// On-visit endpoint: returns the displayed archetype + radar series for one
// user. Computes S-scores live; uses the cron-cached percentile table to
// turn S into O = 0.5*S + 0.5*percentile.

import { serverSupabaseServiceRole } from '#supabase/server';
import {
  fetchRecipesByIds,
  fetchUserEdges,
} from '~~/server/utils/metrics/fetch';
import {
  computeUserScores,
  rankArchetypes,
  listAllArchetypes,
} from '~~/server/utils/metrics/scores';
import { computeRadar } from '~~/server/utils/metrics/radar';
import type {
  MetricsRecipe,
  PercentileTable,
} from '~~/server/utils/metrics/types';
import { buildWeightedT } from '~~/server/utils/metrics/weights';
import {
  weightedAverageEmbedding,
  parseVector,
  cosineSimilarity,
} from '~~/server/utils/metrics/embedding';

const MIN_T_SIZE = 10;
const GLOBAL_CACHE_ID = 1;
const NEIGHBOR_COUNT = 3;

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id');
  if (!userId)
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' });

  const client = serverSupabaseServiceRole<any>(event);

  // 1. Pull user edges + cached percentiles in parallel
  const [edges, cacheRes] = await Promise.all([
    fetchUserEdges(client, userId),
    client
      .from('global_cache')
      .select('*')
      .eq('id', GLOBAL_CACHE_ID)
      .maybeSingle(),
  ]);

  // 2. Cold-start guard: |T| must be big enough to be meaningful
  const allIds = new Set<number>([
    ...edges.ownedIds,
    ...edges.highlyRatedIds,
    ...edges.savedIds,
  ]);
  if (allIds.size < MIN_T_SIZE) {
    return {
      coldStart: true,
      tSize: allIds.size,
      minTSize: MIN_T_SIZE,
      archetype: null,
      ranked: [],
      all: [],
      radar: null,
      neighbors: [],
      counts: {
        created: edges.ownedIds.size,
        saved: edges.savedIds.size,
        rated: edges.ratingCount,
        highlyRated: edges.highlyRatedIds.size,
      },
    };
  }

  // 3. Fetch the projection for just this user's T
  const recipes = await fetchRecipesByIds(client, [...allIds]);
  const recipesById = new Map<number, MetricsRecipe>(
    recipes.map((r) => [r.id, r]),
  );

  const T = buildWeightedT(
    {
      ownedIds: edges.ownedIds,
      highlyRatedIds: edges.highlyRatedIds,
      savedIds: edges.savedIds,
    },
    recipesById,
  );

  // 4. Cache lookup (fall back to zeros if cron hasn't run yet)
  const cache = cacheRes.data as any;
  const percentiles: PercentileTable = cache?.archetype_percentiles ?? {};
  const globalExplorerP95 = Number(cache?.global_explorer_p95 ?? 0);
  const prolificCreatorP95 = Number(cache?.prolific_creator_p95 ?? 0);

  const extras = {
    ratingCount: edges.ratingCount,
    avgRating:
      edges.ratingCount > 0 ? edges.ratingSum / edges.ratingCount : null,
    createdCount: edges.ownedIds.size,
  };
  const global = { globalExplorerP95, prolificCreatorP95 };

  // 5. Compute scores → rank → top
  const scores = computeUserScores(T, extras, global);
  const ranked = rankArchetypes(T, scores, percentiles, extras, global);
  const all = listAllArchetypes(T, percentiles, extras, global);
  const top = ranked[0] ?? null;

  // 6. Radar
  const radar = computeRadar(T);

  // 7. Taste neighbors: live-compute this user's taste vector from T, then
  //    cosine-compare against every other profile's cached_taste_vector.
  //    For small user bases this is fine to do in JS; swap for a pgvector
  //    ANN query once the population gets large.
  const liveTasteVec = weightedAverageEmbedding(
    T.map(({ recipe, weight }) => ({ vec: recipe.embedding, weight })),
  );

  let neighbors: {
    id: string;
    username: string | null;
    picture: string | null;
    match: number;
  }[] = [];
  if (liveTasteVec) {
    const { data: others, error: nErr } = await client
      .from('profiles')
      .select('id, username, picture, cached_taste_vector')
      .neq('id', userId)
      .not('cached_taste_vector', 'is', null);
    if (nErr) throw nErr;

    const scored: { row: any; sim: number }[] = [];
    for (const row of others ?? []) {
      const vec = parseVector(row.cached_taste_vector);
      if (!vec) continue;
      const sim = cosineSimilarity(liveTasteVec, vec);
      scored.push({ row, sim });
    }
    scored.sort((a, b) => b.sim - a.sim);
    neighbors = scored.slice(0, NEIGHBOR_COUNT).map(({ row, sim }) => ({
      id: row.id,
      username: row.username,
      picture: row.picture,
      match: Math.round(sim * 100),
    }));
  }

  return {
    coldStart: false,
    tSize: T.length,
    archetype: top
      ? {
          key: top.key,
          label: top.label,
          subtitle: top.subtitle,
          S: top.S,
          percentile: top.percentile,
          O: top.O,
        }
      : null,
    ranked: ranked.map((r) => ({
      key: r.key,
      label: r.label,
      subtitle: r.subtitle,
      S: r.S,
      percentile: r.percentile,
      O: r.O,
    })),
    all,
    counts: {
      created: edges.ownedIds.size,
      saved: edges.savedIds.size,
      rated: edges.ratingCount,
      highlyRated: edges.highlyRatedIds.size,
    },
    radar,
    neighbors,
  };
});
