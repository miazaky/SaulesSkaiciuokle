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

const getProfileLength = (i: CalculatorInput): 4200 | 5200 =>
  Number(i.profileLength) === 4200 ? 4200 : 5200;

const polineR2Qty = (i: CalculatorInput) => {
  const leg = calcLegCount(i.constructionLength);
  const gegneCode = calcGegneCode(i.moduleLength);
  return gegneCode === "GG-1" || gegneCode === "GG-2" ? leg : 0;
};

export const registry: Record<string, FormulaFn> = {
  k1Code: (i) => (i.batteryType === "ezys" ? "K-1E" : "K-1"),
  k2Code: (i) => (i.batteryType === "ezys" ? "K-2E" : "K-2"),

  k1Length: (i) => (i.batteryType === "ezys" ? 1200 : 2700),
  k2Length: (i) => (i.batteryType === "ezys" ? 2400 : 3900),

  legCount: (i) => calcLegCount(i.constructionLength),

  rysys: (i) => calcRysys(i.moduleCount, i.moduleWidth),

  gegneCode: (i) => calcGegneCode(i.moduleLength),
  gegneLength: (i) => calcGegneLength(i.moduleLength),

  grebestasQty: (i) => calcGrebestas(i.constructionLength, getProfileLength(i)),

  extraGrebestasQty: (i) =>
    calcExtraGrebestasQty(i.constructionLength, getProfileLength(i)),
  extraGrebestasLength: (i) =>
    calcExtraGrebestasLength(i.constructionLength, getProfileLength(i)),

  // Current  templates use Gb-1/Gb-1* for 5200mm profiles too.
  gb2Qty: () => 0,

  gb2ExtraQty: () => 0,
  gb2ExtraLength: (i) =>
    calcExtraGrebestasLength(i.constructionLength, 5200),

  grebestuJungtysQty: (i) => {
    const profile = getProfileLength(i);
    const j11 = calcGrebestas(i.constructionLength, profile);
    const j12 = calcExtraGrebestasQty(i.constructionLength, profile);
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

  // M10 kompl. (2sud.)
  varztasM10_2: (i) => {
    const r1 = calcRysys(i.moduleCount, i.moduleWidth);
    const profile = getProfileLength(i);

    // Poline 4200  includes R-2 here; Poline 5200 moves it to M12.
    if (i.batteryType === "poline" && profile === 4200) {
      return r1 * 2 + polineR2Qty(i) * 2;
    }

    return r1 * 2;
  },

  // M12 kompl.
  varztasM12: (i) => {
    const leg = calcLegCount(i.constructionLength);
    const profile = getProfileLength(i);

    // Ezys : J5*2 + R-2*2, and R-2 equals the leg count.
    if (i.batteryType === "ezys") {
      return leg * 4;
    }

    // Poline 5200  moves R-2 from the M10 second set to M12.
    if (i.batteryType === "poline" && profile === 5200) {
      return (leg * 2) + (polineR2Qty(i) * 2);
    }

    return leg * 2;
  },

  clampGQty: () => 8,
  clampVQty: (i) => (i.moduleCount - 2) * 2,
  profileLength: (i) => getProfileLength(i),

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
