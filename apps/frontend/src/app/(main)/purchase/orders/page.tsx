import PurchaseOrderListClient from "@/features/purchase/components/order-list-client";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function PurchaseOrderLoader() {
  const orders = await getPurchaseOrders();
  return <PurchaseOrderListClient orders={orders} />;
}
export default async function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <PurchaseOrderLoader />
    </Suspense>
  );
}
