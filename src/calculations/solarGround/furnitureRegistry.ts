import { CalculatorInput } from "../types";
import { registry as sys } from "./formulaRegistry";

export type FormulaValue = string | number | null;
export type FormulaFn = (i: CalculatorInput) => FormulaValue;

const n = (v: FormulaValue) => {
  const num = Number(v);
  if (!Number.isFinite(num)) throw new Error(`Furniture formula returned non-number: ${String(v)}`);
  return num;
};

const profileLength = (i: CalculatorInput) =>
  Number(i.profileLength) === 4200 ? 4200 : 5200;

const includeSecondM10Set = (i: CalculatorInput) =>
  !(i.batteryType === "ezys" && profileLength(i) === 4200);

const secondM10Set = (i: CalculatorInput) =>
  includeSecondM10Set(i) ? n(sys.varztasM10_2(i)) : 0;

export const furnitureRegistry: Record<string, FormulaFn> = {
  furn_end_clamp: (i) => n(sys.clampGQty(i)), // 8
  furn_mid_clamp: (i) => n(sys.clampVQty(i)), // (moduleCount-2)*2

  furn_m8_bolt: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),
  furn_m8_spring_washer: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),

  furn_alu_plate: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),
  furn_rhombic_lock: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),
  furn_rhombic_nut: (i) => n(sys.clampGQty(i)) + n(sys.clampVQty(i)),

  // M10 varžtas:
  //   ezys 4200mm -> first set only
  //   ezys 5200mm and poline -> first + second set
  furn_m10_bolt: (i) => {
    const firstSet = n(sys.varztasM10_1(i));
    const secondSet = secondM10Set(i);
    return firstSet + secondSet;
  },

  // M10 poveržlės:
  //   ezys 4200mm -> first set * 2
  //   ezys 5200mm and poline -> first set * 2 + second set
  furn_m10_washer: (i) => {
    const firstSet = n(sys.varztasM10_1(i));
    const secondSet = secondM10Set(i);
    return firstSet * 2 + secondSet;
  },

  // M10 veržlė su sijonėliu = same as M10 varžtas
  furn_m10_flange_nut: (i) => n(furnitureRegistry.furn_m10_bolt(i)),

  furn_m12_bolt: (i) => n(sys.varztasM12(i)),
  furn_m12_washer: (i) => n(sys.varztasM12(i)) * 2,
  furn_m12_spring_washer: (i) => n(sys.varztasM12(i)),
  furn_m12_nut: (i) => n(sys.varztasM12(i)),
};
