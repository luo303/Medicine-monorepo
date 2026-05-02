import PurchaseStorageClient from "@/features/purchase/components/storage-client";
import { getPurchaseOrders } from "@/features/purchase/server/purchase-server";

export default async function PurchaseStoragePage() {
  const orders = await getPurchaseOrders();
  const pendingOrders = orders.filter(o => o.status === "已审核" || o.status === "部分入库");
  return <PurchaseStorageClient orders={pendingOrders} />;
}
