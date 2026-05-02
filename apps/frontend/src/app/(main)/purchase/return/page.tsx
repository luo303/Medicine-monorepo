import PurchaseReturnClient from "@/features/purchase/components/return-client";
import { getPurchaseOrders, getPurchaseStorages } from "@/features/purchase/server/purchase-server";

export default async function PurchaseReturnPage() {
  const [orders, storages] = await Promise.all([getPurchaseOrders(), getPurchaseStorages()]);
  return <PurchaseReturnClient orders={orders} storages={storages} />;
}
