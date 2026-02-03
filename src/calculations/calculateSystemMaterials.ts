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

function resolveLength(
  input: CalculatorInput,
  spec: number | null | { from: string },
) {
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

function resolveQuantity(input: CalculatorInput, key: string) {
  const v = registry[key]?.(input);
  if (v === null || v === undefined || v === "") return 0;

  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function calculateSystemMaterials(
  input: CalculatorInput,
): CalculatedSystemMaterial[] {
  // Ground systems (ezys, poline)
  if (input.batteryType === "ezys" || input.batteryType === "poline") {
    return solarGroundMaterials.map((row) => ({
      code: resolveValue(input, row.code),
      name: row.name,
      quantity: resolveQuantity(input, row.qty),
      length: resolveLength(input, row.length),
      note: row.note ?? "",
    }));
  }

  // Roof systems
  const materials =
    input.batteryType === "ploksciasStogas" ||
    input.batteryType === "slaitinisStogas"
      ? roofSystemMaterials
      : groundSystemMaterials;

  const filtered = materials.filter((row) => {
    if (input.batteryType === "slaitinisStogas") {
      if (row.systems) return false;
      return row.mountingMethods?.includes(input.mountingMethod) ?? false;
    }

    // Plokscias stogas
    if (!row.systems) return false;

    if (!row.systems.includes(input.system)) {
      return false;
    }

    if (row.orientation && !row.orientation.includes(input.orientation)) {
      return false;
    }

    if (row.construction) {
      return row.construction.includes(input.moduleConstruction);
    }

    return true;
  });

  return filtered.map((row) => ({
    code: typeof row.code === "function" ? row.code(input) : row.code,
    name: row.name,
    quantity: row.calculateQuantity ? row.calculateQuantity(input) : 0,
    length: row.calculateLength
      ? row.calculateLength(input)
      : (row.length ?? null),
    note: row.note ?? "",
  }));
}
