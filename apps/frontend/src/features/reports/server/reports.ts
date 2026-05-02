export type {
  Drug,
  Inventory,
  Manufacturer,
  MedicalInstitution,
  PurchaseDetail,
  PurchaseOrder,
  PurchaseStorage,
  SalesDetail
} from "@medicine/shared";

import type { SalesDetail } from "@medicine/shared";

export interface SalesOrder {
  order_no: string;
  sales_date: string;
  institutionApprovalNo: string;
  institution_name: string;
  manufacturerApprovalNo: string;
  manufacturer_name: string;
  total_amount: string;
  salesperson: string;
  status: string;
  create_time: string;
  salesDetails?: SalesDetail[];
}

export interface SalesOutbound {
  id: number;
  warehouse_code: string;
  location_code: string;
  orderNo: string;
  outbound_date: string;
  institutionApprovalNo: string;
  manufacturerApprovalNo: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  quantity: number;
  salesperson: string;
  inspector: string;
  keeper: string;
}
