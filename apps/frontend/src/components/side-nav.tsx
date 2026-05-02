"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavStore } from "@/store/nav-store";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  children?: { href: string; label: string }[];
}

export default function SideNav() {
  const pathname = usePathname();
  const { collapsed, toggle } = useNavStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const navItems: NavItem[] = [
    {
      href: "/home",
      label: "仪表盘",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      )
    },
    {
      href: "/assistant",
      label: "AI 助手",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )
    },
    {
      href: "/reports",
      label: "数据报表",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      )
    },
    {
      label: "基础数据",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      children: [
        { href: "/basic-data/manufacturers", label: "生产企业" },
        { href: "/basic-data/drugs", label: "药品目录" },
        { href: "/basic-data/institutions", label: "医疗机构" },
        { href: "/basic-data/warehouses", label: "仓库管理" }
      ]
    },
    {
      label: "采购管理",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      children: [
        { href: "/purchase/orders", label: "采购单列表" },
        { href: "/purchase/new-order", label: "新增采购单" },
        { href: "/purchase/storage", label: "采购入库" },
        { href: "/purchase/return", label: "采购退货" },
        { href: "/purchase/report", label: "采购报表" }
      ]
    },
    {
      label: "销售管理",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
      children: [
        { href: "/sales/order-list", label: "销售单列表" },
        { href: "/sales/new-order", label: "新增销售单" },
        { href: "/sales/storage", label: "销售出库" },
        { href: "/sales/return", label: "销售退货" },
        { href: "/sales/report", label: "销售报表" }
      ]
    },
    {
      label: "库存管理",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      children: [
        { href: "/inventory", label: "实时库存" },
        { href: "/inventory/warning", label: "库存预警" },
        { href: "/inventory/flow", label: "库存流水" },
        { href: "/inventory/check", label: "库存盘点" },
        { href: "/inventory/trace", label: "批次跟踪" }
      ]
    }
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => (prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]));
  };

  const isChildActive = (children: { href: string }[]) => {
    return children.some(child => pathname === child.href);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full relative",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <div className="absolute inset-0 bg-slate-50/95 dark:bg-slate-900/98 backdrop-blur-xl" />
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-teal-200/30 dark:via-teal-800/20 to-transparent" />

      <div
        className={cn(
          "relative p-4 pb-3 border-b border-slate-200/60 dark:border-slate-700/40",
          "transition-all duration-300 ease-in-out"
        )}
      >
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex items-center gap-2.5 overflow-hidden transition-all duration-300",
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            )}
          >
            <div className="relative shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/15">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow-sm" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-none">
                智能医疗系统
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Medical AI Platform</p>
            </div>
          </div>

          <Button
            onClick={toggle}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shrink-0",
              collapsed ? "mx-auto" : ""
            )}
            title={collapsed ? "展开导航栏" : "收起导航栏"}
          >
            <svg
              className={cn("w-4 h-4 transition-transform duration-300", collapsed ? "rotate-180" : "rotate-0")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Button>
        </div>
      </div>

      <nav className="relative flex-1 p-2.5 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          if (item.children) {
            const isExpanded = expandedMenus.includes(item.label);
            const hasActiveChild = isChildActive(item.children);

            return (
              <Collapsible
                key={item.label}
                open={isExpanded}
                onOpenChange={() => toggleMenu(item.label)}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                      "transition-all duration-200 cursor-pointer",
                      hasActiveChild
                        ? "text-teal-700 dark:text-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50/50 dark:from-teal-950/30 dark:to-cyan-950/15 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {hasActiveChild && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-400 shadow-sm" />
                    )}
                    <span
                      className={cn(
                        "shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                        hasActiveChild
                          ? "bg-white dark:bg-slate-800 shadow-sm"
                          : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-left overflow-hidden whitespace-nowrap transition-all duration-300",
                        collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      )}
                    >
                      {item.label}
                    </span>
                    {!collapsed && (
                      <svg
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform duration-200",
                          isExpanded ? "rotate-90" : ""
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  {!collapsed &&
                    item.children.map(child => {
                      const isActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "group relative flex items-center gap-3 pl-14 pr-3 py-2 rounded-lg text-sm",
                            "transition-all duration-200 cursor-pointer",
                            isActive
                              ? "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-900/20"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
                          )}
                        >
                          {isActive && (
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400" />
                          )}
                          {child.label}
                        </Link>
                      );
                    })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                "transition-all duration-200 cursor-pointer",
                isActive
                  ? "text-teal-700 dark:text-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50/50 dark:from-teal-950/30 dark:to-cyan-950/15 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-400 shadow-sm" />
              )}
              <span
                className={cn(
                  "shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-white dark:bg-slate-800 shadow-sm"
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50"
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                {item.label}
              </span>
              {isActive && !collapsed && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "relative p-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/40",
          "transition-all duration-300 ease-in-out",
          collapsed ? "overflow-hidden opacity-0 h-0 p-0 border-none" : "overflow-visible"
        )}
      >
        {!collapsed && (
          <div className="px-2 py-2 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 border border-slate-200/50 dark:border-slate-700/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">管理员</p>
                <p className="text-[10px] text-slate-400 truncate">admin@medical.ai</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
