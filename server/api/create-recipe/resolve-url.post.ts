// Follows redirects on a short/share URL and returns the final (long) URL.
// Used client-side to resolve short links before the duplicate check so we
// can match against canonical URLs already stored in the DB.
export default defineEventHandler(async (event) => {
  const { url } = await readBody(event);
  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'url is required' });
  }

  try {
    // Use GET with redirect: "manual" to capture the Location header without
    // downloading the full page.  Follow up to 5 hops.
    let current = url;
    for (let i = 0; i < 5; i++) {
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
      });
      const location = res.headers.get('location');
      if (!location || res.status < 300 || res.status >= 400) {
        break;
      }
      // Location may be relative
      current = new URL(location, current).href;
    }
    return { resolved: current };
  } catch (err: any) {
    console.error('resolve-url failed:', err.message);
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to resolve URL',
    });
  }
});
