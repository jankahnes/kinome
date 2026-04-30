import { timeAgo } from '~/utils/format/timeAgo';

/**
 * Activity-on-own: things that happened on this persona's content since
 * `since`, surfaced as a prompt block for the `respond_to_activity_on_own`
 * intent. Two strands:
 *   1. Replies to comments this persona wrote (anywhere).
 *   2. Top-level comments on recipes this persona authored, excluding
 *      source_type='MEDIA' (imported clips — not really "theirs").
 *
 * Returns rendered string in `result`. Empty string when nothing to show —
 * the orchestrator uses that to decide whether the intent is available.
 */
export default async function handleActivityOnOwn(
  client: any,
  personaUserId: string,
  payload: any,
) {
  const since = String(payload.since ?? '').trim();
  if (!since) throw new Error('since required');
  const limit = Math.max(1, Math.min(30, parseInt(String(payload.limit ?? 10), 10)));

  // --- Strand 1: replies to my comments -------------------------------------
  const repliesQ = client
    .from('comments')
    .select(
      `
        id, content, created_at, recipe_id,
        user:user_id(id, username),
        recipe:recipe_id(id, title),
        parent:replying_to!inner(id, content, user_id)
      `,
    )
    .eq('parent.user_id', personaUserId)
    .neq('user_id', personaUserId)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);

  // --- Strand 2: top-level comments on my recipes (excl. MEDIA imports) -----
  const commentsQ = client
    .from('comments')
    .select(
      `
        id, content, created_at,
        user:user_id(id, username),
        recipe:recipe_id!inner(id, title, source_type, user_id)
      `,
    )
    .eq('recipe.user_id', personaUserId)
    .neq('recipe.source_type', 'MEDIA')
    .neq('user_id', personaUserId)
    .is('replying_to', null)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);

  const [repliesRes, commentsRes] = await Promise.all([repliesQ, commentsQ]);
  if (repliesRes.error) throw repliesRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const replies = repliesRes.data ?? [];
  const comments = commentsRes.data ?? [];

  if (replies.length === 0 && comments.length === 0) {
    return { result: '' };
  }

  const sections: string[] = [];

  if (replies.length > 0) {
    const lines = replies.map((row: any) => {
      const who = userLink(row.user);
      const recipe = recipePhrase(row.recipe, row.recipe_id);
      const yourText = truncate(row.parent?.content ?? '', 80);
      const reply = (row.content ?? '').trim();
      const when = row.created_at ? timeAgo(row.created_at) : '';
      return (
        `- ${who} replied to your "${yourText}" on ${recipe}: ` +
        `"${reply}" (comment_id=${row.id}${when ? `, ${when}` : ''})`
      );
    });
    sections.push(`Replies to your comments:\n${lines.join('\n')}`);
  }

  if (comments.length > 0) {
    const lines = comments.map((row: any) => {
      const who = userLink(row.user);
      const recipe = recipePhrase(row.recipe);
      const text = (row.content ?? '').trim();
      const when = row.created_at ? timeAgo(row.created_at) : '';
      return (
        `- ${who} commented on ${recipe}: "${text}" ` +
        `(comment_id=${row.id}${when ? `, ${when}` : ''})`
      );
    });
    sections.push(`Comments on your recipes:\n${lines.join('\n')}`);
  }

  return { result: sections.join('\n\n') };
}

function userLink(user: { id?: string | null; username?: string | null } | null) {
  const id = user?.id;
  const name = user?.username ?? 'someone';
  if (!id) return name;
  return `[@${name}](${id})`;
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

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}
