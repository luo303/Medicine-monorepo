import { InventoryClient } from "@/features/inventory/components/inventory-client";
import { getInventories } from "@/features/inventory/server/inventory-server";

export default async function InventoryPage() {
  const inventories = await getInventories();
  return <InventoryClient inventories={inventories} />;
}
