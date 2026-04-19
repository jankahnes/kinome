import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '#supabase/server';
import type { Database } from '~/types/supabase';
import {
  getVisitStreaks,
  handleDailyVisit,
} from '~~/server/utils/gamification/service';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ date?: string }>(event);
  const logicalDate =
    body.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  const client = serverSupabaseServiceRole<Database>(event);
  await handleDailyVisit(client as any, user.sub, logicalDate);
  const streaks = await getVisitStreaks(client as any, user.sub, logicalDate);

  return {
    success: true,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
});
