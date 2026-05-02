"use client";

import { Loader2 } from "lucide-react";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="relative w-12 h-12 text-teal-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">正在加载报表数据</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">首次加载可能需要几秒钟...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
