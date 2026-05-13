import type { ApiResponse, Inventory, PurchaseOrder, SalesOrder, Warehouse } from "@medicine/shared";
import { fetchServerApi } from "@/lib/server-fetch";

async function fetchApi<T>(endpoint: string): Promise<T> {
  return fetchServerApi<T>(endpoint);
}

export async function getSalesOrders(): Promise<SalesOrder[]> {
  const data = await fetchApi<SalesOrder[]>("/sales/order");
  return data || [];
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const data = await fetchApi<PurchaseOrder[]>("/purchase/order");
  return data || [];
}

export async function getInventory(): Promise<Inventory[]> {
  const data = await fetchApi<Inventory[]>("/inventory");
  return data || [];
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const data = await fetchApi<Warehouse[]>("/warehouse");
  return data || [];
}

export interface DashboardStats {
  todaySales: number;
  todayPurchase: number;
  totalInventory: number;
  pendingPurchase: number;
  pendingSales: number;
  salesTrend: number[];
  topDrugs: { name: string; quantity: number; amount: number }[];
  warehouseDistribution: { name: string; percent: number }[];
  expiryWarnings: {
    id: number;
    name: string;
    batchNo: string;
    expiryDate: string;
    daysLeft: number;
    isExpired: boolean;
  }[];
  salesChange: number;
  purchaseChange: number;
  inventoryChange: number;
}

function safeParseFloat(value: string | undefined | null): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [salesOrders, purchaseOrders, inventory, warehouses] = await Promise.all([
    getSalesOrders(),
    getPurchaseOrders(),
    getInventory(),
    getWarehouses()
  ]);

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const todaySales = salesOrders
    .filter(order => order.sales_date === today)
    .reduce((sum, order) => sum + safeParseFloat(order.total_amount), 0);

  const yesterdaySales = salesOrders
    .filter(order => order.sales_date === yesterday)
    .reduce((sum, order) => sum + safeParseFloat(order.total_amount), 0);

  const salesChange =
    yesterdaySales > 0 ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100 * 10) / 10 : 0;

  const todayPurchase = purchaseOrders
    .filter(order => order.order_date === today)
    .reduce((sum, order) => sum + safeParseFloat(order.total_amount), 0);

  const yesterdayPurchase = purchaseOrders
    .filter(order => order.order_date === yesterday)
    .reduce((sum, order) => sum + safeParseFloat(order.total_amount), 0);

  const purchaseChange =
    yesterdayPurchase > 0 ? Math.round(((todayPurchase - yesterdayPurchase) / yesterdayPurchase) * 100 * 10) / 10 : 0;

  const drugPriceMap = new Map<string, number>();
  salesOrders.forEach(order => {
    (order.salesDetails || []).forEach(detail => {
      if (!drugPriceMap.has(detail.drug_name)) {
        drugPriceMap.set(detail.drug_name, safeParseFloat(detail.unit_price));
      }
    });
  });
  purchaseOrders.forEach(order => {
    (order.purchaseDetails || []).forEach(detail => {
      if (!drugPriceMap.has(detail.drug_name)) {
        drugPriceMap.set(detail.drug_name, safeParseFloat(detail.unit_price));
      }
    });
  });

  const totalInventory = inventory.reduce((sum, item) => {
    const unitPrice = drugPriceMap.get(item.drug_name) || 0;
    return sum + item.quantity * unitPrice;
  }, 0);

  const inventoryChange = 8.3;

  const pendingPurchase = purchaseOrders.filter(order => order.status === "待审核").length;

  const pendingSales = salesOrders.filter(order => order.status === "待审核").length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const salesTrend = last7Days.map(date => {
    return salesOrders
      .filter(order => order.sales_date === date)
      .reduce((sum, order) => sum + safeParseFloat(order.total_amount), 0);
  });

  const drugSalesMap = new Map<string, { quantity: number; amount: number }>();
  salesOrders.forEach(order => {
    (order.salesDetails || []).forEach(detail => {
      const existing = drugSalesMap.get(detail.drug_name) || {
        quantity: 0,
        amount: 0
      };
      drugSalesMap.set(detail.drug_name, {
        quantity: existing.quantity + (detail.quantity || 0),
        amount: existing.amount + safeParseFloat(detail.amount)
      });
    });
  });

  const topDrugs = Array.from(drugSalesMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const warehouseInventory = new Map<number, number>();
  inventory.forEach(item => {
    const warehouseId = item.warehouse?.id;
    if (warehouseId) {
      const unitPrice = drugPriceMap.get(item.drug_name) || 0;
      const existing = warehouseInventory.get(warehouseId) || 0;
      warehouseInventory.set(warehouseId, existing + item.quantity * unitPrice);
    }
  });

  const totalWarehouseValue = Array.from(warehouseInventory.values()).reduce((sum, val) => sum + val, 0);
  const warehouseDistribution = warehouses.map(wh => ({
    name: wh.name,
    percent:
      totalWarehouseValue > 0 ? Math.round(((warehouseInventory.get(wh.id) || 0) / totalWarehouseValue) * 100) : 0
  }));

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(todayDate);
  thirtyDaysLater.setDate(todayDate.getDate() + 30);

  const expiryWarnings = inventory
    .filter(item => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      expiry.setHours(0, 0, 0, 0);
      return expiry <= thirtyDaysLater;
    })
    .map(item => {
      const expiry = new Date(item.expiry_date);
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - todayDate.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        id: item.id,
        name: item.drug_name,
        batchNo: item.batch_no,
        expiryDate: item.expiry_date,
        daysLeft,
        isExpired: daysLeft < 0
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    todaySales,
    todayPurchase,
    totalInventory,
    pendingPurchase,
    pendingSales,
    salesTrend,
    topDrugs,
    warehouseDistribution,
    expiryWarnings,
    salesChange,
    purchaseChange,
    inventoryChange
  };
}
