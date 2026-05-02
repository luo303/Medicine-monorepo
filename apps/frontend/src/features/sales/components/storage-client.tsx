"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import type { SalesOrder } from "@/types/sales";

interface StorageClientProps {
  orders: SalesOrder[];
}

function getPreviewInventoryQty(seed: string): number {
  return 500 + (Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 1000);
}

export function StorageClient({ orders }: StorageClientProps) {
  const [selectedOrderNo, setSelectedOrderNo] = useState("");
  const [outboundQuantities, setOutboundQuantities] = useState<Record<string, number>>({});
  const [inspector, setInspector] = useState("");
  const [keeper, setKeeper] = useState("");
  const [outboundDate, setOutboundDate] = useState(new Date().toISOString().split("T")[0]);

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === "已审核" || o.status === "部分出库");
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.order_no === selectedOrderNo);
  }, [orders, selectedOrderNo]);

  const handleOutboundChange = (drugApprovalNo: string, value: number) => {
    setOutboundQuantities(prev => ({
      ...prev,
      [drugApprovalNo]: value
    }));
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">销售出库</h1>
          <p className="text-sm text-slate-500">销售药品出库管理</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
          确认出库
        </Button>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">销售单：</span>
            <Select value={selectedOrderNo} onValueChange={setSelectedOrderNo}>
              <SelectTrigger className="w-64 h-8">
                <SelectValue placeholder="请选择销售单" />
              </SelectTrigger>
              <SelectContent>
                {pendingOrders.map(order => (
                  <SelectItem key={order.order_no} value={order.order_no}>
                    {order.order_no} - {order.institution_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedOrder && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">销售日期：</span>
                <span className="text-sm">{selectedOrder.sales_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">销售员：</span>
                <span className="text-sm">{selectedOrder.salesperson}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">状态：</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                  {selectedOrder.status}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-auto">
        {!selectedOrder ? (
          <EmptyState title="请选择销售单" description="请从上方下拉框选择需要出库的销售单" />
        ) : selectedOrder.salesDetails.length === 0 ? (
          <EmptyState title="暂无药品明细" description="该销售单没有药品明细" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  药品名称
                </th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">批号</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  生产日期
                </th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  有效期
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  销售量
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  已出库
                </th>
                <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  本次出库
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  库存量
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {selectedOrder.salesDetails.map(detail => {
                const outboundQty = outboundQuantities[detail.drugApprovalNo] || 0;
                const alreadyOutbound = Math.floor(detail.quantity * 0.5);
                const remaining = detail.quantity - alreadyOutbound;
                const inventoryQty = getPreviewInventoryQty(`${detail.id}-${detail.drugApprovalNo}`);

                return (
                  <tr key={detail.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-3 font-medium">{detail.drug_name}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      B{detail.production_date.replace(/-/g, "").slice(2)}001
                    </td>
                    <td className="px-4 py-3 text-slate-600">{detail.production_date}</td>
                    <td className="px-4 py-3 text-slate-600">2025-12-31</td>
                    <td className="px-4 py-3 text-right font-mono">{detail.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{alreadyOutbound}</td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        className="w-20 h-8 text-center"
                        value={outboundQty}
                        onChange={e => handleOutboundChange(detail.drugApprovalNo, Number(e.target.value))}
                        max={remaining}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{inventoryQty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">检验员：</span>
            <Select value={inspector} onValueChange={setInspector}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="李检验">李检验</SelectItem>
                <SelectItem value="王检验">王检验</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">保管员：</span>
            <Select value={keeper} onValueChange={setKeeper}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="张保管">张保管</SelectItem>
                <SelectItem value="刘保管">刘保管</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">出库日期：</span>
            <Input
              type="date"
              className="w-40 h-8"
              value={outboundDate}
              onChange={e => setOutboundDate(e.target.value)}
            />
          </div>
        </div>
        {selectedOrder && selectedOrder.salesDetails.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">先进先出提示</span>
            </div>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
              建议优先出库批号 B{selectedOrder.salesDetails[0].production_date.replace(/-/g, "").slice(2)}001（有效期
              2025-12-31）
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
