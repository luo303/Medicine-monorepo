import ManufacturersClient from "@/features/basic-data/components/manufacturers-client";
import { getManufacturers } from "@/features/basic-data/server/basic-data-server";

export default async function ManufacturersPage() {
  const manufacturers = await getManufacturers();

  return <ManufacturersClient manufacturers={manufacturers} />;
}
