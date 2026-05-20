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
          return 'No relevant information was found in the knowledge base.';
        }

        return result.answer;
      },
      {
        name: 'query_knowledge_base',
        description:
          'Search uploaded knowledge-base documents and return relevant passages for answering the question. The tool already filters private and public documents for the current user.',
        schema: z.object({
          question: z
            .string()
            .describe('The question to search in the knowledge base.'),
        }),
      },
    ),
  ];
}
