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

export interface SavePdfResponse {
  url: string;
}

export const inventoryApi = {
  getWarehouses: () => apiFetch<Warehouse[]>("/api/warehouses"),

  getProducts: () => apiFetch<Product[]>("/api/Products"),

  createOutbound: (data: CreateTransactionCommand) =>
    apiFetch<string>("/api/InventoryTransactions/outbound", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Upload the commercial proposal PDF for a given order.
   * `pdfBase64` should be the data-URI string returned by jsPDF's output("datauristring").
   * The backend stores the PDF in blob storage and saves the URL on the Order entity.
   * Returns the blob URL.
   */
  savePdf: (orderId: string, pdfBase64: string) =>
    apiFetch<SavePdfResponse>(`/orders/${orderId}/pdf`, {
      method: "POST",
      body: JSON.stringify({ data: pdfBase64 }),
    }),
};
