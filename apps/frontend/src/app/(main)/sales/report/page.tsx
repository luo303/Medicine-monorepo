import { ReportClient } from "@/features/sales/components/report-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";

export default async function SalesReportPage() {
  const orders = await getSalesOrders();
  return <ReportClient orders={orders} />;
}
