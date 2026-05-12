import type { ApiResponse } from "@medicine/shared";
import {
  type Manufacturer,
  type Drug,
  type MedicalInstitution,
  type PurchaseOrder,
  type SalesOrder,
  type PurchaseStorage,
  type SalesOutbound,
  type Inventory
} from "./reports";
import { API_BASE_URL } from "@/lib/api-config";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export async function getManufacturers(): Promise<Manufacturer[]> {
  return fetchApi<Manufacturer[]>("/manufacturer");
}

export async function getDrugs(): Promise<Drug[]> {
  return fetchApi<Drug[]>("/drug");
}

export async function getMedicalInstitutions(): Promise<MedicalInstitution[]> {
  return fetchApi<MedicalInstitution[]>("/MedicalInstitution");
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return fetchApi<PurchaseOrder[]>("/purchase/order");
}

export async function getSalesOrders(): Promise<SalesOrder[]> {
  return fetchApi<SalesOrder[]>("/sales/order");
}

export async function getPurchaseStorages(): Promise<PurchaseStorage[]> {
  return fetchApi<PurchaseStorage[]>("/purchase/storage");
}

export async function getSalesOutbounds(): Promise<SalesOutbound[]> {
  return fetchApi<SalesOutbound[]>("/sales/outbound");
}

export async function getInventory(): Promise<Inventory[]> {
  return fetchApi<Inventory[]>("/inventory");
}

export interface AllReportsData {
  manufacturers: Manufacturer[];
  drugs: Drug[];
  institutions: MedicalInstitution[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  purchaseStorages: PurchaseStorage[];
  salesOutbounds: SalesOutbound[];
  inventory: Inventory[];
}

export async function getAllReportsData(): Promise<AllReportsData> {
  const [manufacturers, drugs, institutions, purchaseOrders, salesOrders, purchaseStorages, salesOutbounds, inventory] =
    await Promise.all([
      getManufacturers(),
      getDrugs(),
      getMedicalInstitutions(),
      getPurchaseOrders(),
      getSalesOrders(),
      getPurchaseStorages(),
      getSalesOutbounds(),
      getInventory()
    ]);

  return {
    manufacturers,
    drugs,
    institutions,
    purchaseOrders,
    salesOrders,
    purchaseStorages,
    salesOutbounds,
    inventory
  };
}
