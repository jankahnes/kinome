import type { SupabaseClient } from '@supabase/supabase-js';
import type { FullUser } from '~/types/types';
import { getRecipeOverviews } from '~/utils/db/getters/getRecipes';

export async function getUsers(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<FullUser[]> {
  let query = client.from('profiles').select(`*`);
  query = buildQuery(query, opts);
  const { data, error } = await query;
  if (error) throw error;
  const users = data;
  const ids = users.map((user) => user.id);
  const ownRecipes = await getRecipeOverviews(client, { in: { user_id: ids } });
  const activity = await getActivity(client, {
    in: { user_id: ids },
    orderBy: { column: 'created_at', ascending: false },
  });
  const { data: bookmarks, error: bookmarksError } = await client
    .from('bookmarks')
    .select('recipe_id')
    .eq('user_id', ids);
  if (bookmarksError) throw bookmarksError;
  const bookmarkRecipeIds = bookmarks.map((bookmark) => bookmark.recipe_id);
  const bookmarkRecipes = await getRecipeOverviews(client, {
    in: { id: bookmarkRecipeIds },
  });
  const stats = {
    recipesCount: ownRecipes.length,
    activityCount: activity.length,
    bookmarksCount: bookmarkRecipes.length,
  };

  const processedUsers = await Promise.all(
    users.map(async (user) => ({
      ...user,
      recipes: ownRecipes,
      activity: activity,
      bookmarks: bookmarkRecipes,
      settings: user.settings as Record<string, any>,
      stats,
    }))
  );

  return processedUsers as FullUser[];
}

export async function getUsersPartial(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<User[]> {
  let query = client.from('profiles').select(`*`);
  query = buildQuery(query, opts);
  const { data, error } = await query;
  if (error) throw error;
  return data as User[];
}

export async function getUser(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<FullUser> {
  return expectSingle(await getUsers(client, opts));
}

export async function getUserPartial(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<User> {
  return expectSingle(await getUsersPartial(client, opts));
}
