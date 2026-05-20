import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ManufacturerService } from '../../basic/manufacturer/manufacturer.service';
import { Manufacturer } from '@/entity/Manufacturer';

export function createManufacturerTools(
  manufacturerService: ManufacturerService,
) {
  return [
    tool(
      async ({ keyword }) => {
        const manufacturers = await manufacturerService.findAll();
        const filtered = keyword
          ? manufacturers.filter(
              (m: Manufacturer) =>
                m.name.includes(keyword) || m.city?.includes(keyword),
            )
          : manufacturers;

        return JSON.stringify(
          filtered.map((m: Manufacturer) => ({
            approval_no: m.approval_no,
            name: m.name,
            city: m.city,
            address: m.address,
            phone: m.phone,
            is_gmp: m.is_gmp,
          })),
        );
      },
      {
        name: 'query_manufacturer_list',
        description:
          'Query the manufacturer catalog and return matching manufacturers. Optionally filter by manufacturer name or city.',
        schema: z.object({
          keyword: z
            .string()
            .optional()
            .describe('Optional manufacturer name or city keyword.'),
        }),
      },
    ),
  ];
}
