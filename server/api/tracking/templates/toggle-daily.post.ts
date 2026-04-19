import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import { updateTemplateSchedule } from '~~/server/utils/tracking';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ templateId?: number; active?: boolean }>(event);
  if (!body.templateId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing schedule payload' });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  await updateTemplateSchedule(
    client as any,
    user.sub,
    body.templateId,
    {
      active: Boolean(body.active),
      scheduleUntil: null,
    },
  );

  return { success: true };
});
