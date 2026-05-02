"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { exportToExcel } from "@/lib/excel-export";
import { Loader2 } from "lucide-react";
import * as echarts from "echarts";
import type { PurchaseOrder, PurchaseReport } from "@/types/purchase";

interface PurchaseReportClientProps {
  orders: PurchaseOrder[];
}

export default function PurchaseReportClient({ orders }: PurchaseReportClientProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [dimension, setDimension] = useState("month");
  const [year, setYear] = useState("");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [exporting, setExporting] = useState(false);

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    orders.forEach(order => {
      const date = new Date(order.order_date);
      const yearStr = date.getFullYear().toString();
      yearSet.add(yearStr);
    });
    const sortedYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
    return sortedYears;
  }, [orders]);

  const reportData = useMemo(() => {
    const data: PurchaseReport[] = [];
    const monthMap = new Map<string, { orders: Set<string>; purchase: number; storage: number }>();

    orders.forEach(order => {
      const date = new Date(order.order_date);
      const yearStr = date.getFullYear().toString();
      const monthKey = `${yearStr}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { orders: new Set(), purchase: 0, storage: 0 });
      }

      const monthData = monthMap.get(monthKey)!;
      monthData.orders.add(order.order_no);
      monthData.purchase += parseFloat(order.total_amount) || 0;

      if (order.purchaseStorages) {
        order.purchaseStorages.forEach(storage => {
          const detail = order.purchaseDetails?.find(d => d.drugApprovalNo === storage.drugApprovalNo);
          if (detail) {
            monthData.storage += storage.quantity * parseFloat(detail.unit_price);
          }
        });
      }
    });

    const sortedMonths = Array.from(monthMap.keys()).sort();
    sortedMonths.forEach(month => {
      const monthData = monthMap.get(month)!;
      data.push({
        month,
        order_count: monthData.orders.size,
        purchase_amount: monthData.purchase,
        storage_amount: monthData.storage,
        return_amount: 0
      });
    });

    return data;
  }, [orders]);

  const chartData = useMemo(() => {
    return reportData
      .filter(d => !year || d.month.startsWith(year))
      .map(d => ({
        month: d.month,
        amount: d.purchase_amount / 1000
      }));
  }, [reportData, year]);

  useEffect(() => {
    if (years.length > 0 && !year) {
      setYear(years[0]);
    }
  }, [years, year]);

  useEffect(() => {
    if (viewMode !== "chart") {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
      return;
    }

    if (!chartRef.current || chartData.length === 0) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    }

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: "#334155",
          fontSize: 13
        },
        formatter: (params: unknown) => {
          const data = params as { name: string; value: number; marker: string }[];
          if (!data || data.length === 0) return "";
          const item = data[0];
          return `
                        <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${item.name}</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${item.marker}
                            <span style="color: #64748b;">采购金额：</span>
                            <span style="font-weight: 600; color: #14b8a6;">¥${(item.value * 1000).toLocaleString()}</span>
                        </div>
                    `;
        }
      },
      grid: {
        left: "4%",
        right: "4%",
        bottom: "8%",
        top: "12%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: chartData.map(d => d.month),
        axisLine: {
          lineStyle: { color: "#e2e8f0", width: 2 }
        },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748b",
          fontSize: 12,
          margin: 16
        }
      },
      yAxis: {
        type: "value",
        name: "金额（千元）",
        nameTextStyle: {
          color: "#94a3b8",
          fontSize: 12,
          padding: [0, 0, 0, -20]
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: "#f1f5f9",
            type: "dashed"
          }
        },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 12
        }
      },
      series: [
        {
          name: "采购金额",
          type: "bar",
          barWidth: "40%",
          data: chartData.map(d => d.amount),
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#14b8a6" },
              { offset: 1, color: "#0d9488" }
            ]),
            shadowColor: "rgba(20, 184, 166, 0.3)",
            shadowBlur: 10,
            shadowOffsetY: 4
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#2dd4bf" },
                { offset: 1, color: "#14b8a6" }
              ])
            }
          },
          label: {
            show: true,
            position: "top",
            color: "#64748b",
            fontSize: 11,
            fontWeight: 500,
            formatter: "{c}"
          }
        }
      ]
    };

    chartInstance.current.setOption(option, true);

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [chartData, viewMode]);

  const handleViewModeChange = (mode: "chart" | "table") => {
    if (mode !== viewMode && chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }
    setViewMode(mode);
  };

  const tableData = useMemo(() => {
    return reportData.filter(d => !year || d.month.startsWith(year));
  }, [reportData, year]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel({
        reportType: "purchase_report",
        reportLabel: `采购报表${year ? `_${year}年` : ""}`,
        rawData: tableData.map(d => ({
          month: d.month,
          orderCount: d.order_count,
          purchaseAmount: d.purchase_amount,
          storageAmount: d.storage_amount,
          returnAmount: d.return_amount
        }))
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">采购报表</h1>
          <p className="text-sm text-slate-500">采购数据统计分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Button
              variant={viewMode === "chart" ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-4 ${viewMode === "chart" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
              onClick={() => handleViewModeChange("chart")}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              图表
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className={`h-8 px-4 ${viewMode === "table" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
              onClick={() => handleViewModeChange("table")}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              表格
            </Button>
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
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">统计维度：</span>
            <Select value={dimension} onValueChange={setDimension}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">按月</SelectItem>
                <SelectItem value="quarter">按季</SelectItem>
                <SelectItem value="year">按年</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">时间范围：</span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue placeholder="选择年份" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>
                    {y}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4 overflow-hidden">
        {viewMode === "chart" ? (
          <>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              采购金额趋势图{year ? `（${year}年）` : ""}
            </h3>
            {chartData.length > 0 ? (
              <div ref={chartRef} className="w-full h-[calc(100%-2rem)]" />
            ) : (
              <EmptyState title="暂无图表数据" description="当前筛选条件下没有采购数据" />
            )}
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              采购明细数据{year ? `（${year}年）` : ""}
            </h3>
            {tableData.length > 0 ? (
              <div className="h-[calc(100%-2rem)] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        月份
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        采购单数
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        采购金额
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        入库金额
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        退货金额
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {tableData.map(item => (
                      <tr key={item.month} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                        <td className="px-4 py-3 font-medium">{item.month}</td>
                        <td className="px-4 py-3 text-right">{item.order_count}</td>
                        <td className="px-4 py-3 text-right font-mono text-teal-600">
                          ¥{item.purchase_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">¥{item.storage_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono">¥{item.return_amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="暂无报表数据" description="当前筛选条件下没有采购数据" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
