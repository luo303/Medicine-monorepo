import PurchaseStorageClient from "@/features/purchase/components/storage-client";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function PurchaseStorageLoader() {
  const orders = await getPurchaseOrders();
  const pendingOrders = orders.filter(o => o.status === "已审核" || o.status === "部分入库");
  return <PurchaseStorageClient orders={pendingOrders} />;
}
export default async function PurchaseStoragePage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <PurchaseStorageLoader />
    </Suspense>
  );
}
