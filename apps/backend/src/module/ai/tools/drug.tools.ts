import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { DrugService } from '../../basic/drug/drug.service';
import { Drug } from '@/entity/Drug';

export function createDrugTools(drugService: DrugService) {
  const MAX_RETURNED_DRUGS = 50;

  return [
    tool(
      async ({ keyword }) => {
        const drugs = await drugService.findAll();
        const filtered = keyword
          ? drugs.filter((d: Drug) => d.name.includes(keyword))
          : drugs;

        const limited = filtered.slice(0, MAX_RETURNED_DRUGS);
        return JSON.stringify({
          total: filtered.length,
          returned: limited.length,
          truncated: filtered.length > limited.length,
          items: limited.map((d: Drug) => ({
            approval_no: d.approval_no,
            name: d.name,
            specification: d.specification,
            is_prescription: d.is_prescription,
          })),
        });
      },
      {
        name: 'query_drug_list',
        description:
          'Query the drug catalog and return matching medicines. Optionally filter by a drug name keyword.',
        schema: z.object({
          keyword: z
            .string()
            .optional()
            .describe('Optional drug name keyword.'),
        }),
      },
    ),
  ];
}
