/**
 * Single source of truth for "is this axis meaningfully present?" gating.
 *
 * The health-score algorithm scores each axis as a per-2000kcal density
 * (Drewnowski/NRF style). That's correct mathematically but produces three
 * misleading display states on its own:
 *
 *   1. False high on dilute foods. Cucumber gets S+ MNIDX from extrapolating
 *      its tiny micronutrient amount up to 2000kcal. The grade is "right" in
 *      the model's terms but the user reads it as "great source of
 *      micronutrients", which a 16kcal/100g vegetable is not.
 *
 *   2. False low on whole foods that don't carry that nutrient. Salmon F-fiber
 *      and olive-oil F-protein read as "this food failed at fiber/protein",
 *      but those nutrients were never on offer — the absence is not a failure.
 *
 *   3. False S+ on whole foods for harm axes that are simply absent. Salmon
 *      S+ salt sounds comical because nobody buys salmon for "no added salt".
 *
 * Display hints classify each axis as one of three states from the absolute
 * (per 100g) amount, independent of the per-2000kcal score. Consumers
 * (gradesToReadable, *ToReadable, QualityList grade pills) read this and
 * choose a rendering: suppress, cap-at-A, or render normally.
 *
 *   trace   — too little to evaluate. Positive axes hide entirely; negative
 *             axes cap at A with a neutral colour.
 *   low     — present but the per-density rating would over-claim. Render
 *             but flag with a low-absolute caveat.
 *   normal  — render as scored.
 */

import type { Recipe, FullFoodRow } from '~/types/types';

export type HintState = 'trace' | 'low' | 'normal';
export type Polarity = 'positive' | 'negative';

export type AxisHint = {
  state: HintState;
  polarity: Polarity;
  /** Raw absolute value the gate looked at (per 100g, units depend on axis). */
  raw: number;
  /** Threshold that was crossed to reach `state`. Useful for subtitles. */
  traceBelow: number;
  lowBelow: number;
  /** Optional axis-specific extras consumers can read. */
  extras?: Record<string, number | null | undefined>;
};

export type DisplayHints = {
  fiber: AxisHint;
  protein: AxisHint;
  fat_profile: AxisHint;
  protective: AxisHint;
  micronutrients: AxisHint;
  sugar: AxisHint;
  salt: AxisHint;
};

// ── thresholds (per 100g unless noted) ───────────────────────────────────────
//
// Tuned against the verification set in scripts/reviewHealthScore.ts:
// salmon, cucumber, cola, olive oil, white bread, carbonara, ice cream.

export const FIBER_TRACE_PER100G = 0.5;          // salmon ~0, cucumber 0.5
export const FIBER_LOW_PER100G = 1.5;            // ~half a "good source of" line

export const PROTEIN_TRACE_PER100G = 3;          // cola 0, cucumber 0.7
export const PROTEIN_LOW_PER100G = 6;            // bread/grain territory

export const FAT_TRACE_PER100G = 1.5;            // matches fatProfileToReadable
export const FAT_LOW_PER100G = 4;

// 0–10 internal raw scale (matches protectiveCompoundsToReadable).
export const PROTECTIVE_TRACE_RAW = 1;
export const PROTECTIVE_LOW_RAW = 3;

// Sugar — negative axis. Below trace, "Minimal sugar" is true but boring;
// cap at A. Below low, the natural-vs-processed split is noise.
export const SUGAR_TRACE_PER100G = 1;
export const SUGAR_LOW_PER100G = 3;

// Salt — negative axis. Gate by saltPer100g (NaCl equivalent, g/100g).
// Below ~0.3g/100g (EU "low salt"), sodium is *inherently* absent in the
// food (whole meats, vegetables, oils) — celebrating "Minimal Sodium" with
// an S+ bullet reads comical. Use a separate Na+K floor inside saltToReadable
// for the Na/K ratio's own relevance check.
export const SALT_TRACE_PER100G = 0.3;
export const SALT_LOW_PER100G = 0.7;

// Micronutrients — two-clause gate. The kcal/100g floor catches dilute foods
// (cucumber 16, lettuce 15, watermelon ~30). The absolute-density floor lets
// genuinely nutrient-dense low-cal foods like dark leafy greens through:
// 100g lettuce delivers >1 RDA of vitamin K alone, so its sum easily clears.
export const MN_DILUTE_KCAL_PER100G = 30;
// Sum of (rawValue / RDA) * 100 across all tracked micronutrients.
// 100 ≈ "100g of this food provides one full RDA's worth of micronutrient
// mass, summed across the panel." Cucumber sums to ~30; lettuce to >250.
export const MN_TRACE_DENSITY_SUM = 100;
export const MN_LOW_DENSITY_SUM = 200;

// ── helpers ──────────────────────────────────────────────────────────────────

function classify(
  raw: number,
  traceBelow: number,
  lowBelow: number,
  polarity: Polarity,
  extras?: AxisHint['extras'],
): AxisHint {
  let state: HintState = 'normal';
  if (raw < traceBelow) state = 'trace';
  else if (raw < lowBelow) state = 'low';
  return { state, polarity, raw, traceBelow, lowBelow, extras };
}

function classifyTwoClause(
  primary: number,
  primaryTraceBelow: number,
  primaryLowBelow: number,
  secondary: number,
  secondaryTraceBelow: number,
  secondaryLowBelow: number,
  polarity: Polarity,
  extras?: AxisHint['extras'],
): AxisHint {
  // For MNIDX-style gates: only fire trace/low if BOTH clauses say so. A
  // dark leafy green has low kcal but high density-sum -> stays normal.
  let state: HintState = 'normal';
  if (primary < primaryTraceBelow && secondary < secondaryTraceBelow) {
    state = 'trace';
  } else if (primary < primaryLowBelow && secondary < secondaryLowBelow) {
    state = 'low';
  }
  return {
    state,
    polarity,
    raw: secondary, // density-sum is the more meaningful number to surface
    traceBelow: secondaryTraceBelow,
    lowBelow: secondaryLowBelow,
    extras,
  };
}

// ── computation ──────────────────────────────────────────────────────────────

export function computeDisplayHints(
  report: any,
  _recipe: Recipe | FullFoodRow,
  _isFood: boolean,
): DisplayHints {
  const fiberPer100g = report?.fiber?.fiberPer100g ?? 0;
  const proteinPer100g = report?.protein?.proteinPer100g ?? 0;
  const fatPer100g = report?.fatProfile?.totalFatPer100g ?? 0;
  const compounds = report?.protectiveCompounds ?? {};
  const maxRawCompound = Math.max(
    compounds.polyphenols ?? 0,
    compounds.carotenoids ?? 0,
    compounds.glucosinolates ?? 0,
  );
  const sugarPer100g = report?.sugar?.totalSugarPer100 ?? 0;
  const saltPer100g = report?.salt?.saltPer100g ?? 0;
  const electrolytesPer100g = report?.salt?.totalElectrolytesPer100g ?? 0;

  // Micronutrients absolute density: sum of (raw / RDA) across all tracked
  // micros, scaled to per-100g %. The engine already stored rdaPer100 per
  // entry as Math.round((rawValue * 100) / rda), so summing is direct.
  const mnDetails: any[] = report?.micronutrients?.details ?? [];
  const mnDensitySum = mnDetails.reduce(
    (acc, d) => acc + (Number(d?.rdaPer100) || 0),
    0,
  );
  const kcalPer100g = report?.overall?.kcal_per_100g
    ?? report?.kcal_per_100g
    ?? 0;

  return {
    fiber: classify(fiberPer100g, FIBER_TRACE_PER100G, FIBER_LOW_PER100G, 'positive'),
    protein: classify(
      proteinPer100g,
      PROTEIN_TRACE_PER100G,
      PROTEIN_LOW_PER100G,
      'positive',
    ),
    fat_profile: classify(fatPer100g, FAT_TRACE_PER100G, FAT_LOW_PER100G, 'positive'),
    protective: classify(
      maxRawCompound,
      PROTECTIVE_TRACE_RAW,
      PROTECTIVE_LOW_RAW,
      'positive',
    ),
    micronutrients: classifyTwoClause(
      kcalPer100g,
      MN_DILUTE_KCAL_PER100G,
      MN_DILUTE_KCAL_PER100G * 1.5,
      mnDensitySum,
      MN_TRACE_DENSITY_SUM,
      MN_LOW_DENSITY_SUM,
      'positive',
      { kcalPer100g, densitySum: mnDensitySum },
    ),
    sugar: classify(
      sugarPer100g,
      SUGAR_TRACE_PER100G,
      SUGAR_LOW_PER100G,
      'negative',
    ),
    salt: classify(
      saltPer100g,
      SALT_TRACE_PER100G,
      SALT_LOW_PER100G,
      'negative',
      { electrolytesPer100g },
    ),
  };
}
