import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { materializeDailySchedules } from '~~/server/utils/tracking';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ date?: string }>(event);
  const logicalDate = body.date?.slice(0, 10);
  if (!logicalDate) {
    throw createError({ statusCode: 400, statusMessage: 'Missing date' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  return materializeDailySchedules(client as any, user.id, logicalDate);
});
