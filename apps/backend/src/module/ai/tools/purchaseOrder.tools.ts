import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { Repository } from 'typeorm';

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
        description:
          'Query purchase orders. Optionally filter by order number, manufacturer name, or status.',
        schema: z.object({
          order_no: z
            .string()
            .optional()
            .describe('Optional purchase order number keyword.'),
          manufacturer_name: z
            .string()
            .optional()
            .describe('Optional manufacturer name keyword.'),
          status: z.string().optional().describe('Optional order status.'),
        }),
      },
    ),
    tool(
      async ({ order_no }) => {
        const order = await purchaseOrderRepository.findOne({
          where: { order_no },
          relations: ['purchaseDetails', 'purchaseDetails.drug'],
        });

        if (!order) {
          return 'Purchase order not found.';
        }

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
        description:
          'Query purchase order details and return all medicine line items under the order.',
        schema: z.object({
          order_no: z.string().describe('Purchase order number.'),
        }),
      },
    ),
  ];
}
