import { WarningClient } from "@/features/inventory/components/warning-client";
import { getInventories } from "@/features/inventory/server/inventory-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
export default async function InventoryWarningPage() {
  const inventories = await getInventories();
  return (
    <Suspense fallback={<ReportsLoading />}>
      <WarningClient inventories={inventories} />
    </Suspense>
  );
}
