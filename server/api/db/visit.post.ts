import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { handleDailyVisit } from '~~/server/utils/gamification/service';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ date?: string }>(event);
  const logicalDate = body.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  const client = serverSupabaseServiceRole<Database>(event);
  await handleDailyVisit(client as any, user.id, logicalDate);

  return { success: true };
});
