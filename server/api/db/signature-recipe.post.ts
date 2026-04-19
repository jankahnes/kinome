import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { handleSignatureSet } from '~~/server/utils/gamification/service';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ recipeId?: number | null }>(event);
  const recipeId = body?.recipeId ?? null;

  let user: { sub: string } | null = null;
  try {
    user = await serverSupabaseUser(event);
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const client = serverSupabaseServiceRole<Database>(event);

  if (recipeId == null) {
    const { error } = await client
      .from('profiles')
      .update({ signature_recipe: null })
      .eq('id', user.sub);

    if (error) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to clear signature recipe' });
    }

    return { success: true, recipeId: null };
  }

  if (!Number.isInteger(recipeId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid recipe ID' });
  }

  const { data: recipe, error: recipeError } = await client
    .from('recipes')
    .select('id, user_id, source_type')
    .eq('id', recipeId)
    .single();

  if (recipeError || !recipe) {
    throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
  }

  if (recipe.user_id !== user.sub) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to sign this recipe' });
  }

  if (recipe.source_type === 'MEDIA' || recipe.source_type === 'WEBSITE') {
    throw createError({ statusCode: 400, statusMessage: 'Imported recipes cannot be chosen as signature recipes' });
  }

  const { error: updateError } = await client
    .from('profiles')
    .update({ signature_recipe: recipeId })
    .eq('id', user.sub);

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save signature recipe' });
  }

  await handleSignatureSet(client as any, user.sub, recipeId);

  return { success: true, recipeId };
});
