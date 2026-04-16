/**
 * Detect whether a URL is a short/share-style video link that likely needs
 * resolving to its canonical long form.
 *
 * Short patterns:
 *  - youtu.be/*                       (YouTube share links)
 *  - youtube.com/shorts/*             (Shorts share links)
 *  - tiktok.com/<alphanumeric>        (TikTok share – no @user/video/ path)
 *  - vm.tiktok.com/*                  (TikTok share variant)
 *  - vt.tiktok.com/*                  (TikTok share variant)
 *  - instagram.com/share/*            (Instagram share links)
 */
export default function isShortVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    // YouTube short links
    if (host === 'youtu.be') return true;

    // TikTok share domains
    if (host === 'vm.tiktok.com' || host === 'vt.tiktok.com') return true;

    // TikTok short share links on main domain: tiktok.com/<code>
    // Long form always has /@user/video/<id>
    if (
      (host === 'tiktok.com' || host === 'www.tiktok.com' || host === 'm.tiktok.com') &&
      !path.includes('/video/')
    ) {
      return true;
    }

    // Instagram share links
    if (
      (host === 'instagram.com' || host === 'www.instagram.com') &&
      path.startsWith('/share/')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
