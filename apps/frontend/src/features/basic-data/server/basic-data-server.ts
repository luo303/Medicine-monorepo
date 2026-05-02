import { cacheLife, cacheTag } from "next/cache";
import type { ApiResponse } from "@medicine/shared";
import type { Manufacturer, Drug, MedicalInstitution, Warehouse, StorageLocation } from "@/types/basic-data";
import { API_BASE_URL } from "@/lib/api-config";

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} for ${endpoint}`);
      return null;
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

export async function getManufacturers(): Promise<Manufacturer[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("manufacturers");
  const data = await fetchApi<Manufacturer[]>("/manufacturer");
  return data || [];
}

export async function getDrugs(): Promise<Drug[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("drugs");
  const data = await fetchApi<Drug[]>("/drug");
  return data || [];
}

export async function getMedicalInstitutions(): Promise<MedicalInstitution[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("institutions");
  const data = await fetchApi<MedicalInstitution[]>("/MedicalInstitution");
  return data || [];
}

export async function getWarehouses(): Promise<Warehouse[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("warehouses");
  const data = await fetchApi<Warehouse[]>("/warehouse");
  return data || [];
}

export async function getStorageLocations(): Promise<StorageLocation[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("storage-locations");
  const data = await fetchApi<StorageLocation[]>("/storage-location");
  return data || [];
}
