/**
 * Canonicalize a URL so the same real-world link always serializes the same way.
 *
 * Rules:
 *  - force https://
 *  - lowercase hostname, normalize known equivalent subdomains
 *  - drop trailing slashes from pathname
 *  - drop fragment (#...)
 *  - strip all query params by default
 *  - for known video hosts, preserve only identifying params
 *      - youtube.com: preserve `v`
 *      - youtu.be / tiktok.com / instagram.com: identifier lives in the path
 *  - for non-parseable strings, fall back to a best-effort strip
 *
 * Any URL stored in the DB MUST go through this function first, so the exists-check
 * on the client can just do `.eq(source, canonicalUrl(link))`.
 */
const PRESERVE_PARAMS_BY_HOST: Record<string, string[]> = {
  'youtube.com': ['v'],
};

const HOST_ALIASES: Record<string, string> = {
  'www.youtube.com': 'youtube.com',
  'm.youtube.com': 'youtube.com',
  'www.tiktok.com': 'tiktok.com',
  'm.tiktok.com': 'tiktok.com',
  'www.instagram.com': 'instagram.com',
  'm.instagram.com': 'instagram.com',
};

function normalizeHost(hostname: string): string {
  const host = hostname.toLowerCase();
  return HOST_ALIASES[host] ?? host.replace(/^www\./, '');
}

export default function canonicalUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    const host = normalizeHost(parsed.hostname);
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
    return url.trim().split('?')[0]!.replace(/\/+$/, '');
  }
}
