import { gegneCodeRules, gegneLengthByCode, grebestasRules, grebestuJungtysRules, legCountRules, rysysRules } from "../../config/rules";
import { rangeLookup } from "../utils/rangeLookup";


/** J5/J6 */
export function calcLegCount(constructionLength: number): number {
  return rangeLookup(
    constructionLength,
    legCountRules,
    "Klaida: constructionLength viršija 32000"
  );
}

/** J8 */
export function calcRysys(moduleCount: number): number {
  return rangeLookup(moduleCount, rysysRules, "Klaida: netinkamas modulių kiekis");
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

/** J11 */
export function calcGrebestas(
  constructionLength: number,
  profileLength: 4200 | 5200
): number {
  const steps = Math.floor(constructionLength / profileLength); // 0..∞

  if (steps <= 0) return 0;

  // Excel limits:
  // 4200: allowed up to 7 (=> 28), error from 8+
  // 5200: allowed up to 6 (=> 24), error from 7+
  const maxSteps = profileLength === 4200 ? 7 : 6;

  if (steps > maxSteps) {
    throw new Error("Klaida: per didelis konstrukcijos ilgis (grebėstai)");
  }

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
