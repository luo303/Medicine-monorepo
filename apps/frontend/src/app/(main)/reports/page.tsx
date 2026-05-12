import ReportsClient from "@/features/reports/components/reports-client";
import { getAllReportsData } from "@/features/reports/server/reports-server";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function ReportsLoader() {
  const initialData = await getAllReportsData();
  return <ReportsClient initialData={initialData} />;
}
export default async function ReportsPage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsLoader />
    </Suspense>
  );
}
