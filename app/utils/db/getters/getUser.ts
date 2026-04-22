import type { SupabaseClient } from '@supabase/supabase-js';
import type { FullUser } from '~/types/types';
import { getRecipeOverviews } from '~/utils/db/getters/getRecipes';

export async function getUser(
  client: SupabaseClient,
  userID: string | undefined | null,
): Promise<FullUser | null> {
  if (!userID) {
    return null;
  }
  let query = client.from('profiles').select(`*`).eq('id', userID);
  const { data, error } = await query;
  if (error) throw error;
  const user = data[0];
  if (!user) {
    return null;
  }
  const ownRecipes = await getRecipeOverviews(client, {
    eq: { user_id: userID },
  });
  const activity = await getActivity(client, {
    eq: { user_id: userID },
    orderBy: { column: 'created_at', ascending: false },
  });
  const { data: bookmarks, error: bookmarksError } = await client
    .from('bookmarks')
    .select('recipe_id')
    .eq('user_id', userID);
  if (bookmarksError) throw bookmarksError;
  const bookmarkRecipeIds = bookmarks.map((bookmark) => bookmark.recipe_id);
  let bookmarkRecipes: RecipeOverview[] = [];
  if (bookmarkRecipeIds.length > 0) {
    bookmarkRecipes = await getRecipeOverviews(client, {
      in: { id: bookmarkRecipeIds },
      neq: { visibility: 'HIDDEN' },
    });
  }
  const stats = {
    recipesCount: ownRecipes.length,
    activityCount: activity.length,
    bookmarksCount: bookmarkRecipes.length,
  };

  const processedUser = {
    ...user,
    recipes: ownRecipes,
    activity: activity,
    bookmarks: bookmarkRecipes,
    stats,
  };

  return processedUser as FullUser;
}

export async function getUserByUsername(
  client: SupabaseClient,
  username: string | undefined | null,
): Promise<FullUser | null> {
  if (!username) {
    return null;
  }

  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('normalized_username', normalizeUsername(username))
    .maybeSingle();

  if (error) throw error;
  return getUser(client, data?.id);
}

export async function getUsersPartial(
  client: SupabaseClient,
  opts: GetterOpts = {},
): Promise<User[]> {
  let query = client.from('profiles').select(`*`);
  query = buildQuery(query, opts);
  const { data, error } = await query;
  if (error) throw error;
  return data as User[];
}

export async function getUserPartial(
  client: SupabaseClient,
  opts: GetterOpts = {},
): Promise<User> {
  return expectSingle(await getUsersPartial(client, opts));
}
