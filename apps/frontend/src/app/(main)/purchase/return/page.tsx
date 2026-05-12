import PurchaseReturnClient from "@/features/purchase/components/return-client";
import { getPurchaseOrders, getPurchaseStorages } from "@/features/purchase/server/purchase-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function PurchaseReturnLoader() {
  const [orders, storages] = await Promise.all([getPurchaseOrders(), getPurchaseStorages()]);
  return <PurchaseReturnClient orders={orders} storages={storages} />;
}
export default async function PurchaseReturnPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <PurchaseReturnLoader />
    </Suspense>
  );
}
