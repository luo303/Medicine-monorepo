import { StorageClient } from "@/features/sales/components/storage-client";
import { getSalesOrders } from "@/features/sales/server/sales-server";

export default async function SalesStoragePage() {
  const orders = await getSalesOrders();
  return <StorageClient orders={orders} />;
}
