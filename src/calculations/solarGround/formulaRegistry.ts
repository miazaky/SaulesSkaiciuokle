import { CalculatorInput } from "../types";
import {
  calcExtraGrebestasLength,
  calcExtraGrebestasQty,
  calcGegneCode,
  calcGegneLength,
  calcGrebestas,
  calcGrebestuJungtys,
  calcLegCount,
  calcRysys,
} from "./formulas";

export type FormulaValue = string | number | null;
export type FormulaFn = (i: CalculatorInput) => FormulaValue;

export const registry: Record<string, FormulaFn> = {
  k1Code: (i) => (i.batteryType === "ezys" ? "K-1E" : "K-1"),
  k2Code: (i) => (i.batteryType === "ezys" ? "K-2E" : "K-2"),

  k1Length: (i) => (i.batteryType === "ezys" ? 1200 : 2700),
  k2Length: (i) => (i.batteryType === "ezys" ? 2400 : 3900),

  legCount: (i) => calcLegCount(i.constructionLength),
  rysys: (i) => calcRysys(i.moduleCount),

  gegneCode: (i) => calcGegneCode(i.moduleLength),
  gegneLength: (i) => calcGegneLength(i.moduleLength),

  grebestasQty: (i) => calcGrebestas(i.constructionLength),
  extraGrebestasQty: (i) => calcExtraGrebestasQty(i.constructionLength),
  extraGrebestasLength: (i) => calcExtraGrebestasLength(i.constructionLength),

  grebestuJungtysQty: (i) => {
    const j11 = calcGrebestas(i.constructionLength);
    const j12 = calcExtraGrebestasQty(i.constructionLength);
    return calcGrebestuJungtys(j11, j12);
  },

  // POLINE neturi strypų
  strypaiQty: (i) => {
    if (i.batteryType === "poline") {
      return 0;
    }
    const j5 = calcLegCount(i.constructionLength);
    const j6 = j5;
    return (j5 + j6) * 4;
  },

  rysysR2Qty: (i) => calcLegCount(i.constructionLength),

  varztasM10_1: (i) => {
    const j10 = calcLegCount(i.constructionLength);
    const j13 = registry.grebestuJungtysQty(i) as number;
    return j10 * 4 + j13 * 4;
  },

  varztasM10_2: (i) => {
    const r1 = calcRysys(i.moduleCount);
    const r2 = calcLegCount(i.constructionLength);

    if (i.batteryType === "poline") {
      return r1 * 2 + r2 * 2;
    }

    return r1 * 2;
  },

  varztasM12: (i) => {
    const leg = calcLegCount(i.constructionLength);

    if (i.batteryType === "poline") {
      return leg * 2;
    }

    return leg * 4;
  },

  clampGQty: () => 8,
  clampVQty: (i) => (i.moduleCount - 2) * 2,
};
