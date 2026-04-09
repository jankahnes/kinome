import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { updateTemplateSchedule } from '~~/server/utils/tracking';

function addDays(logicalDate: string, days: number) {
  const next = new Date(`${logicalDate}T12:00:00`);
  next.setDate(next.getDate() + Math.max(0, days - 1));
  return next.toISOString();
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ templateId?: number; days?: number; startDate?: string }>(event);
  if (!body.templateId || !body.days || !body.startDate) {
    throw createError({ statusCode: 400, statusMessage: 'Missing schedule payload' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  await updateTemplateSchedule(client as any, user.id, body.templateId, {
    active: true,
    scheduleUntil: addDays(body.startDate.slice(0, 10), body.days),
  });

  return { success: true };
});
