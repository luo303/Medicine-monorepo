import { TraceClient } from "@/features/inventory/components/trace-client";
import { getInventories } from "@/features/inventory/server/inventory-server";

export default async function BatchTracePage() {
  const inventories = await getInventories();
  return <TraceClient inventories={inventories} />;
}
