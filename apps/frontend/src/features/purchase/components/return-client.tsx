"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PurchaseOrder, PurchaseStorage } from "@/types/purchase";

interface PurchaseReturnClientProps {
  orders: PurchaseOrder[];
  storages: PurchaseStorage[];
}

export default function PurchaseReturnClient({ orders, storages }: PurchaseReturnClientProps) {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedOrderNo, setSelectedOrderNo] = useState("all");
  const [inspector, setInspector] = useState("");
  const [keeper, setKeeper] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<number, string>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const manufacturers = useMemo(() => {
    const mfrSet = new Set<string>();
    orders.forEach(o => {
      if (o.manufacturer_name) {
        mfrSet.add(o.manufacturer_name);
      }
    });
    return Array.from(mfrSet).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      o =>
        (!selectedManufacturer || o.manufacturer_name === selectedManufacturer) &&
        (o.status === "全部入库" || o.status === "部分入库")
    );
  }, [orders, selectedManufacturer]);

  const filteredStorages = useMemo(() => {
    return storages.filter(
      s =>
        (selectedOrderNo === "all" || s.orderNo === selectedOrderNo) &&
        (!selectedManufacturer ||
          orders.find(o => o.order_no === s.orderNo)?.manufacturer_name === selectedManufacturer)
    );
  }, [storages, orders, selectedManufacturer, selectedOrderNo]);

  const handleQuantityChange = (id: number, value: string) => {
    const num = parseInt(value) || 0;
    setReturnQuantities(prev => ({ ...prev, [id]: num }));
  };

  const handleReasonChange = (id: number, value: string) => {
    setReturnReasons(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const totalReturnAmount = useMemo(() => {
    return filteredStorages
      .filter(s => selectedItems.has(s.id))
      .reduce((sum, s) => {
        const order = orders.find(o => o.order_no === s.orderNo);
        const detail = order?.purchaseDetails?.find(d => d.drugApprovalNo === s.drugApprovalNo);
        const unitPrice = detail ? parseFloat(detail.unit_price) : 0;
        return sum + (returnQuantities[s.id] || 0) * unitPrice;
      }, 0);
  }, [filteredStorages, selectedItems, returnQuantities, orders]);

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">采购退货</h1>
          <p className="text-sm text-slate-500">处理采购退货</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
          确认退货
        </Button>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">退货单号：</span>
            <span className="text-sm text-slate-400">自动生成</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">退货日期：</span>
            <Input
              type="date"
              className="flex-1 h-8"
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">供应商：</span>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="选择供应商" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">原采购单：</span>
            <Select value={selectedOrderNo} onValueChange={setSelectedOrderNo}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="选择采购单" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {filteredOrders.map(o => (
                  <SelectItem key={o.order_no} value={o.order_no}>
                    {o.order_no}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
            <tr>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 w-20 text-sm">
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
                库存量
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
            {filteredStorages.map(storage => {
              const order = orders.find(o => o.order_no === storage.orderNo);
              const detail = order?.purchaseDetails?.find(d => d.drugApprovalNo === storage.drugApprovalNo);

              return (
                <tr key={storage.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300"
                      checked={selectedItems.has(storage.id)}
                      onChange={e => handleSelectItem(storage.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{storage.drug_name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-teal-600">{storage.batch_no}</td>
                  <td className="px-4 py-3 text-slate-600">{storage.production_date}</td>
                  <td className="px-4 py-3 text-right font-mono">{storage.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      type="number"
                      className="w-20 h-8 text-center"
                      min={0}
                      max={storage.quantity}
                      value={returnQuantities[storage.id] || ""}
                      onChange={e => handleQuantityChange(storage.id, e.target.value)}
                      placeholder="0"
                      disabled={!selectedItems.has(storage.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={returnReasons[storage.id] || ""}
                      onValueChange={v => handleReasonChange(storage.id, v)}
                      disabled={!selectedItems.has(storage.id)}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue placeholder="选择原因" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="包装破损">包装破损</SelectItem>
                        <SelectItem value="质量问题">质量问题</SelectItem>
                        <SelectItem value="数量不符">数量不符</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-20">退货总金额：</span>
            <span className="text-lg font-bold text-teal-600">¥{totalReturnAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">检验员：</span>
            <Select value={inspector} onValueChange={setInspector}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="选择检验员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="李检验">李检验</SelectItem>
                <SelectItem value="王检验">王检验</SelectItem>
                <SelectItem value="张检验">张检验</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">保管员：</span>
            <Select value={keeper} onValueChange={setKeeper}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="选择保管员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="张保管">张保管</SelectItem>
                <SelectItem value="李保管">李保管</SelectItem>
                <SelectItem value="王保管">王保管</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
