import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://solar-inventory.azurewebsites.net/api";

export interface ProductPrice {
  id: string;
  sku: string | null;
  name: string;
  price: number | null;
}

/** Returns a map of SKU → price (€ ex. VAT).
 *  Falls back to an empty map on network failure so the app still works. */
export function useProductPrices(): {
  pricesBySku: Record<string, number>;
  loading: boolean;
} {
  const [pricesBySku, setPricesBySku] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/products`)
      .then((r) => r.json())
      .then((products: ProductPrice[]) => {
        if (cancelled) return;
        const map: Record<string, number> = {};
        for (const p of products) {
          if (p.sku) {
            // Use 0 as fallback so price columns always appear even for unpriced items
            map[p.sku] = p.price ?? 0;
          }
        }
        setPricesBySku(map);
      })
      .catch((err) => {
        console.warn("Could not fetch product prices:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { pricesBySku, loading };
}
