import type { ApiResponse } from "@medicine/shared";
import type { Inventory, InventoryFlow } from "@/types/inventory";
import type { PurchaseStorage } from "@/types/purchase";
import type { SalesOutbound } from "@/types/sales";
import { API_BASE_URL } from "@/lib/api-config";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
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
    fetchApi<SalesOutbound[]>("/sales/outbound")
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
    (outbound.details || []).forEach(detail => {
      flows.push({
        id: idCounter++,
        date: outbound.outbound_date,
        type: "销售出库",
        order_no: outbound.order_no,
        drug_name: detail.drug_name,
        batch_no: detail.batch_number,
        quantity: -detail.outbound_quantity,
        operator: outbound.salesperson || "系统"
      });
    });
  });

  return flows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
