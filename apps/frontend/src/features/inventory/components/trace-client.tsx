"use client";

import { useMemo, useState } from "react";
import { Package, Search, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import type { Inventory } from "@/types/inventory";
import type { PurchaseOrder, PurchaseStorage } from "@/types/purchase";
import type { SalesOrder, SalesOutboundRecord } from "@/types/sales";

interface TraceClientProps {
  inventories: Inventory[];
  purchaseOrders: PurchaseOrder[];
  purchaseStorages: PurchaseStorage[];
  salesOrders: SalesOrder[];
  salesOutbounds: SalesOutboundRecord[];
}

function getDaysRemaining(expiryDate: string) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function TraceClient({
  inventories,
  purchaseOrders,
  purchaseStorages,
  salesOrders,
  salesOutbounds
}: TraceClientProps) {
  const [batchNo, setBatchNo] = useState("");
  const [searchedBatch, setSearchedBatch] = useState<string | null>(null);

  const purchaseOrderMap = useMemo(() => {
    return new Map(purchaseOrders.map(order => [order.order_no, order]));
  }, [purchaseOrders]);

  const salesOrderMap = useMemo(() => {
    return new Map(salesOrders.map(order => [order.order_no, order]));
  }, [salesOrders]);

  const matchedInventories = useMemo(() => {
    if (!searchedBatch) {
      return [];
    }

    return inventories.filter(item => item.batch_no === searchedBatch);
  }, [inventories, searchedBatch]);

  const inventory = matchedInventories[0] ?? null;

  const purchaseRecords = useMemo(() => {
    if (!searchedBatch) {
      return [];
    }

    return purchaseStorages
      .filter(storage => storage.batch_no === searchedBatch)
      .map(storage => ({
        storage,
        order: purchaseOrderMap.get(storage.orderNo) ?? null
      }))
      .sort((a, b) => new Date(b.storage.storage_date).getTime() - new Date(a.storage.storage_date).getTime());
  }, [purchaseOrderMap, purchaseStorages, searchedBatch]);

  const salesRecords = useMemo(() => {
    if (!inventory || matchedInventories.length === 0) {
      return [];
    }

    const inventoryLocationKeys = new Set(
      matchedInventories.map(item => `${item.warehouse_code}|${item.location_code}`)
    );

    return salesOutbounds
      .filter(outbound => {
        const sameBatchIdentity =
          outbound.drugApprovalNo === inventory.drugApprovalNo &&
          outbound.manufacturerApprovalNo === inventory.manufacturerApprovalNo &&
          outbound.production_date === inventory.production_date;

        const sameLocation = inventoryLocationKeys.has(`${outbound.warehouse_code}|${outbound.location_code}`);

        return sameBatchIdentity && sameLocation;
      })
      .map(outbound => ({
        outbound,
        order: salesOrderMap.get(outbound.orderNo) ?? null
      }))
      .sort((a, b) => new Date(b.outbound.outbound_date).getTime() - new Date(a.outbound.outbound_date).getTime());
  }, [inventory, matchedInventories, salesOrderMap, salesOutbounds]);

  const handleSearch = () => {
    if (batchNo.trim()) {
      setSearchedBatch(batchNo.trim());
    }
  };

  const totalQuantity = matchedInventories.reduce((sum, item) => sum + item.quantity, 0);
  const locationSummary = matchedInventories
    .map(item => `${item.warehouse.name} / ${item.location_code}`)
    .filter((value, index, array) => array.indexOf(value) === index);

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden p-6">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">批次跟踪</h1>
          <p className="text-sm text-slate-500">追踪药品批次的采购入库、当前库存和销售出库记录</p>
        </div>
      </div>

      <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">批号：</span>
            <Input
              className="h-8 w-48"
              placeholder="输入批号进行查询"
              value={batchNo}
              onChange={e => setBatchNo(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
          <Button size="sm" onClick={handleSearch}>
            <Search className="mr-1 h-4 w-4" />
            查询
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!searchedBatch ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="请输入批号进行查询"
                description="输入药品批号以查看该批次的库存、采购和销售记录"
                icon={<Search className="h-12 w-12 text-slate-400" />}
              />
            </CardContent>
          </Card>
        ) : !inventory ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="未找到该批次"
                description={`未找到批号为“${searchedBatch}”的库存记录`}
                icon={<Package className="h-12 w-12 text-slate-400" />}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  批次概览
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
                    <p className="text-sm text-slate-500">有效期至</p>
                    <p className="font-medium">{inventory.expiry_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">剩余天数</p>
                    <p
                      className={`font-bold ${getDaysRemaining(inventory.expiry_date) <= 90 ? "text-amber-600" : "text-emerald-600"}`}
                    >
                      {getDaysRemaining(inventory.expiry_date)} 天
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">当前库存</p>
                    <p className="font-bold text-teal-600">{totalQuantity.toLocaleString()} 盒</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">批号</p>
                    <p className="font-mono text-sm">{inventory.batch_no || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">所在库位</p>
                    <p className="text-sm">{locationSummary.join("、")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5" />
                  采购记录
                </CardTitle>
                <CardDescription>按批号精确匹配采购入库记录</CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseRecords.length === 0 ? (
                  <EmptyState
                    title="暂无采购记录"
                    description="该批次暂无采购入库记录"
                    icon={<Truck className="h-10 w-10 text-slate-400" />}
                  />
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">采购单号</th>
                          <th className="px-4 py-3 text-left font-semibold">供应商</th>
                          <th className="px-4 py-3 text-left font-semibold">入库日期</th>
                          <th className="px-4 py-3 text-right font-semibold">数量</th>
                          <th className="px-4 py-3 text-left font-semibold">仓库 / 货位</th>
                          <th className="px-4 py-3 text-left font-semibold">操作人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                        {purchaseRecords.map(({ storage, order }) => (
                          <tr key={storage.id}>
                            <td className="px-4 py-3 font-mono text-teal-600">{storage.orderNo}</td>
                            <td className="px-4 py-3">{order?.manufacturer_name || "-"}</td>
                            <td className="px-4 py-3 text-slate-600">{storage.storage_date}</td>
                            <td className="px-4 py-3 text-right font-mono">{storage.quantity}</td>
                            <td className="px-4 py-3">
                              {storage.warehouse_code} / {storage.location_code}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {storage.inspector || storage.purchaser || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  销售记录
                </CardTitle>
                <CardDescription>根据药品、生产日期和库位关联销售出库记录</CardDescription>
              </CardHeader>
              <CardContent>
                {salesRecords.length === 0 ? (
                  <EmptyState
                    title="暂无销售记录"
                    description="该批次暂无匹配的销售出库记录"
                    icon={<ShoppingCart className="h-10 w-10 text-slate-400" />}
                  />
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      当前销售出库接口未返回批号字段，这里按同一药品、生产日期、生产企业和库位进行追溯匹配。
                    </p>
                    <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">销售单号</th>
                            <th className="px-4 py-3 text-left font-semibold">客户</th>
                            <th className="px-4 py-3 text-left font-semibold">出库日期</th>
                            <th className="px-4 py-3 text-right font-semibold">数量</th>
                            <th className="px-4 py-3 text-left font-semibold">仓库 / 货位</th>
                            <th className="px-4 py-3 text-left font-semibold">操作人</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                          {salesRecords.map(({ outbound, order }) => (
                            <tr key={outbound.id}>
                              <td className="px-4 py-3 font-mono text-teal-600">{outbound.orderNo}</td>
                              <td className="px-4 py-3">{order?.institution_name || "-"}</td>
                              <td className="px-4 py-3 text-slate-600">{outbound.outbound_date}</td>
                              <td className="px-4 py-3 text-right font-mono">{outbound.quantity}</td>
                              <td className="px-4 py-3">
                                {outbound.warehouse_code} / {outbound.location_code}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {outbound.inspector || outbound.keeper || outbound.salesperson || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
