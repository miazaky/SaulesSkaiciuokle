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

export interface ZemesPdfParams {
  moduleCount: number;
  moduleWidth: number;
  profileLength: number;
  ggCode: string;
  systemType: string;
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
  savePdf: (orderId: string, pdfBase64: string, buyerName: string) =>
    apiFetch<SavePdfResponse>(`/orders/${orderId}/pdf`, {
      method: "POST",
      body: JSON.stringify({ data: pdfBase64, buyerName }),
    }),

  /**
   * Triggers the backend to email the employer with attachments:
   *   1. The order PDF already saved in blob storage.
   *   2. Montavimo_vadovas.docx from blob storage.
   *   3. (For Žemės systems) The matching installation PDF, e.g. "8 mod 1134 4200 GG-0 ezys.pdf".
   * Buyer info is loaded server-side from the Order — only the optional zemes params need sending.
   */
  /**
   * Saves the solar module parameters (count, width, length) on the order entity.
   * Called immediately after order creation so the inventory system can use
   * these values when sending the offer email without re-prompting the user.
   */
  updateModuleParams: (orderId: string, params: { moduleCount: number; moduleArea: number; moduleLength: number }) =>
    apiFetch<void>(`/orders/${orderId}/module-params`, {
      method: "PATCH",
      body: JSON.stringify(params),
    }),

  sendProposalEmail: (orderId: string, zemesPdf?: ZemesPdfParams) =>
    apiFetch<void>(`/orders/${orderId}/send-proposal-email`, {
      method: "POST",
      body: JSON.stringify(zemesPdf
        ? {
            moduleCount: zemesPdf.moduleCount,
            moduleWidth: zemesPdf.moduleWidth,
            profileLength: zemesPdf.profileLength,
            ggCode: zemesPdf.ggCode,
            systemType: zemesPdf.systemType,
          }
        : {}),
    }),
};