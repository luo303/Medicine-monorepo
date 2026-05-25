import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { PurchaseStorage } from '@/entity/PurchaseStorage';
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
            id: d.id,
            drugApprovalNo: d.drugApprovalNo,
            drug_name: d.drug_name || d.drug?.name,
            production_date: d.production_date,
            validity_months: d.validity_months,
            quantity: d.quantity,
            unit_price: d.unit_price,
            amount: d.amount,
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
    tool(
      async ({ order_no, drug_name }) => {
        const purchaseStorageRepository =
          purchaseOrderRepository.manager.getRepository(PurchaseStorage);
        const queryBuilder =
          purchaseStorageRepository.createQueryBuilder('storage');

        queryBuilder.leftJoinAndSelect('storage.purchaseOrder', 'order');
        queryBuilder.leftJoinAndSelect('storage.drug', 'drug');

        if (order_no) {
          queryBuilder.andWhere('storage.orderNo LIKE :order_no', {
            order_no: `%${order_no}%`,
          });
        }

        if (drug_name) {
          queryBuilder.andWhere('storage.drug_name LIKE :drug_name', {
            drug_name: `%${drug_name}%`,
          });
        }

        const storages = await queryBuilder.getMany();

        return JSON.stringify(
          storages.map((storage) => ({
            id: storage.id,
            order_no: storage.orderNo,
            warehouse_code: storage.warehouse_code,
            location_code: storage.location_code,
            drugApprovalNo: storage.drugApprovalNo,
            drug_name: storage.drug_name || storage.drug?.name,
            production_date: storage.production_date,
            expiry_date: storage.expiry_date,
            quantity: storage.quantity,
            batch_no: storage.batch_no,
            storage_date: storage.storage_date,
          })),
        );
      },
      {
        name: 'query_purchase_storages',
        description:
          'Query purchase storage records. Optionally filter by purchase order number or drug name.',
        schema: z.object({
          order_no: z
            .string()
            .optional()
            .describe('Optional purchase order number keyword.'),
          drug_name: z
            .string()
            .optional()
            .describe('Optional drug name keyword.'),
        }),
      },
    ),
  ];
}
