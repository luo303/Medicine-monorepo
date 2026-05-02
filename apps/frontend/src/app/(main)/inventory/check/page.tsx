import { CheckClient } from "@/features/inventory/components/check-client";
import { getInventories } from "@/features/inventory/server/inventory-server";

export default async function InventoryCheckPage() {
  const inventories = await getInventories();
  return <CheckClient inventories={inventories} />;
}
