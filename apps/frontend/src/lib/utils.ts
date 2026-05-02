import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化日期
export function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch (e) {
    return dateStr;
  }
}

// 格式化金额
export function formatCurrency(amount: string | number | undefined | null) {
  if (amount === undefined || amount === null) return "-";
  const val = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(val)) return "-";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY"
  }).format(val);
}
