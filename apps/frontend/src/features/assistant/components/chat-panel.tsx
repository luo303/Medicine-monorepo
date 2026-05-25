"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";
import { API_BASE_URL } from "@/lib/api-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type UiMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
};

type ApprovalDecision =
  | { type: "approve" }
  | { type: "edit"; args: Record<string, unknown> }
  | { type: "reject"; reason?: string };

type ApprovalPayload = {
  kind: "db_write_review";
  toolCallId: string;
  toolName: string;
  entity: string;
  operation: string;
  summary: string;
  args: Record<string, unknown>;
  target?: Record<string, unknown>;
  before?: unknown;
};

type PendingApproval = {
  threadId: string;
  payload: ApprovalPayload;
};

type StreamEvent = {
  type?: string;
  threadId?: string;
  text?: string;
  payload?: ApprovalPayload;
  message?: string;
};

function handleUnauthorized() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [approvalDraft, setApprovalDraft] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const threadIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingApproval]);

  const updateLatestAssistantMessage = useCallback((content: string) => {
    setMessages(prev => {
      const next = [...prev];

      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === "assistant") {
          next[i] = { ...next[i], content };
          return next;
        }
      }

      return [...next, { role: "assistant", content }];
    });
  }, []);

  const readSseStream = useCallback(
    async (
      response: Response,
      handlers: {
        onSession?: (threadId: string) => void;
        onText?: (text: string) => void;
        onApproval?: (approval: PendingApproval) => void;
        onError?: (message: string) => void;
      }
    ) => {
      if (!response.body) {
        throw new Error("Empty response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        buffer = buffer.replace(/\r/g, "");

        let eventBoundary = buffer.indexOf("\n\n");

        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(eventBoundary + 2);

          const dataStr = rawEvent
            .split("\n")
            .filter(line => line.startsWith("data:"))
            .map(line => line.slice(5).trimStart())
            .join("\n");

          if (!dataStr || dataStr === "[DONE]") {
            eventBoundary = buffer.indexOf("\n\n");
            continue;
          }

          try {
            const data = JSON.parse(dataStr) as StreamEvent;

            switch (data.type) {
              case "session":
                if (data.threadId) {
                  handlers.onSession?.(data.threadId);
                }
                break;
              case "text":
                handlers.onText?.(data.text || "");
                break;
              case "approval_required":
                if (data.threadId && data.payload) {
                  handlers.onApproval?.({
                    threadId: data.threadId,
                    payload: data.payload
                  });
                }
                break;
              case "error":
                handlers.onError?.(data.message || "AI 请求失败");
                break;
              default:
                break;
            }
          } catch (error) {
            console.warn("Failed to parse SSE payload:", error, dataStr);
          }

          eventBoundary = buffer.indexOf("\n\n");
        }

        if (done) {
          break;
        }
      }
    },
    []
  );

  const sendMessage = async (userInput: string) => {
    if (isLoading) {
      return;
    }

    const trimmedInput = userInput.trim();
    if (!trimmedInput) {
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: trimmedInput }, { role: "assistant", content: "" }]);
    setInput("");

    try {
      const requestMessages = messages.map(({ role, content }) => ({
        role,
        content
      }));

      const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          messages: [...requestMessages, { role: "user", content: trimmedInput }],
          threadId: threadIdRef.current
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      let aiResponse = "";

      await readSseStream(response, {
        onSession: threadId => {
          threadIdRef.current = threadId;
        },
        onText: text => {
          aiResponse += text;
          updateLatestAssistantMessage(aiResponse);
        },
        onApproval: approval => {
          setPendingApproval(approval);
          setApprovalDraft(stringifyJson(approval.payload.args));
          setRejectReason("");
          updateLatestAssistantMessage(`${aiResponse}\n\n待人工审核：${approval.payload.summary}`.trim());
        },
        onError: message => {
          updateLatestAssistantMessage(aiResponse ? `${aiResponse}\n\n${message}` : message);
        }
      });
    } catch (error) {
      console.error("AI request failed:", error);
      updateLatestAssistantMessage(`抱歉，请求失败：${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resumeWithDecision = useCallback(
    async (decision: ApprovalDecision) => {
      if (!pendingApproval || isLoading) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/ai/chat/review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            threadId: pendingApproval.threadId,
            decision
          })
        });

        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Unauthorized");
        }

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        setPendingApproval(null);
        let aiResponse = "";

        await readSseStream(response, {
          onSession: threadId => {
            threadIdRef.current = threadId;
          },
          onText: text => {
            aiResponse += text;
            updateLatestAssistantMessage(aiResponse);
          },
          onApproval: approval => {
            setPendingApproval(approval);
            setApprovalDraft(stringifyJson(approval.payload.args));
            setRejectReason("");
            updateLatestAssistantMessage(`${aiResponse}\n\n待人工审核：${approval.payload.summary}`.trim());
          },
          onError: message => {
            updateLatestAssistantMessage(aiResponse ? `${aiResponse}\n\n${message}` : message);
          }
        });
      } catch (error) {
        console.error("AI review resume failed:", error);
        updateLatestAssistantMessage(`审批恢复失败：${(error as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, pendingApproval, readSseStream, updateLatestAssistantMessage]
  );

  const handleApprove = () => {
    void resumeWithDecision({ type: "approve" });
  };

  const handleApproveWithEdit = () => {
    try {
      const parsed = JSON.parse(approvalDraft) as Record<string, unknown>;
      void resumeWithDecision({ type: "edit", args: parsed });
    } catch {
      updateLatestAssistantMessage("审批参数不是合法 JSON，请先修正后再提交。");
    }
  };

  const handleReject = () => {
    void resumeWithDecision({
      type: "reject",
      reason: rejectReason.trim() || "Rejected by reviewer."
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 bg-white shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">医疗系统 AI 助手</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">支持查询与人工审核后的数据库写入</p>
            </div>
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="outline"
              className="rounded-lg border-gray-300 transition-all hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              suppressHydrationWarning
            >
              {mounted ? (theme === "dark" ? "深色" : "浅色") : null}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                  <svg
                    className="h-12 w-12 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">开始对话</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  你可以先查数据，也可以让 AI 发起写库申请并在审核后执行
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${index}-${message.role}-${message.content.slice(0, 16)}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[80%] gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold text-white ${
                        message.role === "user" ? "bg-blue-500" : "bg-gray-600 dark:bg-gray-500"
                      }`}
                    >
                      {message.role === "user" ? "你" : "AI"}
                    </div>

                    <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <div className="markdown">
                              <Markdown remarkPlugins={[remarkGfm]}>
                                {message.content ||
                                  (message.role === "assistant" && isLoading && index === messages.length - 1
                                    ? "思考中..."
                                    : "")}
                              </Markdown>
                            </div>
                          </div>
                          {message.role === "assistant" && isLoading && index === messages.length - 1 ? (
                            <div className="flex items-center space-x-1">
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                                style={{ animationDelay: "0ms" }}
                              />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                                style={{ animationDelay: "150ms" }}
                              />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="px-4 py-4">
            <div className="flex items-end gap-3">
              <div className="relative flex-1">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="请输入你的问题，或让 AI 发起新增、修改、删除申请。按 Enter 发送，Shift + Enter 换行。"
                  className="min-h-[60px] max-h-[200px] resize-none rounded-xl border-gray-300 bg-white text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-800"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="h-[60px] rounded-xl bg-blue-500 px-6 shadow-md transition-all hover:bg-blue-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "发送中..." : "发送"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!pendingApproval}
        onOpenChange={open => {
          if (!open && !isLoading) {
            setPendingApproval(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[min(96vw,72rem)] max-w-[72rem] overflow-hidden p-0">
          <div className="flex max-h-[90vh] flex-col overflow-hidden">
            <DialogHeader className="shrink-0 border-b border-slate-200/80 px-6 pt-6 pb-4 dark:border-slate-800">
              <DialogTitle>人工审核数据库写入</DialogTitle>
              <DialogDescription>AI 已生成数据库变更提案，请审核后决定是否执行。</DialogDescription>
            </DialogHeader>

            {pendingApproval ? (
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                <div className="space-y-4 pb-1">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                    <div className="font-semibold">操作摘要</div>
                    <div className="mt-1">{pendingApproval.payload.summary}</div>
                    <div className="mt-2 text-xs">
                      工具：{pendingApproval.payload.toolName} | 实体：
                      {pendingApproval.payload.entity} | 操作：
                      {pendingApproval.payload.operation}
                    </div>
                  </div>

                  {pendingApproval.payload.target ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">命中目标</div>
                      <pre className="max-h-[28vh] overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100">
                        {stringifyJson(pendingApproval.payload.target)}
                      </pre>
                    </div>
                  ) : null}

                  {pendingApproval.payload.before ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">当前记录</div>
                      <pre className="max-h-[32vh] overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100">
                        {stringifyJson(pendingApproval.payload.before)}
                      </pre>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">执行参数</div>
                    <Textarea
                      value={approvalDraft}
                      onChange={e => setApprovalDraft(e.target.value)}
                      className="min-h-[220px] max-h-[38vh] resize-y font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">驳回原因</div>
                    <Textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="如果驳回，可以补充原因或修改建议。"
                      className="min-h-[110px] resize-y"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="shrink-0 border-t border-slate-200/80 bg-background px-6 py-4 dark:border-slate-800">
              <Button variant="outline" onClick={handleReject} disabled={!pendingApproval || isLoading}>
                驳回
              </Button>
              <Button variant="outline" onClick={handleApproveWithEdit} disabled={!pendingApproval || isLoading}>
                修改后通过
              </Button>
              <Button onClick={handleApprove} disabled={!pendingApproval || isLoading}>
                直接通过
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
