import { CalculatorInput } from "../types";
import {
  calcExtraGrebestasLength,
  calcExtraGrebestasQty,
  calcGb2,
  calcGegneCode,
  calcGegneLength,
  calcGrebestas,
  calcGrebestuJungtys,
  calcLegCount,
  calcRysys,
} from "./formulas";

export type FormulaValue = string | number | null;
export type FormulaFn = (i: CalculatorInput) => FormulaValue;

// Gb-2/Gb-2* system: only when 1303mm wide module AND 5200mm profile
const is1303ezys5200 = (i: CalculatorInput) =>
  i.moduleWidth === 1303 && i.batteryType === "ezys" && i.profileLength === 5200;

export const registry: Record<string, FormulaFn> = {
  k1Code: (i) => (i.batteryType === "ezys" ? "K-1E" : "K-1"),
  k2Code: (i) => (i.batteryType === "ezys" ? "K-2E" : "K-2"),

  k1Length: (i) => (i.batteryType === "ezys" ? 1200 : 2700),
  k2Length: (i) => (i.batteryType === "ezys" ? 2400 : 3900),

  legCount: (i) => calcLegCount(i.constructionLength),

  // Width-aware: 1303mm uses different breakpoints
  rysys: (i) => calcRysys(i.moduleCount, i.moduleWidth),

  gegneCode: (i) => calcGegneCode(i.moduleLength),
  gegneLength: (i) => calcGegneLength(i.moduleLength),

  // Gb-1: only for 1134mm systems — returns 0 for 1303mm ezys
  grebestasQty: (i) =>
    is1303ezys5200(i) ? 0 : calcGrebestas(i.constructionLength, i.profileLength),

  // Gb-1* remainder: only for 1134mm systems — returns 0 for 1303mm ezys
  extraGrebestasQty: (i) =>
    is1303ezys5200(i) ? 0 : calcExtraGrebestasQty(i.constructionLength, i.profileLength),
  extraGrebestasLength: (i) =>
    calcExtraGrebestasLength(i.constructionLength, i.profileLength),

  // Gb-2: main profile pieces for 1303mm ezys (always 5200mm); 0 for 1134mm
  gb2Qty: (i) =>
    is1303ezys5200(i) ? calcGb2(i.constructionLength) : 0,

  // Gb-2*: remainder piece for 1303mm ezys; 0 for 1134mm
  gb2ExtraQty: (i) =>
    is1303ezys5200(i) ? calcExtraGrebestasQty(i.constructionLength, 5200) : 0,
  gb2ExtraLength: (i) =>
    calcExtraGrebestasLength(i.constructionLength, 5200),

  grebestuJungtysQty: (i) => {
    if (is1303ezys5200(i)) {
      // For 1303mm ezys: J11 = Gb-2 qty, J12 = Gb-2* qty
      const j11 = calcGb2(i.constructionLength);
      const j12 = calcExtraGrebestasQty(i.constructionLength, 5200);
      return calcGrebestuJungtys(j11, j12);
    }
    // Standard: J11 = Gb-1, J12 = Gb-1* remainder
    const j11 = calcGrebestas(i.constructionLength, i.profileLength);
    const j12 = calcExtraGrebestasQty(i.constructionLength, i.profileLength);
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

  // J14 = J10*4 + J13*4
  varztasM10_1: (i) => {
    const j10 = calcLegCount(i.constructionLength);
    const j13 = registry.grebestuJungtysQty(i) as number;
    return j10 * 4 + j13 * 4;
  },

  // J15 = J8*2 = rysys*2 for all cases
  varztasM10_2: (i) => {
    const r1 = calcRysys(i.moduleCount, i.moduleWidth);
    return r1 * 2;
  },

  // (J5*2) + J8*2 = legCount*2 + legCount*2 = legCount*4 for all cases
  varztasM12: (i) => {
    const leg = calcLegCount(i.constructionLength);
    return leg * 4;
  },

  clampGQty: () => 8,
  clampVQty: (i) => (i.moduleCount - 2) * 2,
  profileLength: (i) => i.profileLength,

  clampGCode: (i) => {
    const isBlack = i.moduleColor === "juoda";
    const thickness = Number(i.moduleThickness);
    const t = thickness <= 30 ? 30 : 35;
    if (isBlack) return t === 30 ? "Clamp G30J" : "Clamp G35J";
    return t === 30 ? "Clamp G30" : "Clamp G35";
  },

  clampVCode: (i) => {
    const isBlack = i.moduleColor === "juoda";
    return isBlack ? "Clamp VJ" : "Clamp V";
  },
};
