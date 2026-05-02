import { ReturnClient } from "@/features/sales/components/return-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";

export default async function SalesReturnPage() {
  const orders = await getSalesOrders();
  return <ReturnClient orders={orders} />;
}
