import { FlowClient } from "@/features/inventory/components/flow-client";
import { getInventoryFlows } from "@/features/inventory/server/inventory-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function InventoryFlowLoader() {
  const flows = await getInventoryFlows();
  return <FlowClient flows={flows} />;
}
export default async function InventoryFlowPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <InventoryFlowLoader />
    </Suspense>
  );
}
