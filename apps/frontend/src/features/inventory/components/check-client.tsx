"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Plus, Save, Send, FileText } from "lucide-react";
import type { Inventory } from "@/types/inventory";

interface CheckClientProps {
  inventories: Inventory[];
}

interface CheckItem {
  id: number;
  drug_name: string;
  batch_no: string;
  location_code: string;
  book_quantity: number;
  actual_quantity: number;
  difference: number;
  reason: string;
}

export function CheckClient({ inventories }: CheckClientProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState("全部");
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split("T")[0]);
  const [checker, setChecker] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);

  const warehouses = useMemo(() => {
    const set = new Set<string>();
    inventories.forEach(item => set.add(item.warehouse.name));
    return ["全部", ...Array.from(set)];
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    return inventories.filter(item => selectedWarehouse === "全部" || item.warehouse.name === selectedWarehouse);
  }, [inventories, selectedWarehouse]);

  const handleAddAllItems = () => {
    const items: CheckItem[] = filteredInventories.map((item, index) => ({
      id: index + 1,
      drug_name: item.drug_name,
      batch_no: item.batch_no,
      location_code: item.location_code,
      book_quantity: item.quantity,
      actual_quantity: item.quantity,
      difference: 0,
      reason: ""
    }));
    setCheckItems(items);
  };

  const handleActualQuantityChange = (id: number, value: number) => {
    setCheckItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const difference = value - item.book_quantity;
          return { ...item, actual_quantity: value, difference };
        }
        return item;
      })
    );
  };

  const handleReasonChange = (id: number, reason: string) => {
    setCheckItems(prev => prev.map(item => (item.id === id ? { ...item, reason } : item)));
  };

  const generateCheckNo = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `PD${year}${month}${day}001`;
  };

  const handleSaveDraft = () => {
    if (checkItems.length === 0) {
      alert("请先添加盘点数据");
      return;
    }
    if (!checker) {
      alert("请填写盘点人");
      return;
    }
    alert("保存草稿成功！盘点单号：" + generateCheckNo());
  };

  const handleSubmitForReview = () => {
    if (checkItems.length === 0) {
      alert("请先添加盘点数据");
      return;
    }
    if (!checker || !reviewer) {
      alert("请填写盘点人和审核人");
      return;
    }
    const hasDifference = checkItems.some(item => item.difference !== 0);
    if (hasDifference) {
      const noReasonItems = checkItems.filter(item => item.difference !== 0 && !item.reason);
      if (noReasonItems.length > 0) {
        alert("存在差异的盘点项必须填写差异原因");
        return;
      }
    }
    alert("提交审核成功！等待审核人审核...");
  };

  const handleGenerateAdjustment = () => {
    if (checkItems.length === 0) {
      alert("请先添加盘点数据");
      return;
    }
    const itemsWithDifference = checkItems.filter(item => item.difference !== 0);
    if (itemsWithDifference.length === 0) {
      alert("没有差异项，无需生成盘盈盘亏单");
      return;
    }
    alert(`已生成盘盈盘亏单，共 ${itemsWithDifference.length} 项差异需要调整`);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">库存盘点</h1>
          <p className="text-sm text-slate-500">创建和管理库存盘点单</p>
        </div>
        <Button size="sm" onClick={handleAddAllItems}>
          <Plus className="w-4 h-4 mr-1" />
          新建盘点
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">盘点信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-600 dark:text-slate-400">盘点单号</label>
                <Input className="h-8 bg-slate-50 dark:bg-slate-800" value={generateCheckNo()} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-600 dark:text-slate-400">盘点仓库</label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-600 dark:text-slate-400">盘点日期</label>
                <Input type="date" className="h-8" value={checkDate} onChange={e => setCheckDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {checkItems.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="暂无盘点数据"
                description='点击"新建盘点"按钮开始盘点'
                icon={<FileText className="w-12 h-12 text-slate-400" />}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">盘点明细</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300 w-40">
                        药品名称
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300 w-32">
                        批号
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300 w-24">
                        货位
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 dark:text-slate-300 w-24">
                        账面数量
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 dark:text-slate-300 w-24">
                        实盘数量
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-600 dark:text-slate-300 w-24">
                        差异
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                        差异原因
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {checkItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2 text-sm">{item.drug_name}</td>
                        <td className="px-4 py-2 text-sm">
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {item.batch_no}
                          </code>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <code className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                            {item.location_code}
                          </code>
                        </td>
                        <td className="px-4 py-2 text-sm text-right">{item.book_quantity.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-right">
                          <Input
                            type="number"
                            className="w-20 h-7 text-right"
                            value={item.actual_quantity}
                            onChange={e => handleActualQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          <span
                            className={`font-bold ${
                              item.difference > 0
                                ? "text-emerald-600"
                                : item.difference < 0
                                  ? "text-red-600"
                                  : "text-slate-600"
                            }`}
                          >
                            {item.difference > 0 ? "+" : ""}
                            {item.difference}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <Select value={item.reason} onValueChange={value => handleReasonChange(item.id, value)}>
                            <SelectTrigger className="h-7 w-32">
                              <SelectValue placeholder="选择原因" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="破损">破损</SelectItem>
                              <SelectItem value="盘点误差">盘点误差</SelectItem>
                              <SelectItem value="待查明">待查明</SelectItem>
                              <SelectItem value="其他">其他</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {checkItems.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-slate-600 dark:text-slate-400">盘点人</label>
                  <Input
                    className="h-8"
                    placeholder="输入盘点人姓名"
                    value={checker}
                    onChange={e => setChecker(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-600 dark:text-slate-400">审核人</label>
                  <Input
                    className="h-8"
                    placeholder="输入审核人姓名"
                    value={reviewer}
                    onChange={e => setReviewer(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                  <Save className="w-4 h-4 mr-1" />
                  保存草稿
                </Button>
                <Button variant="outline" size="sm" onClick={handleSubmitForReview}>
                  <Send className="w-4 h-4 mr-1" />
                  提交审核
                </Button>
                <Button size="sm" onClick={handleGenerateAdjustment}>
                  <FileText className="w-4 h-4 mr-1" />
                  生成盘盈盘亏单
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
