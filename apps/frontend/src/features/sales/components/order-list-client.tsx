"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateCaches } from "@/lib/cache-client";
import { deleteSalesOrder, getSalesOrderDetail, updateSalesOrder } from "@/lib/api-client";
import { exportToExcel } from "@/lib/excel-export";
import type { SalesOrder } from "@/types/sales";
import { SALES_STATUS_MAP } from "@/types/sales";

interface OrderListClientProps {
  orders: SalesOrder[];
}

function formatCurrency(value?: string | number) {
  const amount = Number(value ?? 0);
  return `¥${amount.toLocaleString()}`;
}

export function OrderListClient({ orders }: OrderListClientProps) {
  const router = useRouter();
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [exporting, setExporting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);
  const [actingOrderNo, setActingOrderNo] = useState<string | null>(null);

  const customers = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(order => {
      if (order.institution_name) {
        set.add(order.institution_name);
      }
    });

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

  const handleViewDetail = async (orderNo: string) => {
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const order = await getSalesOrderDetail(orderNo);
      setDetailOrder(order);
    } catch (error) {
      console.error("加载销售单详情失败:", error);
      alert(`加载详情失败：${(error as Error).message}`);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (order: SalesOrder) => {
    if (order.status !== "待审核") {
      return;
    }

    setActingOrderNo(order.order_no);
    try {
      await updateSalesOrder(order.order_no, { status: "已审核" });
      await revalidateCaches([CACHE_TAGS.salesOrders]);
      router.refresh();
    } catch (error) {
      console.error("审核销售单失败:", error);
      alert(`审核失败：${(error as Error).message}`);
    } finally {
      setActingOrderNo(null);
    }
  };

  const handleDelete = async (order: SalesOrder) => {
    if (!confirm(`确定要删除销售单 ${order.order_no} 吗？`)) {
      return;
    }

    setActingOrderNo(order.order_no);
    try {
      await deleteSalesOrder(order.order_no);
      await revalidateCaches([CACHE_TAGS.salesOrders, CACHE_TAGS.salesDetails, CACHE_TAGS.salesOutbounds]);

      if (detailOrder?.order_no === order.order_no) {
        setDetailOpen(false);
        setDetailOrder(null);
      }

      router.refresh();
    } catch (error) {
      console.error("删除销售单失败:", error);
      alert(`删除失败：${(error as Error).message}`);
    } finally {
      setActingOrderNo(null);
    }
  };

  const columns: ColumnDef<SalesOrder>[] = useMemo(
    () => [
      {
        key: "order_no",
        label: "销售单号",
        width: 160,
        align: "left",
        render: value => <span className="font-mono text-sm text-teal-600">{value}</span>
      },
      {
        key: "institution_name",
        label: "客户",
        width: 220,
        align: "left",
        render: value => <span className="font-medium">{value}</span>
      },
      {
        key: "sales_date",
        label: "销售日期",
        width: 140,
        align: "left",
        render: value => <span className="text-slate-600">{value}</span>
      },
      {
        key: "salesperson",
        label: "销售员",
        width: 120,
        align: "left",
        render: value => <span>{value || "-"}</span>
      },
      {
        key: "total_amount",
        label: "总金额",
        width: 120,
        align: "right",
        render: value => <span className="font-mono">{formatCurrency(value)}</span>
      },
      {
        key: "status",
        label: "状态",
        width: 110,
        align: "center",
        render: (value: string) => {
          const statusInfo = SALES_STATUS_MAP[value] || { label: value, color: "text-slate-500 bg-slate-50" };
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          );
        }
      },
      {
        key: "actions",
        label: "操作",
        width: 240,
        align: "center",
        render: (_, item) => {
          const acting = actingOrderNo === item.order_no;

          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-teal-600 hover:text-teal-700"
                onClick={event => {
                  event.stopPropagation();
                  void handleViewDetail(item.order_no);
                }}
              >
                详情
              </Button>
              {(item.status === "已审核" || item.status === "部分出库") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-blue-600 hover:text-blue-700"
                  onClick={event => {
                    event.stopPropagation();
                    router.push(`/sales/storage?orderNo=${encodeURIComponent(item.order_no)}`);
                  }}
                >
                  出库
                </Button>
              )}
              {item.status === "待审核" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-amber-600 hover:text-amber-700"
                    disabled={acting}
                    onClick={event => {
                      event.stopPropagation();
                      void handleApprove(item);
                    }}
                  >
                    {acting ? "处理中..." : "审核"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-rose-600 hover:text-rose-700"
                    disabled={acting}
                    onClick={event => {
                      event.stopPropagation();
                      void handleDelete(item);
                    }}
                  >
                    删除
                  </Button>
                </>
              )}
            </div>
          );
        }
      }
    ],
    [actingOrderNo, router]
  );

  const detailItems = detailOrder?.salesDetails ?? [];

  return (
    <>
      <div className="flex h-full flex-col space-y-4 overflow-hidden p-6">
        <div className="flex flex-shrink-0 items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">销售单列表</h1>
            <p className="text-sm text-slate-500">管理销售订单信息</p>
          </div>
          <Button
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:from-teal-600 hover:to-cyan-600"
            onClick={() => router.push("/sales/new-order")}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增销售单
          </Button>
        </div>

        <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">单号：</span>
              <Input
                className="h-8 w-32"
                placeholder="销售单号"
                value={searchOrderNo}
                onChange={e => setSearchOrderNo(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">客户：</span>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="h-8 w-40">
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
                <SelectTrigger className="h-8 w-28">
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
              <Input type="date" className="h-8 w-32" value={dateStart} onChange={e => setDateStart(e.target.value)} />
              <span className="text-slate-400">~</span>
              <Input type="date" className="h-8 w-32" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={handleReset}>
                重置
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    导出中...
                  </>
                ) : (
                  "导出"
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/40 dark:bg-slate-800/60">
          <VirtualTable
            columns={columns}
            data={filteredOrders}
            rowKey={item => item.order_no}
            emptyText="暂无销售单数据"
            onRowClick={item => {
              void handleViewDetail(item.order_no);
            }}
          />
        </div>

        <div className="text-sm text-slate-500">
          点击行或“详情”可查看完整明细；待审核订单可直接审核，已审核订单可跳转到出库页面继续处理。
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>销售单详情</DialogTitle>
            <DialogDescription>查看订单头信息和销售明细。</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在加载详情...
            </div>
          ) : !detailOrder ? (
            <div className="py-12 text-center text-sm text-slate-500">暂无可展示的订单详情</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-700/40 dark:bg-slate-900/30">
                <div>
                  <p className="text-xs text-slate-500">销售单号</p>
                  <p className="font-mono text-sm text-teal-600">{detailOrder.order_no}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">客户</p>
                  <p className="text-sm font-medium">{detailOrder.institution_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">销售日期</p>
                  <p className="text-sm">{detailOrder.sales_date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">销售员</p>
                  <p className="text-sm">{detailOrder.salesperson || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">状态</p>
                  <p className="text-sm">{detailOrder.status}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">总金额</p>
                  <p className="text-sm font-medium">{formatCurrency(detailOrder.total_amount)}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">药品名称</th>
                      <th className="px-4 py-3 text-left font-semibold">生产日期</th>
                      <th className="px-4 py-3 text-left font-semibold">生产企业</th>
                      <th className="px-4 py-3 text-right font-semibold">数量</th>
                      <th className="px-4 py-3 text-right font-semibold">单价</th>
                      <th className="px-4 py-3 text-right font-semibold">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {detailItems.map(detail => (
                      <tr key={detail.id}>
                        <td className="px-4 py-3">{detail.drug_name}</td>
                        <td className="px-4 py-3 text-slate-600">{detail.production_date}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{detail.manufacturerApprovalNo}</td>
                        <td className="px-4 py-3 text-right font-mono">{detail.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(detail.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(detail.amount)}</td>
                      </tr>
                    ))}
                    {!detailItems.length && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                          当前订单暂无销售明细
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
