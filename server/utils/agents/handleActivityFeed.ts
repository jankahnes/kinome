import { timeAgo } from '~/utils/format/timeAgo';

function userLink(user: { id?: string | null; username?: string | null } | null) {
  const id = user?.id;
  const name = user?.username ?? 'Guest';
  if (!id) return name === 'Guest' ? 'Someone' : name;
  return `[${name}](${id})`;
}

function recipePhrase(
  recipe: { id?: number | null; title?: string | null } | null | undefined,
  fallbackId?: number | null,
) {
  const id = recipe?.id ?? fallbackId;
  const title = recipe?.title ?? 'Recipe';
  if (id != null) return `[${title}](${id})`;
  return title;
}

function formatActivityRow(item: any): string {
  const who = userLink(item.user);
  const when = item.created_at ? ` · ${timeAgo(item.created_at)}` : '';

  switch (item.type) {
    case 'COMMENT_CREATION': {
      const recipe = recipePhrase(
        item.recipe,
        item.comment?.recipe_id ?? null,
      );
      const text = item.comment?.content?.trim() ?? '';
      return `${who} commented on ${recipe}: ${text}${when}`;
    }
    case 'RECIPE_CREATION':
      return `${who} added ${recipePhrase(item.recipe)}${when}`;
    case 'RATING_CREATION': {
      const rrecipe = recipePhrase(
        item.rating?.recipe ?? item.recipe,
      );
      const stars = item.rating?.rating ?? '?';
      return `${who} rated ${rrecipe}: ${stars}/5 stars${when}`;
    }
    case 'USER_CREATION':
      return `${who} joined the community.${when}`;
    case 'FOOD_CREATION':
      return `${who} added a new food.${when}`;
    default:
      return `${who} (${item.type})${when}`;
  }
}

export default async function handleActivityFeed(client: any, payload: any) {
  const limit = payload.limit ?? 20;

  const { data, error } = await client
    .from('activity')
    .select(
      `
        id, type, created_at,
        user:user_id(id, username),
        recipe:recipe_id(id, title),
        rating:rating_id(rating, recipe:recipe_id(id, title)),
        comment:comment_id(id, content, recipe_id)
      `,
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const lines = (data ?? []).map(formatActivityRow);
  const result =
    lines.length > 0
      ? lines.join('\n')
      : 'No recent activity.';

  return { result };
}