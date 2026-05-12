import { TraceClient } from "@/features/inventory/components/trace-client";
import { getInventories } from "@/features/inventory/server/inventory-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function BatchTraceLoader() {
  const inventories = await getInventories();
  return <TraceClient inventories={inventories} />;
}
export default async function BatchTracePage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <BatchTraceLoader />
    </Suspense>
  );
}
