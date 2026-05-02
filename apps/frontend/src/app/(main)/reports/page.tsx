import ReportsClient from "@/features/reports/components/reports-client";
import { getAllReportsData } from "@/features/reports/server/reports-server";

export default async function ReportsPage() {
  const initialData = await getAllReportsData();
  return <ReportsClient initialData={initialData} />;
}
