import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { CurrentUser } from '@/auth/current-user.decorator';
import { AuthUser } from '@/auth/auth.types';
import { AiService } from './ai.service';
import {
  AgentInterruptState,
  AgentMessageStreamChunk,
  AgentMultiStreamChunk,
  AgentToolStreamChunk,
  ApprovalDecision,
  ApprovalInterruptPayload,
  ChatMessage,
} from './tools';

type SseResponse = Response & {
  flush?: () => void;
  flushHeaders?: () => void;
};

interface ChatStreamBody {
  messages: ChatMessage[];
  threadId?: string;
}

interface ReviewBody {
  threadId: string;
  decision: ApprovalDecision;
}

interface StreamedToolCall {
  streamKey: string;
  turnKey: string;
  toolCallId?: string;
  name?: string;
  argsText: string;
  status: 'streaming' | 'called' | 'completed' | 'error';
}

interface ToolCallRegistry {
  callsByKey: Map<string, StreamedToolCall>;
  keyByToolCallId: Map<string, string>;
  emittedToolResultIds: Set<string>;
}

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('chat/stream')
  async chatStream(
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: ChatStreamBody,
    @Res() res: Response,
  ) {
    if (!user) {
      throw new BadRequestException(
        'Current authenticated user was not found.',
      );
    }

    const { messages, threadId } = body;

    if (!Array.isArray(messages)) {
      res
        .status(400)
        .json({ code: 400, message: 'messages must be an array.' });
      return;
    }

    const effectiveThreadId =
      threadId || this.aiService.createThreadId(Number(user.sub));
    const agent = this.aiService.createAgent({
      userId: Number(user.sub),
      username: user.username,
    });

    try {
      const input = {
        messages: this.convertMessages(messages),
      };

      this.prepareSse(res, effectiveThreadId);

      const stream = await agent.stream(input, {
        streamMode: ['updates', 'messages', 'tools'],
        recursionLimit: 8,
        configurable: {
          thread_id: effectiveThreadId,
        },
      });

      const streamResult = await this.forwardStream(
        res,
        stream,
        effectiveThreadId,
      );
      await this.emitPendingInterruptsFromState(
        res,
        agent,
        effectiveThreadId,
        streamResult.emittedInterruptIds,
      );
      this.finishSse(res);
    } catch (error) {
      this.logger.error(
        `AI stream failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.handleError(error, res);
    }
  }

  @Post('chat/review')
  async reviewWrite(
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: ReviewBody,
    @Res() res: Response,
  ) {
    if (!user) {
      throw new BadRequestException(
        'Current authenticated user was not found.',
      );
    }

    if (!body?.threadId) {
      res.status(400).json({ code: 400, message: 'threadId is required.' });
      return;
    }

    if (!body?.decision || typeof body.decision !== 'object') {
      res.status(400).json({ code: 400, message: 'decision is required.' });
      return;
    }

    try {
      this.prepareSse(res, body.threadId);

      const stream = await this.aiService.resumeAgent(
        {
          userId: Number(user.sub),
          username: user.username,
        },
        {
          threadId: body.threadId,
          decision: body.decision,
        },
      );

      const streamResult = await this.forwardStream(res, stream, body.threadId);
      const agent = this.aiService.createAgent({
        userId: Number(user.sub),
        username: user.username,
      });
      await this.emitPendingInterruptsFromState(
        res,
        agent,
        body.threadId,
        streamResult.emittedInterruptIds,
      );
      this.finishSse(res);
    } catch (error) {
      this.logger.error(
        `AI review resume failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.handleError(error, res);
    }
  }

  private prepareSse(res: Response, threadId: string) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-AI-Thread-Id', threadId);
    (res as SseResponse).flushHeaders?.();

    this.writeSse(res, {
      type: 'session',
      threadId,
    });
  }

  private async forwardStream(
    res: Response,
    stream: AsyncIterable<AgentMessageStreamChunk | AgentMultiStreamChunk>,
    threadId: string,
  ) {
    const emittedInterruptIds = new Set<string>();
    const toolCallRegistry: ToolCallRegistry = {
      callsByKey: new Map(),
      keyByToolCallId: new Map(),
      emittedToolResultIds: new Set(),
    };

    for await (const chunk of stream) {
      if (Array.isArray(chunk) && typeof chunk[0] === 'string') {
        if (chunk[0] === 'messages') {
          this.handleMessageChunk(
            res,
            chunk[1] as AgentMessageStreamChunk,
            toolCallRegistry,
          );
        }

        if (chunk[0] === 'updates') {
          this.handleUpdatesChunk(
            res,
            chunk[1],
            threadId,
            emittedInterruptIds,
            toolCallRegistry,
          );
        }

        if (chunk[0] === 'tools') {
          this.handleToolsChunk(res, chunk[1], toolCallRegistry);
        }

        continue;
      }

      this.handleMessageChunk(
        res,
        chunk as AgentMessageStreamChunk,
        toolCallRegistry,
      );
    }

    return {
      emittedInterruptIds,
    };
  }

  private handleMessageChunk(
    res: Response,
    chunk: AgentMessageStreamChunk,
    toolCallRegistry: ToolCallRegistry,
  ) {
    const [messageChunk, metadata] = chunk;

    if (metadata.langgraph_node !== 'llmCall') {
      return;
    }

    this.emitToolCallEvents(res, chunk, toolCallRegistry);

    const reasoning = this.extractReasoningContent(messageChunk);

    if (reasoning) {
      this.writeSse(res, {
        type: 'reasoning',
        text: reasoning,
      });
    }

    const text = this.extractTextContent(messageChunk.content);

    if (!text) {
      return;
    }

    this.writeSse(res, {
      type: 'text',
      text,
    });
  }

  private handleUpdatesChunk(
    res: Response,
    updates: Record<string, Record<string, unknown>>,
    threadId: string,
    emittedInterruptIds: Set<string>,
    toolCallRegistry: ToolCallRegistry,
  ) {
    this.emitInterruptEvents(
      res,
      this.extractInterrupts(
        (updates as Record<string, unknown>).__interrupt__,
      ),
      threadId,
      emittedInterruptIds,
    );

    const updateEntries = Object.values(updates);

    for (const update of updateEntries) {
      this.emitInterruptEvents(
        res,
        this.extractInterrupts(update.__interrupt__),
        threadId,
        emittedInterruptIds,
      );

      this.emitToolResultEvents(res, update, toolCallRegistry);
    }
  }

  private emitToolCallEvents(
    res: Response,
    chunk: AgentMessageStreamChunk,
    toolCallRegistry: ToolCallRegistry,
  ) {
    const [messageChunk, metadata] = chunk;
    const turnKey = this.deriveToolTurnKey(messageChunk, metadata);
    const toolCallChunks = Array.isArray(messageChunk.tool_call_chunks)
      ? messageChunk.tool_call_chunks
      : [];

    for (const toolCallChunk of toolCallChunks) {
      const streamKey = this.deriveToolStreamKey(turnKey, toolCallChunk);
      const previous = toolCallRegistry.callsByKey.get(streamKey);
      const nextState: StreamedToolCall = {
        streamKey,
        turnKey,
        toolCallId: toolCallChunk.id || previous?.toolCallId,
        name: toolCallChunk.name || previous?.name,
        argsText: `${previous?.argsText || ''}${toolCallChunk.args || ''}`,
        status: 'streaming',
      };

      toolCallRegistry.callsByKey.set(streamKey, nextState);

      if (nextState.toolCallId) {
        toolCallRegistry.keyByToolCallId.set(nextState.toolCallId, streamKey);
      }

      this.writeSse(res, {
        type: 'tool_call',
        call: {
          streamKey,
          toolCallId: nextState.toolCallId,
          name: nextState.name,
          argsText: nextState.argsText,
          argsTextDelta: toolCallChunk.args || '',
          status: nextState.status,
        },
      });
    }

    const parsedToolCalls = Array.isArray(messageChunk.tool_calls)
      ? messageChunk.tool_calls
      : [];

    parsedToolCalls.forEach((toolCall, index) => {
      const byIdKey = toolCall.id
        ? toolCallRegistry.keyByToolCallId.get(toolCall.id)
        : undefined;
      const streamKey = byIdKey || `${turnKey}:${index}`;
      const previous = toolCallRegistry.callsByKey.get(streamKey);
      const argsText =
        previous?.argsText || JSON.stringify(toolCall.args, null, 2);
      const nextState: StreamedToolCall = {
        streamKey,
        turnKey,
        toolCallId: toolCall.id || previous?.toolCallId,
        name: toolCall.name || previous?.name,
        argsText,
        status: 'called',
      };

      toolCallRegistry.callsByKey.set(streamKey, nextState);

      if (nextState.toolCallId) {
        toolCallRegistry.keyByToolCallId.set(nextState.toolCallId, streamKey);
      }

      this.writeSse(res, {
        type: 'tool_call',
        call: {
          streamKey,
          toolCallId: nextState.toolCallId,
          name: nextState.name,
          argsText,
          args: toolCall.args,
          status: nextState.status,
        },
      });
    });
  }

  private emitToolResultEvents(
    res: Response,
    update: Record<string, unknown>,
    toolCallRegistry: ToolCallRegistry,
  ) {
    const messages = this.extractToolMessages(update.messages);

    for (const message of messages) {
      const dedupeKey = `${message.tool_call_id}:${String(message.status || 'success')}`;

      if (toolCallRegistry.emittedToolResultIds.has(dedupeKey)) {
        continue;
      }

      toolCallRegistry.emittedToolResultIds.add(dedupeKey);
      const streamKey =
        toolCallRegistry.keyByToolCallId.get(message.tool_call_id) ||
        message.tool_call_id;
      const previous = toolCallRegistry.callsByKey.get(streamKey);
      const nextStatus = message.status === 'error' ? 'error' : 'completed';

      if (previous) {
        toolCallRegistry.callsByKey.set(streamKey, {
          ...previous,
          status: nextStatus,
        });
      }

      this.writeSse(res, {
        type: 'tool_result',
        result: {
          streamKey,
          toolCallId: message.tool_call_id,
          name: previous?.name,
          status: nextStatus,
          content: this.stringifyStructuredPayload(message.content),
        },
      });
    }
  }

  private handleToolsChunk(
    res: Response,
    chunk: AgentToolStreamChunk,
    toolCallRegistry: ToolCallRegistry,
  ) {
    const streamKey = this.resolveToolStreamKeyFromLifecycle(
      chunk,
      toolCallRegistry,
    );
    const previous = toolCallRegistry.callsByKey.get(streamKey);
    const toolCallId = chunk.toolCallId || previous?.toolCallId;
    const name = chunk.name || previous?.name;

    if (toolCallId) {
      toolCallRegistry.keyByToolCallId.set(toolCallId, streamKey);
    }

    if (chunk.event === 'on_tool_start' || chunk.event === 'on_tool_event') {
      const nextState: StreamedToolCall = {
        streamKey,
        turnKey: previous?.turnKey || 'tool',
        toolCallId,
        name,
        argsText:
          previous?.argsText ||
          this.stringifyStructuredPayload(chunk.input) ||
          '',
        status: chunk.event === 'on_tool_start' ? 'called' : 'streaming',
      };

      toolCallRegistry.callsByKey.set(streamKey, nextState);
      this.writeSse(res, {
        type: 'tool_call',
        call: {
          streamKey,
          toolCallId,
          name,
          argsText: nextState.argsText,
          status: nextState.status,
          progressText:
            chunk.event === 'on_tool_event'
              ? this.stringifyStructuredPayload(chunk.data)
              : undefined,
        },
      });

      return;
    }

    const nextStatus = chunk.event === 'on_tool_error' ? 'error' : 'completed';
    const dedupeKey = `${toolCallId || streamKey}:${nextStatus}`;

    if (toolCallRegistry.emittedToolResultIds.has(dedupeKey)) {
      return;
    }

    toolCallRegistry.emittedToolResultIds.add(dedupeKey);

    if (previous) {
      toolCallRegistry.callsByKey.set(streamKey, {
        ...previous,
        status: nextStatus,
      });
    }

    this.writeSse(res, {
      type: 'tool_result',
      result: {
        streamKey,
        toolCallId,
        name,
        status: nextStatus,
        content: this.stringifyStructuredPayload(
          chunk.event === 'on_tool_error' ? chunk.error : chunk.output,
        ),
      },
    });
  }

  private extractInterrupts(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is AgentInterruptState => !!item && typeof item === 'object',
    );
  }

  private emitInterruptEvents(
    res: Response,
    interrupts: AgentInterruptState[],
    threadId: string,
    emittedInterruptIds: Set<string>,
  ) {
    for (const interrupt of interrupts) {
      const payload = interrupt.value as ApprovalInterruptPayload | undefined;
      const interruptId = interrupt.id || `${threadId}:anonymous-interrupt`;

      if (!payload || payload.kind !== 'db_write_review') {
        continue;
      }

      if (emittedInterruptIds.has(interruptId)) {
        continue;
      }

      emittedInterruptIds.add(interruptId);
      this.writeSse(res, {
        type: 'approval_required',
        threadId,
        interruptId,
        payload,
      });
    }
  }

  private async emitPendingInterruptsFromState(
    res: Response,
    agent: {
      getState: (options?: {
        configurable?: Record<string, unknown>;
      }) => Promise<{
        interrupts?: AgentInterruptState[];
        tasks?: Array<{ interrupts?: AgentInterruptState[] }>;
      }>;
    },
    threadId: string,
    emittedInterruptIds: Set<string>,
  ) {
    const state = await agent.getState({
      configurable: {
        thread_id: threadId,
      },
    });

    this.emitInterruptEvents(
      res,
      state.interrupts || [],
      threadId,
      emittedInterruptIds,
    );

    const taskInterrupts =
      state.tasks?.flatMap((task) => task.interrupts || []) || [];

    this.emitInterruptEvents(
      res,
      taskInterrupts,
      threadId,
      emittedInterruptIds,
    );
  }

  private finishSse(res: Response) {
    res.write('data: [DONE]\n\n');
    res.end();
  }

  private writeSse(res: Response, payload: Record<string, unknown>) {
    res.write('event: message\n');
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    (res as SseResponse).flush?.();
  }

  private extractTextContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (!Array.isArray(content)) {
      return '';
    }

    return content.map((item) => this.extractTextContentPart(item)).join('');
  }

  private extractTextContentPart(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (!content || typeof content !== 'object') {
      return '';
    }

    const block = content as Record<string, unknown>;

    if (typeof block.text === 'string') {
      return block.text;
    }

    return '';
  }

  private extractReasoningContent(chunk: AgentMessageStreamChunk[0]): string {
    const reasoning = chunk.additional_kwargs?.reasoning_content;

    if (typeof reasoning === 'string') {
      return reasoning;
    }

    if (Array.isArray(reasoning)) {
      return reasoning
        .map((item) => this.extractReasoningContentPart(item))
        .join('');
    }

    return '';
  }

  private extractReasoningContentPart(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (!content || typeof content !== 'object') {
      return '';
    }

    const block = content as Record<string, unknown>;

    if (typeof block.text === 'string') {
      return block.text;
    }

    return '';
  }

  private deriveToolTurnKey(
    messageChunk: AgentMessageStreamChunk[0],
    metadata: AgentMessageStreamChunk[1],
  ) {
    const metadataKeys = [
      'langgraph_checkpoint_ns',
      'checkpoint_ns',
      'run_id',
      'langgraph_run_id',
    ];

    if (typeof messageChunk.id === 'string' && messageChunk.id.trim()) {
      return messageChunk.id;
    }

    for (const key of metadataKeys) {
      const value = metadata[key];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return String(metadata.langgraph_node || 'llmCall');
  }

  private deriveToolStreamKey(
    turnKey: string,
    toolCallChunk: NonNullable<
      AgentMessageStreamChunk[0]['tool_call_chunks']
    >[number],
  ) {
    return `${turnKey}:${toolCallChunk.index ?? 0}`;
  }

  private resolveToolStreamKeyFromLifecycle(
    chunk: AgentToolStreamChunk,
    toolCallRegistry: ToolCallRegistry,
  ) {
    if (chunk.toolCallId) {
      const existing = toolCallRegistry.keyByToolCallId.get(chunk.toolCallId);

      if (existing) {
        return existing;
      }
    }

    const pendingByName = this.findPendingToolStreamKeyByName(
      chunk.name,
      toolCallRegistry,
    );

    if (pendingByName) {
      return pendingByName;
    }

    return chunk.toolCallId || `tool:${chunk.name || 'unknown'}`;
  }

  private findPendingToolStreamKeyByName(
    name: string | undefined,
    toolCallRegistry: ToolCallRegistry,
  ) {
    if (!name) {
      return undefined;
    }

    const pendingCalls = Array.from(
      toolCallRegistry.callsByKey.values(),
    ).reverse();
    const matched = pendingCalls.find((call) => {
      return (
        call.name === name &&
        !call.toolCallId &&
        call.status !== 'completed' &&
        call.status !== 'error'
      );
    });

    return matched?.streamKey;
  }

  private stringifyStructuredPayload(value: unknown): string {
    const text = this.extractTextContent(value);

    if (text) {
      return text;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value === undefined || value === null) {
      return '';
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private extractToolMessages(value: unknown): ToolMessage[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is ToolMessage => {
      if (item instanceof ToolMessage) {
        return true;
      }

      if (!item || typeof item !== 'object') {
        return false;
      }

      const candidate = item as Record<string, unknown> & {
        getType?: () => string;
      };

      if (candidate.type === 'tool') {
        return typeof candidate.tool_call_id === 'string';
      }

      return (
        candidate.getType?.() === 'tool' &&
        typeof candidate.tool_call_id === 'string'
      );
    });
  }

  private convertMessages(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((message) => {
      if (message.role === 'user') {
        return new HumanMessage(message.content);
      }

      if (message.role === 'assistant') {
        return new AIMessage(message.content);
      }

      if (message.role === 'system') {
        return new SystemMessage(message.content);
      }

      if (message.role === 'tool') {
        return new ToolMessage({
          content: message.content,
          tool_call_id: message.tool_call_id || '',
        });
      }

      return new HumanMessage(message.content);
    });
  }

  private handleError(err: unknown, res: Response) {
    if (res.headersSent) {
      this.writeSse(res, {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
      res.end();
      return;
    }

    let status = 500;
    let message = 'AI request failed.';

    if (err instanceof Error) {
      message = err.message;
    }

    if (err instanceof HttpException) {
      status = err.getStatus();
      const response = err.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        message = String((response as Record<string, unknown>).message);
      }
    }

    res.status(status).json({ code: status, message });
  }
}
