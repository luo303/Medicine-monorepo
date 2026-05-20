import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { StorageLocation } from '@/entity/StorageLocation';
import { Repository } from 'typeorm';

export function createStorageLocationTools(
  storageLocationRepository: Repository<StorageLocation>,
) {
  return [
    tool(
      async ({ warehouse_id, code }) => {
        const queryBuilder =
          storageLocationRepository.createQueryBuilder('location');
        queryBuilder.leftJoinAndSelect('location.warehouse', 'warehouse');

        if (warehouse_id) {
          queryBuilder.andWhere('location.warehouse_id = :warehouse_id', {
            warehouse_id,
          });
        }

        if (code) {
          queryBuilder.andWhere('location.code LIKE :code', {
            code: `%${code}%`,
          });
        }

        const locations = await queryBuilder.getMany();
        return JSON.stringify(
          locations.map((l) => ({
            id: l.id,
            warehouse_name: l.warehouse?.name || 'Unknown warehouse',
            code: l.code,
            capacity: l.capacity,
            description: l.description,
          })),
        );
      },
      {
        name: 'query_storage_locations',
        description:
          'Query storage locations. Optionally filter by warehouse ID or location code.',
        schema: z.object({
          warehouse_id: z
            .number()
            .optional()
            .describe('Optional warehouse ID.'),
          code: z
            .string()
            .optional()
            .describe('Optional storage location code keyword.'),
        }),
      },
    ),
  ];
}
