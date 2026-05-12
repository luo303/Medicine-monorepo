import { getDashboardStats } from "@/features/dashboard/server/dashboard-server";
import Dashboard from "@/features/dashboard/components/dashboard";
import ReportsLoading from "@/app/(main)/reports/loading";
import { Suspense } from "react";
async function DashboardLoader() {
  const stats = await getDashboardStats();
  return <Dashboard stats={stats} />;
}
export default async function HomePage() {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <DashboardLoader />
    </Suspense>
  );
}
