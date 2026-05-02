import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { MedicalInstitutionService } from '../../basic/MedicalInstitution/MedicalInstitution.service';
import { MedicalInstitution } from '@/entity/MedicalInstitution';

/**
 * 创建医疗机构相关的 AI 工具
 * @param medicalInstitutionService 医疗机构服务
 * @returns 医疗机构相关的工具数组
 */
export function createMedicalInstitutionTools(
  medicalInstitutionService: MedicalInstitutionService,
) {
  return [
    tool(
      async ({ keyword }) => {
        const institutions = await medicalInstitutionService.findAll();
        const filtered = keyword
          ? institutions.filter(
              (m: MedicalInstitution) =>
                m.name.includes(keyword) || m.address?.includes(keyword),
            )
          : institutions;
        return JSON.stringify(
          filtered.map((m: MedicalInstitution) => ({
            approval_no: m.approval_no,
            name: m.name,
            address: m.address,
            phone: m.phone,
            is_specialized: m.is_specialized,
          })),
        );
      },
      {
        name: 'query_medical_institution_list',
        description:
          '查询医疗机构目录列表，获取所有医疗机构信息，可以按名称或地址筛选',
        schema: z.object({
          keyword: z
            .string()
            .optional()
            .describe('可选的医疗机构名称或地址关键词'),
        }),
      },
    ),
  ];
}
