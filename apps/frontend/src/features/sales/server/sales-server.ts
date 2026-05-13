import type { SalesOrder, SalesDetail, SalesOutboundRecord } from "@/types/sales";
import { fetchServerApi } from "@/lib/server-fetch";

async function fetchApi<T>(endpoint: string): Promise<T> {
  return fetchServerApi<T>(endpoint);
}

export async function getSalesOrders(): Promise<SalesOrder[]> {
  return fetchApi<SalesOrder[]>("/sales/order");
}

export async function getSalesOrder(orderNo: string): Promise<SalesOrder> {
  return fetchApi<SalesOrder>(`/sales/order/${orderNo}`);
}

export async function getSalesDetails(): Promise<SalesDetail[]> {
  return fetchApi<SalesDetail[]>("/sales/detail");
}

export async function getSalesDetail(id: number): Promise<SalesDetail> {
  return fetchApi<SalesDetail>(`/sales/detail/${id}`);
}

export async function getSalesOutbounds(): Promise<SalesOutboundRecord[]> {
  return fetchApi<SalesOutboundRecord[]>("/sales/outbound");
}

export async function getSalesOutbound(id: number): Promise<SalesOutboundRecord> {
  return fetchApi<SalesOutboundRecord>(`/sales/outbound/${id}`);
}
