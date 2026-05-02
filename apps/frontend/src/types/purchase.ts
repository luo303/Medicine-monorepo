export type { PurchaseDetail, PurchaseOrder, PurchaseReport, PurchaseStorage } from "@medicine/shared";

export const PURCHASE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  待审核: {
    label: "待审核",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
  },
  已审核: {
    label: "已审核",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
  },
  部分入库: {
    label: "部分入库",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20"
  },
  全部入库: {
    label: "全部入库",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
  },
  已取消: {
    label: "已取消",
    color: "text-slate-500 bg-slate-50 dark:bg-slate-800"
  }
};
