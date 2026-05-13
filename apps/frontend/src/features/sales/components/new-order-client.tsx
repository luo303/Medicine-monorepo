"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateCaches } from "@/lib/cache-client";
import { createSalesDetail, createSalesOrder } from "@/lib/api-client";
import { EmptyState } from "@/components/empty-state";
import type { Inventory } from "@/types/inventory";
import type { SalesOrder } from "@/types/sales";

interface InstitutionOption {
  approval_no: string;
  name: string;
}

interface NewOrderClientProps {
  orders: SalesOrder[];
  institutions: InstitutionOption[];
  inventories: Inventory[];
}

interface SalesItem {
  id: string;
  inventoryId: string;
  manufacturerApprovalNo: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  availableQuantity: number;
  quantity: number;
  unit_price: number;
}

function generateOrderNo(existingOrders: SalesOrder[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `SO${year}${month}`;

  const lastOrder = existingOrders
    .filter(order => order.order_no.startsWith(prefix))
    .sort((a, b) => b.order_no.localeCompare(a.order_no))[0];

  if (!lastOrder) {
    return `${prefix}001`;
  }

  const nextNumber = Number.parseInt(lastOrder.order_no.slice(-3), 10) + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

export function NewOrderClient({ orders, institutions, inventories }: NewOrderClientProps) {
  const router = useRouter();
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [remark, setRemark] = useState("");
  const [submittingMode, setSubmittingMode] = useState<"save" | "submit" | null>(null);

  const nextOrderNo = useMemo(() => generateOrderNo(orders), [orders]);

  const inventoryOptions = useMemo(() => {
    return inventories
      .filter(item => item.quantity > 0)
      .map(item => ({
        value: String(item.id),
        label: `${item.drug_name} / ${item.batch_no || "无批号"} / ${item.warehouse.name}-${item.location_code}`,
        inventory: item
      }));
  }, [inventories]);

  const totalAmount = useMemo(() => {
    return salesItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }, [salesItems]);

  const handleAddDrug = () => {
    setSalesItems(prev => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        inventoryId: "",
        manufacturerApprovalNo: "",
        drugApprovalNo: "",
        drug_name: "",
        production_date: "",
        availableQuantity: 0,
        quantity: 1,
        unit_price: 0
      }
    ]);
  };

  const handleRemoveDrug = (id: string) => {
    setSalesItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, updater: (item: SalesItem) => SalesItem) => {
    setSalesItems(prev => prev.map(item => (item.id === id ? updater(item) : item)));
  };

  const handleInventorySelect = (id: string, inventoryId: string) => {
    const inventory = inventories.find(item => String(item.id) === inventoryId);
    if (!inventory) {
      return;
    }

    handleItemChange(id, item => ({
      ...item,
      inventoryId,
      manufacturerApprovalNo: inventory.manufacturerApprovalNo,
      drugApprovalNo: inventory.drugApprovalNo,
      drug_name: inventory.drug_name,
      production_date: inventory.production_date,
      availableQuantity: inventory.quantity,
      quantity: Math.min(item.quantity || 1, inventory.quantity),
      unit_price: item.unit_price
    }));
  };

  const submitOrder = async (mode: "save" | "submit") => {
    const institution = institutions.find(item => item.approval_no === selectedInstitution);
    if (!institution) {
      alert("请选择客户");
      return;
    }

    if (!salesItems.length) {
      alert("请至少添加一条销售明细");
      return;
    }

    for (const item of salesItems) {
      if (!item.inventoryId || !item.drugApprovalNo || !item.manufacturerApprovalNo) {
        alert("请先为每条明细选择库存来源");
        return;
      }

      if (item.quantity <= 0 || item.quantity > item.availableQuantity) {
        alert(`${item.drug_name} 的销售数量超出可用库存`);
        return;
      }
    }

    setSubmittingMode(mode);
    try {
      await createSalesOrder({
        order_no: nextOrderNo,
        sales_date: salesDate,
        institutionApprovalNo: institution.approval_no,
        institution_name: institution.name,
        total_amount: totalAmount,
        salesperson
      });

      await Promise.all(
        salesItems.map(item =>
          createSalesDetail({
            orderNo: nextOrderNo,
            manufacturerApprovalNo: item.manufacturerApprovalNo,
            drugApprovalNo: item.drugApprovalNo,
            drug_name: item.drug_name,
            production_date: item.production_date,
            quantity: item.quantity,
            unit_price: item.unit_price
          })
        )
      );

      await revalidateCaches([CACHE_TAGS.salesOrders, CACHE_TAGS.salesDetails]);
      alert(mode === "save" ? "销售单已保存" : "销售单已创建");
      router.push("/sales/order-list");
      router.refresh();
    } catch (error) {
      console.error("创建销售单失败:", error);
      alert(`创建失败：${(error as Error).message}`);
    } finally {
      setSubmittingMode(null);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden p-6">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">新增销售单</h1>
          <p className="text-sm text-slate-500">从现有库存选择批次并创建销售订单</p>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-500 dark:text-slate-400">销售单号</span>
            <span className="font-mono text-teal-600">{nextOrderNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-500 dark:text-slate-400">销售日期</span>
            <Input type="date" className="w-40 h-8" value={salesDate} onChange={e => setSalesDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-500 dark:text-slate-400">客户</span>
            <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
              <SelectTrigger className="w-56 h-8">
                <SelectValue placeholder="请选择客户" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map(inst => (
                  <SelectItem key={inst.approval_no} value={inst.approval_no}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-500 dark:text-slate-400">销售员</span>
            <Input
              className="w-40 h-8"
              placeholder="输入销售员"
              value={salesperson}
              onChange={e => setSalesperson(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="flex items-center justify-between border-b border-slate-200/60 p-4 dark:border-slate-700/40">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">药品明细</h3>
          <Button variant="outline" size="sm" className="h-7" onClick={handleAddDrug}>
            添加药品
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          {salesItems.length === 0 ? (
            <EmptyState title="暂无销售明细" description="请点击上方按钮添加药品" />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200">库存来源</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200">药品名称</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200">生产日期</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">可用库存</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">销售数量</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">单价</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">金额</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {salesItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <Select value={item.inventoryId} onValueChange={value => handleInventorySelect(item.id, value)}>
                        <SelectTrigger className="w-72 h-8">
                          <SelectValue placeholder="选择库存批次" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.drug_name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{item.production_date || "-"}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">
                      {item.availableQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        className="h-8 w-24 text-right"
                        value={item.quantity}
                        min={1}
                        max={item.availableQuantity || 1}
                        onChange={e =>
                          handleItemChange(item.id, current => ({
                            ...current,
                            quantity: Number(e.target.value) || 1
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 w-24 text-right"
                        value={item.unit_price}
                        min={0}
                        onChange={e =>
                          handleItemChange(item.id, current => ({
                            ...current,
                            unit_price: Number(e.target.value) || 0
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">￥{(item.quantity * item.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveDrug(item.id)}
                      >
                        删除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-700/40 dark:bg-slate-800/50">
          <div className="text-sm text-slate-500 dark:text-slate-400">备注仅保留在前端表单中，当前后端暂无备注字段</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">合计金额</span>
            <span className="text-lg font-semibold text-teal-600">￥{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="flex items-start gap-2">
          <span className="w-20 shrink-0 text-sm text-slate-500 dark:text-slate-400">备注</span>
          <textarea
            className="min-h-[80px] flex-1 resize-none rounded-lg border border-slate-200 bg-transparent p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700"
            placeholder="输入备注信息"
            value={remark}
            onChange={e => setRemark(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
