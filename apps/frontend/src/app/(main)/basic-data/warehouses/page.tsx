import WarehousesClient from "@/features/basic-data/components/warehouses-client";
import { getWarehouses, getStorageLocations } from "@/features/basic-data/server/basic-data-server";

export default async function WarehousesPage() {
  const [warehouses, storageLocations] = await Promise.all([getWarehouses(), getStorageLocations()]);

  return <WarehousesClient warehouses={warehouses} storageLocations={storageLocations} />;
}
