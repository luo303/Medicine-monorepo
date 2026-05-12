import { ReturnClient } from "@/features/sales/components/return-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function SalesReturnLoader() {
  const orders = await getSalesOrders();
  return <ReturnClient orders={orders} />;
}
export default async function SalesReturnPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <SalesReturnLoader />
    </Suspense>
  );
}
