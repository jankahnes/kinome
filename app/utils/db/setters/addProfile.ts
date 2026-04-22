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
  const { data, error } = await client
    .from('profiles')
    .update(profileRow)
    .eq('id', profileRow.id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (data) return;

  const { error: insertError } = await client.from('profiles').insert(profileRow);
  if (insertError) throw insertError;
}
