const DEFAULT_API_BASE_URL = "http://localhost:3001/api";

function normalizeApiBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

export const API_BASE_URL = normalizeApiBaseUrl(configuredApiBaseUrl);
