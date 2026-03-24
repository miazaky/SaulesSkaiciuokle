const BASE_URL = import.meta.env.VITE_API_BASE;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  code?: string;
  sku?: string;
}

export interface CreateTransactionCommand {
  warehouseId: string;
  productId: string;
  quantity: number;
}

export const inventoryApi = {
  getWarehouses: () => apiFetch<Warehouse[]>("/api/warehouses"),
  getProducts: () => apiFetch<Product[]>("/api/Products"),
  createOutbound: (data: CreateTransactionCommand) =>
    apiFetch<string>("/api/InventoryTransactions/outbound", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
