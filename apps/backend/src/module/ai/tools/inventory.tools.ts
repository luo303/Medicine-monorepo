import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Inventory } from '@/entity/Inventory';
import { Repository } from 'typeorm';

export function createInventoryTools(
  inventoryRepository: Repository<Inventory>,
) {
  return [
    tool(
      async ({ drug_name, warehouse_id }) => {
        const queryBuilder =
          inventoryRepository.createQueryBuilder('inventory');
        queryBuilder.leftJoinAndSelect('inventory.drug', 'drug');
        queryBuilder.leftJoinAndSelect('inventory.warehouse', 'warehouse');

        if (drug_name) {
          queryBuilder.andWhere('drug.name LIKE :name', {
            name: `%${drug_name}%`,
          });
        }

        if (warehouse_id) {
          queryBuilder.andWhere('warehouse.id = :warehouse_id', {
            warehouse_id,
          });
        }

        const inventories = await queryBuilder.getMany();
        return JSON.stringify(
          inventories.map((i: Inventory) => ({
            drug_name: i.drug?.name || i.drug_name,
            warehouse_name: i.warehouse?.name || i.warehouse_code,
            stock_quantity: i.quantity,
          })),
        );
      },
      {
        name: 'query_inventory',
        description:
          'Query inventory records. Use drug_name and optionally warehouse_id to narrow the results.',
        schema: z.object({
          drug_name: z.string().describe('Drug name.'),
          warehouse_id: z
            .number()
            .optional()
            .describe('Optional warehouse ID.'),
        }),
      },
    ),
  ];
}
