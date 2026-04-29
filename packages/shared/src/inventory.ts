import type { Drug, Warehouse } from "./basic-data.js";

export interface Inventory {
  id: number;
  warehouse_code: string;
  location_code: string;
  manufacturerApprovalNo: string;
  drugApprovalNo: string;
  drug_name: string;
  batch_no: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  last_update: string;
  drug: Drug;
  warehouse: Warehouse;
}

export interface InventoryFlow {
  id: number;
  date: string;
  type: "采购入库" | "销售出库" | "采购退货" | "销售退货" | "盘点调整";
  order_no: string;
  drug_name: string;
  batch_no: string;
  quantity: number;
  operator: string;
  warehouse_code?: string;
  location_code?: string;
}

export interface InventoryCheck {
  id: number;
  check_no: string;
  check_date: string;
  warehouse_code: string;
  warehouse_name: string;
  status: "草稿" | "待审核" | "已审核" | "已完成";
  checker: string;
  reviewer: string;
  items: InventoryCheckItem[];
}

export interface InventoryCheckItem {
  id: number;
  drug_name: string;
  batch_no: string;
  location_code: string;
  book_quantity: number;
  actual_quantity: number;
  difference: number;
  reason: string;
}

export interface BatchTrace {
  batch_no: string;
  drug_name: string;
  drug_approval_no: string;
  production_date: string;
  expiry_date: string;
  manufacturer_name: string;
  current_quantity: number;
  purchase_records: BatchPurchaseRecord[];
  sales_records: BatchSalesRecord[];
}

export interface BatchPurchaseRecord {
  order_no: string;
  order_date: string;
  quantity: number;
  purchaser: string;
  storage_date: string;
  storage_no: string;
  inspector: string;
}

export interface BatchSalesRecord {
  order_no: string;
  sales_date: string;
  customer: string;
  quantity: number;
  salesperson: string;
  outbound_date: string;
}

export interface SafetyStockSetting {
  drug_approval_no: string;
  drug_name: string;
  safety_stock: number;
  max_stock: number;
}
