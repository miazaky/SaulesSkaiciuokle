import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE as string;

type ReadonlyResult<T> =
  | { readonly: false; data: null; loading: false; error: null }
  | { readonly: true; data: null; loading: true; error: null }
  | { readonly: true; data: T; loading: false; error: null }
  | { readonly: true; data: null; loading: false; error: string };

/**
 * When ?readonly=true&orderId=<id> is in the URL,
 * fetches the order from the inventory API and returns its stepsJson parsed.
 */
export function useReadonlyMode<T = Record<string, unknown>>(): ReadonlyResult<T> {
  const [searchParams] = useSearchParams();
  const isReadonly = searchParams.get("readonly") === "true";
  const orderId = searchParams.get("orderId");

  const [state, setState] = useState<ReadonlyResult<T>>(
    isReadonly
      ? { readonly: true, data: null, loading: true, error: null }
      : { readonly: false, data: null, loading: false, error: null }
  );

  useEffect(() => {
    if (!isReadonly || !orderId) {
      if (isReadonly && !orderId)
        setState({ readonly: true, data: null, loading: false, error: "Trūksta orderId parametro." });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/Orders/${orderId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const order = await res.json();
        if (cancelled) return;
        if (!order.stepsJson) {
          setState({ readonly: true, data: null, loading: false, error: "Šis užsakymas neturi skaičiuoklės duomenų." });
          return;
        }
        const parsed = JSON.parse(order.stepsJson) as T;
        setState({ readonly: true, data: parsed, loading: false, error: null });
      } catch (e) {
        if (!cancelled)
          setState({ readonly: true, data: null, loading: false, error: "Nepavyko gauti užsakymo duomenų." });
      }
    })();

    return () => { cancelled = true; };
  }, [isReadonly, orderId]);

  return state;
}
