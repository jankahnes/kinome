import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { buildTemplateForDay } from '~~/server/utils/tracking';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ templateId?: number }>(event);
  if (!body.templateId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing templateId' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  return buildTemplateForDay(client as any, user.sub, body.templateId);
});
