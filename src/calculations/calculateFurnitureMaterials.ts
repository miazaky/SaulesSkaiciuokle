import { CalculatorInput } from "./types";
import { solarGroundFurnitureMaterials } from "../config/furnitureMaterials";
import { furnitureRegistry } from "./solarGround/furnitureRegistry";
import { registry as formulaRegistry } from "./solarGround/formulaRegistry";

export type CalculatedFurnitureMaterial = {
  name: string;   // i18n key or display name
  sku: string;    // clean SKU for price lookup and DB matching
  quantity: number;
  note?: string;
};

export function calculateFurnitureMaterials(input: CalculatorInput): CalculatedFurnitureMaterial[] {
  return solarGroundFurnitureMaterials.map((m) => {
    const qtyVal = furnitureRegistry[m.qty]?.(input);
    const qty = Number(qtyVal);

    if (!Number.isFinite(qty)) {
      throw new Error(`Furniture formula '${m.qty}' returned non-number: ${String(qtyVal)}`);
    }

    // Resolve dynamic SKU (e.g. Clamp G30/G35 based on thickness)
    const sku = m.skuFormula
      ? String(formulaRegistry[m.skuFormula]?.(input) ?? "")
      : extractSku(m.name);

    return {
      name: m.name,
      sku,
      quantity: qty,
      note: m.note ?? "",
    };
  });
}

function extractSku(name: string): string {
  const match = name.match(/\(([^)]+)\)$/);
  return match ? match[1] : "";
}
