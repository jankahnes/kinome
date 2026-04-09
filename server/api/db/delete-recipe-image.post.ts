import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';

export default defineEventHandler(async (event) => {
  const { recipeId } = await readBody(event);
  const config = useRuntimeConfig();
  const client = serverSupabaseServiceRole<Database>(event);
  let user: { id: string } | null = null;
  try {
    user = await serverSupabaseUser(event);
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized (No auth session)' });
  }

  const id = typeof recipeId === 'number' ? recipeId : Number(recipeId);
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid recipe id' });
  }

  if (user?.id === config.adminUuid) {
    console.log('Overriding owner check for admin (delete recipe image)');
  } else {
    const { data: existingRecipe, error: fetchError } = await client
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecipe) {
      throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
    }
    if (existingRecipe.user_id !== user?.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Not authorized to update this recipe image',
      });
    }
  }

  const objectPath = `${id}.webp`;
  const { error: storageError } = await client.storage.from('recipe').remove([objectPath]);
  if (storageError) {
    console.warn('Recipe image storage remove:', storageError.message);
  }

  const { error: dbError } = await client
    .from('recipes')
    .update({ picture: null })
    .eq('id', id);

  if (dbError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to clear recipe picture' });
  }

  return { status: 'ok' };
});
