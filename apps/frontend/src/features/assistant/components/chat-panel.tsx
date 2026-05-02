"use client";
import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_BASE_URL } from "@/lib/api-config";
import { useTheme } from "@/components/theme-provider";

function handleUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ role: string; content: string; reasoning?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 更新 AI 消息内容的函数
  const updateAIMessageContent = useCallback((content: string, reasoning?: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === "assistant") {
          newMessages[i] = {
            ...newMessages[i],
            content: content,
            ...(reasoning !== undefined && { reasoning: reasoning })
          };
          return newMessages;
        }
      }
      return newMessages;
    });
  }, []);

  // 发送消息的函数
  const sendMessage = async (userInput: string) => {
    if (isLoading) return;

    setIsLoading(true);

    // 1. 先添加用户消息
    setMessages(prev => [...prev, { role: "user", content: userInput }]);

    // 2. 立即添加一个空的 AI 消息（占位）
    setMessages(prev => [...prev, { role: "assistant", content: "", reasoning: "" }]);

    setInput("");

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userInput }]
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        throw new Error(`请求失败：${res.status}`);
      }

      if (!res.body) {
        throw new Error("无法获取响应流");
      }
      setIsLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiResponse = "";
      let aiReasoning = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);

            if (dataStr === "[DONE]") {
              setMessages(prev => {
                const newMessages = [...prev];
                console.log(newMessages);
                return newMessages;
              });
              continue;
            }

            try {
              const data = JSON.parse(dataStr);
              switch (data.type) {
                case "reasoning":
                  const reasoning_content = data.reasoning || "";
                  aiReasoning += reasoning_content;
                  updateAIMessageContent(aiResponse, aiReasoning);
                  break;
                case "text":
                  const text = data.text || "";
                  aiResponse += text;
                  updateAIMessageContent(aiResponse, aiReasoning);
                  break;
                case "tool":
                  console.log(data.tool_calls);
                  break;
              }
            } catch (e) {
              console.warn("解析失败:", e, "原始数据:", dataStr);
            }
          }
        }
      }
    } catch (error) {
      console.error("API 调用错误:", error);
      updateAIMessageContent("抱歉，请求失败：" + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 回车发送消息
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        await sendMessage(input.trim());
      }
    }
  };

  // 按钮发送消息
  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部标题 */}
      <div className="bg-white dark:bg-gray-900 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">医疗系统 AI 智能助手</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">随时为您解答问题</p>
          </div>
          <Button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            variant="outline"
            className="rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            suppressHydrationWarning
          >
            {mounted ? (
              theme === "dark" ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span className="ml-2">暗色</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="ml-2">亮色</span>
                </>
              )
            ) : null}
          </Button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                <svg
                  className="w-12 h-12 text-blue-600 dark:text-blue-400"
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
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">开始对话</h2>
              <p className="text-gray-500 dark:text-gray-400">输入您的问题，我会尽力帮助您</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${index}-${message.role}-${message.content.substring(0, 10)}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* 头像 */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      message.role === "user" ? "bg-blue-500" : "bg-gray-600 dark:bg-gray-500"
                    }`}
                  >
                    {message.role === "user" ? "你" : "AI"}
                  </div>

                  {/* 消息内容 */}
                  <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                    {/* 推理内容 */}
                    {message.role === "assistant" && message.reasoning && message.reasoning.trim() && (
                      <div className="rounded-2xl px-4 py-2 mb-2 shadow-sm text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <div className="markdown">
                          <Markdown remarkPlugins={[remarkGfm]}>{message.reasoning}</Markdown>
                        </div>
                      </div>
                    )}
                    {/* 正式回复内容 */}
                    {message.content || (isLoading && index === messages.length - 1) ? (
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <div className="markdown">
                              <Markdown remarkPlugins={[remarkGfm]}>
                                {message.content ||
                                  (message.role === "assistant" && isLoading && index === messages.length - 1
                                    ? "思考中"
                                    : "")}
                              </Markdown>
                            </div>
                          </div>
                          {message.role === "assistant" && isLoading && index === messages.length - 1 && (
                            <div className="flex space-x-1 items-center">
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                          )}
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

      {/* 输入区域 */}
      <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入你的问题... (按 Enter 发送，Shift + Enter 换行)"
                className="min-h-[60px] max-h-[200px] resize-none rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 bottom-3">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[60px] px-6 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>发送中...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
