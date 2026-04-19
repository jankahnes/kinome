import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { listTemplateMeals, upsertTemplates } from '~~/server/utils/tracking';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ templates?: any[] }>(event);
  const templates = body.templates ?? [];

  const client = serverSupabaseServiceRole<Database>(event);
  await upsertTemplates(client as any, user.sub, templates);
  return listTemplateMeals(client as any, user.sub);
});
