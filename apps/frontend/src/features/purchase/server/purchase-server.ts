import type { PurchaseOrder, PurchaseDetail, PurchaseStorage } from "@/types/purchase";
import { fetchServerApi } from "@/lib/server-fetch";

async function fetchApi<T>(endpoint: string): Promise<T> {
  return fetchServerApi<T>(endpoint);
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return fetchApi<PurchaseOrder[]>("/purchase/order");
}

export async function getPurchaseOrder(orderNo: string): Promise<PurchaseOrder> {
  return fetchApi<PurchaseOrder>(`/purchase/order/${orderNo}`);
}

export async function getPurchaseDetails(): Promise<PurchaseDetail[]> {
  return fetchApi<PurchaseDetail[]>("/purchase/detail");
}

export async function getPurchaseDetail(id: number): Promise<PurchaseDetail> {
  return fetchApi<PurchaseDetail>(`/purchase/detail/${id}`);
}

export async function getPurchaseStorages(): Promise<PurchaseStorage[]> {
  return fetchApi<PurchaseStorage[]>("/purchase/storage");
}

export async function getPurchaseStorage(id: number): Promise<PurchaseStorage> {
  return fetchApi<PurchaseStorage>(`/purchase/storage/${id}`);
}
