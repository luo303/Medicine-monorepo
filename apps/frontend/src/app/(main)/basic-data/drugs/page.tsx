import DrugsClient from "@/features/basic-data/components/drugs-client";
import { getDrugs } from "@/features/basic-data/server/basic-data-server";

export default async function DrugsPage() {
  const drugs = await getDrugs();

  return <DrugsClient drugs={drugs} />;
}
