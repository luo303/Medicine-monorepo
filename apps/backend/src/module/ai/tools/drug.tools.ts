import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { DrugService } from '../../basic/drug/drug.service';
import { Drug } from '@/entity/Drug';

export function createDrugTools(drugService: DrugService) {
  return [
    tool(
      async ({ keyword }) => {
        const drugs = await drugService.findAll();
        const filtered = keyword
          ? drugs.filter((d: Drug) => d.name.includes(keyword))
          : drugs;
        return JSON.stringify(
          filtered.map((d: Drug) => ({
            approval_no: d.approval_no,
            name: d.name,
            specification: d.specification,
            is_prescription: d.is_prescription,
          })),
        );
      },
      {
        name: 'query_drug_list',
        description: '查询药品目录列表，获取所有药品信息',
        schema: z.object({
          keyword: z.string().optional().describe('可选的药品名称关键词'),
        }),
      },
    ),
  ];
}
