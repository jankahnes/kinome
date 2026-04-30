import { getGrade } from '~/utils/constants/grades';
import { getTagByID } from '~/utils/format/getTagByID';
import getStringFromIngredients from '~/utils/format/getStringFromIngredients';
import getTotalTime from '~/utils/format/getTotalTime';
import { timeAgo } from '~/utils/format/timeAgo';
import getHealthLabel from '~/utils/format/healthLabel';
import stripIngredientLinks from '~~/app/utils/format/stripIngredientLinks';
import { getDailyQualityCards } from '~/utils/nutrition/getDailyQualityCards';
import normalizeTags from './normalizeTags';
import formatRecipeOverviews from './formatRecipeOverviews';

function toTitleCase(input: string): string {
  return input
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getWebsiteName(source: string | null | undefined): string {
  if (!source) return '';
  try {
    const url = new URL(source);
    const parts = url.hostname.split('.');
    return parts.length > 2
      ? (parts[parts.length - 2] ?? '')
      : (parts[0] ?? '');
  } catch {
    return '';
  }
}

function getSocialProof(value: number | null | undefined): string {
  if (!value) return '0';
  if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.floor(value / 1_000)}K`;
  return String(value);
}

function formatNutritionLabel(r: any): string {
  const lines = [
    `Calories ${Math.round(Number(r.kcal ?? 0))} kcal`,
    `Protein ${Number(r.protein ?? 0).toFixed(1)} g`,
    `Carbohydrates ${Number(r.carbohydrates ?? 0).toFixed(1)} g`,
    `Fat ${Number(r.fat ?? 0).toFixed(1)} g`,
    `Fiber ${Number(r.fiber ?? 0).toFixed(1)} g`,
    `Sugar ${Number(r.sugar ?? 0).toFixed(1)} g`,
    `Salt ${Number(r.salt ?? 0).toFixed(1)} g`,
  ];
  return lines.join('; ');
}

function formatMethod(r: any): string {
  const full = Array.isArray(r.full_instructions) ? r.full_instructions : [];
  if (full.length > 0) {
    return full
      .map((step: any, idx: number) => {
        const title = step?.title?.trim() ? `${step.title}: ` : '';
        const text = stripIngredientLinks(step?.formatted_text ?? '');
        return `${idx + 1}. ${title}${text}`.trim();
      })
      .join('\n');
  }
  const simple = Array.isArray(r.instructions) ? r.instructions : [];
  return simple
    .map(
      (step: string, idx: number) =>
        `${idx + 1}. ${stripIngredientLinks(step ?? '')}`,
    )
    .join('\n');
}

function formatOriginLine(r: any): string {
  if (r.collection?.startsWith('traditional-')) {
    const cuisine = toTitleCase(
      String(r.collection).slice('traditional-'.length),
    );
    return `Traditional ${cuisine} recipe`;
  }
  if (r.source_type === 'MEDIA' && r.video_metadata?.channel) {
    const platform = getWebsiteName(r.video_metadata?.url ?? r.source);
    return `By ${r.video_metadata.channel}${platform ? ` on ${platform}` : ''} · Original recipe`;
  }
  if (r.source_type === 'WEBSITE' && r.source) {
    const website = getWebsiteName(r.source);
    return `From ${website ? toTitleCase(website) : 'website'} · Original recipe`;
  }
  if (r.user?.username) {
    return `By ${r.user.username} · Original recipe`;
  }
  return 'Original recipe';
}

function formatMetaLine(r: any): string {
  const timeParts = getTotalTime(r.total_time_mins ?? null, r.effort ?? null);
  const timeText =
    Array.isArray(timeParts) && timeParts.length > 0
      ? timeParts.map((p: any) => `${p.value} ${p.label}`).join(' ')
      : 'Unknown time';
  const ratingText =
    r.rating != null
      ? `${Number(r.rating).toFixed(1)} (${r.rating_count ?? 0} ratings)`
      : 'No ratings yet';
  const grade = getGrade(r.hidx, 'ovr');
  const health = grade ? `${grade} · "${getHealthLabel(grade)}"` : 'N/A';
  const tagNames = normalizeTags(r.tags ?? [])
    .map((id) => getTagByID(id)?.name)
    .filter(Boolean)
    .slice(0, 6)
    .join(', ');
  return `Health ${health}; Rating ${ratingText}; Time ${timeText}; Calories ${r.kcal ?? 'N/A'} kcal${tagNames ? `; Tags ${tagNames}` : ''}`;
}

function formatQualityProfile(r: any): string {
  const cards = getDailyQualityCards(r.report, {
    totalFat: r.fat,
    protectiveScore: r.protective_score,
  });
  if (!cards.length) return 'No quality profile available.';
  return cards
    .map(
      (c) => `${c.title}: ${c.rating}${c.subtitle ? ` (${c.subtitle})` : ''}`,
    )
    .join('; ');
}

function formatComments(comments: any[]): string {
  if (!comments.length) return 'No comments yet.';
  const byParent = new Map<number, any[]>();
  const roots: any[] = [];
  for (const c of comments) {
    if (c.replying_to) {
      const arr = byParent.get(c.replying_to) ?? [];
      arr.push(c);
      byParent.set(c.replying_to, arr);
    } else {
      roots.push(c);
    }
  }
  return roots
    .map((root) => {
      const user = root.user?.username ?? 'Guest';
      const when = root.created_at ? timeAgo(root.created_at) : 'unknown time';
      const replies = byParent.get(root.id) ?? [];
      const replyText = replies.length
        ? ` Replies: ${replies.map((r) => `[Comment by ${r.user?.username ?? 'Guest'} (${r.created_at ? timeAgo(r.created_at) : 'unknown time'})](${r.id}): ${r.content}`).join(' | ')}`
        : '';
      return `[Comment by ${user} (${when})](${root.id}): ${root.content}${replyText}`;
    })
    .join('\n');
}

export default async function handleRecipeDetails(
  client: any,
  personaUserId: string,
  payload: any,
  dryRun = false,
) {
  const { recipe_id } = payload;
  if (!recipe_id) throw new Error('recipe_id required');

  const [recipeRes, ratingsCountRes, variationsRes] = await Promise.all([
    client
      .from('recipes')
      .select(
        `
          id, title, description, source_type, source, collection,
          batch_size, total_time_mins, effort, hidx, rating, kcal, report, protective_score, embedding,
          protein, carbohydrates, fat, fiber, sugar, salt,
          instructions, full_instructions, based_on, variation_name,
          based_on_parent:recipe_overviews!recipes_based_on_fkey(id, title),
          tags:recipe_tags(tag_id), video_metadata,
          user:profiles!recipes_user_id_fkey(id, username),
          ingredients:recipe_foods(amount, unit, category, preparation_description, food_name:food_names(id, name)),
          comments:comments(id, content, replying_to, created_at, user:profiles(id, username))
        `,
      )
      .eq('id', recipe_id)
      .neq('visibility', 'HIDDEN')
      .single(),
    client
      .from('ratings')
      .select('id', { count: 'exact', head: true })
      .eq('recipe_id', recipe_id),
    client
      .from('recipes')
      .select('id, title, variation_display_name')
      .eq('based_on', recipe_id)
      .neq('visibility', 'HIDDEN'),
  ]);

  if (recipeRes.error) {
    throw new Error(
      `Recipe query failed: code=${(recipeRes.error as any).code ?? '?'} message=${recipeRes.error.message} details=${(recipeRes.error as any).details ?? ''} hint=${(recipeRes.error as any).hint ?? ''}`,
    );
  }
  if (!recipeRes.data)
    throw new Error(`Recipe ${recipe_id} not found or hidden`);
  const r = recipeRes.data as any;
  r.rating_count = ratingsCountRes.count ?? 0;

  if (!dryRun) {
    await Promise.all([
      (client as any)
        .from('agent_engagement_log')
        .insert({ user_id: personaUserId, recipe_id }),
      client.rpc('increment_recipe_engagement', {
        recipe_id_param: recipe_id,
        points_param: 10,
      }),
    ]);
  }

  const similarRecipes: any[] = [];
  const embedding = Array.isArray(r.embedding)
    ? r.embedding
    : typeof r.embedding === 'string'
      ? JSON.parse(r.embedding)
      : null;
  if (Array.isArray(embedding) && embedding.length > 0) {
    const similarRes = await client.rpc('search_recipes_ai', {
      query: embedding,
      max: 12,
    });
    const ids = (similarRes.data ?? [])
      .map((it: any) => it.id)
      .filter((id: number) => id !== r.id)
      .slice(0, 8);
    if (ids.length > 0) {
      const overviewRes = await client
        .from('recipes')
        .select(
          'id, title, hidx, rating, kcal, total_time_mins, source_type, picture',
        )
        .in('id', ids)
        .or('picture.not.is.null,source_type.eq.MEDIA')
        .neq('visibility', 'HIDDEN');
      const byId = new Map(
        (overviewRes.data ?? []).map((it: any) => [it.id, it]),
      );
      for (const id of ids) {
        const item = byId.get(id);
        if (item) similarRecipes.push(item);
        if (similarRecipes.length >= 3) break;
      }
    }
  }

  const ingredientsForPage = (r.ingredients ?? []).map((i: any) => ({
    id: i.food_name?.id,
    name: i.food_name?.name ?? 'Unknown ingredient',
    category: i.category ?? 'uncategorized',
    preparation_description: i.preparation_description ?? null,
    amountInfo: [[i.amount, i.unit]],
    currentUnit: 0,
    countable_units: {},
  }));
  const formattedIngredients =
    getStringFromIngredients(ingredientsForPage, r.batch_size ?? 1).trim() ||
    'No ingredients listed.';
  const formattedMethod = formatMethod(r) || 'No method steps available.';
  const formattedNutrition = formatNutritionLabel(r);
  const qualityProfile = formatQualityProfile(r);
  const originLine = formatOriginLine(r);
  const metaLine = formatMetaLine(r);
  const formattedComments = formatComments(r.comments ?? []);
  const similarText = formatRecipeOverviews(similarRecipes);
  const variations = variationsRes.data ?? [];

  const mediaLine =
    r.source_type === 'MEDIA'
      ? `\nVideo: Uploaded by ${r.video_metadata?.channel ?? 'Unknown creator'} on ${getWebsiteName(r.video_metadata?.url ?? r.source) || 'unknown platform'}, ${r.video_metadata?.upload_date ? timeAgo(r.video_metadata.upload_date) : 'unknown time'}. Viewed ${getSocialProof(r.video_metadata?.view_count)} times and liked ${getSocialProof(r.video_metadata?.like_count)} times.`
      : '';
  const variationLine =
    r.based_on && r.based_on_parent?.id
      ? `\nVariation: ${r.variation_name ?? 'Variation'} of [${r.based_on_parent.title}](${r.based_on_parent.id}).`
      : '';
  const variationsLine = variations.length
    ? `\nVariations: ${variations.map((v: any) => `[${v.variation_display_name ?? v.title}](${v.id})`).join(', ')}.`
    : '';

  const resultText = [
    `You click on ${r.title}.`,
    'A page opens, revealing details about the recipe.',
    `Description: ${r.description ?? 'No description available.'}`,
    `Author & Origin: ${originLine}`,
    `Meta: ${metaLine}`,
    `Method: ${formattedMethod}`,
    `Ingredients: ${formattedIngredients}`,
    `Nutrition Label: ${formattedNutrition}`,
    `Quality Profile: ${qualityProfile}`,
    `${mediaLine}${variationLine}${variationsLine}`.trim(),
    `You might also like: ${similarText}`,
    `Comments: ${formattedComments}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { result: resultText };
}
