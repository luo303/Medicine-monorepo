import { StorageClient } from "@/features/sales/components/storage-client";
import { getInventories } from "@/features/inventory/server/inventory-server";
import { getSalesOrders, getSalesOutbounds } from "@/features/sales/server/sales-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";

async function SalesStorageLoader() {
  const [orders, inventories, outbounds] = await Promise.all([getSalesOrders(), getInventories(), getSalesOutbounds()]);

  return <StorageClient orders={orders} inventories={inventories} outbounds={outbounds} />;
}

export default async function SalesStoragePage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <SalesStorageLoader />
    </Suspense>
  );
}
