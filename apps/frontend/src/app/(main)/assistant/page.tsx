"use client";
import ChatPanel from "@/features/assistant/components/chat-panel";
import KnowledgePanel from "@/features/assistant/components/knowledge-panel";

export default function AssistantPage() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatPanel />
      </div>
      <div className="w-96 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <KnowledgePanel />
      </div>
    </div>
  );
}
