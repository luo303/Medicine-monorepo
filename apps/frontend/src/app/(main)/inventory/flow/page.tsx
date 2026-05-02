import { FlowClient } from "@/features/inventory/components/flow-client";
import { getInventoryFlows } from "@/features/inventory/server/inventory-server";

export default async function InventoryFlowPage() {
  const flows = await getInventoryFlows();
  return <FlowClient flows={flows} />;
}
