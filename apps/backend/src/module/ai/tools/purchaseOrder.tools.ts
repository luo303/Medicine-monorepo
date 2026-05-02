import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { Repository } from 'typeorm';

/**
 * 创建采购订单相关的 AI 工具
 * @param purchaseOrderRepository 采购订单仓库
 * @returns 采购订单相关的工具数组
 */
export function createPurchaseOrderTools(
  purchaseOrderRepository: Repository<PurchaseOrder>,
) {
  return [
    tool(
      async ({ order_no, manufacturer_name, status }) => {
        const queryBuilder =
          purchaseOrderRepository.createQueryBuilder('order');

        if (order_no) {
          queryBuilder.andWhere('order.order_no LIKE :order_no', {
            order_no: `%${order_no}%`,
          });
        }
        if (manufacturer_name) {
          queryBuilder.andWhere(
            'order.manufacturer_name LIKE :manufacturer_name',
            { manufacturer_name: `%${manufacturer_name}%` },
          );
        }
        if (status) {
          queryBuilder.andWhere('order.status = :status', { status });
        }

        const orders = await queryBuilder.getMany();
        return JSON.stringify(
          orders.map((o) => ({
            order_no: o.order_no,
            order_date: o.order_date,
            manufacturer_name: o.manufacturer_name,
            total_amount: o.total_amount,
            status: o.status,
            purchaser: o.purchaser,
          })),
        );
      },
      {
        name: 'query_purchase_orders',
        description: '查询采购订单列表，可以按订单号、生产企业名称或状态筛选',
        schema: z.object({
          order_no: z.string().optional().describe('可选的采购单号关键词'),
          manufacturer_name: z
            .string()
            .optional()
            .describe('可选的生产企业名称关键词'),
          status: z.string().optional().describe('可选的订单状态'),
        }),
      },
    ),
    tool(
      async ({ order_no }) => {
        const order = await purchaseOrderRepository.findOne({
          where: { order_no },
          relations: ['purchaseDetails', 'purchaseDetails.drug'],
        });
        if (!order) return '未找到该订单';
        return JSON.stringify(
          order.purchaseDetails.map((d) => ({
            drug_name: d.drug_name || d.drug?.name,
            quantity: d.quantity,
            unit_price: d.unit_price,
            amount: d.amount,
            production_date: d.production_date,
          })),
        );
      },
      {
        name: 'query_purchase_order_details',
        description: '查询采购订单详情，获取该订单下的所有药品明细',
        schema: z.object({
          order_no: z.string().describe('采购单号'),
        }),
      },
    ),
  ];
}
