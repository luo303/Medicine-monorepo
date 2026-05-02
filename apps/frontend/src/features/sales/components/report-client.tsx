"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { exportToExcel } from "@/lib/excel-export";
import { Loader2 } from "lucide-react";
import * as echarts from "echarts";
import type { SalesOrder } from "@/types/sales";

interface ReportClientProps {
  orders: SalesOrder[];
}

type ViewMode = "chart" | "table";

export function ReportClient({ orders }: ReportClientProps) {
  const [year, setYear] = useState<string>("全部");
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    orders.forEach(order => {
      const y = order.sales_date.split("-")[0];
      if (y) yearSet.add(y);
    });
    return ["全部", ...Array.from(yearSet).sort().reverse()];
  }, [orders]);

  const monthlyData = useMemo(() => {
    const filtered = year === "全部" ? orders : orders.filter(o => o.sales_date.startsWith(year));
    const monthMap = new Map<string, { orderCount: number; salesAmount: number; costAmount: number }>();

    filtered.forEach(order => {
      const month = order.sales_date.substring(0, 7);
      const current = monthMap.get(month) || { orderCount: 0, salesAmount: 0, costAmount: 0 };
      current.orderCount += 1;
      current.salesAmount += parseFloat(order.total_amount);
      current.costAmount += parseFloat(order.total_amount) * 0.66;
      monthMap.set(month, current);
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        ...data,
        profit: data.salesAmount - data.costAmount,
        profitRate: (((data.salesAmount - data.costAmount) / data.salesAmount) * 100).toFixed(1)
      }));
  }, [orders, year]);

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode !== viewMode && chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }
    setViewMode(mode);
  };

  const initChart = useCallback(() => {
    if (!chartRef.current || monthlyData.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    chartInstance.current = chart;

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: "#334155", fontSize: 13 },
        formatter: (params: any) => {
          const data = params[0];
          const monthData = monthlyData.find(m => m.month === data.name);
          if (!monthData) return "";
          return `
                        <div style="font-weight: 600; margin-bottom: 8px;">${data.name}</div>
                        <div style="display: flex; justify-content: space-between; gap: 24px;">
                            <span style="color: #64748b;">销售额</span>
                            <span style="font-weight: 500;">¥${monthData.salesAmount.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 24px;">
                            <span style="color: #64748b;">成本</span>
                            <span style="font-weight: 500;">¥${monthData.costAmount.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 24px;">
                            <span style="color: #64748b;">毛利</span>
                            <span style="font-weight: 500; color: #14b8a6;">¥${monthData.profit.toLocaleString()}</span>
                        </div>
                    `;
        }
      },
      grid: { left: "4%", right: "4%", bottom: "8%", top: "12%", containLabel: true },
      xAxis: {
        type: "category",
        data: monthlyData.map(d => d.month),
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisLabel: { color: "#64748b", fontSize: 12 },
        axisTick: { show: false }
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisLabel: {
          color: "#64748b",
          fontSize: 12,
          formatter: (value: number): string => (value >= 1000 ? `${value / 1000}K` : String(value))
        },
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } }
      },
      series: [
        {
          name: "销售额",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          data: monthlyData.map(d => d.salesAmount),
          lineStyle: { width: 3, color: "#14b8a6" },
          itemStyle: { color: "#14b8a6", borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(20, 184, 166, 0.3)" },
              { offset: 1, color: "rgba(20, 184, 166, 0.05)" }
            ])
          }
        },
        {
          name: "成本",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: monthlyData.map(d => d.costAmount),
          lineStyle: { width: 2, color: "#f97316", type: "dashed" },
          itemStyle: { color: "#f97316", borderWidth: 2 }
        }
      ]
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [monthlyData]);

  useEffect(() => {
    if (viewMode === "chart") {
      const timer = setTimeout(initChart, 100);
      return () => {
        clearTimeout(timer);
        if (chartInstance.current) {
          chartInstance.current.dispose();
          chartInstance.current = null;
        }
      };
    }
  }, [viewMode, initChart]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToExcel({
        reportType: "sales_report",
        reportLabel: `销售报表${year === "全部" ? "" : `_${year}年`}`,
        rawData: monthlyData
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">销售报表</h1>
          <p className="text-sm text-slate-500">销售数据统计分析</p>
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
            <Select value="按月" onValueChange={() => {}}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="按月">按月</SelectItem>
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
                    {y === "全部" ? "全部" : `${y}年`}
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
              销售金额趋势图{year !== "全部" ? `（${year}年）` : ""}
            </h3>
            {monthlyData.length > 0 ? (
              <div ref={chartRef} className="w-full h-[calc(100%-2rem)]" />
            ) : (
              <EmptyState title="暂无图表数据" description="当前筛选条件下没有销售数据" />
            )}
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              销售明细数据{year !== "全部" ? `（${year}年）` : ""}
            </h3>
            {monthlyData.length > 0 ? (
              <div className="h-[calc(100%-2rem)] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr>
                      <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        月份
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        销售单数
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        销售额
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        成本
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        毛利
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        毛利率
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {monthlyData.map(data => (
                      <tr key={data.month} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                        <td className="px-4 py-3 font-medium">{data.month}</td>
                        <td className="px-4 py-3 text-right">{data.orderCount}</td>
                        <td className="px-4 py-3 text-right font-mono text-teal-600">
                          ¥{data.salesAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">¥{data.costAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-teal-600">
                          ¥{data.profit.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20">
                            {data.profitRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="暂无报表数据" description="当前筛选条件下没有销售数据" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
