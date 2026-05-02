import NewPurchaseOrderClient from "@/features/purchase/components/new-order-client";
import { getManufacturers, getDrugs } from "@/features/basic-data/server/basic-data-server";

export default async function NewPurchaseOrderPage() {
  const [manufacturers, drugs] = await Promise.all([getManufacturers(), getDrugs()]);
  return <NewPurchaseOrderClient manufacturers={manufacturers} drugs={drugs} />;
}
