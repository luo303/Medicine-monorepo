export type { Institution, SalesDetail, SalesOrder } from "@medicine/shared";

export interface SalesOutboundRecord {
  id: number;
  warehouse_code: string;
  location_code: string;
  orderNo: string;
  outbound_date: string;
  institutionApprovalNo: string;
  manufacturerApprovalNo?: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  quantity: number;
  salesperson?: string;
  inspector?: string;
  keeper?: string;
  create_time?: string;
}

export const SALES_STATUS_MAP: Record<string, { label: string; color: string }> = {
  全部出库: {
    label: "全部出库",
    color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
  },
  部分出库: {
    label: "部分出库",
    color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20"
  },
  已审核: {
    label: "已审核",
    color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
  },
  待审核: {
    label: "待审核",
    color: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20"
  }
};
