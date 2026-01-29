export type RangeRule<T> = { max: number; value: T };

/**
 * Grąžina pirmą rule.value, kur x <= rule.max.
 * Jei neranda – meta klaidą.
 */
export function rangeLookup<T>(
  x: number,
  rules: RangeRule<T>[],
  errMsg?: string
): T {
  for (const r of rules) {
    if (x <= r.max) return r.value;
  }
  throw new Error(errMsg ?? `No rule matched for value: ${x}`);
}
