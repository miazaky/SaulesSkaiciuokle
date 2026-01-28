import { groundSystemMaterials, roofSystemMaterials } from "./systemMaterials";
import { CalculatorInput } from "./types";

export type CalculatedSystemMaterial = {
  code: string;
  name: string;
  quantity: number;
  length: number | null;
  note?: string;
};

export function calculateSystemMaterials(input: CalculatorInput): CalculatedSystemMaterial[] {
  const materials =
    input.batteryType === "ploksciasStogas"
      ? roofSystemMaterials
      : groundSystemMaterials;

  return materials.map((row) => ({
    code: typeof row.code === "function" ? row.code(input) : row.code,
    name: row.name,
    quantity: row.calculateQuantity(input),
    length: row.calculateLength ? row.calculateLength(input) : row.length ?? null,
    note: row.note ?? "",
  }));
}
