import { groundSystemMaterials, roofSystemMaterials } from "./systemMaterials";
import { CalculatorInput } from "./types";
import { solarGroundMaterials } from "../config/solarGround/materials";
import { registry } from "./solarGround/formulaRegistry";

export type CalculatedSystemMaterial = {
  code: string;
  name: string;
  quantity: number;
  length: number | null;
  note?: string;
};

function resolveValue(input: CalculatorInput, spec: string | { from: string }) {
  if (typeof spec === "string") {
    return spec;
  }
  const v = registry[spec.from]?.(input);
  return v == null ? "" : String(v);
}

function resolveLength(input: CalculatorInput, spec: number | null | { from: string }) {
  if (spec === null) {
    return null;
  }
  if (typeof spec === "number") {
    return spec;
  }

  const v = registry[spec.from]?.(input);
  if (v === null || v === undefined || v === "") return null;

  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function calculateSystemMaterials(input: CalculatorInput): CalculatedSystemMaterial[] {
  const materials = input.batteryType === "ploksciasStogas"
      ? roofSystemMaterials
      : groundSystemMaterials;

  if (materials == groundSystemMaterials){
    return solarGroundMaterials
    .map((m) => {
      const qtyVal = registry[m.qty]?.(input);
      const qty = Number(qtyVal);

      if (!Number.isFinite(qty)) {
        throw new Error(`Formula '${m.qty}' returned non-number: ${String(qtyVal)}`);
      }

      return {
        code: resolveValue(input, m.code),
        name: m.name,
        quantity: qty,
        length: resolveLength(input, m.length),
        note: m.note ?? "",
      };
    })
    .filter((row) => row.quantity !== 0);
  }
  else{
    return materials.map((row) => ({
      code: typeof row.code === "function" ? row.code(input) : row.code,
      name: row.name,
      quantity: row.calculateQuantity(input),
      length: row.calculateLength ? row.calculateLength(input) : row.length ?? null,
      note: row.note ?? "",
    }));
  }
}
