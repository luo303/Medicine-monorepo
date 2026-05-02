/**
 * Excel 导出 - 列定义与数据转换
 * 负责各报表类型的表头配置和原始数据到 Excel 行数据的映射
 */

export type ReportType =
  | "manufacturer"
  | "drug"
  | "institution"
  | "purchase"
  | "sales"
  | "purchase_storage"
  | "sales_outbound"
  | "inventory"
  | "warehouse"
  | "storage_location"
  | "sales_report"
  | "purchase_report"
  | "inventory_flow";

export interface ExportColumnDef {
  key: string;
  label: string;
  width?: number;
}

/** 各报表类型的列定义 */
export const COLUMN_DEFS: Record<ReportType, ExportColumnDef[]> = {
  manufacturer: [
    { key: "approval_no", label: "企业批准号" },
    { key: "name", label: "企业名称" },
    { key: "city", label: "所在城市" },
    { key: "address", label: "地址" },
    { key: "postal_code", label: "邮政编码" },
    { key: "phone", label: "联系电话" },
    { key: "is_gmp", label: "GMP认证" }
  ],
  drug: [
    { key: "approval_no", label: "药品批准号" },
    { key: "name", label: "药品名称" },
    { key: "scientific_name", label: "学名" },
    { key: "model", label: "型号" },
    { key: "specification", label: "规格" },
    { key: "is_prescription", label: "处方药" }
  ],
  institution: [
    { key: "approval_no", label: "机构批准号" },
    { key: "name", label: "机构名称" },
    { key: "address", label: "地址" },
    { key: "postal_code", label: "邮政编码" },
    { key: "phone", label: "联系电话" },
    { key: "is_specialized", label: "专科医院" }
  ],
  purchase: [
    { key: "order_no", label: "采购单号" },
    { key: "order_date", label: "采购日期" },
    { key: "manufacturer_name", label: "企业名称" },
    { key: "total_amount", label: "总金额(¥)" },
    { key: "purchaser", label: "采购员" },
    { key: "status", label: "状态" }
  ],
  sales: [
    { key: "order_no", label: "销售单号" },
    { key: "sales_date", label: "销售日期" },
    { key: "institution_name", label: "机构名称" },
    { key: "total_amount", label: "总金额(¥)" },
    { key: "salesperson", label: "销售员" },
    { key: "status", label: "状态" }
  ],
  purchase_storage: [
    { key: "warehouse_code", label: "仓号" },
    { key: "location_code", label: "货位号" },
    { key: "orderNo", label: "采购单号" },
    { key: "storage_date", label: "入库日期" },
    { key: "drug_name", label: "药品名称" },
    { key: "quantity", label: "入库数量" }
  ],
  sales_outbound: [
    { key: "warehouse_code", label: "仓号" },
    { key: "location_code", label: "货位号" },
    { key: "orderNo", label: "销售单号" },
    { key: "outbound_date", label: "出库日期" },
    { key: "drug_name", label: "药品名称" },
    { key: "quantity", label: "出库数量" }
  ],
  inventory: [
    { key: "warehouse_code", label: "仓号" },
    { key: "location_code", label: "货位号" },
    { key: "batch_no", label: "批次号" },
    { key: "drug_name", label: "药品名称" },
    { key: "quantity", label: "库存数量" },
    { key: "last_update", label: "最后更新" }
  ],
  warehouse: [
    { key: "code", label: "仓库编号" },
    { key: "name", label: "仓库名称" },
    { key: "address", label: "地址" },
    { key: "manager", label: "负责人" }
  ],
  storage_location: [
    { key: "code", label: "货位编号" },
    { key: "warehouseId", label: "仓库ID" },
    { key: "description", label: "描述" },
    { key: "capacity", label: "容量" }
  ],
  sales_report: [
    { key: "month", label: "月份" },
    { key: "orderCount", label: "销售单数" },
    { key: "salesAmount", label: "销售额(¥)" },
    { key: "costAmount", label: "成本(¥)" },
    { key: "profit", label: "毛利(¥)" },
    { key: "profitRate", label: "毛利率" }
  ],
  purchase_report: [
    { key: "month", label: "月份" },
    { key: "orderCount", label: "采购单数" },
    { key: "purchaseAmount", label: "采购金额(¥)" },
    { key: "storageAmount", label: "入库金额(¥)" },
    { key: "returnAmount", label: "退货金额(¥)" }
  ],
  inventory_flow: [
    { key: "date", label: "时间" },
    { key: "type", label: "类型" },
    { key: "order_no", label: "单号" },
    { key: "drug_name", label: "药品名称" },
    { key: "batch_no", label: "批号" },
    { key: "quantity", label: "数量" },
    { key: "operator", label: "操作人" }
  ]
};

/** 状态码 → 中文 映射 */
const STATUS_MAP: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  completed: "已完成",
  cancelled: "已取消"
};

/**
 * 将原始数据转换为扁平行对象数组（供 xlsx 使用）
 * 处理布尔值→中文、状态码→中文等映射转换
 */
export function flattenData(reportType: ReportType, rawData: any[]): Record<string, any>[] {
  const columns = COLUMN_DEFS[reportType];

  return rawData.map(item => {
    const row: Record<string, any> = {};

    for (const col of columns) {
      let value = item[col.key];

      if (typeof value === "boolean") {
        value = value ? "是" : "否";
      }

      if (col.key === "status" && typeof value === "string") {
        value = STATUS_MAP[value] || value;
      }

      if (col.key === "is_prescription" && typeof value === "boolean") {
        value = value ? "处方药" : "非处方药";
      }

      row[col.label] = value ?? "";
    }

    return row;
  });
}
