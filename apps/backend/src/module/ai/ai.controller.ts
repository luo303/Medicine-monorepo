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
import { ChatMessage } from './tools';

type SseResponse = Response & {
  flush?: () => void;
};

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('chat/stream')
  async chatStream(
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: { messages: ChatMessage[] },
    @Res() res: Response,
  ) {
    if (!user) {
      throw new BadRequestException(
        'Current authenticated user was not found.',
      );
    }

    const { messages } = body;

    try {
      if (!Array.isArray(messages)) {
        res
          .status(400)
          .json({ code: 400, message: 'messages must be an array.' });
        return;
      }

      const agent = this.aiService.createAgent({
        userId: Number(user.sub),
        username: user.username,
      });

      const input = {
        messages: this.convertMessages(messages),
      };

      this.logger.log(
        `chat stream started: userId=${user.sub}, messages=${messages.length}`,
      );

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const stream = await agent.stream(input, {
        streamMode: 'messages',
        recursionLimit: 8,
      });

      let chunkCount = 0;
      let emittedChunkCount = 0;
      let totalChars = 0;

      for await (const [messageChunk, metadata] of stream) {
        chunkCount += 1;
        const text = this.extractTextContent(messageChunk.content);

        this.logger.log(
          `stream chunk #${chunkCount} received: node=${metadata.langgraph_node ?? 'unknown'}, content=${JSON.stringify(messageChunk.content)}`,
        );

        if (metadata.langgraph_node !== 'llmCall') {
          this.logger.log(
            `stream chunk #${chunkCount} skipped: non-llm node ${metadata.langgraph_node ?? 'unknown'}`,
          );
          continue;
        }

        if (!text) {
          this.logger.warn(
            `stream chunk #${chunkCount} skipped: empty text content`,
          );
          continue;
        }

        emittedChunkCount += 1;
        totalChars += text.length;
        this.logger.log(
          `stream text #${emittedChunkCount} emitted: node=${metadata.langgraph_node ?? 'unknown'}, chars=${text.length}, text=${JSON.stringify(text)}`,
        );

        this.writeSse(res, {
          type: 'text',
          text,
        });
      }

      this.logger.log(
        `chat stream finished: chunks=${chunkCount}, emitted=${emittedChunkCount}, chars=${totalChars}`,
      );

      if (emittedChunkCount === 0) {
        this.logger.warn('chat stream finished with zero emitted text chunks');
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      this.logger.error(
        `chat stream failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
        err instanceof Error ? err.stack : undefined,
      );
      this.handleError(err, res);
    }
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
