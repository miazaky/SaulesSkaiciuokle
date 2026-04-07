import { gegneCodeRules, gegneLengthByCode, grebestuJungtysRules, legCountRules, rysysRules, rysysRules1303 } from "../../config/rules";
import { rangeLookup } from "../utils/rangeLookup";


/** J5/J6 */
export function calcLegCount(constructionLength: number): number {
  return rangeLookup(
    constructionLength,
    legCountRules,
    "Klaida: constructionLength viršija 32000"
  );
}

/** J8 – width-aware */
export function calcRysys(moduleCount: number, moduleWidth: number = 1134): number {
  const rules = moduleWidth === 1303 ? rysysRules1303 : rysysRules;
  return rangeLookup(moduleCount, rules, "Klaida: netinkamas modulių kiekis");
}

/** J10 code */
export function calcGegneCode(moduleLength: number): string {
  return rangeLookup(moduleLength, gegneCodeRules, "Klaida: netinkamas modulio ilgis");
}

/** J10 length */
export function calcGegneLength(moduleLength: number): number | null {
  const code = calcGegneCode(moduleLength);
  return gegneLengthByCode[code] ?? null;
}

/** J11 – Gb-1: standard profileLength pieces (4200mm or 5200mm) */
export function calcGrebestas(
  constructionLength: number,
  profileLength: 4200 | 5200
): number {
  const steps = Math.floor(constructionLength / profileLength);

  if (steps <= 0) return 0;

  // Excel limits:
  // 4200: allowed up to 7 steps (=> 28 pieces), error from 8+
  // 5200: allowed up to 6 steps (=> 24 pieces), error from 7+
  const maxSteps = profileLength === 4200 ? 7 : 6;

  if (steps > maxSteps) {
    throw new Error("Klaida: per didelis konstrukcijos ilgis (grebėstai)");
  }

  return steps * 4;
}

/**
 * Gb-2 qty: second 5200mm grebėstas profile used in the 1303mm-width ezys / 5200mm system.
 * Excel formula: =IF(D11/5200=1;4; IF(D11/5200=2;8; ... IF(D11/5200<1;0; IF(D11/5200<2;4; ...))))
 * Logic: floor(constructionLength / 5200) * 4, capped at 6 steps (24 pieces max).
 */
export function calcGb2(constructionLength: number): number {
  const steps = Math.floor(constructionLength / 5200);
  if (steps <= 0) return 0;
  if (steps > 6) throw new Error("Klaida: per didelis konstrukcijos ilgis (Gb-2)");
  return steps * 4;
}

/** J12 qty */
export function calcExtraGrebestasQty(constructionLength: number, profileLength: 4200 | 5200): number {
  const k12 = calcExtraGrebestasLength(constructionLength, profileLength);
  return k12 === 0 ? 0 : 4;
}

/** J12 length */
export function calcExtraGrebestasLength(constructionLength: number, profileLength: 4200 | 5200): number {
  const j11 = calcGrebestas(constructionLength, profileLength);
  const remainder = constructionLength - (j11 / 4) * profileLength;

  if (remainder === 0) {
    return 0;
  }
  if (remainder < 300) {
    return 300;
  }
  return remainder;
}

/** J13 */
export function calcGrebestuJungtys(j11: number, j12: number): number {
  return rangeLookup(j11 + j12, grebestuJungtysRules, "Klaida: per daug grebėstų");
}
