import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { KnowledgeService } from '../../knowledge/knowledge.service';

export function createKnowledgeTool(knowledgeService: KnowledgeService) {
  return [
    tool(
      async ({ question }: { question: string }) => {
        console.log(`\n🔧 [知识库工具] 查询："${question}"`);

        const result = await knowledgeService.query(question, 3);

        if (result.sources.length === 0) {
          return '知识库中没有相关信息';
        }

        return result.answer;
      },
      {
        name: 'query_knowledge_base',
        description:
          '从上传的知识库文档中检索信息来回答问题。适用于查询公司制度、流程、规范等文档内容',
        schema: z.object({
          question: z.string().describe('要查询的问题'),
        }),
      },
    ),
  ];
}
