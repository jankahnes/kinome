import type { SupabaseClient } from '@supabase/supabase-js';

export default async function addProfile(
  client: SupabaseClient,
  profileRow: {
    id: string;
    username: string;
    liked_tags?: number[];
    filter_tags?: number[];
    [key: string]: any;
  }
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update(profileRow)
    .eq('id', profileRow.id);
  if (error) throw error;
}
