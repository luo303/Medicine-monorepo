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

/**
 * LangChain Agent Stream Metadata
 */
export interface AgentMetadata {
  langgraph_node: string;
  [key: string]: any;
}

/**
 * LangChain Agent Token (Message)
 * 不直接继承 BaseMessage 以避免属性冲突
 */
export interface AgentToken {
  content: string | any[];
  contentBlocks?: Array<{
    type: string;
    text?: string;
    reasoning?: string;
    [key: string]: any;
  }>;
  tool_calls?: Array<{
    name: string;
    args: Record<string, any>;
    id?: string;
  }>;
  additional_kwargs?: Record<string, any>;
  [key: string]: any;
}

/**
 * Interface for the compiled LangChain Agent
 */
export interface IAgent {
  stream(
    input: { messages: BaseMessage[] },
    options?: { streamMode?: string },
  ): Promise<AsyncIterable<[AgentToken, AgentMetadata]>>;
}
