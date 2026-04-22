import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';

type LookupBody = {
  username?: string;
  email?: string;
  excludeProfileId?: string;
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LookupBody>(event);
  const username = body.username?.trim();
  const normalizedUsername = username ? normalizeUsername(username) : null;
  const email = body.email?.trim().toLowerCase();
  const excludeProfileId = body.excludeProfileId;
  const client = serverSupabaseServiceRole<Database>(event);

  let usernameTaken = false;
  let emailForUsername: string | null = null;

  if (normalizedUsername) {
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id')
      .eq('normalized_username', normalizedUsername)
      .maybeSingle();

    if (profileError) {
      throw createError({
        statusCode: 500,
        statusMessage: profileError.message,
      });
    }

    usernameTaken = Boolean(profile && profile.id !== excludeProfileId);

    if (profile?.id) {
      const { data: authUser, error: authUserError } =
        await client.auth.admin.getUserById(profile.id);

      if (authUserError) {
        throw createError({
          statusCode: 500,
          statusMessage: authUserError.message,
        });
      }

      emailForUsername = authUser.user?.email ?? null;
    }
  }

  let emailTaken = false;

  if (email) {
    let page = 1;
    const perPage = 1000;

    while (!emailTaken) {
      const { data, error } = await client.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: error.message,
        });
      }

      emailTaken = data.users.some(
        (user) => user.email?.toLowerCase() === email,
      );

      if (emailTaken || data.users.length < perPage) break;
      page++;
    }
  }

  return {
    usernameTaken,
    usernameAvailable: username ? !usernameTaken : null,
    emailTaken,
    emailAvailable: email ? !emailTaken : null,
    emailForUsername,
  };
});
