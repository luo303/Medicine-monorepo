import { OrderListClient } from "@/features/sales/components/order-list-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";

export default async function SalesOrderListPage() {
  const orders = await getSalesOrders();
  return <OrderListClient orders={orders} />;
}
