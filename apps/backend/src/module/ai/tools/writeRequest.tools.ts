import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PurchaseOrderStatus } from '@/entity/PurchaseOrder';
import { SalesOrderStatus } from '@/entity/SalesOrder';
import { MutationEntity, MutationOperation } from './tool.types';

export interface WriteToolDefinition {
  name: string;
  entity: MutationEntity;
  operation: MutationOperation;
}

const drugFields = {
  approval_no: z.string().describe('Drug approval number.'),
  name: z.string().describe('Drug name.'),
  scientific_name: z.string().optional().describe('Scientific name.'),
  model: z.string().optional().describe('Model.'),
  specification: z.string().optional().describe('Specification.'),
  is_prescription: z
    .boolean()
    .optional()
    .describe('Whether it is a prescription drug.'),
};

const warehouseFields = {
  code: z.string().describe('Warehouse code.'),
  name: z.string().describe('Warehouse name.'),
  address: z.string().optional().describe('Warehouse address.'),
  manager: z.string().optional().describe('Warehouse manager.'),
};

const manufacturerFields = {
  approval_no: z.string().describe('Manufacturer approval number.'),
  name: z.string().describe('Manufacturer name.'),
  city: z.string().optional().describe('City.'),
  address: z.string().optional().describe('Address.'),
  postal_code: z.string().optional().describe('Postal code.'),
  phone: z.string().optional().describe('Phone number.'),
  is_gmp: z.boolean().optional().describe('Whether GMP certified.'),
};

const medicalInstitutionFields = {
  approval_no: z.string().describe('Medical institution approval number.'),
  name: z.string().describe('Medical institution name.'),
  address: z.string().optional().describe('Address.'),
  postal_code: z.string().optional().describe('Postal code.'),
  phone: z.string().optional().describe('Phone number.'),
  is_specialized: z
    .boolean()
    .optional()
    .describe('Whether it is a specialized institution.'),
};

const storageLocationFields = {
  warehouseId: z.number().describe('Warehouse ID.'),
  code: z.string().describe('Storage location code.'),
  capacity: z.number().int().optional().describe('Capacity.'),
  description: z.string().optional().describe('Description.'),
};

const inventoryFields = {
  warehouse_code: z.string().describe('Warehouse code.'),
  location_code: z.string().describe('Storage location code.'),
  manufacturerApprovalNo: z
    .string()
    .optional()
    .describe('Manufacturer approval number.'),
  drugApprovalNo: z.string().describe('Drug approval number.'),
  drug_name: z.string().describe('Drug name.'),
  batch_no: z.string().optional().describe('Batch number.'),
  production_date: z.string().describe('Production date in ISO format.'),
  expiry_date: z.string().describe('Expiry date in ISO format.'),
  quantity: z.number().int().describe('Inventory quantity.'),
};

const purchaseOrderDetailFields = {
  drugApprovalNo: z.string().describe('Drug approval number.'),
  drug_name: z.string().describe('Drug name.'),
  production_date: z.string().describe('Production date in ISO format.'),
  validity_months: z.number().int().describe('Validity period in months.'),
  quantity: z.number().int().describe('Purchase quantity.'),
  unit_price: z.number().describe('Purchase unit price.'),
};

const purchaseOrderCreateFields = {
  order_no: z.string().describe('Purchase order number.'),
  order_date: z.string().describe('Order date in ISO format.'),
  manufacturerApprovalNo: z.string().describe('Manufacturer approval number.'),
  manufacturer_name: z.string().describe('Manufacturer name.'),
  purchaser: z.string().describe('Purchaser name.'),
  purchaseDetails: z
    .array(z.object(purchaseOrderDetailFields))
    .min(1)
    .describe('Purchase order detail lines.'),
};

const purchaseOrderUpdateFields = {
  order_date: z.string().optional().describe('Order date in ISO format.'),
  manufacturer_name: z.string().optional().describe('Manufacturer name.'),
  total_amount: z.number().optional().describe('Order total amount.'),
  purchaser: z.string().optional().describe('Purchaser name.'),
  status: z
    .nativeEnum(PurchaseOrderStatus)
    .optional()
    .describe('Purchase order status.'),
};

const salesOrderDetailFields = {
  manufacturerApprovalNo: z.string().describe('Manufacturer approval number.'),
  drugApprovalNo: z.string().describe('Drug approval number.'),
  drug_name: z.string().describe('Drug name.'),
  production_date: z.string().describe('Production date in ISO format.'),
  quantity: z.number().int().describe('Sales quantity.'),
  unit_price: z.number().describe('Sales unit price.'),
};

const salesOrderCreateFields = {
  order_no: z.string().describe('Sales order number.'),
  sales_date: z.string().describe('Sales date in ISO format.'),
  institutionApprovalNo: z
    .string()
    .describe('Medical institution approval number.'),
  institution_name: z.string().describe('Medical institution name.'),
  salesperson: z.string().describe('Salesperson name.'),
  salesDetails: z
    .array(z.object(salesOrderDetailFields))
    .min(1)
    .describe('Sales order detail lines.'),
};

const salesOrderUpdateFields = {
  sales_date: z.string().optional().describe('Sales date in ISO format.'),
  institution_name: z.string().optional().describe('Medical institution name.'),
  total_amount: z.number().optional().describe('Order total amount.'),
  salesperson: z.string().optional().describe('Salesperson name.'),
  status: z
    .nativeEnum(SalesOrderStatus)
    .optional()
    .describe('Sales order status.'),
};

const purchaseDetailCreateFields = {
  orderNo: z.string().describe('Purchase order number.'),
  drugApprovalNo: z.string().describe('Drug approval number.'),
  drug_name: z.string().describe('Drug name.'),
  production_date: z.string().describe('Production date in ISO format.'),
  validity_months: z.number().int().describe('Validity period in months.'),
  quantity: z.number().int().describe('Purchase quantity.'),
  unit_price: z.number().describe('Purchase unit price.'),
};

const purchaseDetailUpdateFields = {
  quantity: z.number().int().optional().describe('Purchase quantity.'),
  unit_price: z.number().optional().describe('Purchase unit price.'),
};

const salesDetailCreateFields = {
  orderNo: z.string().describe('Sales order number.'),
  manufacturerApprovalNo: z.string().describe('Manufacturer approval number.'),
  drugApprovalNo: z.string().describe('Drug approval number.'),
  drug_name: z.string().describe('Drug name.'),
  production_date: z.string().describe('Production date in ISO format.'),
  quantity: z.number().int().describe('Sales quantity.'),
  unit_price: z.number().describe('Sales unit price.'),
};

const salesDetailUpdateFields = {
  quantity: z.number().int().optional().describe('Sales quantity.'),
  unit_price: z.number().optional().describe('Sales unit price.'),
};

const purchaseStorageEntryFields = {
  detailId: z.number().int().describe('Purchase detail ID.'),
  warehouse_code: z.string().describe('Warehouse code.'),
  location_code: z.string().describe('Storage location code.'),
  quantity: z.number().int().describe('Storage quantity.'),
  batch_no: z.string().optional().describe('Batch number.'),
};

const purchaseStorageCreateFields = {
  orderNo: z.string().describe('Purchase order number.'),
  storage_date: z.string().describe('Storage date in ISO format.'),
  inspector: z.string().describe('Inspector name.'),
  keeper: z.string().describe('Keeper name.'),
  entries: z
    .array(z.object(purchaseStorageEntryFields))
    .min(1)
    .describe('Purchase storage submission entries.'),
};

const purchaseStorageUpdateFields = {
  quantity: z.number().int().optional().describe('Storage quantity.'),
  batch_no: z.string().optional().describe('Batch number.'),
};

const salesOutboundEntryFields = {
  detailId: z.number().int().describe('Sales detail ID.'),
  inventoryId: z.number().int().describe('Inventory record ID.'),
  quantity: z.number().int().describe('Outbound quantity.'),
};

const salesOutboundCreateFields = {
  orderNo: z.string().describe('Sales order number.'),
  outbound_date: z.string().describe('Outbound date in ISO format.'),
  inspector: z.string().describe('Inspector name.'),
  keeper: z.string().describe('Keeper name.'),
  entries: z
    .array(z.object(salesOutboundEntryFields))
    .min(1)
    .describe('Sales outbound submission entries.'),
};

const salesOutboundUpdateFields = {
  quantity: z.number().int().optional().describe('Outbound quantity.'),
};

const writeToolDefinitions: Array<{
  definition: WriteToolDefinition;
  description: string;
  schema: z.ZodTypeAny;
}> = [
  {
    definition: {
      name: 'request_create_drug',
      entity: 'drug',
      operation: 'create',
    },
    description:
      'Propose creating a drug record. This requires human approval before the database is updated.',
    schema: z.object(drugFields),
  },
  {
    definition: {
      name: 'request_update_drug',
      entity: 'drug',
      operation: 'update',
    },
    description:
      'Propose updating a drug record by approval number. Use only when the target record is unambiguous.',
    schema: z.object({
      approval_no: z.string().describe('Target drug approval number.'),
      data: z.object(drugFields).partial().describe('Fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_drug',
      entity: 'drug',
      operation: 'delete',
    },
    description:
      'Propose deleting a drug record by approval number. This requires human approval.',
    schema: z.object({
      approval_no: z.string().describe('Target drug approval number.'),
    }),
  },
  {
    definition: {
      name: 'request_create_warehouse',
      entity: 'warehouse',
      operation: 'create',
    },
    description:
      'Propose creating a warehouse record. This requires human approval before execution.',
    schema: z.object(warehouseFields),
  },
  {
    definition: {
      name: 'request_update_warehouse',
      entity: 'warehouse',
      operation: 'update',
    },
    description:
      'Propose updating a warehouse record by ID. Use only when the target is clear.',
    schema: z.object({
      id: z.number().describe('Target warehouse ID.'),
      data: z.object(warehouseFields).partial().describe('Fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_warehouse',
      entity: 'warehouse',
      operation: 'delete',
    },
    description:
      'Propose deleting a warehouse record by ID. This requires human approval.',
    schema: z.object({
      id: z.number().describe('Target warehouse ID.'),
    }),
  },
  {
    definition: {
      name: 'request_create_manufacturer',
      entity: 'manufacturer',
      operation: 'create',
    },
    description:
      'Propose creating a manufacturer record. This requires human approval before execution.',
    schema: z.object(manufacturerFields),
  },
  {
    definition: {
      name: 'request_update_manufacturer',
      entity: 'manufacturer',
      operation: 'update',
    },
    description:
      'Propose updating a manufacturer record by approval number. Use only when the target is clear.',
    schema: z.object({
      approval_no: z.string().describe('Target manufacturer approval number.'),
      data: z
        .object(manufacturerFields)
        .partial()
        .describe('Fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_manufacturer',
      entity: 'manufacturer',
      operation: 'delete',
    },
    description:
      'Propose deleting a manufacturer record by approval number. This requires human approval.',
    schema: z.object({
      approval_no: z.string().describe('Target manufacturer approval number.'),
    }),
  },
  {
    definition: {
      name: 'request_create_medical_institution',
      entity: 'medical_institution',
      operation: 'create',
    },
    description:
      'Propose creating a medical institution record. This requires human approval before execution.',
    schema: z.object(medicalInstitutionFields),
  },
  {
    definition: {
      name: 'request_update_medical_institution',
      entity: 'medical_institution',
      operation: 'update',
    },
    description:
      'Propose updating a medical institution record by approval number. Use only when the target is clear.',
    schema: z.object({
      approval_no: z
        .string()
        .describe('Target medical institution approval number.'),
      data: z
        .object(medicalInstitutionFields)
        .partial()
        .describe('Fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_medical_institution',
      entity: 'medical_institution',
      operation: 'delete',
    },
    description:
      'Propose deleting a medical institution record by approval number. This requires human approval.',
    schema: z.object({
      approval_no: z
        .string()
        .describe('Target medical institution approval number.'),
    }),
  },
  {
    definition: {
      name: 'request_create_storage_location',
      entity: 'storage_location',
      operation: 'create',
    },
    description:
      'Propose creating a storage location record. This requires human approval before execution.',
    schema: z.object(storageLocationFields),
  },
  {
    definition: {
      name: 'request_update_storage_location',
      entity: 'storage_location',
      operation: 'update',
    },
    description:
      'Propose updating a storage location record by ID. Use only when the target is clear.',
    schema: z.object({
      id: z.number().describe('Target storage location ID.'),
      data: z
        .object(storageLocationFields)
        .partial()
        .describe('Fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_storage_location',
      entity: 'storage_location',
      operation: 'delete',
    },
    description:
      'Propose deleting a storage location record by ID. This requires human approval.',
    schema: z.object({
      id: z.number().describe('Target storage location ID.'),
    }),
  },
  {
    definition: {
      name: 'request_create_inventory',
      entity: 'inventory',
      operation: 'create',
    },
    description:
      'Propose creating an inventory record. This requires human approval before execution.',
    schema: z.object(inventoryFields),
  },
  {
    definition: {
      name: 'request_update_inventory',
      entity: 'inventory',
      operation: 'update',
    },
    description:
      'Propose updating an inventory record by ID. Use only when the target is clear.',
    schema: z.object({
      id: z.number().describe('Target inventory ID.'),
      data: z.object(inventoryFields).partial().describe('Fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_inventory',
      entity: 'inventory',
      operation: 'delete',
    },
    description:
      'Propose deleting an inventory record by ID. This requires human approval.',
    schema: z.object({
      id: z.number().describe('Target inventory ID.'),
    }),
  },
  {
    definition: {
      name: 'request_create_purchase_order',
      entity: 'purchase_order',
      operation: 'create',
    },
    description:
      'Propose creating a purchase order with detail lines. This requires human approval before execution.',
    schema: z.object(purchaseOrderCreateFields),
  },
  {
    definition: {
      name: 'request_update_purchase_order',
      entity: 'purchase_order',
      operation: 'update',
    },
    description:
      'Propose updating a purchase order by order number. Use only when the target order is clear.',
    schema: z.object({
      order_no: z.string().describe('Target purchase order number.'),
      data: z
        .object(purchaseOrderUpdateFields)
        .describe('Order fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_purchase_order',
      entity: 'purchase_order',
      operation: 'delete',
    },
    description:
      'Propose deleting a purchase order by order number. This requires human approval.',
    schema: z.object({
      order_no: z.string().describe('Target purchase order number.'),
    }),
  },
  {
    definition: {
      name: 'request_create_sales_order',
      entity: 'sales_order',
      operation: 'create',
    },
    description:
      'Propose creating a sales order with detail lines. This requires human approval before execution.',
    schema: z.object(salesOrderCreateFields),
  },
  {
    definition: {
      name: 'request_update_sales_order',
      entity: 'sales_order',
      operation: 'update',
    },
    description:
      'Propose updating a sales order by order number. Use only when the target order is clear.',
    schema: z.object({
      order_no: z.string().describe('Target sales order number.'),
      data: z
        .object(salesOrderUpdateFields)
        .describe('Order fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_sales_order',
      entity: 'sales_order',
      operation: 'delete',
    },
    description:
      'Propose deleting a sales order by order number. This requires human approval.',
    schema: z.object({
      order_no: z.string().describe('Target sales order number.'),
    }),
  },
  {
    definition: {
      name: 'request_create_purchase_detail',
      entity: 'purchase_detail',
      operation: 'create',
    },
    description:
      'Propose creating a purchase order detail line. This requires human approval before execution.',
    schema: z.object(purchaseDetailCreateFields),
  },
  {
    definition: {
      name: 'request_update_purchase_detail',
      entity: 'purchase_detail',
      operation: 'update',
    },
    description:
      'Propose updating a purchase order detail line by ID. Use only when the target detail is clear.',
    schema: z.object({
      id: z.number().describe('Target purchase detail ID.'),
      data: z
        .object(purchaseDetailUpdateFields)
        .describe('Detail fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_purchase_detail',
      entity: 'purchase_detail',
      operation: 'delete',
    },
    description:
      'Propose deleting a purchase order detail line by ID. This requires human approval.',
    schema: z.object({
      id: z.number().describe('Target purchase detail ID.'),
    }),
  },
  {
    definition: {
      name: 'request_create_sales_detail',
      entity: 'sales_detail',
      operation: 'create',
    },
    description:
      'Propose creating a sales order detail line. This requires human approval before execution.',
    schema: z.object(salesDetailCreateFields),
  },
  {
    definition: {
      name: 'request_update_sales_detail',
      entity: 'sales_detail',
      operation: 'update',
    },
    description:
      'Propose updating a sales order detail line by ID. Use only when the target detail is clear.',
    schema: z.object({
      id: z.number().describe('Target sales detail ID.'),
      data: z
        .object(salesDetailUpdateFields)
        .describe('Detail fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_sales_detail',
      entity: 'sales_detail',
      operation: 'delete',
    },
    description:
      'Propose deleting a sales order detail line by ID. This requires human approval.',
    schema: z.object({
      id: z.number().describe('Target sales detail ID.'),
    }),
  },
  {
    definition: {
      name: 'request_create_purchase_storage',
      entity: 'purchase_storage',
      operation: 'create',
    },
    description:
      'Propose submitting purchase storage entries. This requires human approval before execution.',
    schema: z.object(purchaseStorageCreateFields),
  },
  {
    definition: {
      name: 'request_update_purchase_storage',
      entity: 'purchase_storage',
      operation: 'update',
    },
    description:
      'Propose updating a purchase storage record by ID. Use only when the target record is clear.',
    schema: z.object({
      id: z.number().describe('Target purchase storage record ID.'),
      data: z
        .object(purchaseStorageUpdateFields)
        .describe('Storage fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_purchase_storage',
      entity: 'purchase_storage',
      operation: 'delete',
    },
    description:
      'Propose deleting a purchase storage record by ID. This requires human approval.',
    schema: z.object({
      id: z.number().describe('Target purchase storage record ID.'),
    }),
  },
  {
    definition: {
      name: 'request_create_sales_outbound',
      entity: 'sales_outbound',
      operation: 'create',
    },
    description:
      'Propose submitting sales outbound entries. This requires human approval before execution.',
    schema: z.object(salesOutboundCreateFields),
  },
  {
    definition: {
      name: 'request_update_sales_outbound',
      entity: 'sales_outbound',
      operation: 'update',
    },
    description:
      'Propose updating a sales outbound record by ID. Use only when the target record is clear.',
    schema: z.object({
      id: z.number().describe('Target sales outbound record ID.'),
      data: z
        .object(salesOutboundUpdateFields)
        .describe('Outbound fields to update.'),
    }),
  },
  {
    definition: {
      name: 'request_delete_sales_outbound',
      entity: 'sales_outbound',
      operation: 'delete',
    },
    description:
      'Propose deleting a sales outbound record by ID. This requires human approval.',
    schema: z.object({
      id: z.number().describe('Target sales outbound record ID.'),
    }),
  },
];

export const WRITE_TOOL_DEFINITIONS: WriteToolDefinition[] =
  writeToolDefinitions.map((item) => item.definition);

export const WRITE_TOOL_NAMES = new Set(
  WRITE_TOOL_DEFINITIONS.map((item) => item.name),
);

export function createWriteRequestTools() {
  return writeToolDefinitions.map(({ definition, description, schema }) =>
    tool(
      async (input) =>
        JSON.stringify({
          pending_approval: true,
          tool: definition.name,
          input,
        }),
      {
        name: definition.name,
        description,
        schema,
      },
    ),
  );
}
