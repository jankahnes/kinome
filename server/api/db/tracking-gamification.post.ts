import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { handleTrackingSaved } from '~~/server/utils/gamification/service';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ date?: string }>(event);
  const logicalDate = body.date?.slice(0, 10);
  if (!logicalDate) {
    throw createError({ statusCode: 400, statusMessage: 'Missing tracking date' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  const { count, error } = await client
    .from('tracked_meals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('meal_date', logicalDate);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to inspect tracking day' });
  }

  if ((count ?? 0) > 0) {
    await handleTrackingSaved(client as any, user.id, logicalDate);
  }

  return { success: true };
});
