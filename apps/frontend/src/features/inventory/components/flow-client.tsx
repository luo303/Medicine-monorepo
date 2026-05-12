"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import { EmptyState } from "@/components/empty-state";
import { exportToExcel } from "@/lib/excel-export";
import { Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { InventoryFlow } from "@/types/inventory";

interface FlowClientProps {
  flows: InventoryFlow[];
}

export function FlowClient({ flows }: FlowClientProps) {
  const [selectedType, setSelectedType] = useState("全部");
  const [selectedDrug, setSelectedDrug] = useState("全部");
  const [exporting, setExporting] = useState(false);

  const types = useMemo(() => {
    const set = new Set<string>();
    flows.forEach(item => set.add(item.type));
    return ["全部", ...Array.from(set)];
  }, [flows]);

  const drugs = useMemo(() => {
    const set = new Set<string>();
    flows.forEach(item => set.add(item.drug_name));
    return ["全部", ...Array.from(set).sort()];
  }, [flows]);

  const filteredData = useMemo(() => {
    return flows.filter(item => {
      const matchType = selectedType === "全部" || item.type === selectedType;
      const matchDrug = selectedDrug === "全部" || item.drug_name === selectedDrug;
      return matchType && matchDrug;
    });
  }, [flows, selectedType, selectedDrug]);

  const handleReset = () => {
    setSelectedType("全部");
    setSelectedDrug("全部");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel({
        reportType: "inventory_flow",
        reportLabel: "库存流水",
        rawData: filteredData.map(item => ({
          date: item.date,
          type: item.type,
          order_no: item.order_no,
          drug_name: item.drug_name,
          batch_no: item.batch_no,
          quantity: item.quantity,
          operator: item.operator
        }))
      });
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const columns: ColumnDef<InventoryFlow>[] = useMemo(
    () => [
      {
        key: "date",
        label: "时间",
        width: 80,
        render: value => <span className="text-slate-600">{formatDate(value)}</span>
      },
      {
        key: "type",
        label: "类型",
        width: 100,
        render: value => {
          const isPurchase = value.includes("采购");
          const isOutbound = value.includes("出库");
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isOutbound
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
              }`}
            >
              {isOutbound ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {value}
            </span>
          );
        }
      },
      {
        key: "order_no",
        label: "单号",
        width: 130,
        render: value => (
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{value}</code>
        )
      },
      {
        key: "drug_name",
        label: "药品名称",
        width: 160,
        render: value => <span className="font-medium">{value}</span>
      },
      {
        key: "batch_no",
        label: "批号",
        width: 120,
        render: value => (
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{value}</code>
        )
      },
      {
        key: "quantity",
        label: "数量",
        width: 100,
        render: value => {
          const isNegative = value < 0;
          return (
            <span className={`font-bold ${isNegative ? "text-red-600" : "text-emerald-600"}`}>
              {isNegative ? "" : "+"}
              {value.toLocaleString()}
            </span>
          );
        }
      },
      {
        key: "operator",
        label: "操作人",
        width: 100,
        render: value => <span className="text-slate-600">{value}</span>
      }
    ],
    []
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">库存流水</h1>
          <p className="text-sm text-slate-500">查看库存变动记录</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              导出中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              导出
            </>
          )}
        </Button>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">类型：</span>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map(t => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">药品：</span>
            <Select value={selectedDrug} onValueChange={setSelectedDrug}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {drugs.map(d => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
        {filteredData.length === 0 ? (
          <EmptyState title="暂无流水记录" description="当前条件下没有找到库存流水" />
        ) : (
          <VirtualTable columns={columns} data={filteredData} rowKey={item => item.id} />
        )}
      </div>

      <div className="flex-shrink-0 text-sm text-slate-500">共 {filteredData.length} 条记录</div>
    </div>
  );
}
