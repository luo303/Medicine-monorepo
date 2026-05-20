import { BaseMessage } from '@langchain/core/messages';

export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolDefinition {
  type: 'function';
  function: ToolFunction;
}

export interface ToolUsage {
  name: string;
  args: Record<string, any>;
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  role: 'tool';
  content: string;
  tool_call_id: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface ChatResponse {
  reply: string;
  usedTools: ToolUsage[];
}

export interface AgentMessageChunk {
  content: unknown;
}

export interface AgentStreamMetadata {
  langgraph_node?: string;
  tags?: string[];
  [key: string]: unknown;
}

export type AgentMessageStreamChunk = [AgentMessageChunk, AgentStreamMetadata];

export interface IAgent {
  stream(
    input: { messages: BaseMessage[] },
    options?: { streamMode?: 'messages'; recursionLimit?: number },
  ): Promise<AsyncIterable<AgentMessageStreamChunk>>;
}
