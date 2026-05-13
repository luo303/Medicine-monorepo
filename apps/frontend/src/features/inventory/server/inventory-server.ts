import type { Inventory, InventoryFlow } from "@/types/inventory";
import type { PurchaseStorage } from "@/types/purchase";
import type { SalesOutboundRecord } from "@/types/sales";
import { fetchServerApi } from "@/lib/server-fetch";

async function fetchApi<T>(endpoint: string): Promise<T> {
  return fetchServerApi<T>(endpoint);
}

export async function getInventories(): Promise<Inventory[]> {
  return fetchApi<Inventory[]>("/inventory");
}

export async function getInventory(id: number): Promise<Inventory> {
  return fetchApi<Inventory>(`/inventory/${id}`);
}

export async function getInventoryFlows(): Promise<InventoryFlow[]> {
  const [purchaseStorages, salesOutbounds] = await Promise.all([
    fetchApi<PurchaseStorage[]>("/purchase/storage"),
    fetchApi<SalesOutboundRecord[]>("/sales/outbound")
  ]);

  const flows: InventoryFlow[] = [];
  let idCounter = 1;

  purchaseStorages.forEach(storage => {
    flows.push({
      id: idCounter++,
      date: storage.storage_date,
      type: "采购入库",
      order_no: storage.orderNo,
      drug_name: storage.drug_name,
      batch_no: storage.batch_no,
      quantity: storage.quantity,
      operator: storage.inspector || "系统",
      warehouse_code: storage.warehouse_code,
      location_code: storage.location_code
    });
  });

  salesOutbounds.forEach(outbound => {
    flows.push({
      id: idCounter++,
      date: outbound.outbound_date,
      type: "销售出库",
      order_no: outbound.orderNo,
      drug_name: outbound.drug_name,
      batch_no: "",
      quantity: -outbound.quantity,
      operator: outbound.salesperson || "系统",
      warehouse_code: outbound.warehouse_code,
      location_code: outbound.location_code
    });
  });

  return flows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
