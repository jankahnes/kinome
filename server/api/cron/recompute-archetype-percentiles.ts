// Nightly cron: recompute the cross-user archetype percentile table.
//
// Strategy (chosen for O(|users|+|recipes|) wire cost rather than
// O(|users|*avg|T|)):
//   1. Pull every recipe once with the narrow metrics projection.
//   2. Pull every user's (user_id, recipe_id) edges in three flat queries.
//   3. For every user, build T in memory and compute their S-score for
//      every archetype.
//   4. From those distributions, derive percentile arrays and upsert a
//      single row in global_cache.
//
// The cron is idempotent; it always overwrites the same row.

import { serverSupabaseServiceRole } from '#supabase/server';
import {
  fetchAllRecipesProjection,
  fetchAllUserEdges,
} from '~~/server/utils/metrics/fetch';
import { buildWeightedT } from '~~/server/utils/metrics/weights';
import { computeUserScores } from '~~/server/utils/metrics/scores';
import { buildPercentileTable } from '~~/server/utils/metrics/percentile';
import { cuisineSetSize } from '~~/server/utils/metrics/archetypes';
import {
  weightedAverageEmbedding,
  serializeVector,
} from '~~/server/utils/metrics/embedding';
import type {
  ArchetypeKey,
  MetricsRecipe,
} from '~~/server/utils/metrics/types';

const GLOBAL_CACHE_ID = 1; // single-row table

function pctOf(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const pos = (p / 100) * (sortedAsc.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sortedAsc[lo] * (1 - (pos - lo)) + sortedAsc[hi] * (pos - lo);
}

export default defineEventHandler(async (event) => {
  // Vercel cron auth
  const authHeader = getHeader(event, 'authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const client = serverSupabaseServiceRole<any>(event);
  const startedAt = Date.now();

  try {
    // 1. Bulk fetch
    const [recipes, edges] = await Promise.all([
      fetchAllRecipesProjection(client),
      fetchAllUserEdges(client),
    ]);
    const recipesById = new Map<number, MetricsRecipe>(
      recipes.map((r) => [r.id, r]),
    );

    // 2. Two-pass: first pass derives the global p95s, second pass uses them
    //    to compute final S-scores.
    const cuisineSetSizes: number[] = [];
    const createdCounts: number[] = [];
    type Pass1 = {
      userId: string;
      T: ReturnType<typeof buildWeightedT>;
      ratingCount: number;
      avgRating: number | null;
      createdCount: number;
    };
    const pass1: Pass1[] = [];

    for (const u of edges.values()) {
      const T = buildWeightedT(
        {
          ownedIds: u.ownedIds,
          highlyRatedIds: u.highlyRatedIds,
          savedIds: u.savedIds,
        },
        recipesById,
      );
      // Skip empty-T users (anon-auth ghosts with no activity beyond possibly
      // an orphaned rating/bookmark referencing a now-missing recipe).
      if (T.length === 0) continue;

      const createdCount = u.ownedIds.size;
      cuisineSetSizes.push(cuisineSetSize(T));
      createdCounts.push(createdCount);
      pass1.push({
        userId: u.user_id,
        T,
        ratingCount: u.ratingCount,
        avgRating: u.ratingCount > 0 ? u.ratingSum / u.ratingCount : null,
        createdCount,
      });
    }

    cuisineSetSizes.sort((a, b) => a - b);
    createdCounts.sort((a, b) => a - b);
    const globalExplorerP95 = pctOf(cuisineSetSizes, 95);
    const prolificCreatorP95 = pctOf(createdCounts, 95);

    // 3. Per-user S-scores → bucketed by archetype
    const buckets: Partial<Record<ArchetypeKey, number[]>> = {};
    for (const u of pass1) {
      const scores = computeUserScores(
        u.T,
        {
          ratingCount: u.ratingCount,
          avgRating: u.avgRating,
          createdCount: u.createdCount,
        },
        { globalExplorerP95, prolificCreatorP95 },
      );

      for (const key in scores) {
        const k = key as ArchetypeKey;
        (buckets[k] ??= []).push(scores[k]!);
      }
    }

    // 4. Percentile tables + upsert
    const archetype_percentiles = buildPercentileTable(buckets);
    const payload = {
      id: GLOBAL_CACHE_ID,
      archetype_percentiles,
      global_explorer_p95: globalExplorerP95,
      prolific_creator_p95: prolificCreatorP95,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await client
      .from('global_cache')
      .upsert(payload, { onConflict: 'id' });
    if (upsertError) throw upsertError;

    // 5. Taste vectors: weighted-average each user's embeddings and upsert
    //    into profiles.cached_taste_vector. Used by the on-visit endpoint
    //    to find nearest neighbors.
    const tasteUpdates: { id: string; cached_taste_vector: string }[] = [];
    for (const u of pass1) {
      const items = u.T.map(({ recipe, weight }) => ({
        vec: recipe.embedding,
        weight,
      }));
      const vec = weightedAverageEmbedding(items);
      if (!vec) continue;
      tasteUpdates.push({
        id: u.userId,
        cached_taste_vector: serializeVector(vec),
      });
    }
    // Upsert in chunks to avoid oversized payloads.
    const CHUNK = 200;
    for (let i = 0; i < tasteUpdates.length; i += CHUNK) {
      const chunk = tasteUpdates.slice(i, i + CHUNK);
      const { error: tvError } = await client
        .from('profiles')
        .upsert(chunk, { onConflict: 'id', defaultToNull: false });
      if (tvError) throw tvError;
    }

    return {
      success: true,
      users: pass1.length,
      recipes: recipes.length,
      archetypes: Object.keys(buckets).length,
      tasteVectors: tasteUpdates.length,
      globalExplorerP95,
      prolificCreatorP95,
      durationMs: Date.now() - startedAt,
    };
  } catch (error: any) {
    console.error('recompute-archetype-percentiles failed:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to recompute percentiles',
    });
  }
});
