"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Search, Package, ShoppingCart, Truck } from "lucide-react";
import type { Inventory } from "@/types/inventory";

interface TraceClientProps {
  inventories: Inventory[];
}

export function TraceClient({ inventories }: TraceClientProps) {
  const [batchNo, setBatchNo] = useState("");
  const [searchedBatch, setSearchedBatch] = useState<string | null>(null);

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const inventory = useMemo(() => {
    if (!searchedBatch) return null;
    return inventories.find(item => item.batch_no === searchedBatch) || null;
  }, [inventories, searchedBatch]);

  const handleSearch = () => {
    if (batchNo.trim()) {
      setSearchedBatch(batchNo.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">批次跟踪</h1>
          <p className="text-sm text-slate-500">追踪药品批次的采购和销售记录</p>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">批号：</span>
            <Input
              className="w-48 h-8"
              placeholder="输入批号进行查询"
              value={batchNo}
              onChange={e => setBatchNo(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button size="sm" onClick={handleSearch}>
            <Search className="w-4 h-4 mr-1" />
            查询
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {!searchedBatch ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="请输入批号进行查询"
                description="输入药品批号以查看该批次的详细信息"
                icon={<Search className="w-12 h-12 text-slate-400" />}
              />
            </CardContent>
          </Card>
        ) : !inventory ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="未找到该批次"
                description={`未找到批号为 "${searchedBatch}" 的药品信息`}
                icon={<Package className="w-12 h-12 text-slate-400" />}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  药品信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">药品名称</p>
                    <p className="font-medium">{inventory.drug_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">批准文号</p>
                    <p className="font-mono text-sm">{inventory.drugApprovalNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">生产日期</p>
                    <p className="font-medium">{inventory.production_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">有效期</p>
                    <p className="font-medium">{inventory.expiry_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">剩余天数</p>
                    <p
                      className={`font-bold ${
                        getDaysRemaining(inventory.expiry_date) <= 90 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {getDaysRemaining(inventory.expiry_date)}天
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">当前库存</p>
                    <p className="font-bold text-teal-600">{inventory.quantity.toLocaleString()} 盒</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">仓库</p>
                    <p className="font-medium">{inventory.warehouse.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">货位</p>
                    <code className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                      {inventory.location_code}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5" />
                  采购记录
                </CardTitle>
                <CardDescription>该批次的采购入库记录</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="暂无采购记录"
                  description="该批次暂无采购入库记录"
                  icon={<Truck className="w-10 h-10 text-slate-400" />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5" />
                  销售记录
                </CardTitle>
                <CardDescription>该批次的销售出库记录</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="暂无销售记录"
                  description="该批次暂无销售出库记录"
                  icon={<ShoppingCart className="w-10 h-10 text-slate-400" />}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
