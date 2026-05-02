"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PurchaseOrder, PurchaseDetail, PurchaseStorage } from "@/types/purchase";

interface PurchaseStorageClientProps {
  orders: PurchaseOrder[];
}

export default function PurchaseStorageClient({ orders }: PurchaseStorageClientProps) {
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>(orders[0]?.order_no || "");
  const [storageDate, setStorageDate] = useState(new Date().toISOString().split("T")[0]);
  const [inspector, setInspector] = useState("");
  const [keeper, setKeeper] = useState("");
  const [storageQuantities, setStorageQuantities] = useState<Record<string, number>>({});
  const [batchNumbers, setBatchNumbers] = useState<Record<string, string>>({});
  const [locationCodes, setLocationCodes] = useState<Record<string, string>>({});

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.order_no === selectedOrderNo);
  }, [orders, selectedOrderNo]);

  const details = selectedOrder?.purchaseDetails || [];
  const existingStorages = selectedOrder?.purchaseStorages || [];

  const getStoredQuantity = (drugApprovalNo: string) => {
    return existingStorages.filter(s => s.drugApprovalNo === drugApprovalNo).reduce((sum, s) => sum + s.quantity, 0);
  };

  const handleStorageQuantityChange = (drugApprovalNo: string, value: string) => {
    const num = parseInt(value) || 0;
    setStorageQuantities(prev => ({ ...prev, [drugApprovalNo]: num }));
  };

  const handleBatchNumberChange = (drugApprovalNo: string, value: string) => {
    setBatchNumbers(prev => ({ ...prev, [drugApprovalNo]: value }));
  };

  const handleLocationCodeChange = (drugApprovalNo: string, value: string) => {
    setLocationCodes(prev => ({ ...prev, [drugApprovalNo]: value }));
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">采购入库</h1>
          <p className="text-sm text-slate-500">处理采购订单入库</p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
          确认入库
        </Button>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">采购单：</span>
            <Select value={selectedOrderNo} onValueChange={setSelectedOrderNo}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="选择采购单" />
              </SelectTrigger>
              <SelectContent>
                {orders.map(o => (
                  <SelectItem key={o.order_no} value={o.order_no}>
                    {o.order_no} - {o.manufacturer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">采购日期：</span>
            <span className="text-sm text-slate-800 dark:text-slate-200">{selectedOrder?.order_date || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">采购员：</span>
            <span className="text-sm text-slate-800 dark:text-slate-200">{selectedOrder?.purchaser || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">状态：</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20">
              {selectedOrder?.status || "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
            <tr>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                药品名称
              </th>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                生产日期
              </th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm">
                有效期
              </th>
              <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                采购量
              </th>
              <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                已入库
              </th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm">
                本次入库
              </th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm">
                仓库货位
              </th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm">批号</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {details.map(detail => {
              const storedQty = getStoredQuantity(detail.drugApprovalNo);
              const remainingQty = detail.quantity - storedQty;

              return (
                <tr key={detail.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-medium">{detail.drug_name}</td>
                  <td className="px-4 py-3 text-slate-600">{detail.production_date}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{detail.validity_months}月</td>
                  <td className="px-4 py-3 text-right font-mono">{detail.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">{storedQty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      type="number"
                      className="w-20 h-8 text-center"
                      min={0}
                      max={remainingQty}
                      value={storageQuantities[detail.drugApprovalNo] || ""}
                      onChange={e => handleStorageQuantityChange(detail.drugApprovalNo, e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      className="w-28 h-8 text-center"
                      value={locationCodes[detail.drugApprovalNo] || ""}
                      onChange={e => handleLocationCodeChange(detail.drugApprovalNo, e.target.value)}
                      placeholder="WH01/A01-01"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      className="w-28 h-8 text-center"
                      value={batchNumbers[detail.drugApprovalNo] || ""}
                      onChange={e => handleBatchNumberChange(detail.drugApprovalNo, e.target.value)}
                      placeholder="B2404001"
                    />
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">入库日期：</span>
            <Input
              type="date"
              className="flex-1 h-8"
              value={storageDate}
              onChange={e => setStorageDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
