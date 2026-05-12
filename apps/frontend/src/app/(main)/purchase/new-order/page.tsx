import NewPurchaseOrderClient from "@/features/purchase/components/new-order-client";
import { getManufacturers, getDrugs } from "@/features/basic-data/server/basic-data-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function NewPurchaseOrderLoader() {
  const [manufacturers, drugs] = await Promise.all([getManufacturers(), getDrugs()]);
  return <NewPurchaseOrderClient manufacturers={manufacturers} drugs={drugs} />;
}
export default async function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <NewPurchaseOrderLoader />
    </Suspense>
  );
}
