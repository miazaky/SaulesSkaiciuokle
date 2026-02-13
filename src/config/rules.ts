import { RangeRule } from "../calculations/utils/rangeLookup";

/** J5/J6 – Kojų skaičius pagal konstrukcijos ilgį */
export const legCountRules: RangeRule<number>[] = [
  { max: 4300, value: 2 },
  { max: 7200, value: 3 },
  { max: 10100, value: 4 },
  { max: 13000, value: 5 },
  { max: 15900, value: 6 },
  { max: 18800, value: 7 },
  { max: 21700, value: 8 },
  { max: 24600, value: 9 },
  { max: 27500, value: 10 },
  { max: 30400, value: 11 },
  { max: 32000, value: 12 },
];

/** J8 – Ryšys R-1 pagal modulių kiekį */
export const rysysRules: RangeRule<number>[] = [
  { max: 32, value: 2 },
  { max: 36, value: 3 },
  { max: 54, value: 4 },
];

/** J10 – Gegnės kodas pagal modulio ilgį */
export const gegneCodeRules: RangeRule<string>[] = [
  { max: 1850, value: "GG-0" },
  { max: 2200, value: "GG-1" },
  { max: 2400, value: "GG-2" },
];

/** J10 – Gegnės ilgis pagal kodą */
export const gegneLengthByCode: Record<string, number> = {
  "GG-0": 3025,
  "GG-1": 3600,
  "GG-2": 3750,
};

/**J11 – Grebėstas: pagal konstrukcijos ilgį. */
export const grebestasRules: RangeRule<number>[] = [
  { max: 4199, value: 0 },
  { max: 8399, value: 4 },
  { max: 12599, value: 8 },
  { max: 16799, value: 12 },
  { max: 20999, value: 16 },
  { max: 25199, value: 20 },
  { max: 29399, value: 24 },
  { max: 33599, value: 28 },
];

/** J13 – Grebėstų jungtys pagal total (J11 + J12) */
export const grebestuJungtysRules: RangeRule<number>[] = [
  { max: 4, value: 0 },
  { max: 8, value: 4 },
  { max: 12, value: 8 },
  { max: 16, value: 12 },
  { max: 20, value: 16 },
  { max: 24, value: 20 },
  { max: 28, value: 24 },
  { max: 32, value: 28 },
];
