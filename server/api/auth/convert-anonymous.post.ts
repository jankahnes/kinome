import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '#supabase/server';
import type { Database } from '~/types/supabase';

type ConvertAnonymousBody = {
  email?: string;
  password?: string;
};

export default defineEventHandler(async (event) => {
  const currentUser = await serverSupabaseUser(event);
  if (!currentUser?.sub || !currentUser.is_anonymous) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<ConvertAnonymousBody>(event);
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing email or password',
    });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  const { data: anonymousProfile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('id', currentUser.sub)
    .maybeSingle();

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: profileError.message });
  }

  if (!anonymousProfile) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Anonymous profile not found',
    });
  }

  const { data: createdUser, error: createUserError } =
    await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createUserError) {
    throw createError({
      statusCode: 400,
      statusMessage: createUserError.message,
    });
  }

  const newUserId = createdUser.user?.id;
  if (!newUserId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Account creation did not return a user id',
    });
  }

  let profileMigrated = false;

  try {
    // Auth user creation may trigger a placeholder profile for the new id.
    // Remove it so the existing anonymous profile can claim that id.
    const { error: deletePlaceholderError } = await client
      .from('profiles')
      .delete()
      .eq('id', newUserId);

    if (deletePlaceholderError) throw deletePlaceholderError;

    const { data: migratedProfile, error: migrateProfileError } = await client
      .from('profiles')
      .update({ id: newUserId })
      .eq('id', currentUser.sub)
      .select('id')
      .maybeSingle();

    if (migrateProfileError) throw migrateProfileError;
    if (!migratedProfile) {
      throw new Error('Anonymous profile disappeared during migration');
    }

    profileMigrated = true;

    const { error: deleteAnonymousUserError } =
      await client.auth.admin.deleteUser(currentUser.sub);
    if (deleteAnonymousUserError) {
      console.warn(
        'Converted anonymous account, but failed to delete old auth user',
        deleteAnonymousUserError,
      );
    }
  } catch (error: any) {
    if (!profileMigrated) {
      const { error: rollbackError } =
        await client.auth.admin.deleteUser(newUserId);
      if (rollbackError) {
        console.warn(
          'Failed to roll back permanent auth user after migration error',
          rollbackError,
        );
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Failed to migrate anonymous account',
    });
  }

  return {
    user: {
      id: newUserId,
      email,
    },
  };
});
