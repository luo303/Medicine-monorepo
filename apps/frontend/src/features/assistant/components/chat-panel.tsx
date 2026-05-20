"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";
import { API_BASE_URL } from "@/lib/api-config";

type UiMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
};

function handleUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateAIMessageContent = useCallback((content: string, reasoning?: string) => {
    setMessages(prev => {
      const next = [...prev];

      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === "assistant") {
          next[i] = {
            ...next[i],
            content,
            ...(reasoning !== undefined ? { reasoning } : {})
          };
          break;
        }
      }

      return next;
    });
  }, []);

  const sendMessage = async (userInput: string) => {
    if (isLoading) return;

    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    setIsLoading(true);

    const requestMessages = messages.map(({ role, content }) => ({
      role,
      content
    }));
    const nextMessages = [...requestMessages, { role: "user", content: trimmedInput }];

    setMessages(prev => [
      ...prev,
      { role: "user", content: trimmedInput },
      { role: "assistant", content: "", reasoning: "" }
    ]);
    setInput("");

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          messages: nextMessages
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("Empty response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiResponse = "";
      let aiReasoning = "";
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
            const data = JSON.parse(dataStr);

            switch (data.type) {
              case "reasoning": {
                const reasoningContent = data.reasoning || "";
                aiReasoning += reasoningContent;
                updateAIMessageContent(aiResponse, aiReasoning);
                break;
              }
              case "text": {
                const text = data.text || "";
                aiResponse += text;
                updateAIMessageContent(aiResponse, aiReasoning);
                break;
              }
              case "tool":
                console.log(data.tool_calls);
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
    } catch (error) {
      console.error("AI request failed:", error);
      updateAIMessageContent(`抱歉，请求失败：${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage(input);
    }
  };

  const handleSend = () => {
    void sendMessage(input);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">医疗系统 AI 助手</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">随时为您解答问题</p>
          </div>
          <Button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            variant="outline"
            className="rounded-lg border-gray-300 transition-all hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            suppressHydrationWarning
          >
            {mounted ? (
              theme === "dark" ? (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span className="ml-2">深色</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="ml-2">浅色</span>
                </>
              )
            ) : null}
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
              <p className="text-gray-500 dark:text-gray-400">输入您的问题，我会尽力帮助您</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${index}-${message.role}-${message.content.slice(0, 10)}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[80%] gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white font-semibold ${
                      message.role === "user" ? "bg-blue-500" : "bg-gray-600 dark:bg-gray-500"
                    }`}
                  >
                    {message.role === "user" ? "你" : "AI"}
                  </div>

                  <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                    {message.role === "assistant" && message.reasoning && message.reasoning.trim() ? (
                      <div className="mb-2 rounded-2xl bg-gray-200 px-4 py-2 text-sm text-gray-600 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                        <div className="markdown">
                          <Markdown remarkPlugins={[remarkGfm]}>{message.reasoning}</Markdown>
                        </div>
                      </div>
                    ) : null}

                    {message.content || (isLoading && index === messages.length - 1) ? (
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
                    ) : null}
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
                placeholder="请输入你的问题...（按 Enter 发送，Shift + Enter 换行）"
                className="min-h-[60px] max-h-[200px] resize-none rounded-xl border-gray-300 bg-white text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-800"
                disabled={isLoading}
              />
              {isLoading ? (
                <div className="absolute bottom-3 right-3">
                  <div className="flex space-x-1">
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
                </div>
              ) : null}
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[60px] rounded-xl bg-blue-500 px-6 shadow-md transition-all hover:bg-blue-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>发送中...</span>
                </div>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
