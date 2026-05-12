import WarehousesClient from "@/features/basic-data/components/warehouses-client";
import { getWarehouses, getStorageLocations } from "@/features/basic-data/server/basic-data-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function WarehousesLoader() {
  const [warehouses, storageLocations] = await Promise.all([getWarehouses(), getStorageLocations()]);
  return <WarehousesClient warehouses={warehouses} storageLocations={storageLocations} />;
}
export default async function WarehousesPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <WarehousesLoader />
    </Suspense>
  );
}
