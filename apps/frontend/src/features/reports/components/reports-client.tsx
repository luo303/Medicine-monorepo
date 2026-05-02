"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Loader2,
  FileBox,
  Eye,
  Search,
  X,
  Building2,
  Pill,
  Hospital,
  ShoppingCart,
  Receipt,
  PackageOpen,
  Truck,
  ClipboardList,
  ChevronRight,
  Sparkles,
  Download
} from "lucide-react";
import { exportToExcel } from "@/lib/excel-export";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import type { AllReportsData } from "@/features/reports/server/reports-server";

type ReportType =
  | "manufacturer"
  | "drug"
  | "institution"
  | "purchase"
  | "sales"
  | "purchase_storage"
  | "sales_outbound"
  | "inventory";

const REPORT_CONFIG: Record<ReportType, { label: string; icon: React.ReactNode; description: string; color: string }> =
  {
    manufacturer: {
      label: "企业药品供应厂商情况表",
      icon: <Building2 className="w-4.5 h-4.5" />,
      description: "查看所有合作的药品生产企业及供应商详细信息",
      color: "#0d9488"
    },
    drug: {
      label: "企业经营药品目录表",
      icon: <Pill className="w-4.5 h-4.5" />,
      description: "管理企业当前经营的所有药品种类及规格详情",
      color: "#0891b2"
    },
    institution: {
      label: "企业药品销售机构目录表",
      icon: <Hospital className="w-4.5 h-4.5" />,
      description: "查看所有合作的医疗机构、医院及终端药店信息",
      color: "#7c3aed"
    },
    purchase: {
      label: "企业药品采购表",
      icon: <ShoppingCart className="w-4.5 h-4.5" />,
      description: "追踪企业药品的采购订单、金额明细及完成状态",
      color: "#ea580c"
    },
    sales: {
      label: "企业药品销售表",
      icon: <Receipt className="w-4.5 h-4.5" />,
      description: "查看药品的销售记录、销售额分析及出库进度",
      color: "#16a34a"
    },
    purchase_storage: {
      label: "企业药品采购入库表",
      icon: <PackageOpen className="w-4.5 h-4.5" />,
      description: "管理采购药品的入库记录、货位分配及检验信息",
      color: "#2563eb"
    },
    sales_outbound: {
      label: "企业药品销售出库表",
      icon: <Truck className="w-4.5 h-4.5" />,
      description: "追踪销售药品的出库记录、出库数量及经办人信息",
      color: "#dc2626"
    },
    inventory: {
      label: "企业药品库存表",
      icon: <ClipboardList className="w-4.5 h-4.5" />,
      description: "实时监控各仓库的药品库存余量、批次及效期状态",
      color: "#ca8a04"
    }
  };

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50/90 to-white/60 dark:from-slate-800/60 dark:to-slate-900/40 p-4 border border-slate-100/80 dark:border-slate-700/30 transition-all duration-300 hover:border-teal-200/60 dark:hover:border-teal-800/30 hover:shadow-md hover:shadow-teal-500/5">
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <Label className="text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500 mb-1.5 block uppercase">
      {label}
    </Label>
    <div className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">{value || "-"}</div>
  </div>
);

const BooleanBadge = ({
  value,
  trueText = "是",
  falseText = "否"
}: {
  value: boolean;
  trueText?: string;
  falseText?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
      value
        ? "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/40"
        : "bg-slate-100/90 text-slate-500 ring-1 ring-slate-200/60 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-700/40"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${value ? "bg-emerald-500 shadow-sm shadow-emerald-400/50" : "bg-slate-400"}`}
    ></span>
    {value ? trueText : falseText}
  </span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const isSuccess = status === "completed" || status === "全部出库" || status === "全部入库";
  const isWarning = status === "部分出库" || status === "部分入库" || status === "已审核";

  const config = isSuccess
    ? "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/40"
    : isWarning
      ? "bg-amber-50/90 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800/40"
      : "bg-slate-100/90 text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-700/40";

  const dotColor = isSuccess
    ? "bg-emerald-500 shadow-sm shadow-emerald-400/50"
    : isWarning
      ? "bg-amber-500 shadow-sm shadow-amber-400/50"
      : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${config}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
};

const ActionButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 rounded-lg transition-all duration-200 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:shadow-sm hover:shadow-teal-500/10 active:scale-95"
  >
    <Eye className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
    详情
    <ChevronRight className="w-3 h-3 transition-all duration-200 opacity-0 -ml-1 group-hover:opacity-100 group-hover:translate-x-0.5" />
  </button>
);

interface ReportsClientProps {
  initialData: AllReportsData;
}

export default function ReportsClient({ initialData }: ReportsClientProps) {
  const [activeReport, setActiveReport] = useState<ReportType>("manufacturer");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tableKey, setTableKey] = useState(0);

  const handleViewDetail = useCallback((item: any) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  }, []);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const s = statusFilter;

    switch (activeReport) {
      case "manufacturer":
        return initialData.manufacturers.filter(
          item =>
            (!q ||
              item.name.toLowerCase().includes(q) ||
              item.approval_no.toLowerCase().includes(q) ||
              item.city.toLowerCase().includes(q)) &&
            (s === "all" || (s === "gmp" && item.is_gmp) || (s === "non-gmp" && !item.is_gmp))
        );
      case "drug":
        return initialData.drugs.filter(
          item =>
            (!q ||
              item.name.toLowerCase().includes(q) ||
              item.approval_no.toLowerCase().includes(q) ||
              item.scientific_name.toLowerCase().includes(q)) &&
            (s === "all" || (s === "rx" && item.is_prescription) || (s === "otc" && !item.is_prescription))
        );
      case "institution":
        return initialData.institutions.filter(
          item =>
            (!q || item.name.toLowerCase().includes(q) || item.approval_no.toLowerCase().includes(q)) &&
            (s === "all" || (s === "specialized" && item.is_specialized) || (s === "general" && !item.is_specialized))
        );
      case "purchase":
        return initialData.purchaseOrders.filter(
          item =>
            (!q ||
              item.order_no.toLowerCase().includes(q) ||
              item.manufacturer_name.toLowerCase().includes(q) ||
              item.purchaser.toLowerCase().includes(q)) &&
            (s === "all" || item.status === s)
        );
      case "sales":
        return initialData.salesOrders.filter(
          item =>
            (!q ||
              item.order_no.toLowerCase().includes(q) ||
              item.institution_name.toLowerCase().includes(q) ||
              item.salesperson.toLowerCase().includes(q)) &&
            (s === "all" || item.status === s)
        );
      case "purchase_storage":
        return initialData.purchaseStorages.filter(
          item =>
            !q ||
            item.orderNo.toLowerCase().includes(q) ||
            item.drug_name.toLowerCase().includes(q) ||
            item.warehouse_code.toLowerCase().includes(q)
        );
      case "sales_outbound":
        return initialData.salesOutbounds.filter(
          item =>
            !q ||
            item.orderNo.toLowerCase().includes(q) ||
            item.drug_name.toLowerCase().includes(q) ||
            item.warehouse_code.toLowerCase().includes(q)
        );
      case "inventory":
        return initialData.inventory.filter(
          item =>
            !q ||
            item.drug_name.toLowerCase().includes(q) ||
            item.batch_no.toLowerCase().includes(q) ||
            item.warehouse_code.toLowerCase().includes(q)
        );
      default:
        return [];
    }
  }, [activeReport, searchQuery, statusFilter, initialData]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportToExcel({
        reportType: activeReport,
        reportLabel: REPORT_CONFIG[activeReport].label,
        rawData: filteredData
      });
    } finally {
      setExporting(false);
    }
  }, [activeReport, filteredData]);

  const tableColumns = useMemo((): ColumnDef[] => {
    const baseColumns: Record<ReportType, ColumnDef[]> = {
      manufacturer: [
        {
          key: "approval_no",
          label: "企业批准号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        {
          key: "name",
          label: "企业名称",
          render: v => <span className="font-semibold text-slate-800 dark:text-slate-100">{v}</span>
        },
        { key: "city", label: "所在城市" },
        { key: "address", label: "地址" },
        { key: "phone", label: "联系电话" },
        { key: "is_gmp", label: "是否 GMP", render: v => <BooleanBadge value={v} /> }
      ],
      drug: [
        {
          key: "approval_no",
          label: "药品批准号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        {
          key: "name",
          label: "药品名称",
          render: v => <span className="font-semibold text-slate-800 dark:text-slate-100">{v}</span>
        },
        { key: "scientific_name", label: "学名" },
        { key: "model", label: "型号" },
        { key: "specification", label: "规格" },
        {
          key: "is_prescription",
          label: "处方药",
          render: v => <BooleanBadge value={v} trueText="处方药" falseText="非处方药" />
        }
      ],
      institution: [
        {
          key: "approval_no",
          label: "机构批准号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        {
          key: "name",
          label: "机构名称",
          render: v => <span className="font-semibold text-slate-800 dark:text-slate-100">{v}</span>
        },
        { key: "address", label: "地址" },
        { key: "postal_code", label: "邮政编码" },
        { key: "phone", label: "联系电话" },
        { key: "is_specialized", label: "专科医院", render: v => <BooleanBadge value={v} /> }
      ],
      purchase: [
        {
          key: "order_no",
          label: "采购单号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        { key: "order_date", label: "采购日期", render: v => formatDate(v) },
        {
          key: "manufacturer_name",
          label: "企业名称",
          render: v => <span className="font-medium text-slate-800 dark:text-slate-100">{v}</span>
        },
        {
          key: "total_amount",
          label: "总金额",
          render: v => (
            <span className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
              <span className="text-xs opacity-60">¥</span>
              {formatCurrency(v)}
            </span>
          )
        },
        { key: "purchaser", label: "采购员" },
        { key: "status", label: "状态", render: v => <StatusBadge status={v} /> }
      ],
      sales: [
        {
          key: "order_no",
          label: "销售单号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        { key: "sales_date", label: "销售日期", render: v => formatDate(v) },
        {
          key: "institution_name",
          label: "机构名称",
          render: v => <span className="font-medium text-slate-800 dark:text-slate-100">{v}</span>
        },
        {
          key: "total_amount",
          label: "总金额",
          render: v => (
            <span className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
              <span className="text-xs opacity-60">¥</span>
              {formatCurrency(v)}
            </span>
          )
        },
        { key: "salesperson", label: "销售员" },
        { key: "status", label: "状态", render: v => <StatusBadge status={v} /> }
      ],
      purchase_storage: [
        {
          key: "warehouse_code",
          label: "仓号",
          render: v => (
            <code className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">
              {v}
            </code>
          )
        },
        { key: "location_code", label: "货位号" },
        {
          key: "orderNo",
          label: "采购单号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        { key: "storage_date", label: "入库日期", render: v => formatDate(v) },
        {
          key: "drug_name",
          label: "药品名称",
          render: v => <span className="font-medium text-slate-800 dark:text-slate-100">{v}</span>
        },
        {
          key: "quantity",
          label: "入库数量",
          render: v => <span className="font-bold text-teal-600 dark:text-teal-400">{v}</span>
        }
      ],
      sales_outbound: [
        {
          key: "warehouse_code",
          label: "仓号",
          render: v => (
            <code className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-mono">
              {v}
            </code>
          )
        },
        { key: "location_code", label: "货位号" },
        {
          key: "orderNo",
          label: "销售单号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        { key: "outbound_date", label: "出库日期", render: v => formatDate(v) },
        {
          key: "drug_name",
          label: "药品名称",
          render: v => <span className="font-medium text-slate-800 dark:text-slate-100">{v}</span>
        },
        {
          key: "quantity",
          label: "出库数量",
          render: v => <span className="font-bold text-teal-600 dark:text-teal-400">{v}</span>
        }
      ],
      inventory: [
        {
          key: "warehouse_code",
          label: "仓号",
          render: v => (
            <code className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono">
              {v}
            </code>
          )
        },
        { key: "location_code", label: "货位号" },
        {
          key: "batch_no",
          label: "批次号",
          render: v => (
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              {v}
            </code>
          )
        },
        {
          key: "drug_name",
          label: "药品名称",
          render: v => <span className="font-medium text-slate-800 dark:text-slate-100">{v}</span>
        },
        {
          key: "quantity",
          label: "库存数量",
          render: v => (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-bold text-sm">
              {v}
              <Sparkles className="w-3 h-3 opacity-50" />
            </span>
          )
        },
        { key: "last_update", label: "最后更新", render: v => formatDate(v) }
      ]
    };

    return baseColumns[activeReport] || [];
  }, [activeReport]);

  const rowKey = useCallback(
    (item: any): string | number => {
      switch (activeReport) {
        case "manufacturer":
        case "drug":
        case "institution":
          return item.approval_no;
        case "purchase":
        case "sales":
          return item.order_no;
        default:
          return item.id;
      }
    },
    [activeReport]
  );

  const renderEmptyState = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-slate-50/60 to-teal-50/20 dark:from-slate-900/30 dark:to-teal-950/10 rounded-2xl m-4 border border-dashed border-slate-200/60 dark:border-slate-700/30">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-teal-500/5 border border-slate-100 dark:border-slate-700">
            <FileBox className="w-10 h-10 text-teal-500" />
          </div>
        </div>
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">暂无数据</p>
        <p className="text-sm mt-2 text-slate-400 dark:text-slate-500 max-w-xs text-center leading-relaxed">
          当前报表分类下没有找到任何记录，请尝试调整筛选条件或切换其他报表类型
        </p>
      </div>
    ),
    []
  );

  const renderDetailContent = useMemo(() => {
    if (!selectedItem) return null;

    switch (activeReport) {
      case "manufacturer":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="企业批准号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.approval_no}
                </code>
              }
            />
            <DetailItem label="企业名称" value={selectedItem.name} />
            <DetailItem label="所在城市" value={selectedItem.city} />
            <DetailItem label="地址" value={selectedItem.address} />
            <DetailItem label="邮政编码" value={selectedItem.postal_code} />
            <DetailItem label="联系电话" value={selectedItem.phone} />
            <DetailItem label="是否 GMP" value={<BooleanBadge value={selectedItem.is_gmp} />} />
          </div>
        );
      case "drug":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="药品批准号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.approval_no}
                </code>
              }
            />
            <DetailItem label="药品名称" value={selectedItem.name} />
            <DetailItem label="学名" value={selectedItem.scientific_name} />
            <DetailItem label="型号" value={selectedItem.model} />
            <DetailItem label="规格" value={selectedItem.specification} />
            <DetailItem
              label="是否处方药"
              value={<BooleanBadge value={selectedItem.is_prescription} trueText="处方药" falseText="非处方药" />}
            />
          </div>
        );
      case "institution":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="机构批准号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.approval_no}
                </code>
              }
            />
            <DetailItem label="机构名称" value={selectedItem.name} />
            <DetailItem label="地址" value={selectedItem.address} />
            <DetailItem label="邮政编码" value={selectedItem.postal_code} />
            <DetailItem label="联系电话" value={selectedItem.phone} />
            <DetailItem label="是否专科医院" value={<BooleanBadge value={selectedItem.is_specialized} />} />
          </div>
        );
      case "purchase":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="采购单号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.order_no}
                </code>
              }
            />
            <DetailItem label="采购日期" value={formatDate(selectedItem.order_date)} />
            <DetailItem label="企业批准号" value={selectedItem.manufacturerApprovalNo} />
            <DetailItem label="企业名称" value={selectedItem.manufacturer_name} />
            <DetailItem
              label="总金额"
              value={
                <span className="text-teal-600 dark:text-teal-400 font-bold text-base flex items-center gap-1">
                  <span className="text-sm opacity-60">¥</span>
                  {formatCurrency(selectedItem.total_amount)}
                </span>
              }
            />
            <DetailItem label="采购员" value={selectedItem.purchaser} />
            <DetailItem label="状态" value={<StatusBadge status={selectedItem.status} />} />
            <DetailItem label="创建时间" value={formatDate(selectedItem.create_time)} />
          </div>
        );
      case "sales":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="销售单号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.order_no}
                </code>
              }
            />
            <DetailItem label="销售日期" value={formatDate(selectedItem.sales_date)} />
            <DetailItem label="机构批准号" value={selectedItem.institutionApprovalNo} />
            <DetailItem label="机构名称" value={selectedItem.institution_name} />
            <DetailItem
              label="总金额"
              value={
                <span className="text-teal-600 dark:text-teal-400 font-bold text-base flex items-center gap-1">
                  <span className="text-sm opacity-60">¥</span>
                  {formatCurrency(selectedItem.total_amount)}
                </span>
              }
            />
            <DetailItem label="销售员" value={selectedItem.salesperson} />
            <DetailItem label="状态" value={<StatusBadge status={selectedItem.status} />} />
            <DetailItem label="创建时间" value={formatDate(selectedItem.create_time)} />
          </div>
        );
      case "purchase_storage":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="仓号"
              value={
                <code className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg font-mono">
                  {selectedItem.warehouse_code}
                </code>
              }
            />
            <DetailItem label="货位号" value={selectedItem.location_code} />
            <DetailItem
              label="采购单号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.orderNo}
                </code>
              }
            />
            <DetailItem label="入库日期" value={formatDate(selectedItem.storage_date)} />
            <DetailItem label="企业批准号" value={selectedItem.manufacturerApprovalNo} />
            <DetailItem label="药品批准号" value={selectedItem.drugApprovalNo} />
            <DetailItem label="药品名称" value={selectedItem.drug_name} />
            <DetailItem
              label="入库数量"
              value={<span className="text-teal-600 dark:text-teal-400 font-bold">{selectedItem.quantity}</span>}
            />
            <DetailItem label="采购员" value={selectedItem.purchaser} />
            <DetailItem label="检验员" value={selectedItem.inspector} />
            <DetailItem label="保管员" value={selectedItem.keeper} />
          </div>
        );
      case "sales_outbound":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="仓号"
              value={
                <code className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg font-mono">
                  {selectedItem.warehouse_code}
                </code>
              }
            />
            <DetailItem label="货位号" value={selectedItem.location_code} />
            <DetailItem
              label="销售单号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.orderNo}
                </code>
              }
            />
            <DetailItem label="出库日期" value={formatDate(selectedItem.outbound_date)} />
            <DetailItem label="企业批准号" value={selectedItem.manufacturerApprovalNo} />
            <DetailItem label="药品批准号" value={selectedItem.drugApprovalNo} />
            <DetailItem label="药品名称" value={selectedItem.drug_name} />
            <DetailItem label="生产日期" value={formatDate(selectedItem.production_date)} />
            <DetailItem
              label="出库数量"
              value={<span className="font-bold text-teal-600 dark:text-teal-400">{selectedItem.quantity}</span>}
            />
            <DetailItem label="销售员" value={selectedItem.salesperson} />
            <DetailItem label="检验员" value={selectedItem.inspector} />
            <DetailItem label="保管员" value={selectedItem.keeper} />
          </div>
        );
      case "inventory":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DetailItem
              label="仓号"
              value={
                <code className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg font-mono">
                  {selectedItem.warehouse_code}
                </code>
              }
            />
            <DetailItem label="货位号" value={selectedItem.location_code} />
            <DetailItem label="企业批准号" value={selectedItem.manufacturerApprovalNo} />
            <DetailItem label="药品批准号" value={selectedItem.drugApprovalNo} />
            <DetailItem label="药品名称" value={selectedItem.drug_name} />
            <DetailItem
              label="批次号"
              value={
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono">
                  {selectedItem.batch_no}
                </code>
              }
            />
            <DetailItem label="生产日期" value={formatDate(selectedItem.production_date)} />
            <DetailItem label="有效截止日期" value={formatDate(selectedItem.expiry_date)} />
            <DetailItem
              label="库存数量"
              value={
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-bold">
                  {selectedItem.quantity}
                  <Sparkles className="w-3 h-3 opacity-50" />
                </span>
              }
            />
            <DetailItem label="最后更新" value={formatDate(selectedItem.last_update)} />
          </div>
        );
      default:
        return null;
    }
  }, [selectedItem, activeReport]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm shadow-slate-200/30 dark:shadow-black/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">数据报表中心</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                实时查看企业运营数据，支持多维度筛选与导出
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting || filteredData.length === 0}
              className="h-9 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-teal-500/20 transition-all duration-200 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出 Excel
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(REPORT_CONFIG) as ReportType[]).map(key => {
              const config = REPORT_CONFIG[key];
              const isActive = activeReport === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveReport(key);
                    setSearchQuery("");
                    setStatusFilter("all");
                    setTableKey(prev => prev + 1);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/20"
                      : "bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60"
                  }`}
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.label.replace("企业药品", "").replace("企业", "")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors duration-200" />
              <Input
                type="text"
                placeholder="搜索关键字..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-[220px] h-9 pl-9 pr-8 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-300 dark:focus-visible:border-teal-600 placeholder:text-slate-400 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {["manufacturer", "drug", "institution", "purchase", "sales"].includes(activeReport) && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 rounded-xl focus:ring-2 focus:ring-teal-500/30 text-xs">
                  <SelectValue placeholder="筛选条件" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {activeReport === "manufacturer" && (
                    <>
                      <SelectItem value="gmp">GMP 认证</SelectItem>
                      <SelectItem value="non-gmp">非 GMP</SelectItem>
                    </>
                  )}
                  {activeReport === "drug" && (
                    <>
                      <SelectItem value="rx">处方药</SelectItem>
                      <SelectItem value="otc">非处方药</SelectItem>
                    </>
                  )}
                  {activeReport === "institution" && (
                    <>
                      <SelectItem value="specialized">专科医院</SelectItem>
                      <SelectItem value="general">综合医院</SelectItem>
                    </>
                  )}
                  {(activeReport === "purchase" || activeReport === "sales") && (
                    <>
                      <SelectItem value="全部入库">全部入库</SelectItem>
                      <SelectItem value="全部出库">全部出库</SelectItem>
                      <SelectItem value="部分入库">部分入库</SelectItem>
                      <SelectItem value="部分出库">部分出库</SelectItem>
                      <SelectItem value="已审核">已审核</SelectItem>
                      <SelectItem value="待审核">待审核</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden" key={tableKey}>
          {filteredData.length === 0 ? (
            renderEmptyState
          ) : (
            <VirtualTable columns={tableColumns} data={filteredData} rowKey={rowKey} onRowClick={handleViewDetail} />
          )}
        </div>
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/8 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-400/8 to-transparent rounded-full blur-2xl"></div>
            <DialogHeader className="relative p-6 pb-4">
              <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/20">
                  <Eye className="w-4.5 h-4.5 text-white" />
                </span>
                <div className="flex flex-col">
                  <span>数据详情</span>
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                    {REPORT_CONFIG[activeReport].label}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-slate-700/40"></div>
          </div>

          <div className="p-6 max-h-[65vh] overflow-y-auto">{renderDetailContent}</div>

          <div className="px-6 pb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-teal-200/30 to-transparent dark:via-teal-800/20"></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
