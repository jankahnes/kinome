<template>
  <div class="min-h-screen bg-gray-50" v-if="auth.isAdmin()">
    <div class="max-w-6xl mx-auto px-6 py-8">
      <h1 class="text-2xl font-bold mb-6">Visitor Sessions</h1>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Real visitors</div>
          <div class="text-2xl font-semibold mt-1">{{ stats.realCount }}</div>
          <div class="text-xs text-gray-400 mt-0.5">in window</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div class="text-xs text-gray-500 uppercase tracking-wide">From search</div>
          <div class="text-2xl font-semibold mt-1 text-green-600">{{ stats.fromSearch }}</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Direct</div>
          <div class="text-2xl font-semibold mt-1">{{ stats.direct }}</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Referral</div>
          <div class="text-2xl font-semibold mt-1">{{ stats.referral }}</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">Window</label>
            <select v-model="rangeHours" class="text-sm border border-gray-300 rounded px-2 py-1">
              <option :value="24">24h</option>
              <option :value="24 * 3">3d</option>
              <option :value="24 * 7">7d</option>
              <option :value="24 * 30">30d</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">Sort</label>
            <select v-model="sortMode" class="text-sm border border-gray-300 rounded px-2 py-1">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most_pages">Most pages</option>
              <option value="longest">Longest</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="hideBots" class="rounded" />
            Hide bots
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="hideNoise" class="rounded" />
            Hide single-page noise
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="hideGermany" class="rounded" />
            Hide Germany
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="onlyEngaged" class="rounded" />
            Only engaged
          </label>
          <div class="flex items-center gap-2 ml-auto">
            <input
              v-model="search"
              placeholder="Search url, country, UA, IP…"
              class="text-sm border border-gray-300 rounded px-2 py-1 w-56"
            />
            <button
              @click="refresh"
              class="text-sm bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-3">
          {{ filteredSessions.length }} of {{ allSessions.length }} sessions
          · {{ data?.fetched ?? 0 }} rows scanned
          <span v-if="data?.reachedCap" class="text-amber-600">
            · hit 5k row cap (window may be truncated)
          </span>
          <span v-if="pending"> · loading…</span>
          <span v-if="error" class="text-red-500"> · {{ error }}</span>
        </div>
      </div>

      <!-- Sessions -->
      <div class="space-y-2">
        <div
          v-for="session in filteredSessions"
          :key="session.key"
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            @click="toggle(session.key)"
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
          >
            <span
              class="inline-block w-2 h-2 rounded-full flex-shrink-0"
              :class="qualityDot(session.quality)"
              :title="session.quality"
            ></span>
            <span class="text-xs text-gray-500 w-32 flex-shrink-0">
              {{ relTime(session.startedAt) }}
            </span>
            <span class="text-xs font-mono text-gray-500 w-12 flex-shrink-0">
              {{ session.country || '—' }}
            </span>
            <span class="text-sm font-medium truncate flex-1">
              {{ shortPath(session.entryPath) }}
              <span v-if="session.pageCount > 1" class="text-gray-400 font-normal">
                +{{ session.pageCount - 1 }}
              </span>
            </span>
            <span class="text-xs text-gray-500 flex-shrink-0">
              {{ session.sourceLabel }}
            </span>
            <span class="text-xs text-gray-400 w-14 text-right flex-shrink-0">
              {{ formatDuration(session.durationMs) }}
            </span>
            <span class="text-gray-400 text-xs flex-shrink-0">
              {{ expanded.has(session.key) ? '▾' : '▸' }}
            </span>
          </button>

          <div v-if="expanded.has(session.key)" class="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs space-y-3">
            <div v-if="session.referer" class="pb-2 border-b border-gray-200">
              <div class="text-gray-400 mb-0.5">Referrer</div>
              <div class="text-base font-bold text-gray-900">{{ session.refererShort }}</div>
              <div class="text-xs text-gray-500 break-all font-mono">{{ session.referer }}</div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-gray-600">
              <div><span class="text-gray-400">IP:</span> <span class="font-mono">{{ session.ip || '—' }}</span></div>
              <div><span class="text-gray-400">Pages:</span> {{ session.pageCount }}</div>
              <div><span class="text-gray-400">Requests:</span> {{ session.events.length }}</div>
              <div><span class="text-gray-400">Real navs:</span> {{ session.realNavCount }}</div>
              <div><span class="text-gray-400">Quality:</span> {{ session.quality }}</div>
              <div v-if="!session.referer" class="md:col-span-3"><span class="text-gray-400">Referrer:</span> —</div>
              <div class="md:col-span-4"><span class="text-gray-400">UA:</span> <span class="font-mono break-all">{{ session.userAgent || '—' }}</span></div>
            </div>
            <div>
              <div class="text-gray-400 mb-1">Activity</div>
              <ol class="space-y-0.5">
                <li
                  v-for="(ev, i) in session.events"
                  :key="ev.id"
                  class="flex items-start gap-2 font-mono"
                >
                  <span class="text-gray-400 w-16 flex-shrink-0">{{ formatTime(ev.ts) }}</span>
                  <span
                    class="w-20 flex-shrink-0"
                    :class="ev.method === 'NAVIGATION' ? 'text-blue-600' : 'text-gray-500'"
                  >
                    {{ ev.method || '—' }}
                  </span>
                  <span class="flex-1 break-all">
                    <span v-if="i > 0 && ev.from_url" class="text-gray-400">
                      {{ shortPath(ev.from_url) }} →
                    </span>
                    {{ shortPath(ev.to_url) }}
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
        <div v-if="!pending && filteredSessions.length === 0" class="text-center text-gray-400 py-12 text-sm">
          No sessions match the current filters.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

type RawRow = {
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

type Session = {
  key: string;
  ip: string | null;
  country: string | null;
  userAgent: string | null;
  referer: string | null;
  refererShort: string;
  events: RawRow[];
  startedAt: number;
  endedAt: number;
  durationMs: number;
  pageCount: number;
  realNavCount: number;
  entryPath: string;
  source: 'search' | 'direct' | 'referral' | 'unknown';
  sourceLabel: string;
  isBot: boolean;
  isLocal: boolean;
  quality: 'human' | 'likely' | 'maybe' | 'noise' | 'bot';
};

const SESSION_GAP_MS = 30 * 60 * 1000;
const ENGAGED_MIN_PAGES = 2;
const ENGAGED_MIN_DURATION_MS = 10 * 1000;

const BOT_UA_RE =
  /bot|crawler|spider|headless|python-requests|curl|wget|http-client|axios|scrapy|ahrefs|semrush|mj12|dotbot|applebot|slurp|facebookexternalhit|embedly|preview|phantomjs|monitor|uptime/i;

const SEARCH_HOSTS = [
  'google.', 'bing.', 'duckduckgo.', 'yahoo.', 'yandex.', 'baidu.',
  'ecosia.', 'brave.com', 'kagi.com', 'qwant.', 'startpage.',
];

const rangeHours = ref(24 * 7);
const hideBots = ref(true);
const hideNoise = ref(true);
const hideGermany = ref(false);
const onlyEngaged = ref(false);
const sortMode = ref<'newest' | 'oldest' | 'most_pages' | 'longest'>('newest');
const search = ref('');
const expanded = ref<Set<string>>(new Set());

const since = computed(() =>
  new Date(Date.now() - rangeHours.value * 60 * 60 * 1000).toISOString(),
);

const { data, pending, error, refresh } = await useFetch<{
  rows: RawRow[];
  reachedCap: boolean;
  fetched: number;
}>('/api/admin/request-log', {
  query: { since },
  default: () => ({ rows: [], reachedCap: false, fetched: 0 }),
});

const allSessions = computed<Session[]>(() => {
  const rows = data.value?.rows ?? [];
  if (!rows.length) return [];

  // Group by IP+UA, then split into sessions on >30min inactivity gaps.
  const byKey = new Map<string, RawRow[]>();
  for (const row of rows) {
    const key = `${row.ip ?? 'noip'}|${row.user_agent ?? 'noua'}`;
    const arr = byKey.get(key) ?? [];
    arr.push(row);
    byKey.set(key, arr);
  }

  const sessions: Session[] = [];
  for (const [groupKey, events] of byKey.entries()) {
    events.sort((a, b) => tsMs(a.ts) - tsMs(b.ts));
    let bucket: RawRow[] = [];
    let lastTs = 0;
    let idx = 0;
    const flush = () => {
      if (!bucket.length) return;
      sessions.push(buildSession(`${groupKey}#${idx++}`, bucket));
      bucket = [];
    };
    for (const ev of events) {
      const t = tsMs(ev.ts);
      if (bucket.length && t - lastTs > SESSION_GAP_MS) flush();
      bucket.push(ev);
      lastTs = t;
    }
    flush();
  }

  return sessions;
});

const filteredSessions = computed(() => {
  const q = search.value.trim().toLowerCase();
  let list = allSessions.value.filter((s) => {
    if (s.isLocal) return false;
    if (hideBots.value && (s.isBot || s.quality === 'bot')) return false;
    if (hideNoise.value && s.quality === 'noise') return false;
    if (hideGermany.value && s.country === 'DE') return false;
    if (onlyEngaged.value && s.quality !== 'human' && s.quality !== 'likely')
      return false;
    if (q) {
      const hay = [
        s.ip,
        s.country,
        s.userAgent,
        s.referer,
        s.entryPath,
        ...s.events.map((e) => e.to_url),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (sortMode.value === 'oldest') return a.startedAt - b.startedAt;
    if (sortMode.value === 'most_pages') return b.pageCount - a.pageCount;
    if (sortMode.value === 'longest') return b.durationMs - a.durationMs;
    return b.startedAt - a.startedAt;
  });
  return list;
});

const stats = computed(() => {
  const real = allSessions.value.filter(
    (s) => !s.isLocal && !s.isBot && s.quality !== 'noise' && s.quality !== 'bot',
  );
  return {
    realCount: real.length,
    fromSearch: real.filter((s) => s.source === 'search').length,
    direct: real.filter((s) => s.source === 'direct').length,
    referral: real.filter((s) => s.source === 'referral').length,
  };
});

function buildSession(key: string, events: RawRow[]): Session {
  const ua = events.find((e) => e.user_agent)?.user_agent ?? null;
  const ip = events.find((e) => e.ip)?.ip ?? null;
  const country = events.find((e) => e.country)?.country ?? null;
  const referer = events[0]?.referer ?? null;

  const startedAt = tsMs(events[0]?.ts);
  const endedAt = tsMs(events[events.length - 1]?.ts);
  const durationMs = Math.max(0, endedAt - startedAt);

  // Distinct paths visited
  const paths = new Set<string>();
  for (const e of events) {
    if (e.method === 'NAVIGATION' || !e.method) {
      const p = pathOf(e.to_url);
      if (p) paths.add(p);
    }
  }
  if (paths.size === 0) {
    for (const e of events) {
      const p = pathOf(e.to_url);
      if (p) paths.add(p);
    }
  }
  const pageCount = paths.size;

  const navEvents = events.filter((e) => e.method === 'NAVIGATION');
  // A "real" navigation is one where the user moved between two distinct paths.
  // NAV events with from===to are just page-load pings and don't prove engagement.
  const realNavCount = navEvents.filter((e) => {
    if (!e.from_url) return false;
    return pathOf(e.from_url) !== pathOf(e.to_url);
  }).length;
  const entryPath =
    pathOf(navEvents[0]?.to_url ?? events[0]?.to_url) || '/';

  const isBot = !!ua && BOT_UA_RE.test(ua);
  const isLocal = isLocalIp(ip);
  const source = classifySource(referer, events[0]?.from_url ?? null);
  const sourceLabel = sourceDisplay(source, referer, events[0]?.from_url ?? null);
  const refererShort = shortHost(referer);

  let quality: Session['quality'];
  if (isBot) {
    quality = 'bot';
  } else if (source === 'search' && navEvents.length > 0) {
    quality = 'human';
  } else if (
    realNavCount >= 1 &&
    pageCount >= ENGAGED_MIN_PAGES &&
    durationMs >= ENGAGED_MIN_DURATION_MS
  ) {
    quality = 'likely';
  } else if (pageCount >= 2 || navEvents.length >= 2) {
    quality = 'maybe';
  } else {
    quality = 'noise';
  }

  return {
    key,
    ip,
    country,
    userAgent: ua,
    referer,
    refererShort,
    events,
    startedAt,
    endedAt,
    durationMs,
    pageCount,
    realNavCount,
    entryPath,
    source,
    sourceLabel,
    isBot,
    isLocal,
    quality,
  };
}

function tsMs(ts: string | null | undefined) {
  if (!ts) return 0;
  const t = Date.parse(ts);
  return Number.isFinite(t) ? t : 0;
}

function pathOf(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url, 'http://x');
    return u.pathname + (u.search || '');
  } catch {
    return url;
  }
}

function shortPath(url: string | null | undefined): string {
  const p = pathOf(url);
  return p.length > 90 ? p.slice(0, 87) + '…' : p || '/';
}

function isLocalIp(ip: string | null) {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

function classifySource(
  referer: string | null,
  fromUrl: string | null,
): Session['source'] {
  const ref = referer || fromUrl;
  if (!ref) return 'direct';
  let host = '';
  try {
    host = new URL(ref).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return 'search';
  // Same-host referrer = internal navigation, not a true entry source
  if (typeof window !== 'undefined' && host === window.location.hostname)
    return 'direct';
  return 'referral';
}

function sourceDisplay(
  source: Session['source'],
  referer: string | null,
  fromUrl: string | null,
): string {
  if (source === 'direct') return 'direct';
  if (source === 'search' || source === 'referral') {
    return shortHost(referer || fromUrl) || source;
  }
  return '—';
}

// Strip "www." and the public TLD segment so "www.google.com" → "google",
// "news.ycombinator.com" → "news.ycombinator", "t.co" → "t".
function shortHost(url: string | null | undefined): string {
  if (!url) return '';
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return '';
  }
  host = host.replace(/^www\./, '');
  const parts = host.split('.');
  if (parts.length > 1) parts.pop();
  return parts.join('.');
}

function qualityDot(q: Session['quality']) {
  switch (q) {
    case 'human':
      return 'bg-green-500';
    case 'likely':
      return 'bg-emerald-300';
    case 'maybe':
      return 'bg-yellow-300';
    case 'bot':
      return 'bg-red-300';
    default:
      return 'bg-gray-300';
  }
}

function formatDuration(ms: number) {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function relTime(ms: number) {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatTime(ts: string | null) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function toggle(key: string) {
  if (expanded.value.has(key)) expanded.value.delete(key);
  else expanded.value.add(key);
  // Trigger reactivity for Set
  expanded.value = new Set(expanded.value);
}

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>
