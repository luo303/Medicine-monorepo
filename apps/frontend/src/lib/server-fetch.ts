import type { ApiResponse } from "@medicine/shared";
import { API_BASE_URL } from "./api-config";
import { getTagsForEndpoint } from "./cache-tags";

export async function fetchServerApi<T>(endpoint: string, tags?: string[]): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json"
    },
    next: {
      tags: tags ?? getTagsForEndpoint(endpoint)
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}
