import SideNav from "@/components/side-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white dark:bg-black w-screen">
      {/* 左侧导航栏 - 全局统一 */}
      <SideNav />

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
