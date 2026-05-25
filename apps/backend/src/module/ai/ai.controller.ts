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
        streamMode: ['updates', 'messages'],
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

    for await (const chunk of stream) {
      if (Array.isArray(chunk) && typeof chunk[0] === 'string') {
        if (chunk[0] === 'messages') {
          this.handleMessageChunk(res, chunk[1] as AgentMessageStreamChunk);
        }

        if (chunk[0] === 'updates') {
          this.handleUpdatesChunk(res, chunk[1], threadId, emittedInterruptIds);
        }

        continue;
      }

      this.handleMessageChunk(res, chunk as AgentMessageStreamChunk);
    }

    return {
      emittedInterruptIds,
    };
  }

  private handleMessageChunk(res: Response, chunk: AgentMessageStreamChunk) {
    const [messageChunk, metadata] = chunk;

    if (metadata.langgraph_node !== 'llmCall') {
      return;
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
    }
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
