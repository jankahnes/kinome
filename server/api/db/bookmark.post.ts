import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import {
  evaluateCrowdPleaserForRecipe,
  handleFirstBookmarkCreated,
  maybeAwardSaveReceived,
} from '~~/server/utils/gamification/service';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ recipeId?: number; bookmarked?: boolean }>(event);
  const recipeId = body.recipeId;
  const bookmarked = body.bookmarked;

  if (!recipeId || typeof bookmarked !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid bookmark payload' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  const { data: recipe, error: recipeError } = await client
    .from('recipes')
    .select('id, user_id')
    .eq('id', recipeId)
    .maybeSingle();

  if (recipeError || !recipe) {
    throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
  }

  if (!bookmarked) {
    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('user_id', user.sub)
      .eq('recipe_id', recipeId);

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to remove bookmark' });
    }

    return { success: true, bookmarked: false };
  }

  const { data: existing } = await client
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.sub)
    .eq('recipe_id', recipeId)
    .maybeSingle();

  if (!existing?.id) {
    const { error } = await client
      .from('bookmarks')
      .insert({
        user_id: user.sub,
        recipe_id: recipeId,
      });

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to add bookmark' });
    }

    await handleFirstBookmarkCreated(client as any, user.sub, recipeId);
    await maybeAwardSaveReceived(client as any, recipe.user_id, user.sub, recipeId);
  }

  await evaluateCrowdPleaserForRecipe(client as any, recipeId);

  return { success: true, bookmarked: true };
});
