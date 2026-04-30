import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '#supabase/server';
import type { Database } from '~/types/supabase';

const PAGE_SIZE = 1000;
const MAX_ROWS = 5000;

const BOT_UA_PATTERNS = [
  '%bot%',
  '%crawler%',
  '%spider%',
  '%headless%',
  '%curl%',
  '%wget%',
  '%python-requests%',
  '%axios%',
  '%scrapy%',
  '%http-client%',
  '%go-http-client%',
];

type Row = {
  id: number;
  ts: string | null;
  ip: string | null;
  country: string | null;
  from_url: string | null;
  to_url: string;
  method: string | null;
  user_agent: string | null;
  referer: string | null;
};

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const client = serverSupabaseServiceRole<Database>(event);

  const { data: adminRow } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.sub)
    .maybeSingle();

  if (!adminRow) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const query = getQuery(event);
  const sinceParam = typeof query.since === 'string' ? query.since : null;
  const since =
    sinceParam ?? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const rows: Row[] = [];
  let cursor: string | null = null;
  let reachedCap = false;

  while (rows.length < MAX_ROWS) {
    let q = client
      .from('request_log')
      .select(
        'id, ts, ip, country, from_url, to_url, method, user_agent, referer',
      )
      .gte('ts', since)
      // Singapore is exclusively bots in practice
      .or('country.is.null,country.neq.SG')
      // Drop API noise — every page view fires a handful of /api/* calls
      // that aren't useful for displaying user sessions.
      .not('to_url', 'ilike', '%/api/%');

    for (const pat of BOT_UA_PATTERNS) {
      q = q.not('user_agent', 'ilike', pat);
    }

    if (cursor) q = q.lt('ts', cursor);

    const { data, error } = await q
      .order('ts', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message });
    }

    const batch = (data ?? []) as Row[];
    if (batch.length === 0) break;

    rows.push(...batch);

    if (batch.length < PAGE_SIZE) break;

    const lastTs = batch[batch.length - 1]?.ts;
    if (!lastTs || lastTs === cursor) break;
    cursor = lastTs;

    if (rows.length >= MAX_ROWS) {
      reachedCap = true;
      break;
    }
  }

  return {
    rows: rows.slice(0, MAX_ROWS),
    reachedCap,
    fetched: rows.length,
  };
});
