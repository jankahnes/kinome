import OpenAI from 'openai';
import formatRecipeOverviews from './formatRecipeOverviews';

const RESULT_LIMIT = 10;
const RPC_LIMIT = 40;

export default async function handleSearch(
  client: any,
  personaUserId: string,
  payload: any,
  config: any,
) {
  const query: string | undefined = payload?.query?.trim();
  if (!query) throw new Error('query required');

  const openai = new OpenAI({ apiKey: config.gptKey });
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const embedding = embeddingResponse.data[0]?.embedding;
  if (!embedding) throw new Error('Failed to generate embedding for query');

  const searchRes = await client.rpc('search_recipes_ai', {
    query: embedding,
    max: RPC_LIMIT,
  });
  if (searchRes.error) {
    throw new Error(
      `Search RPC failed: code=${(searchRes.error as any).code ?? '?'} message=${searchRes.error.message}`,
    );
  }
  const candidateIds: number[] = (searchRes.data ?? [])
    .map((it: any) => it.id)
    .filter((id: any) => typeof id === 'number');

  if (candidateIds.length === 0) {
    return { result: `You search for "${query}" but nothing comes up.` };
  }

  const [ratedRes, savedRes, commentedRes, viewedRes] = await Promise.all([
    client
      .from('ratings')
      .select('recipe_id')
      .eq('user_id', personaUserId)
      .in('recipe_id', candidateIds),
    client
      .from('bookmarks')
      .select('recipe_id')
      .eq('user_id', personaUserId)
      .in('recipe_id', candidateIds),
    client
      .from('comments')
      .select('recipe_id')
      .eq('user_id', personaUserId)
      .in('recipe_id', candidateIds),
    (client as any)
      .from('agent_engagement_log')
      .select('recipe_id')
      .eq('user_id', personaUserId)
      .in('recipe_id', candidateIds),
  ]);

  const interacted = new Set<number>();
  for (const row of ratedRes.data ?? []) interacted.add(row.recipe_id);
  for (const row of savedRes.data ?? []) interacted.add(row.recipe_id);
  for (const row of commentedRes.data ?? []) interacted.add(row.recipe_id);
  for (const row of viewedRes.data ?? []) interacted.add(row.recipe_id);

  const filteredIds = candidateIds.filter((id) => !interacted.has(id));
  if (filteredIds.length === 0) {
    return {
      result: `You search for "${query}" but everything that comes up is something you've already engaged with.`,
    };
  }

  const overviewRes = await client
    .from('recipes')
    .select('id, title, rating, tags:recipe_tags(tag_id)')
    .in('id', filteredIds)
    .eq('visibility', 'PUBLIC');
  if (overviewRes.error) {
    throw new Error(
      `Search overview fetch failed: code=${(overviewRes.error as any).code ?? '?'} message=${overviewRes.error.message}`,
    );
  }

  const byId = new Map(
    (overviewRes.data ?? []).map((r: any) => [r.id, r]),
  );
  const orderedResults: any[] = [];
  for (const id of filteredIds) {
    const row = byId.get(id);
    if (row) orderedResults.push(row);
    if (orderedResults.length >= RESULT_LIMIT) break;
  }

  if (orderedResults.length === 0) {
    return { result: `You search for "${query}" but nothing comes up.` };
  }

  return {
    result: [
      `Search results for "${query}":`,
      formatRecipeOverviews(orderedResults),
    ].join('\n'),
  };
}
