import normalizeTags from './normalizeTags';
import formatRecipeOverviews from './formatRecipeOverviews';
import getReasonText from '~/utils/format/getReasonText';

export default async function handleWorldState(
  client: any,
  personaUserId: string,
  payload: any,
  pileOnCap: number,
) {
  const limits = payload.limits ?? {};
  const recLimit = limits.recommended ?? 20;
  const trLimit = limits.trending ?? 10;
  const frLimit = limits.fresh ?? 10;

  const [recResult, trResult, freshResult] = await Promise.all([
    client.rpc('get_recommendations', {
      p_user_id: personaUserId,
      max: recLimit,
      explore: true,
    }),
    client
      .from('recipes')
      .select('id, title, rating, tags:recipe_tags(tag_id)')
      .eq('visibility', 'PUBLIC')
      .order('relevancy', { ascending: false })
      .limit(trLimit),
    client
      .from('recipes')
      .select('id, title, rating, tags:recipe_tags(tag_id)')
      .eq('visibility', 'PUBLIC')
      .order('created_at', { ascending: false })
      .limit(frLimit),
  ]);

  const recommended: any[] = recResult.data ?? [];
  const recIds = new Set(recommended.map((r) => r.id));

  const trending: any[] = (trResult.data ?? []).filter(
    (r: any) => !recIds.has(r.id),
  );
  const trIds = new Set(trending.map((r) => r.id));

  const fresh: any[] = (freshResult.data ?? []).filter(
    (r: any) => !recIds.has(r.id) && !trIds.has(r.id),
  );

  const allIds = Array.from(
    new Set([
      ...recommended.map((r) => r.id),
      ...trending.map((r) => r.id),
      ...fresh.map((r) => r.id),
    ]),
  );

  if (allIds.length === 0) {
    return {
      result: [
        'Trending:',
        'None.',
        '',
        'Recommended:',
        'None.',
        '',
        'New:',
        'None.',
      ].join('\n'),
    };
  }

  const cutoff24h = new Date(Date.now() - 86400_000).toISOString();

  const [rrRes, rbRes, rcRes, viewedRes, ratedRes, savedRes, commentedRes] =
    await Promise.all([
      client
        .from('ratings')
        .select('recipe_id, user_id')
        .in('recipe_id', allIds)
        .gte('created_at', cutoff24h),
      client
        .from('bookmarks')
        .select('recipe_id, user_id')
        .in('recipe_id', allIds)
        .gte('created_at', cutoff24h),
      client
        .from('comments')
        .select('recipe_id, user_id')
        .in('recipe_id', allIds)
        .gte('created_at', cutoff24h),
      (client as any)
        .from('agent_engagement_log')
        .select('recipe_id')
        .eq('user_id', personaUserId)
        .in('recipe_id', allIds),
      client
        .from('ratings')
        .select('recipe_id, rating')
        .eq('user_id', personaUserId)
        .in('recipe_id', allIds),
      client
        .from('bookmarks')
        .select('recipe_id')
        .eq('user_id', personaUserId)
        .in('recipe_id', allIds),
      client
        .from('comments')
        .select('recipe_id')
        .eq('user_id', personaUserId)
        .in('recipe_id', allIds),
    ]);

  // pile-on map: recipe_id → Set<user_id>
  const pileOnMap: Record<number, Set<string>> = {};
  for (const row of [
    ...(rrRes.data ?? []),
    ...(rbRes.data ?? []),
    ...(rcRes.data ?? []),
  ]) {
    if (!pileOnMap[row.recipe_id]) pileOnMap[row.recipe_id] = new Set();
    pileOnMap[row.recipe_id]?.add(row.user_id);
  }

  const viewedSet = new Set<number>(
    (viewedRes.data ?? []).map((r: any) => r.recipe_id),
  );
  const ratedMap: Record<number, number> = {};
  for (const r of ratedRes.data ?? []) ratedMap[r.recipe_id] = r.rating;
  const savedSet = new Set<number>(
    (savedRes.data ?? []).map((r: any) => r.recipe_id),
  );
  const commentedSet = new Set<number>(
    (commentedRes.data ?? []).map((r: any) => r.recipe_id),
  );

  function toOverviewLite(r: any, isRecommended = false) {
    const youHave: string[] = [];
    if (viewedSet.has(r.id)) youHave.push('viewed');
    if (savedSet.has(r.id)) youHave.push('saved');
    if (commentedSet.has(r.id)) youHave.push('commented on');
    if (ratedMap[r.id]) youHave.push(`rated (${ratedMap[r.id]}★)`);

    return {
      id: r.id,
      title: r.title,
      rating: r.rating,
      tags: normalizeTags(r.tags ?? []),
      you_have: youHave,
      recommendation_reason:
        isRecommended && r.dominant_signal !== 'trending'
          ? getReasonText(r)
          : null,
    };
  }

  const filteredTrending = trending
    .filter((r) => (pileOnMap[r.id]?.size ?? 0) < pileOnCap)
    .map((r) => toOverviewLite(r, false));

  const filteredRecommended = recommended
    .filter((r) => (pileOnMap[r.id]?.size ?? 0) < pileOnCap)
    .map((r) => toOverviewLite(r, true));

  const filteredFresh = fresh
    .filter((r) => (pileOnMap[r.id]?.size ?? 0) < pileOnCap)
    .map((r) => toOverviewLite(r, false));

  return {
    result: [
      'TRENDING section:',
      formatRecipeOverviews(filteredTrending),
      '',
      'FOR YOU section:',
      formatRecipeOverviews(filteredRecommended),
      '',
      'NEW RECIPES section:',
      formatRecipeOverviews(filteredFresh),
    ].join('\n'),
  };
}
