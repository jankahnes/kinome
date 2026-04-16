import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';
import type { UploadableRecipe } from '~/types/types';

export default defineEventHandler(async (event) => {
  const { recipeId }: { recipeId: number } = await readBody(event);
  const headers = getRequestHeaders(event);
  const supabase = serverSupabaseServiceRole<Database>(event);

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (!recipe) {
    throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
  }

  if (recipe.visibility !== 'UNLISTED') {
    throw createError({ statusCode: 409, statusMessage: `Recipe is already ${recipe.visibility}` });
  }

  await supabase
    .from('recipes')
    .update({ visibility: 'PUBLISH_PENDING' as any })
    .eq('id', recipeId);

  const { data: recipeFoods } = await supabase
    .from('recipe_foods')
    .select('*, food_name:food_names(id, name)')
    .eq('recipe_id', recipeId);

  const ingredients = (recipeFoods ?? []).map((rf: any) => ({
    id: rf.food_name_id,
    name: rf.food_name?.name ?? '',
    amount: rf.amount ?? 0,
    unit: rf.unit ?? '',
    category: rf.category ?? null,
    preparation_description: rf.preparation_description ?? null,
  }));

  const { data: tagRows } = await supabase
    .from('recipe_tags')
    .select('tag_id')
    .eq('recipe_id', recipeId);

  const equipment_tag_ids = (tagRows ?? []).map((r) => r.tag_id);

  const uploadableRecipe = {
    ...recipe,
    serves: recipe.base_ingredients_serves ?? 1,
    ingredients,
  } as unknown as UploadableRecipe;

  $fetch('/api/create-recipe/postprocess-enrich-recipe', {
    method: 'POST',
    body: {
      recipeId,
      uploadableRecipe,
      instructions: recipe.instructions ?? [],
      equipment_tag_ids,
      authCookie: headers.cookie ?? '',
      authHeader: headers.authorization ?? '',
    },
  }).catch((err) => {
    console.error(`[publish-user-recipe] Phase B failed for recipe ${recipeId}:`, err);
  });

  return { status: 'processing' };
});
