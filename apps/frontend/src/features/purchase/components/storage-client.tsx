"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateCaches } from "@/lib/cache-client";
import { submitPurchaseStorage } from "@/lib/api-client";
import type { StorageLocation, Warehouse } from "@/types/basic-data";
import type { PurchaseDetail, PurchaseOrder } from "@/types/purchase";

interface PurchaseStorageClientProps {
  orders: PurchaseOrder[];
  warehouses: Warehouse[];
  storageLocations: StorageLocation[];
}

export default function PurchaseStorageClient({ orders, warehouses, storageLocations }: PurchaseStorageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>(orders[0]?.order_no || "");
  const [storageDate, setStorageDate] = useState(new Date().toISOString().split("T")[0]);
  const [inspector, setInspector] = useState("");
  const [keeper, setKeeper] = useState("");
  const [storageQuantities, setStorageQuantities] = useState<Record<number, number>>({});
  const [batchNumbers, setBatchNumbers] = useState<Record<number, string>>({});
  const [locationSelections, setLocationSelections] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const orderNo = searchParams.get("orderNo");
    if (orderNo && orders.some(order => order.order_no === orderNo)) {
      setSelectedOrderNo(orderNo);
    }
  }, [orders, searchParams]);

  const selectedOrder = useMemo(() => {
    return orders.find(order => order.order_no === selectedOrderNo) ?? null;
  }, [orders, selectedOrderNo]);

  const warehouseCodeById = useMemo(() => {
    return new Map(warehouses.map(warehouse => [warehouse.id, warehouse.code]));
  }, [warehouses]);

  const locationOptions = useMemo(() => {
    return storageLocations
      .map(location => {
        const warehouseCode = warehouseCodeById.get(location.warehouseId);
        if (!warehouseCode) {
          return null;
        }

        return {
          value: `${warehouseCode}|${location.code}`,
          label: `${warehouseCode} / ${location.code}`
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [storageLocations, warehouseCodeById]);
  const hasLocationOptions = locationOptions.length > 0;

  const details = selectedOrder?.purchaseDetails ?? [];
  const existingStorages = selectedOrder?.purchaseStorages ?? [];

  const getStoredQuantity = (detail: PurchaseDetail) => {
    return existingStorages
      .filter(
        storage =>
          storage.drugApprovalNo === detail.drugApprovalNo && storage.production_date === detail.production_date
      )
      .reduce((sum, storage) => sum + storage.quantity, 0);
  };

  const handleSubmitStorage = async () => {
    if (!selectedOrder) {
      alert("请选择采购单");
      return;
    }

    if (!hasLocationOptions) {
      alert("暂无可用货位，请先维护仓库货位基础数据");
      return;
    }

    const normalizedInspector = inspector.trim();
    if (!normalizedInspector) {
      alert("请输入检验员");
      return;
    }

    const normalizedKeeper = keeper.trim();
    if (!normalizedKeeper) {
      alert("请输入保管员");
      return;
    }

    const entries = details
      .map(detail => ({
        detail,
        quantity: storageQuantities[detail.id] || 0,
        locationValue: locationSelections[detail.id] || "",
        batchNo: batchNumbers[detail.id]?.trim() || ""
      }))
      .filter(item => item.quantity > 0);

    if (!entries.length) {
      alert("请至少填写一条入库数量");
      return;
    }

    for (const entry of entries) {
      const remainingQuantity = Math.max(entry.detail.quantity - getStoredQuantity(entry.detail), 0);
      if (entry.quantity > remainingQuantity) {
        alert(`${entry.detail.drug_name} 的本次入库数量不能超过剩余可入数量`);
        return;
      }

      if (!entry.locationValue) {
        alert(`请选择 ${entry.detail.drug_name} 的货位`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await submitPurchaseStorage({
        orderNo: selectedOrder.order_no,
        storage_date: storageDate,
        inspector: normalizedInspector,
        keeper: normalizedKeeper,
        entries: entries.map(entry => {
          const [warehouse_code, location_code] = entry.locationValue.split("|");
          return {
            detailId: entry.detail.id,
            warehouse_code,
            location_code,
            quantity: entry.quantity,
            batch_no: entry.batchNo || undefined
          };
        })
      });

      await revalidateCaches([CACHE_TAGS.purchaseOrders, CACHE_TAGS.purchaseStorages, CACHE_TAGS.inventories]);
      alert("采购入库已完成");
      setStorageQuantities({});
      setBatchNumbers({});
      setLocationSelections({});
      router.refresh();
    } catch (error) {
      console.error("采购入库失败:", error);
      alert(`入库失败：${(error as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden p-6">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">采购入库</h1>
          <p className="text-sm text-slate-500">根据采购订单录入实际入库信息</p>
          {!hasLocationOptions ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">暂无可用货位，请先在基础数据中维护仓库货位</p>
          ) : null}
        </div>
        <Button
          className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:from-teal-600 hover:to-cyan-600"
          disabled={submitting || !hasLocationOptions}
          onClick={() => void handleSubmitStorage()}
        >
          {submitting ? "入库中..." : "确认入库"}
        </Button>
      </div>

      <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">采购单</span>
            <Select value={selectedOrderNo} onValueChange={setSelectedOrderNo}>
              <SelectTrigger className="h-8 flex-1">
                <SelectValue placeholder="选择采购单" />
              </SelectTrigger>
              <SelectContent>
                {orders.map(order => (
                  <SelectItem key={order.order_no} value={order.order_no}>
                    {order.order_no} - {order.manufacturer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">采购日期</span>
            <span className="text-sm text-slate-800 dark:text-slate-200">{selectedOrder?.order_date || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">采购员</span>
            <span className="text-sm text-slate-800 dark:text-slate-200">{selectedOrder?.purchaser || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">状态</span>
            <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20">
              {selectedOrder?.status || "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/40 dark:bg-slate-800/60">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200">药品名称</th>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-700 dark:text-slate-200">生产日期</th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">有效期(月)</th>
              <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">采购量</th>
              <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">已入库</th>
              <th className="px-4 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-200">剩余可入</th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">本次入库</th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">货位</th>
              <th className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">批号</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {details.map(detail => {
              const storedQuantity = getStoredQuantity(detail);
              const remainingQuantity = Math.max(detail.quantity - storedQuantity, 0);
              const locationHint =
                remainingQuantity <= 0
                  ? "该明细已全部入库"
                  : hasLocationOptions
                    ? ""
                    : "暂无可用货位，请先维护仓库货位基础数据";
              const locationPlaceholder =
                remainingQuantity <= 0 ? "该明细已完成入库" : hasLocationOptions ? "选择货位" : "暂无可用货位";

              return (
                <tr key={detail.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-medium">{detail.drug_name}</td>
                  <td className="px-4 py-3 text-slate-600">{detail.production_date}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{detail.validity_months}</td>
                  <td className="px-4 py-3 text-right font-mono">{detail.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">{storedQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600">
                    {remainingQuantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      type="number"
                      className="h-8 w-20 text-center"
                      disabled={remainingQuantity <= 0}
                      min={0}
                      max={remainingQuantity}
                      value={storageQuantities[detail.id] || ""}
                      onChange={event =>
                        setStorageQuantities(prev => ({
                          ...prev,
                          [detail.id]: Number(event.target.value) || 0
                        }))
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1 text-left">
                      <Select
                        value={locationSelections[detail.id] || ""}
                        disabled={remainingQuantity <= 0 || !hasLocationOptions}
                        onValueChange={value =>
                          setLocationSelections(prev => ({
                            ...prev,
                            [detail.id]: value
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue placeholder={locationPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {hasLocationOptions ? (
                            locationOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-slate-500">
                              暂无可用货位，请先在基础数据中维护仓库货位
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {locationHint ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">{locationHint}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input
                      className="h-8 w-28 text-center"
                      value={batchNumbers[detail.id] || ""}
                      onChange={event =>
                        setBatchNumbers(prev => ({
                          ...prev,
                          [detail.id]: event.target.value
                        }))
                      }
                      placeholder="例如 B2404001"
                    />
                  </td>
                </tr>
              );
            })}
            {!details.length && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                  当前采购单暂无明细
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-shrink-0 rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/60">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">检验员</span>
            <Input className="h-8 flex-1" value={inspector} onChange={e => setInspector(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">保管员</span>
            <Input className="h-8 flex-1" value={keeper} onChange={e => setKeeper(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-sm text-slate-600 dark:text-slate-400">入库日期</span>
            <Input
              type="date"
              className="h-8 flex-1"
              value={storageDate}
              onChange={e => setStorageDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
