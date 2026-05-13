import { Suspense } from "react";
import ReportsLoading from "@/app/(main)/reports/loading";
import { getStorageLocations, getWarehouses } from "@/features/basic-data/server/basic-data-server";
import PurchaseStorageClient from "@/features/purchase/components/storage-client";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";

async function PurchaseStorageLoader() {
  const [orders, warehouses, storageLocations] = await Promise.all([
    getPurchaseOrders(),
    getWarehouses(),
    getStorageLocations()
  ]);

  const pendingOrders = orders.filter(order => order.status === "已审核" || order.status === "部分入库");

  return <PurchaseStorageClient orders={pendingOrders} warehouses={warehouses} storageLocations={storageLocations} />;
}

export default async function PurchaseStoragePage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <PurchaseStorageLoader />
    </Suspense>
  );
}
