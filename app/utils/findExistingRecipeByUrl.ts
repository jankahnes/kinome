import canonicalUrl from './canonicalUrl';
import isShortVideoUrl from './isShortVideoUrl';

export interface FoundRecipe {
  id: number;
  title: string | null;
}

const VIDEO_HOSTS = ['youtube', 'youtu.be', 'tiktok', 'instagram'];

function isVideoLink(url: string): boolean {
  return VIDEO_HOSTS.some((h) => url.includes(h));
}

/**
 * Instagram /p/<id> and /reel/<id> point at the same content. Check both.
 */
function urlVariants(canonical: string): string[] {
  const out = [canonical];
  if (canonical.includes('instagram.com/p/')) {
    out.push(canonical.replace('/p/', '/reel/'));
  } else if (canonical.includes('instagram.com/reel/')) {
    out.push(canonical.replace('/reel/', '/p/'));
  }
  return out;
}

async function lookup(
  client: any,
  url: string,
): Promise<FoundRecipe | null> {
  // 1. Direct match against recipes.source.
  const { data: rec } = await client
    .from('recipes')
    .select('id, title')
    .eq('source', url)
    .limit(1)
    .maybeSingle();
  if (rec?.id) return { id: rec.id as number, title: rec.title ?? null };

  // 2. Match against absorbed-duplicate / alt-source urls.
  const { data: alt } = await (client as any)
    .from('recipe_sources')
    .select('recipe_id')
    .eq('source_url', url)
    .limit(1)
    .maybeSingle();
  const altId = alt?.recipe_id as number | undefined;
  if (!altId) return null;

  const { data: rec2 } = await client
    .from('recipes')
    .select('id, title')
    .eq('id', altId)
    .limit(1)
    .maybeSingle();
  return rec2?.id
    ? { id: rec2.id as number, title: rec2.title ?? null }
    : null;
}

/**
 * Find an existing recipe matching this URL, considering both direct
 * `recipes.source` matches and absorbed-duplicate `recipe_sources.source_url`
 * entries.
 *
 * If `opts.resolveShortUrls` is true and the input is a short video URL
 * (youtu.be, vm.tiktok.com, instagram /share/, etc.), follows redirects to
 * the long form and rechecks. On a hit via resolve, also writes the original
 * (short) canonical URL into `recipe_sources` as an alt source so future
 * checks skip the resolve step.
 *
 * Same logic powers the manual import flow in `recipe/new.vue` and the
 * agent-side `handleCheckUrlExists.ts`.
 */
export default async function findExistingRecipeByUrl(
  client: any,
  inputUrl: string,
  opts: { resolveShortUrls?: boolean } = {},
): Promise<FoundRecipe | null> {
  const canonical = canonicalUrl(inputUrl);
  if (!canonical) return null;

  // Pass 1 — input URL as-is.
  for (const variant of urlVariants(canonical)) {
    const hit = await lookup(client, variant);
    if (hit) return hit;
  }

  // Pass 2 — only for short video URLs: resolve redirects, check again, and
  // cache the short URL as an alt source on hit.
  if (
    opts.resolveShortUrls &&
    isVideoLink(inputUrl) &&
    isShortVideoUrl(inputUrl)
  ) {
    try {
      const { resolved } = await $fetch<{ resolved: string }>(
        '/api/create-recipe/resolve-url',
        { method: 'POST', body: { url: inputUrl } },
      );
      const resolvedCanonical = canonicalUrl(resolved);
      if (resolvedCanonical && resolvedCanonical !== canonical) {
        for (const variant of urlVariants(resolvedCanonical)) {
          const hit = await lookup(client, variant);
          if (hit) {
            // Best-effort cache; failure to insert isn't fatal here, the
            // next call will just resolve again.
            try {
              await (client as any)
                .from('recipe_sources')
                .insert({ recipe_id: hit.id, source_url: canonical } as any);
            } catch (insertErr) {
              console.warn(
                'findExistingRecipeByUrl: alt-source cache failed:',
                (insertErr as Error).message,
              );
            }
            return hit;
          }
        }
      }
    } catch (err) {
      // Resolve failed — caller decides what to do (typically: proceed with
      // the import attempt, server will dedup at write time if it absorbs).
      console.warn(
        'findExistingRecipeByUrl: resolve failed:',
        (err as Error).message,
      );
    }
  }

  return null;
}
