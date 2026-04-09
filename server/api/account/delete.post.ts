import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ confirmation?: string }>(event);
  const confirmation = body?.confirmation?.trim().toUpperCase();

  if (confirmation !== 'DELETE') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Confirmation text did not match',
    });
  }

  let user: Awaited<ReturnType<typeof serverSupabaseUser>>;
  try {
    user = await serverSupabaseUser(event);
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (!user?.id || user.is_anonymous) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  const { error } = await client.auth.admin.deleteUser(user.id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete account',
    });
  }

  return { status: 'ok' };
});
