import PurchaseReportClient from "@/features/purchase/components/report-client";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function PurchaseReportLoader() {
  const orders = await getPurchaseOrders();
  return <PurchaseReportClient orders={orders} />;
}
export default async function PurchaseReportPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <PurchaseReportLoader />
    </Suspense>
  );
}
