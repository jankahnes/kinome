import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import {
  evaluateCrowdPleaserForRecipe,
  handleFirstRatingGiven,
  maybeAwardRatingReceived,
} from '~~/server/utils/gamification/service';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ recipeId?: number; rating?: number }>(event);
  const recipeId = body.recipeId;
  const rating = body.rating;

  if (!recipeId || rating == null || rating < 0 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid rating payload' });
  }

  const client = serverSupabaseServiceRole<Database>(event);

  const [{ data: existing }, { data: recipe, error: recipeError }] = await Promise.all([
    client
      .from('ratings')
      .select('id')
      .eq('user_id', user.sub)
      .eq('recipe_id', recipeId)
      .maybeSingle(),
    client
      .from('recipes')
      .select('id, user_id')
      .eq('id', recipeId)
      .maybeSingle(),
  ]);

  if (recipeError || !recipe) {
    throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
  }

  const { error } = await client
    .from('ratings')
    .upsert(
      {
        user_id: user.sub,
        recipe_id: recipeId,
        rating,
      },
      { onConflict: 'user_id,recipe_id' },
    );

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update rating' });
  }

  if (!existing?.id) {
    await handleFirstRatingGiven(client as any, user.sub, recipeId);
    await maybeAwardRatingReceived(client as any, recipe.user_id, user.sub, recipeId);
  }

  await evaluateCrowdPleaserForRecipe(client as any, recipeId);

  return { success: true, firstRating: !existing?.id };
});
