// Server-side data fetching for the metrics pipeline.
//
// Two entry points:
//   - fetchAllRecipesProjection() — used by the cron, pulls every recipe once
//   - fetchRecipesByIds()        — used by the on-visit endpoint, pulls only T
//
// Both return the same MetricsRecipe shape so the downstream pipeline doesn't
// care which path the data came from.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MetricsRecipe } from './types';
import convertToGrams from '~~/app/utils/format/convertToGrams';
import { parseVector } from './embedding';

// New AI columns aren't in supabase.ts yet → use loose typing.
type AnyClient = SupabaseClient<any, any, any>;

const RECIPE_SELECT = `
  id, user_id, source_type,
  hidx, kcal, protein, carbohydrates, fat, processing_level_score,
  price, total_time_mins,
  flavor_spicy, flavor_umami, flavor_fresh, flavor_sweet, exoticness, complexity,
  embedding,
  tags:recipe_tags(tag_id),
  ingredients:recipe_foods(
    amount, unit,
    food_name:food_names(food:foods(visual_category, density, countable_units))
  )
`;

// Maps food.visual_category → which category-grams bucket it contributes to.
function bucketFor(visualCategory: string | null | undefined): keyof MetricsRecipe['category_grams'] | null {
  switch (visualCategory) {
    case 'grain_pasta':       return 'pasta';
    case 'grain_rice':        return 'rice';
    case 'seafood_fish':
    case 'seafood_shellfish': return 'fish';
    case 'meat_poultry':      return 'poultry';
    default:                  return null;
  }
}

function normalizeRow(row: any): MetricsRecipe {
  const tag_ids: number[] = (row.tags ?? []).map((t: { tag_id: number }) => t.tag_id);
  const ingredients = (row.ingredients ?? []) as any[];

  const category_grams = { pasta: 0, rice: 0, fish: 0, poultry: 0 };
  for (const ing of ingredients) {
    const food = ing?.food_name?.food;
    const bucket = bucketFor(food?.visual_category);
    if (!bucket) continue;
    const unitWeight = food?.countable_units?.[ing.unit] ?? 0;
    const grams = convertToGrams(ing.amount, ing.unit, food?.density ?? 1, unitWeight);
    category_grams[bucket] += grams;
  }
  return {
    id: row.id,
    user_id: row.user_id ?? null,
    source_type: row.source_type ?? null,
    hidx: row.hidx ?? null,
    kcal: row.kcal ?? null,
    protein: row.protein ?? null,
    carbohydrates: row.carbohydrates ?? null,
    fat: row.fat ?? null,
    processing_level_score: row.processing_level_score ?? null,
    price: row.price ?? null,
    total_time_mins: row.total_time_mins ?? null,
    flavor_spicy: row.flavor_spicy ?? null,
    flavor_umami: row.flavor_umami ?? null,
    flavor_fresh: row.flavor_fresh ?? null,
    flavor_sweet: row.flavor_sweet ?? null,
    exoticness: row.exoticness ?? null,
    complexity: row.complexity ?? null,
    embedding: parseVector(row.embedding),
    tag_ids,
    ingredient_count: ingredients.length,
    category_grams,
  };
}

export async function fetchAllRecipesProjection(client: AnyClient): Promise<MetricsRecipe[]> {
  const { data, error } = await client
    .from('recipes')
    .select(RECIPE_SELECT)
    .neq('visibility', 'HIDDEN');
  if (error) throw error;
  return (data ?? []).map(normalizeRow);
}

export async function fetchRecipesByIds(
  client: AnyClient,
  ids: number[],
): Promise<MetricsRecipe[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from('recipes')
    .select(RECIPE_SELECT)
    .in('id', ids);
  if (error) throw error;
  return (data ?? []).map(normalizeRow);
}

// ─── User-edge fetching ──────────────────────────────────────────────────────

export type UserEdgeRow = {
  user_id: string;
  ownedIds: Set<number>;
  highlyRatedIds: Set<number>;
  savedIds: Set<number>;
  ratingCount: number;
  ratingSum: number;
};

/** Fetch every user's (user_id, recipe_id) edges in three flat queries. */
export async function fetchAllUserEdges(client: AnyClient): Promise<Map<string, UserEdgeRow>> {
  const users = new Map<string, UserEdgeRow>();
  const ensure = (id: string): UserEdgeRow => {
    let u = users.get(id);
    if (!u) {
      u = {
        user_id: id,
        ownedIds: new Set(),
        highlyRatedIds: new Set(),
        savedIds: new Set(),
        ratingCount: 0,
        ratingSum: 0,
      };
      users.set(id, u);
    }
    return u;
  };

  // owned
  {
    const { data, error } = await client
      .from('recipes')
      .select('id, user_id')
      .neq('visibility', 'HIDDEN')
      .not('user_id', 'is', null);
    if (error) throw error;
    for (const r of data ?? []) ensure(r.user_id!).ownedIds.add(r.id);
  }
  // ratings
  {
    const { data, error } = await client
      .from('ratings')
      .select('user_id, recipe_id, rating');
    if (error) throw error;
    for (const r of data ?? []) {
      if (!r.user_id || r.recipe_id == null || r.rating == null) continue;
      const u = ensure(r.user_id);
      u.ratingCount += 1;
      u.ratingSum += r.rating;
      if (r.rating >= 4) u.highlyRatedIds.add(r.recipe_id);
    }
  }
  // bookmarks
  {
    const { data, error } = await client
      .from('bookmarks')
      .select('user_id, recipe_id');
    if (error) throw error;
    for (const r of data ?? []) {
      if (!r.user_id || r.recipe_id == null) continue;
      ensure(r.user_id).savedIds.add(r.recipe_id);
    }
  }
  return users;
}

/** Fetch the edges for a single user (used by the on-visit endpoint). */
export async function fetchUserEdges(client: AnyClient, userId: string): Promise<UserEdgeRow> {
  const row: UserEdgeRow = {
    user_id: userId,
    ownedIds: new Set(),
    highlyRatedIds: new Set(),
    savedIds: new Set(),
    ratingCount: 0,
    ratingSum: 0,
  };

  const [owned, rated, saved] = await Promise.all([
    client.from('recipes').select('id').eq('user_id', userId).neq('visibility', 'HIDDEN'),
    client.from('ratings').select('recipe_id, rating').eq('user_id', userId),
    client.from('bookmarks').select('recipe_id').eq('user_id', userId),
  ]);
  if (owned.error) throw owned.error;
  if (rated.error) throw rated.error;
  if (saved.error) throw saved.error;

  for (const r of owned.data ?? []) row.ownedIds.add(r.id);
  for (const r of rated.data ?? []) {
    if (r.recipe_id == null || r.rating == null) continue;
    row.ratingCount += 1;
    row.ratingSum += r.rating;
    if (r.rating >= 4) row.highlyRatedIds.add(r.recipe_id);
  }
  for (const r of saved.data ?? []) {
    if (r.recipe_id != null) row.savedIds.add(r.recipe_id);
  }
  return row;
}
