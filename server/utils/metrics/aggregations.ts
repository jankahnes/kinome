// Small numeric helpers used by archetypes + radar.
//
// Everything operates over WeightedRecipe[]: a getter returns the value for
// one recipe (or null to skip it), and we fold using the recipe's weight.

import type { WeightedRecipe } from './types';

/** Weighted average of a numeric field. Returns null if no recipe contributed. */
export function wAvg(
  T: WeightedRecipe[],
  get: (r: WeightedRecipe['recipe']) => number | null | undefined,
): number | null {
  let num = 0;
  let den = 0;
  for (const { recipe, weight } of T) {
    const v = get(recipe);
    if (v == null || Number.isNaN(v)) continue;
    num += v * weight;
    den += weight;
  }
  return den === 0 ? null : num / den;
}

/** Weighted fraction (0..1) of recipes for which `pred` returns true. */
export function wFrac(
  T: WeightedRecipe[],
  pred: (r: WeightedRecipe['recipe']) => boolean,
): number {
  let num = 0;
  let den = 0;
  for (const { recipe, weight } of T) {
    den += weight;
    if (pred(recipe)) num += weight;
  }
  return den === 0 ? 0 : num / den;
}

/** Weighted sum (no normalisation). */
export function wSum(
  T: WeightedRecipe[],
  get: (r: WeightedRecipe['recipe']) => number | null | undefined,
): number {
  let s = 0;
  for (const { recipe, weight } of T) {
    const v = get(recipe);
    if (v == null || Number.isNaN(v)) continue;
    s += v * weight;
  }
  return s;
}

/** Linear interpolation between two anchor points, clamped to [0, 100]. */
export function interp(value: number, fromX: number, fromY: number, toX: number, toY: number): number {
  if (toX === fromX) return fromY;
  const t = (value - fromX) / (toX - fromX);
  const y = fromY + t * (toY - fromY);
  return clamp01_100(y);
}

export function clamp01_100(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 100) return 100;
  return x;
}
