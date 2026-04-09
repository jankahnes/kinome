import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { createTemplateFromMeal, createTemplateFromPayload } from '~~/server/utils/tracking';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ mealId?: number; meal?: any }>(event);
  if (!body.mealId && !body.meal) {
    throw createError({ statusCode: 400, statusMessage: 'Missing meal payload' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  if (body.mealId) {
    return createTemplateFromMeal(client as any, user.id, body.mealId);
  }

  return createTemplateFromPayload(client as any, user.id, body.meal);
});
