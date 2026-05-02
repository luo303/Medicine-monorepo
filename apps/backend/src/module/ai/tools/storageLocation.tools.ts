import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { StorageLocation } from '@/entity/StorageLocation';
import { Repository } from 'typeorm';

/**
 * 创建货位相关的 AI 工具
 * @param storageLocationRepository 货位仓库
 * @returns 货位相关的工具数组
 */
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
            warehouse_name: l.warehouse?.name || '未知仓库',
            code: l.code,
            capacity: l.capacity,
            description: l.description,
          })),
        );
      },
      {
        name: 'query_storage_locations',
        description: '查询货位列表，可以按仓库 ID 或货位号筛选',
        schema: z.object({
          warehouse_id: z.number().optional().describe('可选的仓库 ID'),
          code: z.string().optional().describe('可选的货位号关键词'),
        }),
      },
    ),
  ];
}
