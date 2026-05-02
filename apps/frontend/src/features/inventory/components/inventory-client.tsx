"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import { EmptyState } from "@/components/empty-state";
import { exportToExcel } from "@/lib/excel-export";
import { Loader2 } from "lucide-react";
import type { Inventory } from "@/types/inventory";

interface InventoryClientProps {
  inventories: Inventory[];
}

export function InventoryClient({ inventories }: InventoryClientProps) {
  const [searchDrug, setSearchDrug] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("全部");
  const [selectedLocation, setSelectedLocation] = useState("全部");
  const [selectedExpiry, setSelectedExpiry] = useState("全部");
  const [exporting, setExporting] = useState(false);

  const warehouses = useMemo(() => {
    const set = new Set<string>();
    inventories.forEach(item => set.add(item.warehouse.name));
    return ["全部", ...Array.from(set)];
  }, [inventories]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    inventories.forEach(item => set.add(item.location_code));
    return ["全部", ...Array.from(set).sort()];
  }, [inventories]);

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredData = useMemo(() => {
    return inventories.filter(item => {
      const matchDrug = !searchDrug || item.drug_name.toLowerCase().includes(searchDrug.toLowerCase());
      const matchWarehouse = selectedWarehouse === "全部" || item.warehouse.name === selectedWarehouse;
      const matchLocation = selectedLocation === "全部" || item.location_code === selectedLocation;

      const daysRemaining = getDaysRemaining(item.expiry_date);
      let matchExpiry = true;
      if (selectedExpiry === "3个月内") {
        matchExpiry = daysRemaining <= 90 && daysRemaining > 0;
      } else if (selectedExpiry === "6个月内") {
        matchExpiry = daysRemaining <= 180 && daysRemaining > 0;
      } else if (selectedExpiry === "已过期") {
        matchExpiry = daysRemaining <= 0;
      }

      return matchDrug && matchWarehouse && matchLocation && matchExpiry;
    });
  }, [inventories, searchDrug, selectedWarehouse, selectedLocation, selectedExpiry]);

  const handleReset = () => {
    setSearchDrug("");
    setSelectedWarehouse("全部");
    setSelectedLocation("全部");
    setSelectedExpiry("全部");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel({
        reportType: "inventory",
        reportLabel: "实时库存",
        rawData: filteredData.map(item => ({
          warehouse_code: item.warehouse.name,
          location_code: item.location_code,
          batch_no: item.batch_no,
          drug_name: item.drug_name,
          quantity: item.quantity,
          last_update: item.last_update
        }))
      });
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnDef<Inventory>[] = useMemo(
    () => [
      {
        key: "drug_name",
        label: "药品名称",
        width: 180,
        render: value => <span className="font-medium">{value}</span>
      },
      {
        key: "batch_no",
        label: "批号",
        width: 140,
        render: value => (
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{value}</code>
        )
      },
      {
        key: "production_date",
        label: "生产日期",
        width: 110,
        render: value => <span className="text-slate-600">{value}</span>
      },
      {
        key: "expiry_date",
        label: "有效期",
        width: 110,
        render: value => <span className="text-slate-600">{value}</span>
      },
      {
        key: "days_remaining",
        label: "剩余天数",
        width: 100,
        align: "center",
        render: (_, item) => {
          const days = getDaysRemaining(item.expiry_date);
          let colorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
          if (days <= 0) {
            colorClass = "text-red-600 bg-red-50 dark:bg-red-900/20";
          } else if (days <= 90) {
            colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
          } else if (days <= 180) {
            colorClass = "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
          }
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
              {days <= 0 ? "已过期" : `${days}天`}
            </span>
          );
        }
      },
      {
        key: "warehouse",
        label: "仓库",
        width: 120,
        render: (_, item) => <span className="text-slate-600">{item.warehouse.name}</span>
      },
      {
        key: "location_code",
        label: "货位",
        width: 100,
        render: value => (
          <code className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded font-mono">
            {value}
          </code>
        )
      },
      {
        key: "quantity",
        label: "数量",
        width: 100,
        align: "right",
        render: value => <span className="font-bold text-teal-600">{value.toLocaleString()}</span>
      }
    ],
    []
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">实时库存</h1>
          <p className="text-sm text-slate-500">查看当前库存状态</p>
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
            <span className="text-sm text-slate-600 dark:text-slate-400">药品名称：</span>
            <Input
              className="w-32 h-8"
              placeholder="输入药品名称"
              value={searchDrug}
              onChange={e => setSearchDrug(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">仓库：</span>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-32 h-8">
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">货位：</span>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map(l => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">效期：</span>
            <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="3个月内">3个月内</SelectItem>
                <SelectItem value="6个月内">6个月内</SelectItem>
                <SelectItem value="已过期">已过期</SelectItem>
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
          <EmptyState title="暂无库存数据" description="当前条件下没有找到库存记录" />
        ) : (
          <VirtualTable columns={columns} data={filteredData} rowKey={item => item.id} />
        )}
      </div>

      <div className="flex-shrink-0 text-sm text-slate-500">共 {filteredData.length} 条记录</div>
    </div>
  );
}
