import type { ApiResponse } from "@medicine/shared";
import { API_BASE_URL } from "./api-config";

function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json"
  };
}

function handleUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized");
  }
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const result: ApiResponse<T> = await response.json();
  return result.data;
}

async function postApi<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data)
  });
  return handleResponse<T>(response);
}

async function putApi<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data)
  });
  return handleResponse<T>(response);
}

async function deleteApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include"
  });
  return handleResponse<T>(response);
}

export interface CreateDrugParams {
  approval_no: string;
  name: string;
  scientific_name?: string;
  model?: string;
  specification?: string;
  is_prescription?: boolean;
}

export interface UpdateDrugParams {
  name?: string;
  scientific_name?: string;
  model?: string;
  specification?: string;
  is_prescription?: boolean;
}

export interface Drug {
  approval_no: string;
  name: string;
  scientific_name?: string;
  model?: string;
  specification?: string;
  is_prescription?: boolean;
}

export async function createDrug(params: CreateDrugParams): Promise<Drug> {
  return postApi<Drug>("/drug", params);
}

export async function updateDrug(approval_no: string, params: UpdateDrugParams): Promise<Drug> {
  return putApi<Drug>(`/drug/${approval_no}`, params);
}

export async function deleteDrug(approval_no: string): Promise<void> {
  return deleteApi<void>(`/drug/${approval_no}`);
}

export interface CreateWarehouseParams {
  code: string;
  name: string;
  address?: string;
  manager?: string;
}

export interface UpdateWarehouseParams {
  code?: string;
  name?: string;
  address?: string;
  manager?: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: string;
  manager?: string;
}

export async function createWarehouse(params: CreateWarehouseParams): Promise<Warehouse> {
  return postApi<Warehouse>("/warehouse", params);
}

export async function updateWarehouse(id: number, params: UpdateWarehouseParams): Promise<Warehouse> {
  return putApi<Warehouse>(`/warehouse/${id}`, params);
}

export async function deleteWarehouse(id: number): Promise<void> {
  return deleteApi<void>(`/warehouse/${id}`);
}

export interface CreateStorageLocationParams {
  warehouseId: number;
  code: string;
  capacity?: number;
  description?: string;
}

export interface UpdateStorageLocationParams {
  warehouseId?: number;
  code?: string;
  capacity?: number;
  description?: string;
}

export interface StorageLocation {
  id: number;
  warehouseId: number;
  code: string;
  capacity?: number;
  description?: string;
}

export async function createStorageLocation(params: CreateStorageLocationParams): Promise<StorageLocation> {
  return postApi<StorageLocation>("/storage-location", params);
}

export async function updateStorageLocation(id: number, params: UpdateStorageLocationParams): Promise<StorageLocation> {
  return putApi<StorageLocation>(`/storage-location/${id}`, params);
}

export async function deleteStorageLocation(id: number): Promise<void> {
  return deleteApi<void>(`/storage-location/${id}`);
}

export interface CreateInventoryParams {
  warehouse_code: string;
  location_code: string;
  manufacturerApprovalNo?: string;
  drugApprovalNo: string;
  drug_name: string;
  batch_no?: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
}

export interface UpdateInventoryParams {
  warehouse_code?: string;
  location_code?: string;
  manufacturerApprovalNo?: string;
  drugApprovalNo?: string;
  drug_name?: string;
  batch_no?: string;
  production_date?: string;
  expiry_date?: string;
  quantity?: number;
}

export interface InventoryRecord {
  id: number;
  warehouse_code: string;
  location_code: string;
  drugApprovalNo: string;
  drug_name: string;
  quantity: number;
}

export async function createInventory(params: CreateInventoryParams): Promise<InventoryRecord> {
  return postApi<InventoryRecord>("/inventory", params);
}

export async function updateInventory(id: number, params: UpdateInventoryParams): Promise<InventoryRecord> {
  return putApi<InventoryRecord>(`/inventory/${id}`, params);
}

export async function deleteInventory(id: number): Promise<void> {
  return deleteApi<void>(`/inventory/${id}`);
}

export interface CreateManufacturerParams {
  approval_no: string;
  name: string;
  city?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  is_gmp?: boolean;
}

export interface UpdateManufacturerParams {
  name?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  is_gmp?: boolean;
}

export interface Manufacturer {
  approval_no: string;
  name: string;
  city?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  is_gmp?: boolean;
}

export async function createManufacturer(params: CreateManufacturerParams): Promise<Manufacturer> {
  return postApi<Manufacturer>("/manufacturer", params);
}

export async function updateManufacturer(approval_no: string, params: UpdateManufacturerParams): Promise<Manufacturer> {
  return putApi<Manufacturer>(`/manufacturer/${approval_no}`, params);
}

export async function deleteManufacturer(approval_no: string): Promise<void> {
  return deleteApi<void>(`/manufacturer/${approval_no}`);
}

export interface CreateMedicalInstitutionParams {
  approval_no: string;
  name: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  is_specialized?: boolean;
}

export interface UpdateMedicalInstitutionParams {
  name?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  is_specialized?: boolean;
}

export interface MedicalInstitution {
  approval_no: string;
  name: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  is_specialized?: boolean;
}

export async function createMedicalInstitution(params: CreateMedicalInstitutionParams): Promise<MedicalInstitution> {
  return postApi<MedicalInstitution>("/MedicalInstitution", params);
}

export async function updateMedicalInstitution(
  approval_no: string,
  params: UpdateMedicalInstitutionParams
): Promise<MedicalInstitution> {
  return putApi<MedicalInstitution>(`/MedicalInstitution/${approval_no}`, params);
}

export async function deleteMedicalInstitution(approval_no: string): Promise<void> {
  return deleteApi<void>(`/MedicalInstitution/${approval_no}`);
}

export interface CreatePurchaseOrderParams {
  order_no: string;
  order_date: string;
  manufacturerApprovalNo: string;
  manufacturer_name: string;
  total_amount?: string;
  purchaser?: string;
  status?: string;
}

export interface UpdatePurchaseOrderParams {
  order_date?: string;
  manufacturer_name?: string;
  total_amount?: string;
  purchaser?: string;
  status?: string;
}

export interface PurchaseOrder {
  order_no: string;
  order_date: string;
  manufacturer_name: string;
  total_amount?: string;
}

export async function createPurchaseOrder(params: CreatePurchaseOrderParams): Promise<PurchaseOrder> {
  return postApi<PurchaseOrder>("/purchase/order", params);
}

export async function updatePurchaseOrder(order_no: string, params: UpdatePurchaseOrderParams): Promise<PurchaseOrder> {
  return putApi<PurchaseOrder>(`/purchase/order/${order_no}`, params);
}

export async function deletePurchaseOrder(order_no: string): Promise<void> {
  return deleteApi<void>(`/purchase/order/${order_no}`);
}

export interface CreatePurchaseDetailParams {
  orderNo: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  validity_months: number;
  quantity: number;
  unit_price: string;
}

export interface UpdatePurchaseDetailParams {
  quantity?: number;
  unit_price?: string;
}

export interface PurchaseDetail {
  id: number;
  orderNo: string;
  drug_name: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

export async function createPurchaseDetail(params: CreatePurchaseDetailParams): Promise<PurchaseDetail> {
  return postApi<PurchaseDetail>("/purchase/detail", params);
}

export async function updatePurchaseDetail(id: number, params: UpdatePurchaseDetailParams): Promise<PurchaseDetail> {
  return putApi<PurchaseDetail>(`/purchase/detail/${id}`, params);
}

export async function deletePurchaseDetail(id: number): Promise<void> {
  return deleteApi<void>(`/purchase/detail/${id}`);
}

export interface CreatePurchaseStorageParams {
  warehouse_code: string;
  location_code: string;
  orderNo: string;
  storage_date: string;
  manufacturerApprovalNo: string;
  drugApprovalNo: string;
  drug_name: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  purchaser?: string;
  inspector?: string;
  keeper?: string;
  batch_no?: string;
}

export interface UpdatePurchaseStorageParams {
  quantity?: number;
  batch_no?: string;
}

export interface PurchaseStorage {
  id: number;
  orderNo: string;
  drug_name: string;
  quantity: number;
}

export async function createPurchaseStorage(params: CreatePurchaseStorageParams): Promise<PurchaseStorage> {
  return postApi<PurchaseStorage>("/purchase/storage", params);
}

export async function updatePurchaseStorage(id: number, params: UpdatePurchaseStorageParams): Promise<PurchaseStorage> {
  return putApi<PurchaseStorage>(`/purchase/storage/${id}`, params);
}

export async function deletePurchaseStorage(id: number): Promise<void> {
  return deleteApi<void>(`/purchase/storage/${id}`);
}

export interface CreateSalesOrderParams {
  order_no: string;
  sales_date: string;
  institutionApprovalNo: string;
  institution_name: string;
  total_amount?: string;
  salesperson?: string;
  status?: string;
}

export interface UpdateSalesOrderParams {
  sales_date?: string;
  institution_name?: string;
  total_amount?: string;
  salesperson?: string;
  status?: string;
}

export interface SalesOrder {
  order_no: string;
  sales_date: string;
  institution_name: string;
  total_amount?: string;
}

export async function createSalesOrder(params: CreateSalesOrderParams): Promise<SalesOrder> {
  return postApi<SalesOrder>("/sales/order", params);
}

export async function updateSalesOrder(order_no: string, params: UpdateSalesOrderParams): Promise<SalesOrder> {
  return putApi<SalesOrder>(`/sales/order/${order_no}`, params);
}

export async function deleteSalesOrder(order_no: string): Promise<void> {
  return deleteApi<void>(`/sales/order/${order_no}`);
}

export interface CreateSalesDetailParams {
  orderNo: string;
  drugApprovalNo: string;
  drug_name: string;
  quantity: number;
  unit_price: string;
}

export interface UpdateSalesDetailParams {
  quantity?: number;
  unit_price?: string;
}

export interface SalesDetail {
  id: number;
  orderNo: string;
  drug_name: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

export async function createSalesDetail(params: CreateSalesDetailParams): Promise<SalesDetail> {
  return postApi<SalesDetail>("/sales/detail", params);
}

export async function updateSalesDetail(id: number, params: UpdateSalesDetailParams): Promise<SalesDetail> {
  return putApi<SalesDetail>(`/sales/detail/${id}`, params);
}

export async function deleteSalesDetail(id: number): Promise<void> {
  return deleteApi<void>(`/sales/detail/${id}`);
}

export interface CreateSalesOutboundParams {
  orderNo: string;
  outbound_date: string;
  institutionApprovalNo: string;
  institution_name: string;
  salesperson?: string;
  inspector?: string;
  keeper?: string;
}

export interface UpdateSalesOutboundParams {
  outbound_date?: string;
  salesperson?: string;
  inspector?: string;
  keeper?: string;
}

export interface SalesOutbound {
  id: number;
  orderNo: string;
  outbound_date: string;
  institution_name: string;
}

export async function createSalesOutbound(params: CreateSalesOutboundParams): Promise<SalesOutbound> {
  return postApi<SalesOutbound>("/sales/outbound", params);
}

export async function updateSalesOutbound(id: number, params: UpdateSalesOutboundParams): Promise<SalesOutbound> {
  return putApi<SalesOutbound>(`/sales/outbound/${id}`, params);
}

export async function deleteSalesOutbound(id: number): Promise<void> {
  return deleteApi<void>(`/sales/outbound/${id}`);
}
