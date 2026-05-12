import { ReportClient } from "@/features/sales/components/report-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function SalesReportLoader() {
  const orders = await getSalesOrders();
  return <ReportClient orders={orders} />;
}
export default async function SalesReportPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <SalesReportLoader />
    </Suspense>
  );
}
