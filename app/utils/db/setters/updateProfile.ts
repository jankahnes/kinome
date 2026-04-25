import type { SupabaseClient } from '@supabase/supabase-js';

export default async function updateProfile(
  client: SupabaseClient,
  profileRow: any
) {
  const { data, error } = await client
    .from('profiles')
    .update(profileRow)
    .eq('id', profileRow.id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      `updateProfile: no profile row matched id ${profileRow.id} (RLS or missing row)`,
    );
  }
}
