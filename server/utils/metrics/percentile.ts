// Build + lookup for the cached percentile table stored in
// global_cache.archetype_percentiles.
//
// Storage shape: { [archetypeKey]: number[101] } where a[i] is the S score
// at the i-th percentile (0..100). We use length 101 (not 100) so the
// boundaries are inclusive on both ends and lookup math is index = round(p).

import type { ArchetypeKey, PercentileTable } from './types';

/**
 * Build a 101-entry percentile table from a sample of S scores.
 * Uses the "nearest-rank" method, then linearly interpolates between samples
 * for indices that fall between two sample positions.
 */
export function buildPercentileArray(samples: number[]): number[] {
  const out = new Array(101).fill(0);
  const cleaned = samples.filter((s) => Number.isFinite(s)).sort((a, b) => a - b);
  if (cleaned.length === 0) return out;
  if (cleaned.length === 1) return out.fill(cleaned[0]);

  for (let i = 0; i <= 100; i++) {
    // position in [0, n-1]
    const pos = (i / 100) * (cleaned.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const t = pos - lo;
    out[i] = cleaned[lo] * (1 - t) + cleaned[hi] * t;
  }
  return out;
}

/**
 * Given a sorted percentile array, return the percentile (0..100) of a value.
 * Linear interp; clamped at the ends.
 */
export function lookupPercentile(table: number[] | undefined, value: number): number {
  if (!table || table.length === 0) return 0;
  if (value <= table[0]) return 0;
  if (value >= table[table.length - 1]) return 100;
  // binary search for the first index where table[i] >= value
  let lo = 0;
  let hi = table.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (table[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  // interpolate between (lo-1, lo)
  const upper = table[lo];
  const lower = table[lo - 1];
  if (upper === lower) return lo;
  const frac = (value - lower) / (upper - lower);
  return (lo - 1 + frac); // already on a 0..100 scale because length is 101
}

export function buildPercentileTable(
  rawScores: Partial<Record<ArchetypeKey, number[]>>,
): PercentileTable {
  const out: PercentileTable = {};
  for (const key in rawScores) {
    const arr = rawScores[key as ArchetypeKey];
    if (arr && arr.length > 0) {
      out[key as ArchetypeKey] = buildPercentileArray(arr);
    }
  }
  return out;
}
