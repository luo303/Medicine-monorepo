import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesOrder } from '@/entity/SalesOrder';
import { SalesOutbound } from '@/entity/SalesOutbound';
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
            id: d.id,
            manufacturerApprovalNo: d.manufacturerApprovalNo,
            drugApprovalNo: d.drugApprovalNo,
            drug_name: d.drug_name || d.drug?.name,
            production_date: d.production_date,
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
    tool(
      async ({ order_no, drug_name }) => {
        const salesOutboundRepository =
          salesOrderRepository.manager.getRepository(SalesOutbound);
        const queryBuilder =
          salesOutboundRepository.createQueryBuilder('outbound');

        queryBuilder.leftJoinAndSelect('outbound.salesOrder', 'order');
        queryBuilder.leftJoinAndSelect('outbound.drug', 'drug');

        if (order_no) {
          queryBuilder.andWhere('outbound.orderNo LIKE :order_no', {
            order_no: `%${order_no}%`,
          });
        }

        if (drug_name) {
          queryBuilder.andWhere('outbound.drug_name LIKE :drug_name', {
            drug_name: `%${drug_name}%`,
          });
        }

        const outbounds = await queryBuilder.getMany();

        return JSON.stringify(
          outbounds.map((outbound) => ({
            id: outbound.id,
            order_no: outbound.orderNo,
            warehouse_code: outbound.warehouse_code,
            location_code: outbound.location_code,
            institutionApprovalNo: outbound.institutionApprovalNo,
            manufacturerApprovalNo: outbound.manufacturerApprovalNo,
            drugApprovalNo: outbound.drugApprovalNo,
            drug_name: outbound.drug_name || outbound.drug?.name,
            production_date: outbound.production_date,
            quantity: outbound.quantity,
            outbound_date: outbound.outbound_date,
          })),
        );
      },
      {
        name: 'query_sales_outbounds',
        description:
          'Query sales outbound records. Optionally filter by sales order number or drug name.',
        schema: z.object({
          order_no: z
            .string()
            .optional()
            .describe('Optional sales order number keyword.'),
          drug_name: z
            .string()
            .optional()
            .describe('Optional drug name keyword.'),
        }),
      },
    ),
  ];
}
