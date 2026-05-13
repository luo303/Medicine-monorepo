export const CACHE_TAGS = {
  drugs: "drugs",
  manufacturers: "manufacturers",
  institutions: "institutions",
  warehouses: "warehouses",
  storageLocations: "storage-locations",
  inventories: "inventories",
  purchaseOrders: "purchase-orders",
  purchaseDetails: "purchase-details",
  purchaseStorages: "purchase-storages",
  salesOrders: "sales-orders",
  salesDetails: "sales-details",
  salesOutbounds: "sales-outbounds",
  knowledgeFiles: "knowledge-files"
} as const;

export function getTagsForEndpoint(endpoint: string): string[] {
  if (endpoint.startsWith("/drug")) {
    return [CACHE_TAGS.drugs];
  }

  if (endpoint.startsWith("/manufacturer")) {
    return [CACHE_TAGS.manufacturers];
  }

  if (endpoint.startsWith("/MedicalInstitution")) {
    return [CACHE_TAGS.institutions];
  }

  if (endpoint.startsWith("/warehouse")) {
    return [CACHE_TAGS.warehouses];
  }

  if (endpoint.startsWith("/storage-location")) {
    return [CACHE_TAGS.storageLocations];
  }

  if (endpoint.startsWith("/inventory")) {
    return [CACHE_TAGS.inventories];
  }

  if (endpoint.startsWith("/purchase/order")) {
    return [CACHE_TAGS.purchaseOrders];
  }

  if (endpoint.startsWith("/purchase/detail")) {
    return [CACHE_TAGS.purchaseDetails];
  }

  if (endpoint.startsWith("/purchase/storage")) {
    return [CACHE_TAGS.purchaseStorages];
  }

  if (endpoint.startsWith("/sales/order")) {
    return [CACHE_TAGS.salesOrders];
  }

  if (endpoint.startsWith("/sales/detail")) {
    return [CACHE_TAGS.salesDetails];
  }

  if (endpoint.startsWith("/sales/outbound")) {
    return [CACHE_TAGS.salesOutbounds];
  }

  if (endpoint.startsWith("/knowledge/files")) {
    return [CACHE_TAGS.knowledgeFiles];
  }

  return [];
}
