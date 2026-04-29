import type { MedicalInstitution } from "./basic-data.js";

export type Institution = MedicalInstitution;

export interface SalesDetail {
  id: number;
  orderNo: string;
  manufacturerApprovalNo: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

export interface SalesOrder {
  order_no: string;
  sales_date: string;
  institutionApprovalNo: string;
  institution_name: string;
  total_amount: string;
  salesperson: string;
  status: string;
  create_time: string;
  institution: Institution;
  salesDetails: SalesDetail[];
}

export interface SalesOutboundDetail {
  id: number;
  orderNo: string;
  drugApprovalNo: string;
  drug_name: string;
  batch_number: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  outbound_quantity: number;
  inventory_quantity: number;
}

export interface SalesOutbound {
  id: number;
  order_no: string;
  outbound_date: string;
  institution_name: string;
  salesperson: string;
  status: string;
  details: SalesOutboundDetail[];
}
