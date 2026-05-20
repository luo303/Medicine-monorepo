import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { MedicalInstitutionService } from '../../basic/MedicalInstitution/MedicalInstitution.service';
import { MedicalInstitution } from '@/entity/MedicalInstitution';

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
          'Query the medical institution catalog and return matching institutions. Optionally filter by institution name or address.',
        schema: z.object({
          keyword: z
            .string()
            .optional()
            .describe('Optional medical institution name or address keyword.'),
        }),
      },
    ),
  ];
}
