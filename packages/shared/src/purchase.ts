import type { Manufacturer } from "./basic-data.js";

export interface PurchaseOrder {
  order_no: string;
  order_date: string;
  manufacturerApprovalNo: string;
  manufacturer_name: string;
  total_amount: string;
  purchaser: string;
  status: string;
  create_time: string;
  manufacturer?: Manufacturer;
  purchaseDetails?: PurchaseDetail[];
  purchaseStorages?: PurchaseStorage[];
}

export interface PurchaseDetail {
  id: number;
  orderNo: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  validity_months: number;
  quantity: number;
  unit_price: string;
  amount: string;
}

export interface PurchaseStorage {
  id: number;
  warehouse_code: string;
  location_code: string;
  orderNo: string;
  storage_date: string;
  manufacturerApprovalNo: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  purchaser: string;
  inspector: string;
  keeper: string;
  batch_no: string;
  create_time: string;
}

export interface PurchaseReport {
  month: string;
  order_count: number;
  purchase_amount: number;
  storage_amount: number;
  return_amount: number;
}
