import { CalculatorInput } from "./types";
import { solarGroundFurnitureMaterials } from "../config/furnitureMaterials";
import { furnitureRegistry } from "./solarGround/furnitureRegistry";

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

    return {
      name: m.name,
      quantity: qty,
      note: m.note ?? "",
    };
  });
}
