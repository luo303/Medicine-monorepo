import { WarningClient } from "@/features/inventory/components/warning-client";
import { getInventories } from "@/features/inventory/server/inventory-server";

export default async function InventoryWarningPage() {
  const inventories = await getInventories();
  return <WarningClient inventories={inventories} />;
}
