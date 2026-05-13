"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateCaches } from "@/lib/cache-client";
import { createSalesOutbound, getInventoryRecords, updateInventory, updateSalesOrder } from "@/lib/api-client";
import type { Inventory } from "@/types/inventory";
import type { SalesOrder, SalesOutboundRecord } from "@/types/sales";

interface StorageClientProps {
  orders: SalesOrder[];
  inventories: Inventory[];
  outbounds: SalesOutboundRecord[];
}

export function StorageClient({ orders, inventories, outbounds }: StorageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedOrderNo, setSelectedOrderNo] = useState("");
  const [inventorySelections, setInventorySelections] = useState<Record<number, string>>({});
  const [outboundQuantities, setOutboundQuantities] = useState<Record<number, number>>({});
  const [inspector, setInspector] = useState("");
  const [keeper, setKeeper] = useState("");
  const [outboundDate, setOutboundDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const orderNo = searchParams.get("orderNo");
    if (orderNo && orders.some(order => order.order_no === orderNo)) {
      setSelectedOrderNo(orderNo);
      return;
    }

    if (!selectedOrderNo && orders[0]) {
      setSelectedOrderNo(orders[0].order_no);
    }
  }, [orders, searchParams, selectedOrderNo]);

  const pendingOrders = useMemo(() => {
    return orders.filter(order => order.status === "已审核" || order.status === "部分出库");
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return orders.find(order => order.order_no === selectedOrderNo) ?? null;
  }, [orders, selectedOrderNo]);

  const getMatchingInventories = (detailId: number) => {
    const detail = selectedOrder?.salesDetails.find(item => item.id === detailId);
    if (!detail) {
      return [];
    }

    return inventories.filter(
      inventory =>
        inventory.quantity > 0 &&
        inventory.drugApprovalNo === detail.drugApprovalNo &&
        inventory.production_date === detail.production_date &&
        inventory.manufacturerApprovalNo === detail.manufacturerApprovalNo
    );
  };

  const getAlreadyOutbound = (detailId: number) => {
    const detail = selectedOrder?.salesDetails.find(item => item.id === detailId);
    if (!detail || !selectedOrder) {
      return 0;
    }

    return outbounds
      .filter(
        outbound =>
          outbound.orderNo === selectedOrder.order_no &&
          outbound.drugApprovalNo === detail.drugApprovalNo &&
          outbound.production_date === detail.production_date &&
          outbound.manufacturerApprovalNo === detail.manufacturerApprovalNo
      )
      .reduce((sum, outbound) => sum + outbound.quantity, 0);
  };

  const handleSubmitOutbound = async () => {
    if (!selectedOrder) {
      alert("请选择销售单");
      return;
    }

    const entries = selectedOrder.salesDetails
      .map(detail => ({
        detail,
        quantity: outboundQuantities[detail.id] || 0,
        inventoryId: inventorySelections[detail.id] || ""
      }))
      .filter(entry => entry.quantity > 0);

    if (!entries.length) {
      alert("请至少填写一条出库数量");
      return;
    }

    const currentInventories = await getInventoryRecords();
    const inventoryMap = new Map(currentInventories.map(item => [String(item.id), item]));

    for (const entry of entries) {
      const alreadyOutbound = getAlreadyOutbound(entry.detail.id);
      const remainingQuantity = Math.max(entry.detail.quantity - alreadyOutbound, 0);

      if (entry.quantity > remainingQuantity) {
        alert(`${entry.detail.drug_name} 的本次出库数量不能大于剩余待出库数量`);
        return;
      }

      if (!entry.inventoryId) {
        alert(`请选择 ${entry.detail.drug_name} 的库存来源`);
        return;
      }

      const matchedInventory = inventoryMap.get(entry.inventoryId);
      if (!matchedInventory) {
        alert(`未找到 ${entry.detail.drug_name} 对应的库存记录`);
        return;
      }

      if (entry.quantity > matchedInventory.quantity) {
        alert(`${entry.detail.drug_name} 的出库数量不能大于当前库存`);
        return;
      }
    }

    setSubmitting(true);
    try {
      for (const entry of entries) {
        const matchedInventory = inventoryMap.get(entry.inventoryId)!;

        await createSalesOutbound({
          warehouse_code: matchedInventory.warehouse_code,
          location_code: matchedInventory.location_code,
          orderNo: selectedOrder.order_no,
          outbound_date: outboundDate,
          institutionApprovalNo: selectedOrder.institutionApprovalNo,
          manufacturerApprovalNo: entry.detail.manufacturerApprovalNo,
          drugApprovalNo: entry.detail.drugApprovalNo,
          drug_name: entry.detail.drug_name,
          production_date: entry.detail.production_date,
          quantity: entry.quantity,
          salesperson: selectedOrder.salesperson,
          inspector,
          keeper
        });

        const updatedInventory = await updateInventory(matchedInventory.id, {
          quantity: Math.max(matchedInventory.quantity - entry.quantity, 0)
        });

        inventoryMap.set(entry.inventoryId, updatedInventory);
      }

      const allComplete = selectedOrder.salesDetails.every(detail => {
        const currentOutbound = getAlreadyOutbound(detail.id);
        const newOutbound = entries
          .filter(entry => entry.detail.id === detail.id)
          .reduce((sum, entry) => sum + entry.quantity, 0);
        return currentOutbound + newOutbound >= detail.quantity;
      });

      await updateSalesOrder(selectedOrder.order_no, {
        status: allComplete ? "全部出库" : "部分出库"
      });

      await revalidateCaches([CACHE_TAGS.salesOrders, CACHE_TAGS.salesOutbounds, CACHE_TAGS.inventories]);
      alert("销售出库已完成");
      setInventorySelections({});
      setOutboundQuantities({});
      router.refresh();
    } catch (error) {
      console.error("销售出库失败:", error);
      alert(`出库失败：${(error as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden p-6">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">销售出库</h1>
          <p className="text-sm text-slate-500">为已审核的销售单选择库存并执行出库</p>
        </div>
        <Button
          className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:from-teal-600 hover:to-cyan-600"
          disabled={submitting}
          onClick={() => void handleSubmitOutbound()}
        >
          {submitting ? "出库中..." : "确认出库"}
        </Button>
      </div>

      <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">销售单</span>
            <Select value={selectedOrderNo} onValueChange={setSelectedOrderNo}>
              <SelectTrigger className="h-8 w-64">
                <SelectValue placeholder="请选择销售单" />
              </SelectTrigger>
              <SelectContent>
                {pendingOrders.map(order => (
                  <SelectItem key={order.order_no} value={order.order_no}>
                    {order.order_no} - {order.institution_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedOrder && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">销售日期</span>
                <span className="text-sm">{selectedOrder.sales_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">销售员</span>
                <span className="text-sm">{selectedOrder.salesperson}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">状态</span>
                <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20">
                  {selectedOrder.status}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/40 dark:bg-slate-800/60">
        {!selectedOrder ? (
          <EmptyState title="请选择销售单" description="请先从上方选择需要出库的销售单" />
        ) : selectedOrder.salesDetails.length === 0 ? (
          <EmptyState title="暂无药品明细" description="该销售单没有可出库的药品明细" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200">药品名称</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200">生产日期</th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">销售量</th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">已出库</th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">剩余待出</th>
                <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">库存来源</th>
                <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">当前库存</th>
                <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">本次出库</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {selectedOrder.salesDetails.map(detail => {
                const matchedInventories = getMatchingInventories(detail.id);
                const selectedInventoryId = inventorySelections[detail.id] || "";
                const selectedInventory =
                  matchedInventories.find(item => String(item.id) === selectedInventoryId) ?? null;
                const alreadyOutbound = getAlreadyOutbound(detail.id);
                const remainingQuantity = Math.max(detail.quantity - alreadyOutbound, 0);

                return (
                  <tr key={detail.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-4 py-3 font-medium">{detail.drug_name}</td>
                    <td className="px-4 py-3 text-slate-600">{detail.production_date}</td>
                    <td className="px-4 py-3 text-right font-mono">{detail.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{alreadyOutbound}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-600">{remainingQuantity}</td>
                    <td className="px-4 py-3 text-center">
                      <Select
                        value={selectedInventoryId}
                        onValueChange={value => setInventorySelections(prev => ({ ...prev, [detail.id]: value }))}
                      >
                        <SelectTrigger className="h-8 w-72">
                          <SelectValue placeholder="选择库存批次" />
                        </SelectTrigger>
                        <SelectContent>
                          {matchedInventories.map(inventory => (
                            <SelectItem key={inventory.id} value={String(inventory.id)}>
                              {inventory.warehouse.name} / {inventory.location_code} / {inventory.batch_no || "无批号"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {selectedInventory?.quantity.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        className="h-8 w-20 text-center"
                        value={outboundQuantities[detail.id] || ""}
                        min={0}
                        max={Math.min(remainingQuantity, selectedInventory?.quantity || remainingQuantity)}
                        onChange={e =>
                          setOutboundQuantities(prev => ({
                            ...prev,
                            [detail.id]: Number(e.target.value) || 0
                          }))
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-500 dark:text-slate-400">检验员</span>
            <Input className="h-8 flex-1" value={inspector} onChange={e => setInspector(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-500 dark:text-slate-400">保管员</span>
            <Input className="h-8 flex-1" value={keeper} onChange={e => setKeeper(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-500 dark:text-slate-400">出库日期</span>
            <Input
              type="date"
              className="h-8 flex-1"
              value={outboundDate}
              onChange={e => setOutboundDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
