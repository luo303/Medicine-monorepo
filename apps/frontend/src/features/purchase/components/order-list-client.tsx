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
import { deletePurchaseOrder, getPurchaseOrderDetail, updatePurchaseOrder } from "@/lib/api-client";
import { exportToExcel } from "@/lib/excel-export";
import type { PurchaseDetail, PurchaseOrder } from "@/types/purchase";
import { PURCHASE_STATUS_MAP } from "@/types/purchase";

interface PurchaseOrderListClientProps {
  orders: PurchaseOrder[];
}

function formatCurrency(value?: string | number) {
  const amount = Number(value ?? 0);
  return `¥${amount.toLocaleString()}`;
}

export default function PurchaseOrderListClient({ orders }: PurchaseOrderListClientProps) {
  const router = useRouter();
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [exporting, setExporting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [actingOrderNo, setActingOrderNo] = useState<string | null>(null);

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
      const matchOrderNo = !searchOrderNo || item.order_no.toLowerCase().includes(searchOrderNo.toLowerCase());
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

  const handleViewDetail = async (orderNo: string) => {
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const order = await getPurchaseOrderDetail(orderNo);
      setDetailOrder(order);
    } catch (error) {
      console.error("加载采购单详情失败:", error);
      alert(`加载详情失败：${(error as Error).message}`);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (order: PurchaseOrder) => {
    if (order.status !== "待审核") {
      return;
    }

    setActingOrderNo(order.order_no);
    try {
      await updatePurchaseOrder(order.order_no, { status: "已审核" });
      await revalidateCaches([CACHE_TAGS.purchaseOrders]);
      router.refresh();
    } catch (error) {
      console.error("审核采购单失败:", error);
      alert(`审核失败：${(error as Error).message}`);
    } finally {
      setActingOrderNo(null);
    }
  };

  const handleDelete = async (order: PurchaseOrder) => {
    if (!confirm(`确定要删除采购单 ${order.order_no} 吗？`)) {
      return;
    }

    setActingOrderNo(order.order_no);
    try {
      await deletePurchaseOrder(order.order_no);
      await revalidateCaches([CACHE_TAGS.purchaseOrders, CACHE_TAGS.purchaseDetails, CACHE_TAGS.purchaseStorages]);

      if (detailOrder?.order_no === order.order_no) {
        setDetailOpen(false);
        setDetailOrder(null);
      }

      router.refresh();
    } catch (error) {
      console.error("删除采购单失败:", error);
      alert(`删除失败：${(error as Error).message}`);
    } finally {
      setActingOrderNo(null);
    }
  };

  const columns: ColumnDef<PurchaseOrder>[] = useMemo(
    () => [
      {
        key: "order_no",
        label: "采购单号",
        width: 160,
        align: "left",
        render: value => <span className="font-mono text-sm text-teal-600">{value}</span>
      },
      {
        key: "manufacturer_name",
        label: "供应商",
        width: 220,
        align: "left",
        render: value => <span className="font-medium">{value}</span>
      },
      {
        key: "order_date",
        label: "采购日期",
        width: 140,
        align: "left",
        render: value => <span className="text-slate-600">{value}</span>
      },
      {
        key: "purchaser",
        label: "采购员",
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
          const statusInfo = PURCHASE_STATUS_MAP[value] || { label: value, color: "text-slate-500 bg-slate-50" };
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
              {(item.status === "已审核" || item.status === "部分入库") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-blue-600 hover:text-blue-700"
                  onClick={event => {
                    event.stopPropagation();
                    router.push(`/purchase/storage?orderNo=${encodeURIComponent(item.order_no)}`);
                  }}
                >
                  入库
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

  const detailItems = detailOrder?.purchaseDetails ?? [];
  const detailStorages = detailOrder?.purchaseStorages ?? [];

  const getStoredQuantity = (detail: PurchaseDetail) => {
    return detailStorages
      .filter(
        storage =>
          storage.drugApprovalNo === detail.drugApprovalNo && storage.production_date === detail.production_date
      )
      .reduce((sum, storage) => sum + storage.quantity, 0);
  };

  return (
    <>
      <div className="flex h-full flex-col space-y-4 overflow-hidden p-6">
        <div className="flex flex-shrink-0 items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">采购单列表</h1>
            <p className="text-sm text-slate-500">管理采购订单信息</p>
          </div>
          <Button
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:from-teal-600 hover:to-cyan-600"
            onClick={() => router.push("/purchase/new-order")}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增采购单
          </Button>
        </div>

        <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">单号：</span>
              <Input
                className="h-8 w-32"
                placeholder="采购单号"
                value={searchOrderNo}
                onChange={e => setSearchOrderNo(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">供应商：</span>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">状态：</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8 w-28">
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
              <Input type="date" className="h-8 w-32" value={dateStart} onChange={e => setDateStart(e.target.value)} />
              <span className="text-slate-400">~</span>
              <Input type="date" className="h-8 w-32" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                重置
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
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
            data={filteredData}
            rowKey={item => item.order_no}
            emptyText="暂无采购单数据"
            onRowClick={item => {
              void handleViewDetail(item.order_no);
            }}
          />
        </div>

        <div className="flex-shrink-0 text-sm text-slate-500">
          点击行或“详情”可查看完整明细；待审核订单可直接审核，已审核订单可跳转到入库页面继续处理。
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>采购单详情</DialogTitle>
            <DialogDescription>查看订单头信息、采购明细和当前入库进度。</DialogDescription>
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
                  <p className="text-xs text-slate-500">采购单号</p>
                  <p className="font-mono text-sm text-teal-600">{detailOrder.order_no}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">供应商</p>
                  <p className="text-sm font-medium">{detailOrder.manufacturer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">采购日期</p>
                  <p className="text-sm">{detailOrder.order_date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">采购员</p>
                  <p className="text-sm">{detailOrder.purchaser || "-"}</p>
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
                      <th className="px-4 py-3 text-right font-semibold">采购量</th>
                      <th className="px-4 py-3 text-right font-semibold">单价</th>
                      <th className="px-4 py-3 text-right font-semibold">金额</th>
                      <th className="px-4 py-3 text-right font-semibold">已入库</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {detailItems.map(detail => (
                      <tr key={detail.id}>
                        <td className="px-4 py-3">{detail.drug_name}</td>
                        <td className="px-4 py-3 text-slate-600">{detail.production_date}</td>
                        <td className="px-4 py-3 text-right font-mono">{detail.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(detail.unit_price)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(detail.amount)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{getStoredQuantity(detail)}</td>
                      </tr>
                    ))}
                    {!detailItems.length && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                          当前订单暂无采购明细
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!!detailStorages.length && (
                <div className="rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-900/20">
                  <p className="mb-3 text-sm font-medium">最近入库记录</p>
                  <div className="space-y-2">
                    {detailStorages.slice(0, 5).map(storage => (
                      <div
                        key={storage.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                      >
                        <span>
                          {storage.drug_name} / {storage.batch_no || "无批号"}
                        </span>
                        <span className="text-slate-500">
                          {storage.storage_date} · {storage.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
