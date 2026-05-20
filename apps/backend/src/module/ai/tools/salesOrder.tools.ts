import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesOrder } from '@/entity/SalesOrder';
import { Repository } from 'typeorm';

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
        description:
          'Query sales orders. Optionally filter by order number, institution name, or status.',
        schema: z.object({
          order_no: z
            .string()
            .optional()
            .describe('Optional sales order number keyword.'),
          institution_name: z
            .string()
            .optional()
            .describe('Optional medical institution name keyword.'),
          status: z.string().optional().describe('Optional order status.'),
        }),
      },
    ),
    tool(
      async ({ order_no }) => {
        const order = await salesOrderRepository.findOne({
          where: { order_no },
          relations: ['salesDetails', 'salesDetails.drug'],
        });

        if (!order) {
          return 'Sales order not found.';
        }

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
        description:
          'Query sales order details and return all medicine line items under the order.',
        schema: z.object({
          order_no: z.string().describe('Sales order number.'),
        }),
      },
    ),
  ];
}
