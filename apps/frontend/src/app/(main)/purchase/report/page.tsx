import PurchaseReportClient from "@/features/purchase/components/report-client";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";

export default async function PurchaseReportPage() {
  const orders = await getPurchaseOrders();
  return <PurchaseReportClient orders={orders} />;
}
