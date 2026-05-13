import NewPurchaseOrderClient from "@/features/purchase/components/new-order-client";
import { getManufacturers, getDrugs } from "@/features/basic-data/server/basic-data-server";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function NewPurchaseOrderLoader() {
  const [manufacturers, drugs, orders] = await Promise.all([getManufacturers(), getDrugs(), getPurchaseOrders()]);
  return <NewPurchaseOrderClient manufacturers={manufacturers} drugs={drugs} orders={orders} />;
}
export default async function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <NewPurchaseOrderLoader />
    </Suspense>
  );
}
