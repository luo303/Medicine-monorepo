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

export type AgentStreamMode = 'messages' | 'updates';

export type AgentUpdatesStreamChunk = Record<string, Record<string, unknown>>;

export type AgentMultiStreamChunk =
  | ['messages', AgentMessageStreamChunk]
  | ['updates', AgentUpdatesStreamChunk];

export type MutationEntity =
  | 'drug'
  | 'warehouse'
  | 'manufacturer'
  | 'medical_institution'
  | 'storage_location'
  | 'inventory'
  | 'purchase_order'
  | 'sales_order'
  | 'purchase_detail'
  | 'sales_detail'
  | 'purchase_storage'
  | 'sales_outbound';

export type MutationOperation = 'create' | 'update' | 'delete';

export interface ApprovalInterruptPayload {
  kind: 'db_write_review';
  toolCallId: string;
  toolName: string;
  entity: MutationEntity;
  operation: MutationOperation;
  summary: string;
  args: Record<string, unknown>;
  target?: Record<string, unknown>;
  before?: unknown;
}

export type ApprovalDecision =
  | { type: 'approve' }
  | { type: 'edit'; args: Record<string, unknown> }
  | { type: 'reject'; reason?: string };

export interface PendingWriteAction {
  toolCallId: string;
  toolName: string;
  entity: MutationEntity;
  operation: MutationOperation;
  args: Record<string, unknown>;
  target?: Record<string, unknown>;
}

export interface AgentInterruptState {
  id?: string;
  value?: unknown;
}

export interface AgentStateSnapshot {
  values?: Record<string, unknown>;
  next?: string[];
  interrupts?: AgentInterruptState[];
  tasks?: Array<{
    interrupts?: AgentInterruptState[];
  }>;
}

export interface IAgent {
  stream(
    input: { messages: BaseMessage[] } | unknown,
    options?: {
      streamMode?: AgentStreamMode | AgentStreamMode[];
      recursionLimit?: number;
      configurable?: Record<string, unknown>;
    },
  ): Promise<AsyncIterable<AgentMessageStreamChunk | AgentMultiStreamChunk>>;
  getState(options?: {
    configurable?: Record<string, unknown>;
  }): Promise<AgentStateSnapshot>;
}
