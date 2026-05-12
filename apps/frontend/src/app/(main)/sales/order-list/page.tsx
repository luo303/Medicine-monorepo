import { OrderListClient } from "@/features/sales/components/order-list-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function SalesOrderListLoader() {
  const orders = await getSalesOrders();
  return <OrderListClient orders={orders} />;
}
export default async function SalesOrderListPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <SalesOrderListLoader />
    </Suspense>
  );
}
