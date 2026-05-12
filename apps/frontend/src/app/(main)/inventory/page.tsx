import { InventoryClient } from "@/features/inventory/components/inventory-client";
import { getInventories } from "@/features/inventory/server/inventory-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function InventoryLoader() {
  const inventories = await getInventories();
  return <InventoryClient inventories={inventories} />;
}
export default async function InventoryPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <InventoryLoader />
    </Suspense>
  );
}
