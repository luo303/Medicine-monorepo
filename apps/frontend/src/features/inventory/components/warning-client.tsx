"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { AlertTriangle, Package, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import type { Inventory } from "@/types/inventory";

interface WarningClientProps {
  inventories: Inventory[];
}

export function WarningClient({ inventories }: WarningClientProps) {
  const [activeTab, setActiveTab] = useState("expiry");

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const expiryWarnings = useMemo(() => {
    return inventories
      .filter(item => {
        const days = getDaysRemaining(item.expiry_date);
        return days > 0 && days <= 90;
      })
      .map(item => ({
        ...item,
        days_remaining: getDaysRemaining(item.expiry_date)
      }))
      .sort((a, b) => a.days_remaining - b.days_remaining);
  }, [inventories]);

  const lowStockWarnings = useMemo(() => {
    const safetyStock = 1000;
    return inventories
      .filter(item => item.quantity < safetyStock)
      .map(item => ({
        ...item,
        safety_stock: safetyStock
      }))
      .sort((a, b) => a.quantity - b.quantity);
  }, [inventories]);

  const highStockWarnings = useMemo(() => {
    const maxStock = 5000;
    return inventories.filter(item => item.quantity > maxStock).sort((a, b) => b.quantity - a.quantity);
  }, [inventories]);

  const getExpiryStatus = (days: number) => {
    if (days <= 30) return { color: "bg-red-50 text-red-600 dark:bg-red-900/20", text: "紧急处理", icon: AlertCircle };
    if (days <= 60)
      return { color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20", text: "需关注", icon: AlertTriangle };
    return { color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20", text: "正常监控", icon: CheckCircle };
  };

  const getStockStatus = (current: number, safety: number) => {
    if (current < safety * 0.5)
      return { color: "bg-red-50 text-red-600 dark:bg-red-900/20", text: "严重不足", icon: AlertCircle };
    if (current < safety)
      return { color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20", text: "库存偏低", icon: AlertTriangle };
    return { color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20", text: "库存充足", icon: CheckCircle };
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">库存预警</h1>
          <p className="text-sm text-slate-500">监控库存异常状态</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-shrink-0 bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40">
            <TabsTrigger value="expiry" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              过期预警
              {expiryWarnings.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  {expiryWarnings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="low-stock" className="gap-2">
              <Package className="w-4 h-4" />
              低库存预警
              {lowStockWarnings.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                >
                  {lowStockWarnings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="high-stock" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              高库存预警
              {highStockWarnings.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {highStockWarnings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expiry" className="flex-1 mt-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">📅</span>
                  过期预警（3个月内过期）
                </CardTitle>
                <CardDescription>以下药品将在3个月内过期，请及时处理</CardDescription>
              </CardHeader>
              <CardContent>
                {expiryWarnings.length === 0 ? (
                  <EmptyState
                    title="暂无过期预警"
                    description="当前没有药品在3个月内过期"
                    icon={<CheckCircle className="w-12 h-12 text-emerald-500" />}
                  />
                ) : (
                  <div className="space-y-3">
                    {expiryWarnings.map(item => {
                      const status = getExpiryStatus(item.days_remaining);
                      const StatusIcon = status.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/40"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{item.drug_name}</span>
                              <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
                                {item.batch_no}
                              </code>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <span>过期日期：{item.expiry_date}</span>
                              <span>库存量：{item.quantity.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {item.days_remaining}天
                              </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${status.color}`}>
                              {status.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock" className="flex-1 mt-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">📦</span>
                  低库存预警（安全库存：1000）
                </CardTitle>
                <CardDescription>以下药品库存低于安全库存，建议及时补货</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockWarnings.length === 0 ? (
                  <EmptyState
                    title="暂无低库存预警"
                    description="所有药品库存充足"
                    icon={<CheckCircle className="w-12 h-12 text-emerald-500" />}
                  />
                ) : (
                  <div className="space-y-3">
                    {lowStockWarnings.map(item => {
                      const status = getStockStatus(item.quantity, item.safety_stock);
                      const StatusIcon = status.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/40"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{item.drug_name}</span>
                              <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
                                {item.batch_no}
                              </code>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <span>当前库存：{item.quantity.toLocaleString()}</span>
                              <span>安全库存：{item.safety_stock.toLocaleString()}</span>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${status.color}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {status.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="high-stock" className="flex-1 mt-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">📈</span>
                  高库存预警（最大库存：5000）
                </CardTitle>
                <CardDescription>以下药品库存超过最大库存，建议促销或调拨</CardDescription>
              </CardHeader>
              <CardContent>
                {highStockWarnings.length === 0 ? (
                  <EmptyState
                    title="暂无高库存预警"
                    description="所有药品库存正常"
                    icon={<CheckCircle className="w-12 h-12 text-emerald-500" />}
                  />
                ) : (
                  <div className="space-y-3">
                    {highStockWarnings.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/40"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{item.drug_name}</span>
                            <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
                              {item.batch_no}
                            </code>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>当前库存：{item.quantity.toLocaleString()}</span>
                            <span>仓库：{item.warehouse.name}</span>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          建议促销
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
