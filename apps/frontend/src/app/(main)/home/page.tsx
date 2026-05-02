import { getDashboardStats } from "@/features/dashboard/server/dashboard-server";
import Dashboard from "@/features/dashboard/components/dashboard";

export default async function HomePage() {
  const stats = await getDashboardStats();
  return <Dashboard stats={stats} />;
}
