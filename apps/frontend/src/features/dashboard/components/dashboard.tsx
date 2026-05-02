"use client";

import { useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import ReactECharts from "echarts-for-react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  PackageOpen,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  Package
} from "lucide-react";
import type { DashboardStats } from "@/features/dashboard/server/dashboard-server";

interface DashboardProps {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

export default function Dashboard({ stats }: DashboardProps) {
  const salesChartRef = useRef<ReactECharts>(null);
  const warehouseChartRef = useRef<ReactECharts>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      salesChartRef.current?.getEchartsInstance()?.resize();
      warehouseChartRef.current?.getEchartsInstance()?.resize();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const statCards: StatCard[] = useMemo(
    () => [
      {
        label: "今日销售额",
        value: formatCurrency(stats.todaySales),
        change: stats.salesChange,
        icon: <TrendingUp className="w-5 h-5" />,
        color: "from-emerald-500 to-teal-500"
      },
      {
        label: "今日采购额",
        value: formatCurrency(stats.todayPurchase),
        change: stats.purchaseChange,
        icon: <ShoppingCart className="w-5 h-5" />,
        color: "from-blue-500 to-cyan-500"
      },
      {
        label: "总库存金额",
        value: formatCurrency(stats.totalInventory),
        change: 0,
        icon: <PackageOpen className="w-5 h-5" />,
        color: "from-violet-500 to-purple-500"
      },
      {
        label: "待处理采购",
        value: stats.pendingPurchase.toString(),
        change: 0,
        icon: <PackageOpen className="w-5 h-5" />,
        color: "from-amber-500 to-orange-500"
      },
      {
        label: "待处理销售",
        value: stats.pendingSales.toString(),
        change: 0,
        icon: <Truck className="w-5 h-5" />,
        color: "from-rose-500 to-red-500"
      }
    ],
    [stats]
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
  }, []);

  const salesChartOption = useMemo(
    () => ({
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        textStyle: { color: "#fff" },
        axisPointer: {
          type: "shadow",
          shadowStyle: { color: "rgba(20, 184, 166, 0.1)" }
        },
        formatter: (params: { name: string; value: number }[]) => {
          const data = params[0];
          return `${data.name}<br/>销售额: ¥${data.value.toLocaleString()}`;
        }
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "0%",
        top: "3%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: weekDays,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#94a3b8", fontSize: 11 }
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.1)" } },
        axisLabel: { color: "#94a3b8", fontSize: 11 }
      },
      series: [
        {
          data: stats.salesTrend,
          type: "bar",
          barWidth: "50%",
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#14b8a6" },
                { offset: 1, color: "#06b6d4" }
              ]
            }
          },
          emphasis: {
            itemStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#2dd4bf" },
                  { offset: 1, color: "#22d3ee" }
                ]
              }
            }
          }
        }
      ]
    }),
    [stats.salesTrend, weekDays]
  );

  const warehouseChartOption = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        textStyle: { color: "#fff" },
        formatter: "{b}: {c}%"
      },
      legend: {
        orient: "vertical",
        right: "5%",
        top: "center",
        textStyle: { color: "#64748b", fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          center: ["35%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: "#fff",
            borderWidth: 2
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: "bold", color: "#1e293b" }
          },
          labelLine: { show: false },
          data: stats.warehouseDistribution.map((item, index) => ({
            value: item.percent,
            name: item.name,
            itemStyle: {
              color: ["#14b8a6", "#3b82f6", "#8b5cf6"][index % 3]
            }
          }))
        }
      ]
    }),
    [stats.warehouseDistribution]
  );

  const renderEmptyState = (text: string) => (
    <div className="h-[220px] flex flex-col items-center justify-center gap-2">
      <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      <span className="text-sm text-slate-400 dark:text-slate-500">{text}</span>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 bg-gradient-to-br from-slate-50/80 via-white/50 to-slate-50/60 dark:from-slate-950/90 dark:via-slate-900/70 dark:to-slate-950/90">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map(card => (
          <div
            key={card.label}
            className="group relative p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/20 transition-all duration-300"
          >
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}
            />
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>{card.icon}</div>
              {card.change !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                    card.change > 0
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  }`}
                >
                  {card.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(card.change)}%
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-6 h-[300px]">
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">近7天销售额趋势</h3>
          </div>
          <div className="flex-1 min-h-[200px]">
            {stats.salesTrend.length === 0 || stats.salesTrend.every(v => v === 0) ? (
              renderEmptyState("暂无销售数据")
            ) : (
              <ReactECharts
                ref={salesChartRef}
                option={salesChartOption}
                style={{ height: "100%", width: "100%" }}
                opts={{ renderer: "svg" }}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-3 p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">热销药品 TOP5</h3>
            </div>
            <Link
              href="/reports"
              className="text-[11px] text-teal-500 hover:text-teal-600 flex items-center gap-0.5 transition-colors"
            >
              查看详情 <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.topDrugs.length === 0 ? (
            renderEmptyState("暂无销售数据")
          ) : (
            <div className="space-y-3">
              {stats.topDrugs.map((drug, index) => {
                const maxAmount = stats.topDrugs[0]?.amount || 1;
                const percentage = (drug.amount / maxAmount) * 100;
                return (
                  <div key={drug.name} className="group relative">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors relative z-10">
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
                          index === 0
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20"
                            : index === 1
                              ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-400/20"
                              : index === 2
                                ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{drug.name}</p>
                          <span className="text-sm font-bold text-slate-800 dark:text-white shrink-0 ml-2">
                            {formatCurrency(drug.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                index === 0
                                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                  : index === 1
                                    ? "bg-gradient-to-r from-slate-300 to-slate-400"
                                    : index === 2
                                      ? "bg-gradient-to-r from-amber-600 to-amber-700"
                                      : "bg-slate-300 dark:bg-slate-600"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {drug.quantity.toLocaleString()}盒
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">各仓库库存占比</h3>
          </div>
          <div className="flex-1 min-h-[200px]">
            {stats.warehouseDistribution.length === 0 ? (
              renderEmptyState("暂无仓库数据")
            ) : (
              <ReactECharts
                ref={warehouseChartRef}
                option={warehouseChartOption}
                style={{ height: "100%", width: "100%" }}
                opts={{ renderer: "svg" }}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">过期预警</h3>
            </div>
            <Link
              href="/reports?tab=inventory"
              className="text-[11px] text-teal-500 hover:text-teal-600 flex items-center gap-0.5 transition-colors"
            >
              查看全部 <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {stats.expiryWarnings.length === 0 ? (
            renderEmptyState("暂无过期预警")
          ) : (
            <div className="overflow-auto max-h-[280px] -mx-5 px-5">
              <div className="space-y-2">
                {stats.expiryWarnings.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      item.isExpired
                        ? "bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                        : item.daysLeft <= 7
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30"
                          : "bg-slate-50/50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/30"
                    }`}
                  >
                    <div
                      className={`w-1 h-10 rounded-full shrink-0 ${
                        item.isExpired
                          ? "bg-red-400"
                          : item.daysLeft <= 7
                            ? "bg-amber-400"
                            : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.name}</p>
                        <code className="text-[10px] bg-slate-200/50 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
                          {item.batchNo}
                        </code>
                      </div>
                      <p className="text-[11px] text-slate-400">有效期至 {item.expiryDate}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${
                        item.isExpired
                          ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                          : item.daysLeft <= 7
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {item.isExpired ? `已过期${Math.abs(item.daysLeft)}天` : `${item.daysLeft}天`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
