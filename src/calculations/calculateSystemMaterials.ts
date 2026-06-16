import {
  groundSystemMaterials,
  roofSystemMaterials,
  type SystemMaterialDefinition,
} from "./systemMaterials";
import { CalculatorInput } from "./types";
import { solarGroundMaterials } from "../config/materials";
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

function normalizeFlatRoofFormulaInput(input: CalculatorInput): CalculatorInput {
  if (
    input.batteryType !== "ploksciasStogas" ||
    input.isEvenModules !== "true" ||
    !input.rowsCount ||
    input.moduleCount <= 0
  ) {
    return input;
  }

  const modulesPerRow = input.moduleCount / input.rowsCount;
  if (!Number.isFinite(modulesPerRow) || !Number.isInteger(modulesPerRow)) {
    return input;
  }

  return {
    ...input,
    moduleCount: modulesPerRow,
  };
}

function resolveSystemMaterial(
  input: CalculatorInput,
  row: SystemMaterialDefinition,
): CalculatedSystemMaterial {
  return {
    code: typeof row.code === "function" ? row.code(input) : row.code,
    name: row.name,
    quantity: row.calculateQuantity ? row.calculateQuantity(input) : 0,
    length: row.calculateLength
      ? row.calculateLength(input)
      : (row.length ?? null),
    note: row.note ?? "",
  };
}

function getSlaitinisRowModuleCounts(input: CalculatorInput): number[] {
  if (!input.rowModuleCounts?.length) {
    return [];
  }

  const rowsCount = Math.max(1, input.rowsCount || 1);

  return input.rowModuleCounts
    .slice(0, rowsCount)
    .map((count) => (Number.isFinite(count) ? count : 0));
}

function calculateSlaitinisSystemMaterials(
  input: CalculatorInput,
  rows: SystemMaterialDefinition[],
): CalculatedSystemMaterial[] {
  const rowModuleCounts = getSlaitinisRowModuleCounts(input);
  if (rowModuleCounts.length === 0) {
    return rows.map((row) => resolveSystemMaterial(input, row));
  }

  return rows.map((row) => {
    const firstRowInput = {
      ...input,
      rowsCount: 1,
      moduleCount: rowModuleCounts[0] ?? 0,
    };
    const material = resolveSystemMaterial(firstRowInput, row);

    return {
      ...material,
      quantity: rowModuleCounts.reduce((sum, moduleCount) => {
        const rowInput = { ...input, rowsCount: 1, moduleCount };
        return (
          sum + (row.calculateQuantity ? row.calculateQuantity(rowInput) : 0)
        );
      }, 0),
    };
  });
}

export function calculateSystemMaterials(
  input: CalculatorInput,
): CalculatedSystemMaterial[] {
  // Ground systems (ezys, poline)
  if (input.batteryType === "ezys" || input.batteryType === "poline") {
    return solarGroundMaterials
      .map((row) => ({
        code: resolveValue(input, row.code),
        name: row.name,
        quantity: resolveQuantity(input, row.qty),
        length: resolveLength(input, row.length),
        note: row.note ?? "",
      }))
      .filter((row) => row.quantity > 0);
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

  if (input.batteryType === "slaitinisStogas") {
    return calculateSlaitinisSystemMaterials(input, filtered);
  }

  const formulaInput = normalizeFlatRoofFormulaInput(input);

  return filtered.map((row) => resolveSystemMaterial(formulaInput, row));
}
