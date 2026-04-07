// Top-level "compute everything for one user" orchestrator. Used by both
// the cron (looped over every user) and the on-visit endpoint.

import type {
  ArchetypeKey,
  ArchetypeScores,
  RadarAxes,
  WeightedRecipe,
  PercentileTable,
} from './types';
import {
  ARCHETYPES,
  ARCHETYPES_BY_KEY,
  cuisineSetSize,
  type ArchetypeContext,
} from './archetypes';
import { computeRadar } from './radar';
import { lookupPercentile } from './percentile';

export type UserExtras = {
  ratingCount: number; // total ratings the user has submitted (any value)
  avgRating: number | null; // mean of those ratings, null if none
  createdCount: number; // |recipes the user authored|
};

export type GlobalContext = {
  globalExplorerP95: number;
  prolificCreatorP95: number;
};

/** Raw S-scores for every archetype the user qualifies to be measured for. */
export function computeUserScores(
  T: WeightedRecipe[],
  extras: UserExtras,
  global: GlobalContext,
): ArchetypeScores {
  const ctx: ArchetypeContext = {
    globalExplorerP95: global.globalExplorerP95,
    prolificCreatorP95: global.prolificCreatorP95,
    userRatingCount: extras.ratingCount,
    userCuisineSetSize: cuisineSetSize(T),
    userCreatedCount: extras.createdCount,
  };
  // Critic needs the user's avg rating; smuggle it via ctx.
  (ctx as any).userAvgRating = extras.avgRating;

  const out: ArchetypeScores = {};
  for (const def of ARCHETYPES) {
    if (def.gate && !def.gate(T, ctx)) continue;
    const s = def.computeS(T, ctx);
    if (s == null || Number.isNaN(s)) continue;
    out[def.key] = s;
  }
  return out;
}

/** Convenience: scores + radar in one call (for the on-visit endpoint). */
export function computeUserMetrics(
  T: WeightedRecipe[],
  extras: UserExtras,
  global: GlobalContext,
): { scores: ArchetypeScores; radar: RadarAxes } {
  return {
    scores: computeUserScores(T, extras, global),
    radar: computeRadar(T),
  };
}

export type RankedArchetype = {
  key: ArchetypeKey;
  label: string;
  subtitle: string;
  S: number;
  percentile: number;
  O: number;
};

export type ArchetypeRow = {
  key: ArchetypeKey;
  label: string;
  subtitle: string;
  S: number | null;
  percentile: number | null;
  O: number | null;
  threshold: number;
  status: 'ranked' | 'below_threshold' | 'gated' | 'no_data';
};

/**
 * Apply S-thresholds, look up percentiles in the cached table, and rank by
 * O = 0.5*S + 0.5*percentile. Returns the full ranked list (top first); the
 * caller picks [0] for the displayed archetype.
 */
export function rankArchetypes(
  T: WeightedRecipe[],
  scores: ArchetypeScores,
  percentiles: PercentileTable,
  extras: UserExtras,
  global: GlobalContext,
): RankedArchetype[] {
  const ctx: ArchetypeContext = {
    globalExplorerP95: global.globalExplorerP95,
    prolificCreatorP95: global.prolificCreatorP95,
    userRatingCount: extras.ratingCount,
    userCuisineSetSize: cuisineSetSize(T),
    userCreatedCount: extras.createdCount,
  };
  (ctx as any).userAvgRating = extras.avgRating;

  const ranked: RankedArchetype[] = [];
  for (const key in scores) {
    const def = ARCHETYPES_BY_KEY[key];
    if (!def) continue;
    const S = scores[key as ArchetypeKey]!;
    if (S < def.threshold) continue;
    const p = lookupPercentile(percentiles[key as ArchetypeKey], S);
    const O = 0.7 * S + 0.3 * p;
    ranked.push({
      key: def.key,
      label: def.label,
      subtitle: def.subtitle(T, ctx),
      S,
      percentile: p,
      O,
    });
  }
  ranked.sort((a, b) => b.O - a.O);
  return ranked;
}

/**
 * Like rankArchetypes, but returns one row per archetype (including those
 * filtered out by the gate or threshold). Used by the dev affinity widget.
 */
export function listAllArchetypes(
  T: WeightedRecipe[],
  percentiles: PercentileTable,
  extras: UserExtras,
  global: GlobalContext,
): ArchetypeRow[] {
  const ctx: ArchetypeContext = {
    globalExplorerP95: global.globalExplorerP95,
    prolificCreatorP95: global.prolificCreatorP95,
    userRatingCount: extras.ratingCount,
    userCuisineSetSize: cuisineSetSize(T),
    userCreatedCount: extras.createdCount,
  };
  (ctx as any).userAvgRating = extras.avgRating;

  const rows: ArchetypeRow[] = [];
  for (const def of ARCHETYPES) {
    const base = { key: def.key, label: def.label, threshold: def.threshold };
    if (def.gate && !def.gate(T, ctx)) {
      rows.push({
        ...base,
        subtitle: def.subtitle(T, ctx),
        S: null,
        percentile: null,
        O: null,
        status: 'gated',
      });
      continue;
    }
    const S = def.computeS(T, ctx);
    if (S == null || Number.isNaN(S)) {
      rows.push({
        ...base,
        subtitle: def.subtitle(T, ctx),
        S: null,
        percentile: null,
        O: null,
        status: 'no_data',
      });
      continue;
    }
    const p = lookupPercentile(percentiles[def.key], S);
    const O = 0.5 * S + 0.5 * p;
    rows.push({
      ...base,
      subtitle: def.subtitle(T, ctx),
      S,
      percentile: p,
      O,
      status: S < def.threshold ? 'below_threshold' : 'ranked',
    });
  }
  rows.sort((a, b) => (b.O ?? -1) - (a.O ?? -1));
  return rows;
}
