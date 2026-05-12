import ManufacturersClient from "@/features/basic-data/components/manufacturers-client";
import { getManufacturers } from "@/features/basic-data/server/basic-data-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function ManufacturersLoader() {
  const manufacturers = await getManufacturers();
  return <ManufacturersClient manufacturers={manufacturers} />;
}
export default async function ManufacturersPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ManufacturersLoader />
    </Suspense>
  );
}
