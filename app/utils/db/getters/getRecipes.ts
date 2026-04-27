import type { SupabaseClient } from '@supabase/supabase-js';
import type { Comment } from '~/types/types';
import { expectSingle } from '~/utils/db/getters/expectSingle';
import buildQuery from '~/utils/db/getters/buildQuery';
import buildQueryFromRecipeFiltering from '~/utils/db/getters/buildQueryFromRecipeFiltering';
import { getRatings } from '~/utils/db/getters/getRatings';
import fillForUnits from '~/utils/format/fillForUnits';
import type { Database } from '~/types/supabase';

const PROCESSING_PICTURE_PREFIX = 'PROCESSING:';
const LEGACY_PROCESSING_PICTURE = 'PROCESSING';

function sanitizeRecipePicture<T extends { picture: string | null }>(
  recipe: T,
): T {
  if (
    recipe.picture &&
    (recipe.picture === LEGACY_PROCESSING_PICTURE ||
      recipe.picture.startsWith(PROCESSING_PICTURE_PREFIX))
  ) {
    recipe.picture = null;
  }
  return recipe;
}

function getTagCategory(tagId: number): string {
  if (tagId >= 400) return 'EQUIPMENT';
  if (tagId >= 300) return 'CUISINE';
  if (tagId >= 200) return 'TYPE';
  if (tagId >= 100) return 'DIET';
  return 'GENERAL';
}

async function getRecipeIdsByTags(
  tags: number[],
  client: SupabaseClient<Database>,
): Promise<number[]> {
  // Group tags by category
  const tagsByCategory: Record<string, number[]> = {};
  tags.forEach((tagId) => {
    const category = getTagCategory(tagId);
    if (!tagsByCategory[category]) {
      tagsByCategory[category] = [];
    }
    tagsByCategory[category].push(tagId);
  });

  // For each category, find recipe IDs that have ANY of those tags (OR)
  const recipeIdSets: Set<number>[] = [];

  for (const [category, tagIds] of Object.entries(tagsByCategory)) {
    const { data } = await client
      .from('recipe_tags')
      .select('recipe_id')
      .in('tag_id', tagIds);

    if (data) {
      const recipeIds = new Set(data.map((r) => r.recipe_id));
      recipeIdSets.push(recipeIds);
    }
  }

  // Intersect all sets (AND across categories)
  if (recipeIdSets.length > 0) {
    let matchingRecipeIds = recipeIdSets[0];
    for (let i = 1; i < recipeIdSets.length; i++) {
      matchingRecipeIds = new Set(
        [...matchingRecipeIds].filter((id) => recipeIdSets[i].has(id)),
      );
    }
    return Array.from(matchingRecipeIds);
  }

  return [];
}

export async function getRecipe(
  client: SupabaseClient<Database>,
  opts: GetterOpts = {},
  _includePercentiles: boolean = false,
): Promise<Recipe> {
  let query = client
    .from('recipes')
    .select(
      `
        *,
        tags:recipe_tags(tag_id),
        ingredients:recipe_foods(
          amount,
          unit,
          food_name:food_names(
            id,
            name,
            food:foods(
              id, density, countable_units, price, aisle, visual_category
            )
          ),
          category,
          preparation_description,
          consumption_factor,
          thermal_intensity,
          heat_medium,
          mechanical_disruption,
          thermal_description,
          mechanical_description
        ),
        comments:comments(*,
          user:profiles(id, username, picture)
        ),
        user:profiles!recipes_user_id_fkey(id, username, picture),
        based_on_parent:recipe_overviews!recipes_based_on_fkey(id, title)
      `,
    )
    .neq('visibility', 'HIDDEN');

  query = buildQuery(query, opts);

  const recipeId = (opts.eq as { id?: number } | undefined)?.id;

  const [mainResult, ratings, variationOverviews] = await Promise.all([
    query,
    recipeId != null
      ? getRatings(client, { eq: { recipe_id: recipeId } })
      : Promise.resolve([] as Awaited<ReturnType<typeof getRatings>>),
    recipeId != null
      ? getRecipeOverviews(client, { eq: { based_on: recipeId } })
      : Promise.resolve([] as RecipeOverview[]),
  ]);

  const { data, error } = mainResult;
  if (error) throw error;
  const recipe = expectSingle(data as any[]) as any;

  sanitizeRecipePicture(recipe);
  recipe.tags = recipe.tags.map((t: { tag_id: number }) => t.tag_id);

  for (const c of recipe.comments) {
    const match = ratings.find(
      (r) => r.user_id === c.user_id && r.recipe_id === recipe.id,
    );
    c.rating = match?.rating ?? null;
  }

  const commentMap: Record<number, Comment> = {};
  recipe.comments.forEach((c: Comment) => {
    c.replies = [];
    commentMap[c.id!] = c;
  });
  const commentRoots: Comment[] = [];
  recipe.comments.forEach((c: Comment) => {
    if (c.replying_to && commentMap[c.replying_to]) {
      commentMap[c.replying_to].replies!.push(c);
    } else {
      commentRoots.push(c);
    }
  });
  recipe.comments = commentRoots;

  recipe.ingredients = recipe.ingredients.map((ingredient: any) => {
    return {
      id: ingredient.food_name.id,
      name: ingredient.food_name.name,
      category: ingredient.category,
      amount: ingredient.amount,
      unit: ingredient.unit,
      countable_units: ingredient.food_name.food.countable_units,
      amountInfo: [[ingredient.amount, ingredient.unit]],
      currentUnit: 0,
      density: ingredient.food_name.food.density,
      aisle: ingredient.food_name.food.aisle,
      price: ingredient.food_name.food.price,
      visual_category: ingredient.food_name.food.visual_category,
      preparation_description: ingredient.preparation_description,
      consumption_factor: ingredient.consumption_factor,
      thermal_intensity: ingredient.thermal_intensity,
      heat_medium: ingredient.heat_medium,
      mechanical_disruption: ingredient.mechanical_disruption,
      thermal_description: ingredient.thermal_description,
      mechanical_description: ingredient.mechanical_description,
    } as Ingredient;
  });
  recipe.ingredients.forEach(fillForUnits);

  recipe.variations = variationOverviews;

  return recipe as Recipe;
}

export async function getRecipeOverviews(
  client: SupabaseClient<Database>,
  opts: GetterOpts = {},
): Promise<RecipeOverview[]> {
  let query = client
    .from('recipes')
    .select(
      `
        id, hidx, kcal, price, title, created_at, visibility, picture, rating, protein, carbohydrates, fat, sugar, salt, fiber, user_id, collection, based_on, variation_name, variation_summary,
        tags:recipe_tags(tag_id), source, description, video_metadata, source_type, total_time_mins, variation_display_name
      `,
    )
    .neq('visibility', 'HIDDEN');
  let similarityMap: Map<number, number> | null = null;
  if (opts.vector_search?.embedding?.length) {
    const { data: vectorResults, error: vectorError } = await client.rpc(
      'search_recipes_ai',
      {
        query: opts.vector_search.embedding,
        max: (opts.limit ?? 40) + 10,
      },
    );

    if (vectorError) throw vectorError;

    if (!vectorResults || vectorResults.length === 0) {
      return [];
    }

    const recipeIds = vectorResults.map((result: any) => result.id);
    similarityMap = new Map(
      vectorResults.map((result: any) => [result.id, result.similarity]),
    );

    query = query.in('id', recipeIds);
  } else if (
    opts.trigram_search &&
    opts.trigram_search.query &&
    opts.trigram_search.query.trim() !== ''
  ) {
    const { data: trigramResults, error: trigramError } = await client.rpc(
      'search_recipes',
      {
        query: opts.trigram_search.query,
        max: (opts.limit ?? 40) + 10,
      },
    );

    if (trigramError) throw trigramError;

    if (!trigramResults || trigramResults.length === 0) {
      return [];
    }

    const recipeIds = trigramResults.map((result: any) => result.id);
    similarityMap = new Map(
      trigramResults.map((result: any) => [result.id, result.similarity]),
    );

    query = query.in('id', recipeIds);
  }

  if (opts.filtering?.tags && opts.filtering.tags.length > 0) {
    const recipeIds = await getRecipeIdsByTags(opts.filtering.tags, client);
    if (recipeIds.length > 0) {
      query = query.in('id', recipeIds);
    } else {
      query = query.in('id', []);
    }
  }

  if (opts.filtering) {
    query = buildQueryFromRecipeFiltering(query, opts.filtering);
  }
  query = buildQuery(query, opts);

  if (opts.limit) {
    query = query.limit(opts.limit + 10);
  }

  const { data, error } = await query;
  if (error) throw error;
  const recipes = data;

  for (const recipe of recipes) {
    sanitizeRecipePicture(recipe as { picture: string | null });
    (recipe as any).tags = recipe.tags.map((t: { tag_id: number }) => t.tag_id);
    if (recipe.tags.includes(102)) {
      recipe.tags = recipe.tags.filter((tagId: number) => tagId !== 103);
    }
  }
  let recipeOverviews = recipes as unknown as RecipeOverview[];

  if (similarityMap) {
    recipeOverviews.sort((a, b) => {
      const similarityA = similarityMap!.get(a.id) ?? 0;
      const similarityB = similarityMap!.get(b.id) ?? 0;
      return similarityB - similarityA; // Sort descending (highest similarity first)
    });
  }

  if (opts.limit && recipes.length > opts.limit) {
    recipeOverviews = recipeOverviews.slice(0, opts.limit);
  }

  return recipeOverviews;
}

export async function getRecipeOverview(
  client: SupabaseClient,
  opts: GetterOpts = {},
): Promise<RecipeOverview> {
  return expectSingle(await getRecipeOverviews(client, opts));
}

export async function getTrendingThisMonth(
  client: SupabaseClient<Database>,
  limit: number,
): Promise<RecipeOverview[]> {
  const { data, error } = await client.rpc('get_trending_this_month', {
    max: limit,
  });

  if (error) throw error;
  data.forEach((recipe) =>
    sanitizeRecipePicture(recipe as { picture: string | null }),
  );
  return data;
}
