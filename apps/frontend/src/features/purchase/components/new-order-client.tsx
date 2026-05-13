"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateCaches } from "@/lib/cache-client";
import { createPurchaseDetail, createPurchaseOrder } from "@/lib/api-client";
import type { Drug, Manufacturer } from "@/types/basic-data";
import type { PurchaseOrder } from "@/types/purchase";

interface NewPurchaseOrderClientProps {
  manufacturers: Manufacturer[];
  drugs: Drug[];
  orders: PurchaseOrder[];
}

interface OrderItem {
  id: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  validity_months: number;
  quantity: number;
  unit_price: number;
}

function generateOrderNo(existingOrders: PurchaseOrder[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `PO${year}${month}`;

  const lastOrder = existingOrders
    .filter(order => order.order_no.startsWith(prefix))
    .sort((a, b) => b.order_no.localeCompare(a.order_no))[0];

  if (!lastOrder) {
    return `${prefix}001`;
  }

  const nextNumber = Number.parseInt(lastOrder.order_no.slice(-3), 10) + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

export default function NewPurchaseOrderClient({ manufacturers, drugs, orders }: NewPurchaseOrderClientProps) {
  const router = useRouter();
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [remark, setRemark] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState("");
  const [addProductionDate, setAddProductionDate] = useState("");
  const [addValidityMonths, setAddValidityMonths] = useState(24);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addUnitPrice, setAddUnitPrice] = useState(0);
  const [submittingMode, setSubmittingMode] = useState<"save" | "submit" | null>(null);

  const nextOrderNo = useMemo(() => generateOrderNo(orders), [orders]);

  const selectedManufacturerRecord = useMemo(
    () => manufacturers.find(item => item.approval_no === selectedManufacturer) ?? null,
    [manufacturers, selectedManufacturer]
  );

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }, [orderItems]);

  const resetAddForm = () => {
    setSelectedDrug("");
    setAddProductionDate("");
    setAddValidityMonths(24);
    setAddQuantity(1);
    setAddUnitPrice(0);
  };

  const handleAddDrug = () => {
    if (!selectedDrug || !addProductionDate || addQuantity <= 0) {
      alert("请完整填写药品明细");
      return;
    }

    const drug = drugs.find(item => item.approval_no === selectedDrug);
    if (!drug) {
      alert("未找到所选药品");
      return;
    }

    setOrderItems(prev => [
      ...prev,
      {
        id: `${selectedDrug}-${Date.now()}`,
        drugApprovalNo: selectedDrug,
        drug_name: drug.name,
        production_date: addProductionDate,
        validity_months: addValidityMonths,
        quantity: addQuantity,
        unit_price: addUnitPrice
      }
    ]);

    setShowAddDialog(false);
    resetAddForm();
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const submitOrder = async (mode: "save" | "submit") => {
    if (!selectedManufacturerRecord) {
      alert("请选择供应商");
      return;
    }

    if (!orderItems.length) {
      alert("请至少添加一条采购明细");
      return;
    }

    setSubmittingMode(mode);
    try {
      await createPurchaseOrder({
        order_no: nextOrderNo,
        order_date: orderDate,
        manufacturerApprovalNo: selectedManufacturerRecord.approval_no,
        manufacturer_name: selectedManufacturerRecord.name,
        total_amount: totalAmount,
        purchaser
      });

      await Promise.all(
        orderItems.map(item =>
          createPurchaseDetail({
            orderNo: nextOrderNo,
            drugApprovalNo: item.drugApprovalNo,
            drug_name: item.drug_name,
            production_date: item.production_date,
            validity_months: item.validity_months,
            quantity: item.quantity,
            unit_price: item.unit_price
          })
        )
      );

      await revalidateCaches([CACHE_TAGS.purchaseOrders, CACHE_TAGS.purchaseDetails]);
      alert(mode === "save" ? "采购单已保存" : "采购单已创建");
      router.push("/purchase/orders");
      router.refresh();
    } catch (error) {
      console.error("创建采购单失败:", error);
      alert(`创建失败：${(error as Error).message}`);
    } finally {
      setSubmittingMode(null);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden p-6">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">新增采购单</h1>
          <p className="text-sm text-slate-500">创建新的采购订单并录入药品明细</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!!submittingMode} onClick={() => void submitOrder("save")}>
            {submittingMode === "save" ? "保存中..." : "保存"}
          </Button>
          <Button
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:from-teal-600 hover:to-cyan-600"
            disabled={!!submittingMode}
            onClick={() => void submitOrder("submit")}
          >
            {submittingMode === "submit" ? "提交中..." : "提交"}
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">采购单号</span>
            <span className="font-mono text-sm text-teal-600">{nextOrderNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">采购日期</span>
            <Input type="date" className="flex-1 h-8" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">供应商</span>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="选择供应商" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(item => (
                  <SelectItem key={item.approval_no} value={item.approval_no}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">采购员</span>
            <Input
              className="flex-1 h-8"
              placeholder="输入采购员"
              value={purchaser}
              onChange={e => setPurchaser(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3 dark:border-slate-700/40">
          <span className="font-medium text-slate-700 dark:text-slate-300">药品明细</span>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            添加药品
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">药品批准号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">药品名称</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">生产日期</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">有效期(月)</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">数量</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">单价</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">金额</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {orderItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-mono text-teal-600">{item.drugApprovalNo}</td>
                  <td className="px-4 py-3 font-medium">{item.drug_name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.production_date}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{item.validity_months}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">￥{item.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">￥{(item.quantity * item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      删除
                    </Button>
                  </td>
                </tr>
              ))}
              {!orderItems.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    暂无采购明细，请先添加药品
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">合计金额</span>
            <span className="text-lg font-bold text-teal-600">￥{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">备注</span>
            <Input
              className="h-8 w-64"
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
              <span className="w-20 text-sm text-slate-600">药品</span>
              <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="选择药品" />
                </SelectTrigger>
                <SelectContent>
                  {drugs.map(drug => (
                    <SelectItem key={drug.approval_no} value={drug.approval_no}>
                      {drug.name} {drug.approval_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-slate-600">生产日期</span>
              <Input
                type="date"
                className="flex-1 h-8"
                value={addProductionDate}
                onChange={e => setAddProductionDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-slate-600">有效期(月)</span>
              <Input
                type="number"
                className="flex-1 h-8"
                value={addValidityMonths}
                min={1}
                onChange={e => setAddValidityMonths(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-slate-600">数量</span>
              <Input
                type="number"
                className="flex-1 h-8"
                value={addQuantity}
                min={1}
                onChange={e => setAddQuantity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-slate-600">采购单价</span>
              <Input
                type="number"
                step="0.01"
                className="flex-1 h-8"
                value={addUnitPrice}
                min={0}
                onChange={e => setAddUnitPrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-slate-600">小计</span>
              <span className="font-bold text-teal-600">￥{(addQuantity * addUnitPrice).toFixed(2)}</span>
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
