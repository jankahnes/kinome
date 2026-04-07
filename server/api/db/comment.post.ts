import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import {
  evaluateCrowdPleaserForRecipe,
  handleCommentCreated,
} from '~~/server/utils/gamification/service';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{
    recipe_id?: number;
    content?: string;
    replying_to?: number | null;
  }>(event);

  const recipeId = body.recipe_id;
  const content = body.content?.trim();
  if (!recipeId || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Missing comment payload' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  const { data, error } = await client
    .from('comments')
    .insert({
      user_id: user.id,
      recipe_id: recipeId,
      content,
      replying_to: body.replying_to ?? null,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to insert comment',
    });
  }

  await handleCommentCreated(client as any, user.id, data.id);
  await evaluateCrowdPleaserForRecipe(client as any, recipeId);

  return { id: data.id };
});
