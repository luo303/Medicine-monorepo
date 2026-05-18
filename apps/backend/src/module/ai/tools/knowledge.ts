import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { KnowledgeService } from '../../knowledge/knowledge.service';
import { KnowledgeUserContext } from '../../knowledge/knowledge.types';

export function createKnowledgeTool(
  knowledgeService: KnowledgeService,
  user: KnowledgeUserContext,
) {
  return [
    tool(
      async ({ question }: { question: string }) => {
        const result = await knowledgeService.query(question, user, 3);

        if (result.sources.length === 0) {
          return '知识库中没有相关信息';
        }

        return result.answer;
      },
      {
        name: 'query_knowledge_base',
        description:
          '从知识库文档中检索信息来回答问题，会自动按当前登录用户过滤私人和公共文档。',
        schema: z.object({
          question: z.string().describe('要查询的问题'),
        }),
      },
    ),
  ];
}
