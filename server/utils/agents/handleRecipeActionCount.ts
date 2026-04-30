export default async function handleRecipeActionCount(
  client: any,
  payload: any,
  pileOnCap: number,
) {
  const { recipe_id, hours = 24 } = payload;
  if (!recipe_id) throw new Error('recipe_id required');

  const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();

  const [rrRes, rbRes, rcRes] = await Promise.all([
    client
      .from('ratings')
      .select('user_id')
      .eq('recipe_id', recipe_id)
      .gte('created_at', cutoff),
    client
      .from('bookmarks')
      .select('user_id')
      .eq('recipe_id', recipe_id)
      .gte('created_at', cutoff),
    client
      .from('comments')
      .select('user_id')
      .eq('recipe_id', recipe_id)
      .gte('created_at', cutoff),
  ]);

  const distinctUsers = new Set<string>([
    ...(rrRes.data ?? []).map((r: any) => r.user_id),
    ...(rbRes.data ?? []).map((r: any) => r.user_id),
    ...(rcRes.data ?? []).map((r: any) => r.user_id),
  ]);

  return { count: distinctUsers.size, cap: pileOnCap };
}
