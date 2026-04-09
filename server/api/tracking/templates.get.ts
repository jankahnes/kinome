import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { listTemplateMeals } from '~~/server/utils/tracking';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  return listTemplateMeals(client as any, user.id);
});
