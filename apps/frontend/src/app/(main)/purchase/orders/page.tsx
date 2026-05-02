import PurchaseOrderListClient from "@/features/purchase/components/order-list-client";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";

export default async function PurchaseOrdersPage() {
  const orders = await getPurchaseOrders();
  return <PurchaseOrderListClient orders={orders} />;
}
