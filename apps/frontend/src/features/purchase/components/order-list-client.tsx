"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import { exportToExcel } from "@/lib/excel-export";
import { Loader2 } from "lucide-react";
import type { PurchaseOrder } from "@/types/purchase";
import { PURCHASE_STATUS_MAP } from "@/types/purchase";

interface PurchaseOrderListClientProps {
  orders: PurchaseOrder[];
}

export default function PurchaseOrderListClient({ orders }: PurchaseOrderListClientProps) {
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [exporting, setExporting] = useState(false);

  const suppliers = useMemo(() => {
    const supplierSet = new Set<string>();
    orders.forEach(item => {
      if (item.manufacturer_name) {
        supplierSet.add(item.manufacturer_name);
      }
    });
    return ["全部", ...Array.from(supplierSet).sort()];
  }, [orders]);

  const filteredData = useMemo(() => {
    return orders.filter(item => {
      const matchOrderNo = item.order_no.includes(searchOrderNo);
      const matchSupplier = selectedSupplier === "全部" || item.manufacturer_name === selectedSupplier;
      const matchStatus = selectedStatus === "全部" || item.status === selectedStatus;
      const matchDateStart = !dateStart || item.order_date >= dateStart;
      const matchDateEnd = !dateEnd || item.order_date <= dateEnd;
      return matchOrderNo && matchSupplier && matchStatus && matchDateStart && matchDateEnd;
    });
  }, [orders, searchOrderNo, selectedSupplier, selectedStatus, dateStart, dateEnd]);

  const handleReset = () => {
    setSearchOrderNo("");
    setSelectedSupplier("全部");
    setSelectedStatus("全部");
    setDateStart("");
    setDateEnd("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel({
        reportType: "purchase",
        reportLabel: "采购单列表",
        rawData: filteredData
      });
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnDef<PurchaseOrder>[] = useMemo(
    () => [
      {
        key: "checkbox",
        label: "选择",
        width: 60,
        align: "center",
        render: () => <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
      },
      {
        key: "order_no",
        label: "采购单号",
        width: 160,
        render: value => <span className="font-mono text-sm text-teal-600">{value}</span>
      },
      {
        key: "manufacturer_name",
        label: "供应商",
        width: 200,
        render: value => <span className="font-medium">{value}</span>
      },
      {
        key: "order_date",
        label: "采购日期",
        render: value => <span className="text-slate-600">{value}</span>
      },
      {
        key: "total_amount",
        label: "总金额",
        width: 120,
        render: value => <span className="font-mono">¥{parseFloat(value).toLocaleString()}</span>
      },
      {
        key: "status",
        label: "状态",
        width: 100,
        align: "center",
        render: (value: string) => {
          const statusInfo = PURCHASE_STATUS_MAP[value] || { label: value, color: "text-slate-500 bg-slate-50" };
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
            >
              {value === "全部入库" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {value === "部分入库" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {value === "已审核" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {value === "待审核" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {statusInfo.label}
            </span>
          );
        }
      },
      {
        key: "actions",
        label: "操作",
        width: 140,
        align: "center",
        render: (_, item) => (
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-teal-600 hover:text-teal-700">
              详情
            </Button>
            {(item.status === "已审核" || item.status === "部分入库") && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-700">
                入库
              </Button>
            )}
            {item.status === "待审核" && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-amber-600 hover:text-amber-700">
                审核
              </Button>
            )}
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">采购单列表</h1>
          <p className="text-sm text-slate-500">管理采购订单信息</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增采购单
        </Button>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">单号：</span>
            <Input
              className="w-32 h-8"
              placeholder="采购单号"
              value={searchOrderNo}
              onChange={e => setSearchOrderNo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">供应商：</span>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">状态：</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="待审核">待审核</SelectItem>
                <SelectItem value="已审核">已审核</SelectItem>
                <SelectItem value="部分入库">部分入库</SelectItem>
                <SelectItem value="全部入库">全部入库</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">日期：</span>
            <Input type="date" className="w-32 h-8" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            <span className="text-slate-400">~</span>
            <Input type="date" className="w-32 h-8" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleReset}>
              重置
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  导出
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
        <VirtualTable columns={columns} data={filteredData} rowKey={item => item.order_no} emptyText="暂无采购单数据" />
      </div>

      <div className="flex-shrink-0 flex items-center gap-4 py-2">
        <span className="text-sm text-slate-500">批量操作：</span>
        <Button variant="outline" size="sm">
          审核
        </Button>
        <Button variant="outline" size="sm">
          入库
        </Button>
        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
          删除
        </Button>
      </div>
    </div>
  );
}
