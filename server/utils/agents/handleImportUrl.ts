import canonicalUrl from '~/utils/canonicalUrl';
import handleRecipeDetails from './handleRecipeDetails';

function isVideoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return [
      'youtube.com',
      'youtu.be',
      'tiktok.com',
      'instagram.com',
      'vimeo.com',
    ].some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

/**
 * Try handleRecipeDetails(client, personaUserId, {recipe_id}, dryRun=true).
 * Returns the result string on success, or null if the recipe row no longer
 * exists (PGRST116 - "0 rows" - which happens when the import got absorbed as
 * a duplicate of an existing recipe between import-time and lookup-time).
 * Re-raises anything else.
 */
async function tryDetails(
  client: any,
  personaUserId: string,
  recipeId: number,
): Promise<string | null> {
  try {
    const details = await handleRecipeDetails(
      client,
      personaUserId,
      { recipe_id: recipeId },
      true,
    );
    return details?.result ?? null;
  } catch (err) {
    const msg = (err as Error).message ?? '';
    if (msg.includes('PGRST116') || msg.includes('not found')) {
      return null;
    }
    throw err;
  }
}

/**
 * The import got absorbed as a duplicate (the just-imported row was deleted
 * because publish-from-any detected it canonicalizes to an existing recipe).
 * recipe_sources should now hold an entry pointing the input URL at the
 * surviving canonical recipe; look that up and use it instead.
 */
async function findCanonicalAfterAbsorption(
  client: any,
  inputUrl: string,
): Promise<number | null> {
  const canon = canonicalUrl(inputUrl);
  if (!canon) return null;
  const { data } = await (client as any)
    .from('recipe_sources')
    .select('recipe_id')
    .eq('source_url', canon)
    .limit(1)
    .maybeSingle();
  return (data?.recipe_id as number | undefined) ?? null;
}

export default async function handleImportUrl(
  client: any,
  personaUserId: string,
  payload: any,
  config: any,
) {
  const { url } = payload;
  if (!url) throw new Error('url required');

  const source_type = isVideoUrl(url) ? 'MEDIA' : 'WEBSITE';

  let result: any;
  try {
    result = (await $fetch('/api/create-recipe/publish-from-any', {
      method: 'POST',
      headers: { 'x-agent-secret': config.agentInternalSecret },
      body: { source_type, source: url, internal_user_id: personaUserId },
    })) as any;
  } catch (err: any) {
    // The video-extractor decided this isn't actually a recipe (tutorial,
    // vlog, ingredient deep-dive, etc.). Bubble that back to the agent as a
    // natural-text result rather than a hard failure — the agent can move
    // on without retrying or imagining the import succeeded.
    const code = err?.data?.code ?? err?.data?.data?.code;
    const statusMessage =
      err?.statusMessage ?? err?.data?.statusMessage ?? '';
    if (code === 'NOT_A_RECIPE' || statusMessage === 'NOT_A_RECIPE') {
      return {
        recipe_id: null,
        title: null,
        not_a_recipe: true,
        result:
          "You tried to import the clip, but the app couldn't pull a recipe " +
          "out of it — it looks more like a tutorial, commentary, or vlog " +
          "rather than an actual recipe video. Nothing to engage with here; " +
          "move on.",
      };
    }
    throw err;
  }

  // After import (Phase A + B both ran inside publish-from-any), route the
  // agent to the recipe page so they see the imported recipe in full and
  // can rate / save / comment without an extra click_on_recipe call. Pass
  // dryRun=true to avoid double-bumping engagement points - the act of
  // importing the recipe is already an engagement signal.
  let detailsBlock = await tryDetails(client, personaUserId, result.id);
  let surfacedRecipeId = result.id as number;

  // PGRST116 fallback: the imported row was absorbed as a dup. Look up the
  // surviving recipe via recipe_sources and try again.
  if (detailsBlock === null) {
    const fallbackId = await findCanonicalAfterAbsorption(client, url);
    if (fallbackId) {
      detailsBlock = await tryDetails(client, personaUserId, fallbackId);
      if (detailsBlock !== null) surfacedRecipeId = fallbackId;
    }
  }

  // Anything still unresolved gets a casual user-facing message instead of a
  // raw error - keeps the agent from looping on what looks like a hard fail.
  if (detailsBlock === null) {
    detailsBlock =
      "The import didn't quite land - the recipe page is being weird right " +
      'now. You can try a different URL or move on.';
  }

  return {
    recipe_id: surfacedRecipeId,
    title: result.title ?? null,
    result: [
      'After waiting for your recipe to be imported, you get routed to this page:',
      detailsBlock,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
