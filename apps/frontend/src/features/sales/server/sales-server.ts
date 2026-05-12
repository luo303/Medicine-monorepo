import type { ApiResponse } from "@medicine/shared";
import type { SalesOrder, SalesOutbound } from "@/types/sales";
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
  return fetchApi<SalesOrder[]>("/sales/order");
}

export async function getSalesOrder(orderNo: string): Promise<SalesOrder> {
  return fetchApi<SalesOrder>(`/sales/order/${orderNo}`);
}

export async function getSalesOutbounds(): Promise<SalesOutbound[]> {
  return fetchApi<SalesOutbound[]>("/sales/outbound");
}

export async function getSalesOutbound(id: number): Promise<SalesOutbound> {
  return fetchApi<SalesOutbound>(`/sales/outbound/${id}`);
}
