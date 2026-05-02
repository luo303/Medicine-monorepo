import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ManufacturerService } from '../../basic/manufacturer/manufacturer.service';
import { Manufacturer } from '@/entity/Manufacturer';

/**
 * 创建生产企业相关的 AI 工具
 * @param manufacturerService 生产企业服务
 * @returns 生产企业相关的工具数组
 */
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
          '查询生产企业目录列表，获取所有生产企业信息，可以按名称或城市筛选',
        schema: z.object({
          keyword: z.string().optional().describe('可选的企业名称或城市关键词'),
        }),
      },
    ),
  ];
}
