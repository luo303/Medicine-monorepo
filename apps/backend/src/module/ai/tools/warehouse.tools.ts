import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { WarehouseService } from '../../basic/warehouse/warehouse.service';
import { Warehouse } from '@/entity/Warehouse';

export function createWarehouseTools(warehouseService: WarehouseService) {
  return [
    tool(
      async ({ keyword }) => {
        const warehouses = await warehouseService.findAll();
        const filtered = keyword
          ? warehouses.filter(
              (w: Warehouse) =>
                w.name.includes(keyword) || w.code.includes(keyword),
            )
          : warehouses;

        return JSON.stringify(
          filtered.map((w: Warehouse) => ({
            id: w.id,
            code: w.code,
            name: w.name,
            address: w.address,
            manager: w.manager,
          })),
        );
      },
      {
        name: 'query_warehouse_list',
        description:
          'Query the warehouse list and return matching warehouses. Optionally filter by warehouse name or code.',
        schema: z.object({
          keyword: z
            .string()
            .optional()
            .describe('Optional warehouse name or code keyword.'),
        }),
      },
    ),
  ];
}
