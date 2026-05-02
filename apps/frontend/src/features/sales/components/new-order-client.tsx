"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import type { SalesOrder } from "@/types/sales";

interface NewOrderClientProps {
  orders: SalesOrder[];
  institutions: { approval_no: string; name: string }[];
  drugs: { approval_no: string; name: string; price: string }[];
}

interface DrugItem {
  id: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

export function NewOrderClient({ orders, institutions, drugs }: NewOrderClientProps) {
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [drugItems, setDrugItems] = useState<DrugItem[]>([]);
  const [remark, setRemark] = useState("");

  const nextOrderNo = useMemo(() => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const prefix = `SO${year}${month}`;
    const lastOrder = orders
      .filter(o => o.order_no.startsWith(prefix))
      .sort((a, b) => b.order_no.localeCompare(a.order_no))[0];
    if (lastOrder) {
      const lastNum = parseInt(lastOrder.order_no.slice(-3));
      return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
    }
    return `${prefix}001`;
  }, [orders]);

  const totalAmount = useMemo(() => {
    return drugItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  }, [drugItems]);

  const handleAddDrug = () => {
    const newItem: DrugItem = {
      id: Date.now().toString(),
      drugApprovalNo: "",
      drug_name: "",
      production_date: "",
      quantity: 0,
      unit_price: "0",
      amount: "0"
    };
    setDrugItems([...drugItems, newItem]);
  };

  const handleRemoveDrug = (id: string) => {
    setDrugItems(drugItems.filter(item => item.id !== id));
  };

  const handleDrugChange = (id: string, field: keyof DrugItem, value: string | number) => {
    setDrugItems(
      drugItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "drugApprovalNo") {
            const drug = drugs.find(d => d.approval_no === value);
            if (drug) {
              updated.drug_name = drug.name;
              updated.unit_price = drug.price;
            }
          }
          if (field === "quantity" || field === "unit_price") {
            const qty = field === "quantity" ? Number(value) : item.quantity;
            const price = field === "unit_price" ? String(value) : item.unit_price;
            updated.amount = (qty * parseFloat(price)).toFixed(2);
          }
          return updated;
        }
        return item;
      })
    );
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">新增销售单</h1>
          <p className="text-sm text-slate-500">创建新的销售订单</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">保存</Button>
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md">
            提交
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">销售单号：</span>
            <span className="font-mono text-teal-600">{nextOrderNo}</span>
            <span className="text-xs text-slate-400">（自动生成）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">销售日期：</span>
            <Input type="date" className="w-40 h-8" value={salesDate} onChange={e => setSalesDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">客户：</span>
            <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
              <SelectTrigger className="w-48 h-8">
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
            <span className="text-sm text-slate-500 dark:text-slate-400 w-20">销售员：</span>
            <Input
              className="w-40 h-8"
              placeholder="请输入销售员"
              value={salesperson}
              onChange={e => setSalesperson(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200/60 dark:border-slate-700/40">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">药品明细</h3>
          <Button variant="outline" size="sm" className="h-7" onClick={handleAddDrug}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加药品
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          {drugItems.length === 0 ? (
            <EmptyState title="暂无药品明细" description="请点击上方按钮添加药品" />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    药品批准号
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    药品名称
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    生产日期
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    数量
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    单价
                  </th>
                  <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    金额
                  </th>
                  <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200 text-sm w-20">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {drugItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <Select
                        value={item.drugApprovalNo}
                        onValueChange={v => handleDrugChange(item.id, "drugApprovalNo", v)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="选择药品" />
                        </SelectTrigger>
                        <SelectContent>
                          {drugs.map(drug => (
                            <SelectItem key={drug.approval_no} value={drug.approval_no}>
                              {drug.approval_no}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">{item.drug_name || "-"}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="date"
                        className="w-32 h-8"
                        value={item.production_date}
                        onChange={e => handleDrugChange(item.id, "production_date", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        className="w-20 h-8 text-right"
                        value={item.quantity}
                        onChange={e => handleDrugChange(item.id, "quantity", Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono">{item.unit_price}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono">¥{item.amount}</span>
                    </td>
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

        <div className="flex items-center justify-between p-4 border-t border-slate-200/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">库存检查：</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              库存充足
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">合计金额：</span>
            <span className="text-lg font-semibold text-teal-600">¥{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4 mt-4">
        <div className="flex items-start gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 w-20 shrink-0">备注：</span>
          <textarea
            className="flex-1 min-h-[80px] p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="请输入备注信息..."
            value={remark}
            onChange={e => setRemark(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
