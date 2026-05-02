"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import { EmptyState } from "@/components/empty-state";
import { exportToExcel } from "@/lib/excel-export";
import { Loader2 } from "lucide-react";
import type { SalesOrder } from "@/types/sales";
import { SALES_STATUS_MAP } from "@/types/sales";

interface OrderListClientProps {
  orders: SalesOrder[];
}

export function OrderListClient({ orders }: OrderListClientProps) {
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [exporting, setExporting] = useState(false);

  const customers = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(order => set.add(order.institution_name));
    return ["全部", ...Array.from(set).sort()];
  }, [orders]);

  const statuses = ["全部", "待审核", "已审核", "部分出库", "全部出库"];

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchOrderNo && !order.order_no.toLowerCase().includes(searchOrderNo.toLowerCase())) {
        return false;
      }
      if (selectedCustomer !== "全部" && order.institution_name !== selectedCustomer) {
        return false;
      }
      if (selectedStatus !== "全部" && order.status !== selectedStatus) {
        return false;
      }
      if (dateStart && order.sales_date < dateStart) {
        return false;
      }
      if (dateEnd && order.sales_date > dateEnd) {
        return false;
      }
      return true;
    });
  }, [orders, searchOrderNo, selectedCustomer, selectedStatus, dateStart, dateEnd]);

  const handleReset = () => {
    setSearchOrderNo("");
    setSelectedCustomer("全部");
    setSelectedStatus("全部");
    setDateStart("");
    setDateEnd("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel({
        reportType: "sales",
        reportLabel: "销售单列表",
        rawData: filteredOrders
      });
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnDef<SalesOrder>[] = useMemo(
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
        label: "销售单号",
        width: 160,
        render: value => <span className="font-mono text-sm text-teal-600">{value}</span>
      },
      {
        key: "institution_name",
        label: "客户",
        render: value => <span className="font-medium">{value}</span>
      },
      {
        key: "sales_date",
        label: "销售日期",
        render: value => <span className="text-slate-600">{value}</span>
      },
      {
        key: "total_amount",
        label: "总金额",
        width: 120,
        align: "right",
        render: value => <span className="font-mono">¥{parseFloat(value).toLocaleString()}</span>
      },
      {
        key: "status",
        label: "状态",
        width: 100,
        align: "center",
        render: (value: string) => {
          const statusInfo = SALES_STATUS_MAP[value] || { label: value, color: "text-slate-500 bg-slate-50" };
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
            >
              {value === "全部出库" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {value === "部分出库" && (
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
            {(item.status === "已审核" || item.status === "部分出库") && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-700">
                出库
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">销售单列表</h1>
          <p className="text-sm text-slate-500">管理销售订单信息</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增销售单
        </Button>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">单号：</span>
            <Input
              className="w-32 h-8"
              placeholder="销售单号"
              value={searchOrderNo}
              onChange={e => setSearchOrderNo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">客户：</span>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer} value={customer}>
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">状态：</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">日期：</span>
            <Input type="date" className="w-32 h-8" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            <span className="text-slate-400">~</span>
            <Input type="date" className="w-32 h-8" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-8" onClick={handleReset}>
              重置
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  导出中...
                </>
              ) : (
                "导出"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <EmptyState title="暂无销售单数据" description="当前条件下没有找到相关销售单" />
        ) : (
          <VirtualTable columns={columns} data={filteredOrders} rowKey={item => item.order_no} />
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">批量操作：</span>
        <Button variant="outline" size="sm" className="h-8">
          审核
        </Button>
        <Button variant="outline" size="sm" className="h-8">
          出库
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-red-600 hover:text-red-700">
          删除
        </Button>
      </div>
    </div>
  );
}
