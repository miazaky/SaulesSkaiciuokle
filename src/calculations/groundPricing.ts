import { CalculatorInput } from "./types";
import type { Product } from "../api/inventoryApi";

export const GROUND_PRICE_PRODUCT_SKU_PREFIX = "__GROUND_PRICE__";

export type GroundSystemPricing = {
  code: string;
  name: string;
  moduleWidth: number;
  unitPrice: number;
};

type PriceMap = Record<string, number>;

export function isGroundSystem(input: CalculatorInput): boolean {
  return input.batteryType === "ezys" || input.batteryType === "poline";
}

export function isGroundPriceProduct(
  product: Pick<Product, "sku"> | null | undefined,
) {
  if (!product?.sku) return false;
  return normalizeSku(product.sku).startsWith(
    normalizeSku(GROUND_PRICE_PRODUCT_SKU_PREFIX),
  );
}

function normalizeSku(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ą]/g, "a")
    .replace(/[č]/g, "c")
    .replace(/[ęė]/g, "e")
    .replace(/[į]/g, "i")
    .replace(/[š]/g, "s")
    .replace(/[ųū]/g, "u")
    .replace(/[ž]/g, "z")
    .replace(/[^a-z0-9]+/g, "");
}

function getGroundPriceSku(input: CalculatorInput, pricesBySku: PriceMap): string | null {
  const systemCode = input.batteryType === "ezys" ? "EZ" : "POL";
  const width = String(input.moduleWidth);

  const expectedSkus = [
    `${GROUND_PRICE_PRODUCT_SKU_PREFIX}${systemCode}_${width}`,
    `${GROUND_PRICE_PRODUCT_SKU_PREFIX}_${systemCode}_${width}`,
    `__GROUND_PRICE_${systemCode}_${width}`,
  ];

  const expectedNormalized = new Set(expectedSkus.map(normalizeSku));

  for (const sku of Object.keys(pricesBySku)) {
    if (expectedNormalized.has(normalizeSku(sku))) {
      return sku;
    }
  }

  return null;
}

function getGroundPriceName(input: CalculatorInput): string {
  return input.batteryType === "ezys"
    ? "„Ežio“ tipo montavimo sistemos su strypais"
    : "Polinės montavimo sistemos";
}

export function getGroundSystemPricing(
  input: CalculatorInput,
  pricesBySku: PriceMap,
): GroundSystemPricing | null {
  if (!isGroundSystem(input)) {
    return null;
  }

  const sku = getGroundPriceSku(input, pricesBySku);
  if (!sku) {
    return null;
  }

  const unitPrice = pricesBySku[sku];
  if (!Number.isFinite(unitPrice)) {
    return null;
  }

  return {
    code: sku,
    name: getGroundPriceName(input),
    moduleWidth: input.moduleWidth,
    unitPrice,
  };
}

export function getGroundSystemTotal(
  input: CalculatorInput,
  pricesBySku: PriceMap,
): number {
  const pricing = getGroundSystemPricing(input, pricesBySku);
  if (!pricing) return 0;

  return pricing.unitPrice * input.moduleCount;
}
