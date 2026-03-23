import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

export interface ProductRecord {
  id: string;
  sku: string | null;
  name: string;
  price: number | null;
}

/** Returns a map of SKU → product record, for matching calculated materials to DB products. */
export function useProducts(): {
  productsBySku: Record<string, ProductRecord>;
  loading: boolean;
} {
  const [productsBySku, setProductsBySku] = useState<Record<string, ProductRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/products`)
      .then((r) => r.json())
      .then((products: ProductRecord[]) => {
        if (cancelled) return;
        const map: Record<string, ProductRecord> = {};
        for (const p of products) {
          if (p.sku) {
            map[p.sku] = p;
          }
        }
        setProductsBySku(map);
      })
      .catch((err) => {
        console.warn("Could not fetch products:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { productsBySku, loading };
}
