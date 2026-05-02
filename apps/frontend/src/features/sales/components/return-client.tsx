"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import type { SalesOrder } from "@/types/sales";

interface ReturnClientProps {
  orders: SalesOrder[];
}

const RETURN_REASONS = ["临近效期", "质量问题", "包装破损", "客户退货", "其他原因"];

export function ReturnClient({ orders }: ReturnClientProps) {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnOrderNo] = useState(
    () =>
      `R${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`
  );
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedOrderNo, setSelectedOrderNo] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [inspector, setInspector] = useState("");
  const [keeper, setKeeper] = useState("");

  const institutions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(order => set.add(order.institution_name));
    return Array.from(set).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!selectedInstitution) return [];
    return orders.filter(o => o.institution_name === selectedInstitution);
  }, [orders, selectedInstitution]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.order_no === selectedOrderNo);
  }, [orders, selectedOrderNo]);

  const totalReturnAmount = useMemo(() => {
    if (!selectedOrder) return 0;
    return selectedOrder.salesDetails.reduce((sum, detail) => {
      const qty = returnQuantities[detail.drugApprovalNo] || 0;
      return sum + qty * parseFloat(detail.unit_price);
    }, 0);
  }, [selectedOrder, returnQuantities]);

  const handleSelectItem = (drugApprovalNo: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(drugApprovalNo)) {
      newSelected.delete(drugApprovalNo);
    } else {
      newSelected.add(drugApprovalNo);
    }
    setSelectedItems(newSelected);
  };

  const handleReturnQuantityChange = (drugApprovalNo: string, value: number) => {
    setReturnQuantities(prev => ({
      ...prev,
      [drugApprovalNo]: value
    }));
  };

  const handleReturnReasonChange = (drugApprovalNo: string, reason: string) => {
    setReturnReasons(prev => ({
      ...prev,
      [drugApprovalNo]: reason
    }));
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">销售退货</h1>
          <p className="text-sm text-slate-500">销售退货处理</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
          确认退货
        </Button>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">退货单号：</span>
            <span className="font-mono text-teal-600">{returnOrderNo}</span>
            <span className="text-xs text-slate-400">（自动生成）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">退货日期：</span>
            <Input type="date" className="w-40 h-8" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">客户：</span>
            <Select
              value={selectedInstitution}
              onValueChange={v => {
                setSelectedInstitution(v);
                setSelectedOrderNo("");
              }}
            >
              <SelectTrigger className="w-48 h-8">
                <SelectValue placeholder="请选择客户" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map(inst => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">原销售单：</span>
            <Select value={selectedOrderNo} onValueChange={setSelectedOrderNo} disabled={!selectedInstitution}>
              <SelectTrigger className="w-48 h-8">
                <SelectValue placeholder="请选择销售单" />
              </SelectTrigger>
              <SelectContent>
                {filteredOrders.map(order => (
                  <SelectItem key={order.order_no} value={order.order_no}>
                    {order.order_no}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-auto">
        {!selectedOrder ? (
          <EmptyState title="请选择销售单" description="请先选择客户和原销售单" />
        ) : selectedOrder.salesDetails.length === 0 ? (
          <EmptyState title="暂无药品明细" description="该销售单没有药品明细" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
              <tr>
                <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm w-20">
                  选择
                </th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  药品名称
                </th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">批号</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  生产日期
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  已售量
                </th>
                <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  退货数量
                </th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  退货原因
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {selectedOrder.salesDetails.map(detail => {
                const isSelected = selectedItems.has(detail.drugApprovalNo);
                const returnQty = returnQuantities[detail.drugApprovalNo] || 0;

                return (
                  <tr key={detail.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300"
                        checked={isSelected}
                        onChange={() => handleSelectItem(detail.drugApprovalNo)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{detail.drug_name}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      B{detail.production_date.replace(/-/g, "").slice(2)}001
                    </td>
                    <td className="px-4 py-3 text-slate-600">{detail.production_date}</td>
                    <td className="px-4 py-3 text-right font-mono">{detail.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        className="w-20 h-8 text-center"
                        value={returnQty}
                        onChange={e => handleReturnQuantityChange(detail.drugApprovalNo, Number(e.target.value))}
                        max={detail.quantity}
                        disabled={!isSelected}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={returnReasons[detail.drugApprovalNo] || ""}
                        onValueChange={v => handleReturnReasonChange(detail.drugApprovalNo, v)}
                        disabled={!isSelected}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="选择原因" />
                        </SelectTrigger>
                        <SelectContent>
                          {RETURN_REASONS.map(reason => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4 mt-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">退货总金额：</span>
            <span className="text-lg font-semibold text-teal-600">¥{totalReturnAmount.toFixed(2)}</span>
          </div>
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
        </div>
      </div>
    </div>
  );
}
