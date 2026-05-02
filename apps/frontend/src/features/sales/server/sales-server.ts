import type { ApiResponse } from "@medicine/shared";
import type { SalesOrder, SalesOutbound } from "@/types/sales";
import { cacheTag, cacheLife } from "next/cache";
import { API_BASE_URL } from "@/lib/api-config";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export async function getSalesOrders(): Promise<SalesOrder[]> {
  "use cache";
  cacheTag("sales-orders");
  cacheLife("minutes");
  return fetchApi<SalesOrder[]>("/sales/order");
}

export async function getSalesOrder(orderNo: string): Promise<SalesOrder> {
  "use cache";
  cacheTag("sales-order", `sales-order-${orderNo}`);
  cacheLife("minutes");
  return fetchApi<SalesOrder>(`/sales/order/${orderNo}`);
}

export async function getSalesOutbounds(): Promise<SalesOutbound[]> {
  "use cache";
  cacheTag("sales-outbounds");
  cacheLife("minutes");
  return fetchApi<SalesOutbound[]>("/sales/outbound");
}

export async function getSalesOutbound(id: number): Promise<SalesOutbound> {
  "use cache";
  cacheTag("sales-outbound", `sales-outbound-${id}`);
  cacheLife("minutes");
  return fetchApi<SalesOutbound>(`/sales/outbound/${id}`);
}
