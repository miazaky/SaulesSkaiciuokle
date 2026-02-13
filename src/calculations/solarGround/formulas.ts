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
export function calcGrebestas(constructionLength: number): number {
  return rangeLookup(
    constructionLength,
    grebestasRules,
    "Klaida: per didelis konstrukcijos ilgis (grebėstai)"
  );
}

/** J12 qty */
export function calcExtraGrebestasQty(constructionLength: number): number {
  const k12 = calcExtraGrebestasLength(constructionLength);
  return k12 === 0 ? 0 : 4;
}

/** J12 length */
export function calcExtraGrebestasLength(constructionLength: number): number {
  const j11 = calcGrebestas(constructionLength);
  const remainder = constructionLength - (j11 / 4) * 4200;

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
