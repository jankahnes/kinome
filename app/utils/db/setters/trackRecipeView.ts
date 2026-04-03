import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_RECENTLY_SEEN = 50;

export async function trackRecipeView(
  client: SupabaseClient,
  userId: string,
  recipeId: number
): Promise<void> {
  const { data: profile } = await client
    .from('profiles')
    .select('recently_seen')
    .eq('id', userId)
    .single();

  const current: number[] = (profile as any)?.recently_seen ?? [];
  const updated = [recipeId, ...current.filter((id) => id !== recipeId)].slice(
    0,
    MAX_RECENTLY_SEEN
  );

  await client
    .from('profiles')
    .update({ recently_seen: updated } as any)
    .eq('id', userId);
}
