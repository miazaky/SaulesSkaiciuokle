import { CalculatorInput } from "./types";
import { solarGroundFurnitureMaterials } from "../config/furnitureMaterials";
import { furnitureRegistry } from "./solarGround/furnitureRegistry";
import { registry as formulaRegistry } from "./solarGround/formulaRegistry";

export type CalculatedFurnitureMaterial = {
  name: string;
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

    let displayName = m.name;
    if (m.skuFormula) {
      const sku = String(formulaRegistry[m.skuFormula]?.(input) ?? "");
      displayName = `${m.name} (${sku})`;
    }

    return {
      name: displayName,
      quantity: qty,
      note: m.note ?? "",
    };
  });
}
