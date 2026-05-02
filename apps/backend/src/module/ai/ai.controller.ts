import { Controller, Post, Body, Res, HttpException } from '@nestjs/common';
import { AiService } from './ai.service';
import type { Response } from 'express';
import { ChatMessage } from './tools';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  BaseMessage,
} from '@langchain/core/messages';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat/stream')
  async chatStream(
    @Body() body: { messages: ChatMessage[] },
    @Res() res: Response,
  ) {
    const { messages } = body;

    try {
      if (!Array.isArray(messages)) {
        res.status(400).json({ code: 400, message: 'messages 必须是数组' });
        return;
      }

      // ✅ 严格实现用户代码：Service 只负责 agent，Controller 负责调用和流式输出
      const input = {
        messages: this.convertMessages(messages),
      };

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // ✅ 在 Controller 中调用 agent.stream
      const events = await this.aiService.agent.stream(input, {
        streamMode: 'messages',
      });

      for await (const [token, metadata] of events) {
        // ✅ 严格过滤：如果是 tools 节点（工具执行结果），不响应给前端
        // 这样 AI 能获取文档内容进行思考，但前端不会收到冗长的文档原文
        if (metadata?.langgraph_node === 'tools') {
          continue;
        }

        const content = token.contentBlocks || token.content;

        // ✅ 避免重复包装：如果 content 是数组（通常是 contentBlocks），直接发送数组内的对象
        if (Array.isArray(content)) {
          for (const block of content) {
            res.write('event: message\n');
            res.write(`data: ${JSON.stringify(block)}\n\n`);
          }
        } else if (typeof content === 'string' && content) {
          // ✅ 只有当 content 是纯字符串且没有 contentBlocks 时，才进行包装
          res.write('event: message\n');
          res.write(
            `data: ${JSON.stringify({ type: 'text', text: content })}\n\n`,
          );
        }

        // 处理工具调用指令（这是 agent 节点发出的，告诉前端 AI 准备调用的工具）
        if (token.tool_calls && token.tool_calls.length > 0) {
          // 如果 contentBlocks 中已经包含了工具调用信息，这里可能会重复
          // 但通常前端需要显式的 tool 类型来展示调用状态
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
    return messages.map((m) => {
      if (m.role === 'user') return new HumanMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      if (m.role === 'system') return new SystemMessage(m.content);
      if (m.role === 'tool')
        return new ToolMessage({
          content: m.content,
          tool_call_id: m.tool_call_id || '',
        });
      return new HumanMessage(m.content);
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
