"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Manufacturer, Drug } from "@/types/basic-data";

interface NewPurchaseOrderClientProps {
  manufacturers: Manufacturer[];
  drugs: Drug[];
}

interface OrderItem {
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  validity_months: number;
  quantity: number;
  unit_price: number;
  amount: number;
}

export default function NewPurchaseOrderClient({ manufacturers, drugs }: NewPurchaseOrderClientProps) {
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [remark, setRemark] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState("");
  const [addProductionDate, setAddProductionDate] = useState("");
  const [addValidityMonths, setAddValidityMonths] = useState(24);
  const [addQuantity, setAddQuantity] = useState(0);
  const [addUnitPrice, setAddUnitPrice] = useState(0);

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.amount, 0);
  }, [orderItems]);

  const handleAddDrug = () => {
    if (!selectedDrug) return;

    const drug = drugs.find(d => d.approval_no === selectedDrug);
    if (!drug) return;

    const newItem: OrderItem = {
      drugApprovalNo: selectedDrug,
      drug_name: drug.name,
      production_date: addProductionDate,
      validity_months: addValidityMonths,
      quantity: addQuantity,
      unit_price: addUnitPrice,
      amount: addQuantity * addUnitPrice
    };

    setOrderItems([...orderItems, newItem]);
    setShowAddDialog(false);
    resetAddForm();
  };

  const resetAddForm = () => {
    setSelectedDrug("");
    setAddProductionDate("");
    setAddValidityMonths(24);
    setAddQuantity(0);
    setAddUnitPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">新增采购单</h1>
          <p className="text-sm text-slate-500">创建新的采购订单</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">保存</Button>
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
            提交
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">采购单号：</span>
            <span className="text-sm text-slate-400">自动生成</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">采购日期：</span>
            <Input type="date" className="flex-1 h-8" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">供应商：</span>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="选择供应商" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(m => (
                  <SelectItem key={m.approval_no} value={m.approval_no}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 w-16">采购员：</span>
            <Input
              className="flex-1 h-8"
              placeholder="采购员姓名"
              value={purchaser}
              onChange={e => setPurchaser(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/40">
          <span className="font-medium text-slate-700 dark:text-slate-300">药品明细</span>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加药品
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">药品批准号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">药品名称</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">生产日期</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">有效期</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">数量</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">单价</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">金额</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {orderItems.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-mono text-sm text-teal-600">{item.drugApprovalNo}</td>
                  <td className="px-4 py-3 font-medium">{item.drug_name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.production_date}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{item.validity_months}月</td>
                  <td className="px-4 py-3 text-right font-mono">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">¥{item.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">¥{item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveItem(index)}
                    >
                      删除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">合计金额：</span>
            <span className="text-lg font-bold text-teal-600">¥{totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">备注：</span>
            <Input
              className="w-64 h-8"
              placeholder="备注信息"
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加药品</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 w-20">药品：</span>
              <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="选择药品" />
                </SelectTrigger>
                <SelectContent>
                  {drugs.map(d => (
                    <SelectItem key={d.approval_no} value={d.approval_no}>
                      {d.name} {d.approval_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 w-20">生产日期：</span>
              <Input
                type="date"
                className="flex-1 h-8"
                value={addProductionDate}
                onChange={e => setAddProductionDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 w-20">有效期(月)：</span>
              <Input
                type="number"
                className="flex-1 h-8"
                value={addValidityMonths}
                onChange={e => setAddValidityMonths(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 w-20">采购数量：</span>
              <Input
                type="number"
                className="flex-1 h-8"
                value={addQuantity}
                onChange={e => setAddQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 w-20">采购单价：</span>
              <Input
                type="number"
                step="0.01"
                className="flex-1 h-8"
                value={addUnitPrice}
                onChange={e => setAddUnitPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 w-20">小计：</span>
              <span className="font-bold text-teal-600">¥{(addQuantity * addUnitPrice).toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddDrug}>确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
