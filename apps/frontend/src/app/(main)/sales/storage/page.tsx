import { StorageClient } from "@/features/sales/components/storage-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function SalesStorageLoader() {
  const orders = await getSalesOrders();
  return <StorageClient orders={orders} />;
}
export default async function SalesStoragePage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <SalesStorageLoader />
    </Suspense>
  );
}
