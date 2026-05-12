import DrugsClient from "@/features/basic-data/components/drugs-client";
import { getDrugs } from "@/features/basic-data/server/basic-data-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function DrugsLoader() {
  const drugs = await getDrugs();
  return <DrugsClient drugs={drugs} />;
}
export default async function DrugsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <DrugsLoader />
    </Suspense>
  );
}
