import { CheckClient } from "@/features/inventory/components/check-client";
import { getInventories } from "@/features/inventory/server/inventory-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function InventoryCheckLoader() {
  const inventories = await getInventories();
  return <CheckClient inventories={inventories} />;
}
export default async function InventoryCheckPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <InventoryCheckLoader />
    </Suspense>
  );
}
