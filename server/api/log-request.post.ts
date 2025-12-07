import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';

export default defineEventHandler(async (event) => {
  // Fire and forget - don't await
  logClientRequest(event).catch((err) => {
    // Silently fail - we don't want logging errors to affect the request
    console.error('Client request logging failed:', err);
  });

  // Return immediately
  return { success: true };
});

async function logClientRequest(event: any) {
  try {
    const supabase = serverSupabaseServiceRole<Database>(event);
    const body = await readBody(event);
    const headers = getHeaders(event);

    // Extract request information
    const ip =
      headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      headers['x-real-ip'] ||
      headers['cf-connecting-ip'] ||
      event.node.req.socket.remoteAddress ||
      null;

    // Get country from headers (Cloudflare, etc.)
    const country =
      headers['cf-ipcountry'] || headers['x-vercel-ip-country'] || null;

    // Insert into database (non-blocking - already not awaited by caller)
    await supabase.from('request_log').insert({
      from_url: body.from_url || null,
      to_url: body.to_url,
      method: body.method || 'NAVIGATION',
      ip: ip,
      user_agent: body.user_agent || null,
      country: country,
      referer: body.referer || null,
      host: body.host || null,
    });
  } catch (error) {
    // Re-throw to be caught by caller
    throw error;
  }
}
