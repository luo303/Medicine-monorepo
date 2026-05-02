import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesOrder } from '@/entity/SalesOrder';
import { Repository } from 'typeorm';

/**
 * 创建销售订单相关的 AI 工具
 * @param salesOrderRepository 销售订单仓库
 * @returns 销售订单相关的工具数组
 */
export function createSalesOrderTools(
  salesOrderRepository: Repository<SalesOrder>,
) {
  return [
    tool(
      async ({ order_no, institution_name, status }) => {
        const queryBuilder = salesOrderRepository.createQueryBuilder('order');
        if (order_no) {
          queryBuilder.andWhere('order.order_no LIKE :order_no', {
            order_no: `%${order_no}%`,
          });
        }
        if (institution_name) {
          queryBuilder.andWhere(
            'order.institution_name LIKE :institution_name',
            { institution_name: `%${institution_name}%` },
          );
        }
        if (status) {
          queryBuilder.andWhere('order.status = :status', { status });
        }

        const orders = await queryBuilder.getMany();
        return JSON.stringify(
          orders.map((o) => ({
            order_no: o.order_no,
            sales_date: o.sales_date,
            institution_name: o.institution_name,
            total_amount: o.total_amount,
            status: o.status,
            salesperson: o.salesperson,
          })),
        );
      },
      {
        name: 'query_sales_orders',
        description: '查询销售订单列表，可以按订单号、医疗机构名称或状态筛选',
        schema: z.object({
          order_no: z.string().optional().describe('可选的销售单号关键词'),
          institution_name: z
            .string()
            .optional()
            .describe('可选的医疗机构名称关键词'),
          status: z.string().optional().describe('可选的订单状态'),
        }),
      },
    ),
    tool(
      async ({ order_no }) => {
        const order = await salesOrderRepository.findOne({
          where: { order_no },
          relations: ['salesDetails', 'salesDetails.drug'],
        });
        if (!order) return '未找到该订单';
        return JSON.stringify(
          order.salesDetails.map((d) => ({
            drug_name: d.drug_name || d.drug?.name,
            quantity: d.quantity,
            unit_price: d.unit_price,
            amount: d.amount,
          })),
        );
      },
      {
        name: 'query_sales_order_details',
        description: '查询销售订单详情，获取该订单下的所有药品明细',
        schema: z.object({
          order_no: z.string().describe('销售单号'),
        }),
      },
    ),
  ];
}
