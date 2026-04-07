// T construction + per-recipe weight assignment.
//
// Weights are deliberately asymmetric so that recipes the user actually
// authored count more than ones they merely saved. See ignored/user-metrics.txt
// for the rationale and the display caveat.

import type { MetricsRecipe, WeightedRecipe } from './types';

const W_CREATED_AUTHORED = 5;   // source_type NOT in (MEDIA, WEBSITE) → genuinely authored
const W_CREATED_IMPORTED = 2;   // imported from media/website → treat ~ saved
const W_HIGHLY_RATED     = 4;
const W_SAVED            = 1.5;

const IMPORT_SOURCES = new Set(['MEDIA', 'WEBSITE']);

export type UserEdges = {
  ownedIds:        Set<number>;  // recipes.user_id == userId
  highlyRatedIds:  Set<number>;  // ratings.rating >= 4
  savedIds:        Set<number>;  // bookmarks.recipe_id
};

/**
 * Build the weighted T-set for a user. Each recipe appears at most once,
 * with the MAX of all applicable weights (so an authored+saved+5★ recipe
 * still gets weight 5, not 10.5).
 */
export function buildWeightedT(
  edges: UserEdges,
  recipesById: Map<number, MetricsRecipe>,
): WeightedRecipe[] {
  const out = new Map<number, number>();

  const bump = (id: number, w: number) => {
    const prev = out.get(id);
    if (prev === undefined || w > prev) out.set(id, w);
  };

  for (const id of edges.ownedIds) {
    const r = recipesById.get(id);
    if (!r) continue;
    const w = r.source_type && IMPORT_SOURCES.has(r.source_type)
      ? W_CREATED_IMPORTED
      : W_CREATED_AUTHORED;
    bump(id, w);
  }
  for (const id of edges.highlyRatedIds) {
    if (recipesById.has(id)) bump(id, W_HIGHLY_RATED);
  }
  for (const id of edges.savedIds) {
    if (recipesById.has(id)) bump(id, W_SAVED);
  }

  const result: WeightedRecipe[] = [];
  for (const [id, weight] of out) {
    result.push({ recipe: recipesById.get(id)!, weight });
  }
  return result;
}
