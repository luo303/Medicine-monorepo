import type { Manufacturer, Drug, MedicalInstitution, Warehouse, StorageLocation } from "@/types/basic-data";
import { fetchServerApi } from "@/lib/server-fetch";

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    return await fetchServerApi<T>(endpoint);
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

export async function getManufacturers(): Promise<Manufacturer[]> {
  const data = await fetchApi<Manufacturer[]>("/manufacturer");
  return data || [];
}

export async function getDrugs(): Promise<Drug[]> {
  const data = await fetchApi<Drug[]>("/drug");
  return data || [];
}

export async function getMedicalInstitutions(): Promise<MedicalInstitution[]> {
  const data = await fetchApi<MedicalInstitution[]>("/MedicalInstitution");
  return data || [];
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const data = await fetchApi<Warehouse[]>("/warehouse");
  return data || [];
}

export async function getStorageLocations(): Promise<StorageLocation[]> {
  const data = await fetchApi<StorageLocation[]>("/storage-location");
  return data || [];
}
