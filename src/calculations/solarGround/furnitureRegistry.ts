import { CalculatorInput } from "../types";
import { registry as sys } from "./formulaRegistry";

export type FormulaValue = string | number | null;
export type FormulaFn = (i: CalculatorInput) => FormulaValue;

const byBattery = <T extends number | string | null>(
  ezys: T | ((i: CalculatorInput) => T),
  poline: T | ((i: CalculatorInput) => T)
) => {
  return (i: CalculatorInput) => {
    const v = i.batteryType === "ezys" ? ezys : poline;
    return typeof v === "function" ? (v as any)(i) : v;
  };
};

const n = (v: FormulaValue) => {
  const num = Number(v);
  if (!Number.isFinite(num)) throw new Error(`Furniture formula returned non-number: ${String(v)}`);
  return num;
};

export const furnitureRegistry: Record<string, FormulaFn> = {
  furn_end_clamp: (i) => n(sys.clampGQty(i)), // 8
  furn_mid_clamp: (i) => n(sys.clampVQty(i)), // (moduleCount-2)*2

  furn_m8_bolt: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),
  furn_m8_spring_washer: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),

  furn_alu_plate: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),
  furn_rhombic_lock: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),
  furn_rhombic_nut: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),

  furn_m10_bolt: (i) => {
    const m10 = byBattery(n(sys.varztasM10_1(i)), n(sys.varztasM10_1(i)) + n(sys.varztasM10_2(i)));
    return n(m10(i));
  },

  furn_m10_washer: (i) => {
    const m10 = byBattery(n(furnitureRegistry.furn_m10_bolt(i)) * 2, n(sys.varztasM10_1(i)) * 2 + n(sys.varztasM10_2(i)));
    return n(m10(i));
  },
  furn_m10_flange_nut: (i) => n(furnitureRegistry.furn_m10_bolt(i)),

  furn_m12_bolt: (i) => n(sys.varztasM12(i)),
  furn_m12_washer: (i) => n(sys.varztasM12(i)) * 2,
  furn_m12_spring_washer: (i) => n(sys.varztasM12(i)),
  furn_m12_nut: (i) => n(sys.varztasM12(i)),
};
