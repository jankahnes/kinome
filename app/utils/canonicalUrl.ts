/**
 * Canonicalize a URL so the same real-world link always serializes the same way.
 *
 * Rules:
 *  - force https://
 *  - lowercase hostname, strip leading "www."
 *  - drop trailing slashes from pathname
 *  - drop fragment (#...)
 *  - strip all query params by default
 *  - for known video hosts, preserve only *identifying* params
 *      - youtube.com: preserve `v`
 *      - youtu.be / tiktok.com / instagram.com: identifier lives in the path, no params preserved
 *  - for non-parseable strings, fall back to a best-effort strip (split('?') + trim trailing '/')
 *
 * Any URL stored in the DB MUST go through this function first, so the exists-check
 * on the client can just do `.eq(source, canonicalUrl(link))` with no variation games.
 */

const PRESERVE_PARAMS_BY_HOST: Record<string, string[]> = {
  'youtube.com': ['v'],
};

export default function canonicalUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const preserveKeys = PRESERVE_PARAMS_BY_HOST[host] ?? [];
    const preserved = new URLSearchParams();
    for (const key of preserveKeys) {
      const val = parsed.searchParams.get(key);
      if (val) preserved.set(key, val);
    }
    const qs = preserved.toString();
    const path = parsed.pathname.replace(/\/+$/, '');
    return `https://${host}${path}${qs ? '?' + qs : ''}`;
  } catch {
    // Non-URL string — best-effort strip for legacy callers.
    return url.split('?')[0]!.replace(/\/+$/, '');
  }
}
