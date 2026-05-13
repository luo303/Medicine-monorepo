import { TraceClient } from "@/features/inventory/components/trace-client";
import { getInventories } from "@/features/inventory/server/inventory-server";
import { getPurchaseOrders, getPurchaseStorages } from "@/features/purchase/server/purchase-server";
import { getSalesOrders, getSalesOutbounds } from "@/features/sales/server/sales-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";

async function BatchTraceLoader() {
  const [inventories, purchaseOrders, purchaseStorages, salesOrders, salesOutbounds] = await Promise.all([
    getInventories(),
    getPurchaseOrders(),
    getPurchaseStorages(),
    getSalesOrders(),
    getSalesOutbounds()
  ]);

  return (
    <TraceClient
      inventories={inventories}
      purchaseOrders={purchaseOrders}
      purchaseStorages={purchaseStorages}
      salesOrders={salesOrders}
      salesOutbounds={salesOutbounds}
    />
  );
}

export default async function BatchTracePage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <BatchTraceLoader />
    </Suspense>
  );
}
