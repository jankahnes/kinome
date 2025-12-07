import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);

  // Skip logging for:
  // - The log-request endpoint itself (avoid loops)
  // - Static assets (images, fonts, etc.)
  // - Internal Nuxt routes
  if (
    url.pathname === '/api/log-request' ||
    url.pathname.startsWith('/_nuxt/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|woff|woff2|ico|css|js)$/i)
  ) {
    return;
  }

  // Fire and forget - don't await
  logRequest(event).catch((err) => {
    // Silently fail - we don't want logging errors to affect the request
    console.error('Request logging failed:', err);
  });
});

async function logRequest(event: any) {
  try {
    const supabase = serverSupabaseServiceRole<Database>(event);

    // Extract request information
    const url = getRequestURL(event);
    const method = getMethod(event);
    const headers = getHeaders(event);

    // Get IP address (check various headers for proxies/CDNs)
    const ip =
      headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      headers['x-real-ip'] ||
      headers['cf-connecting-ip'] ||
      event.node.req.socket.remoteAddress ||
      null;

    // Get country from headers (Cloudflare, etc.)
    const country =
      headers['cf-ipcountry'] || headers['x-vercel-ip-country'] || null;

    const userAgent = headers['user-agent'] || null;
    const referer = headers['referer'] || headers['referrer'] || null;
    const host = headers['host'] || url.host || null;

    // Get the full URL
    const toUrl = url.href;

    // For server middleware, from_url would be the referer
    const fromUrl = referer || null;

    // Insert into database (non-blocking - already not awaited by caller)
    await supabase.from('request_log').insert({
      from_url: fromUrl,
      to_url: toUrl,
      method: method,
      ip: ip,
      user_agent: userAgent,
      country: country,
      referer: referer,
      host: host,
    });
  } catch (error) {
    // Re-throw to be caught by caller
    throw error;
  }
}
