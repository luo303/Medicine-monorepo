import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
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

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat/stream')
  async chatStream(
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: { messages: ChatMessage[] },
    @Res() res: Response,
  ) {
    if (!user) {
      throw new BadRequestException('未识别到当前登录用户');
    }

    const { messages } = body;

    try {
      if (!Array.isArray(messages)) {
        res.status(400).json({ code: 400, message: 'messages 必须是数组' });
        return;
      }

      const agent = this.aiService.createAgent({
        userId: Number(user.sub),
        username: user.username,
      });

      const input = {
        messages: this.convertMessages(messages),
      };

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const events = await agent.stream(input, {
        streamMode: 'messages',
      });

      for await (const [token, metadata] of events) {
        if (metadata?.langgraph_node === 'tools') {
          continue;
        }

        const content = token.contentBlocks || token.content;

        if (Array.isArray(content)) {
          for (const block of content) {
            res.write('event: message\n');
            res.write(`data: ${JSON.stringify(block)}\n\n`);
          }
        } else if (typeof content === 'string' && content) {
          res.write('event: message\n');
          res.write(
            `data: ${JSON.stringify({ type: 'text', text: content })}\n\n`,
          );
        }

        if (token.tool_calls && token.tool_calls.length > 0) {
          res.write('event: message\n');
          res.write(
            `data: ${JSON.stringify({
              type: 'tool',
              tool_calls: token.tool_calls,
            })}\n\n`,
          );
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      this.handleError(err, res);
    }
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
    let message = 'AI 调用失败';

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
