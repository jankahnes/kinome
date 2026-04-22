<template>
  <div class="flex justify-center">
    <div class="max-w-[1300px] w-full flex flex-col gap-6 sm:gap-8">
      <!-- ── HEADER ──────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5" v-if="user">
        <div class="flex items-center gap-4">
          <Avatar :user="user ?? null" class="w-22 md:w-26" />
          <div class="flex flex-col items-start">
            <h1 class="text-4xl font-headers tracking-tight leading-none">
              {{ user?.username ?? 'Guest' }}
            </h1>
            <p class="text-xs text-gray-400 leading-none mt-1">Member since {{ joinDate }} · {{ levelDisplay.title }}
            </p>
            <NuxtLink v-if="isOwn" to="/account"
              class="bg-primary-5/70 flex items-center justify-center main-button animated-button px-2 py-1 gap-1 text-gray-500 mt-2"
              title="Settings">
              <IconSettings class="w-4 h-4" />
              <span class="text-xs">Account Settings</span>
            </NuxtLink>
          </div>
        </div>
        <div class="flex gap-2">
          <div class="flex items-stretch bg-primary-5/70 rounded-3xl overflow-hidden self-start sm:self-auto">
            <NuxtLink :to="getProfileUrl(user) + '/recipes'"
              class="flex flex-col items-center px-5 py-1 sm:py-3 hover:bg-primary-5 transition-colors cursor-pointer">
              <span class="text-2xl tracking-tighter leading-none text-primary font-headers italic!">{{ counts.created
              }}</span>
              <span class="text-[11px] text-gray-600 uppercase font-mono">Created</span>
            </NuxtLink>
            <div class="w-px bg-black/8 my-2"></div>
            <NuxtLink :to="getProfileUrl(user) + '/bookmarks'"
              class="flex flex-col items-center px-5 py-1 sm:py-3 hover:bg-primary-5 transition-colors cursor-pointer">
              <span class="text-2xl tracking-tighter leading-none text-primary font-headers italic!">{{ counts.saved
              }}</span>
              <span class="text-[11px] text-gray-600 uppercase font-mono">Saved</span>
            </NuxtLink>
            <div class="w-px bg-black/8 my-2"></div>
            <NuxtLink :to="getProfileUrl(user) + '/activity'"
              class="flex flex-col items-center px-5 py-1 sm:py-3 hover:bg-primary-5 transition-colors cursor-pointer">
              <span class="text-2xl tracking-tighter leading-none text-primary font-headers italic!">{{ counts.rated
              }}</span>
              <span class="text-[11px] text-gray-600 uppercase font-mono">Rated</span>
            </NuxtLink>
          </div>
        </div>
      </div>
      <Skeleton class="h-26 w-full" v-else />

      <div class="h-px bg-black/5"></div>

      <!-- ── MAIN GRID ──────────────────────────────────────────── -->
      <div class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

        <!-- LEFT COLUMN -->
        <div class="flex flex-col gap-6" v-if="user && !metricsLoading">

          <!-- ── HERO BANNER: Archetype ───────────────── -->
          <div class="main-card main-card-rounded flex gap-6 overflow-hidden items-center py-6 relative">
            <img class="w-20 md:w-30 -ml-10 rotate-160 scale-250 z-0" src="/blob.webp">
            <img class="h-20 md:h-30 z-10 -ml-12 md:-ml-18" src="/temp/archetype-icon.png">
            <div class="ml-4 md:ml-16">
              <p class="text-xs uppercase tracking-widest text-gray-400 font-mono mb-0.5">Archetype</p>
              <h2 v-if="metrics?.archetype" class="text-3xl md:text-[54px] font-headers tracking-tighter leading-none">
                {{ metrics.archetype.label }}
              </h2>
              <h2 v-else-if="metrics?.coldStart"
                class="text-[40px] font-headers tracking-tighter leading-none text-gray-400">
                Not enough data
              </h2>
              <h2 v-else class="text-[40px] font-bold tracking-tighter leading-none text-gray-300">
                {{ metricsLoading ? 'Loading…' : 'Press ↻ to compute' }}
              </h2>
              <p v-if="metrics?.archetype" class="text-sm text-gray-400 leading-snug ml-1">
                {{ metrics.archetype.subtitle }}
              </p>
              <p v-else-if="metrics?.coldStart" class="text-sm text-gray-400 leading-snug ml-1">
                You need at least {{ metrics.minTSize }} recipes in your taste set ({{ metrics.tSize }} so far).
              </p>
            </div>

            <!-- TEMP DEV BUTTONS -->
            <div class="absolute top-2 right-2 flex flex-col gap-1 z-30" v-if="isAdmin">
              <button @click="recomputePercentiles" :disabled="recomputing"
                class="text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded font-mono hover:bg-black disabled:opacity-40">
                {{ recomputing ? '…' : 'cron: recompute %iles' }}
              </button>
              <button @click="loadMetrics" :disabled="metricsLoading"
                class="text-[10px] uppercase tracking-wide bg-black/70 text-white px-2 py-1 rounded font-mono hover:bg-black disabled:opacity-40">
                {{ metricsLoading ? '…' : 'fetch user metrics' }}
              </button>
              <span v-if="devMessage" class="text-[10px] text-gray-500 max-w-44 text-right leading-tight">
                {{ devMessage }}
              </span>
            </div>
          </div>

          <div v-if="signatureRecipe || isOwn">
            <div class="mx-4 mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2.5">
                <h3 class="text-xl font-headers tracking-tighter">Signature Recipe</h3>
              </div>
              <div v-if="isOwn && signatureRecipe" class="flex flex-wrap gap-2">
                <button type="button"
                  class="main-button animated-button rounded-full bg-primary-5/80 hover:bg-primary-5 transition-colors px-4 py-2 text-sm font-semibold text-gray-700"
                  @click="openSignatureModal(signatureRecipe)">
                  Re-sign
                </button>
                <NuxtLink :to="getProfileUrl(user) + '/recipes?mode=signature'"
                  class="main-button animated-button rounded-full bg-primary-5/80 hover:bg-primary-5 transition-colors px-4 py-2 text-sm font-semibold text-gray-700">
                  Change recipe
                </NuxtLink>
              </div>
            </div>
            <div v-if="signatureRecipe" class="relative">
              <RecipeCardHighlight :recipe="signatureRecipe" uniqueId="profile-sig" :is-signature="true"
                class="hidden md:flex" />
              <RecipeCardHighlightMobile :recipe="signatureRecipe" uniqueId="profile-sig" :is-signature="true"
                class="md:hidden" />
              <div class="pointer-events-none absolute top-10 right-10 z-20 flex flex-col items-end">
                <span
                  class="rounded-full bg-primary px-2.5 text-[10px] font-headers font-semibold italic uppercase tracking-widest text-white flex items-center gap-1">
                  <IconSparkle class="w-2" fill="currentColor" />
                  <p>Signature</p>
                </span>
              </div>
              <div v-if="signatureImageUrl && signatureImageVisible"
                class="pointer-events-none absolute bottom-2 right-2 z-20 flex max-w-[45%] justify-end sm:right-6">
                <img :src="signatureImageUrl" class="h-24 w-60 object-contain object-bottom-right"
                  alt="Recipe signature" @error="signatureImageVisible = false" />
              </div>
            </div>
            <button v-else type="button"
              class="main-button animated-button flex min-h-52 w-full flex-col items-center justify-center gap-3 main-card-rounded! border-2 border-dashed border-primary/10 bg-primary-5/60! px-6 py-10 text-center"
              @click="goToSignatureSelection">
              <div class="rounded-full bg-primary p-3 text-white">
                <IconPencil class="h-6 w-6" />
              </div>
              <div>
                <p class="text-2xl tracking-tight font-headers italic">Set your signature recipe</p>
                <p class="mt-1 max-w-lg text-sm text-gray-500">
                  Choose one of your original recipes, sign it, and feature it here on your profile.
                </p>
              </div>
            </button>
          </div>

          <!-- Trophy Case -->
          <div class="bg-primary-5/50 main-card-rounded p-6 space-y-4">
            <div class="flex items-baseline justify-between gap-3">
              <h3 class="text-xl font-headers tracking-tighter">Achievements</h3>
              <span class="text-[11px] text-gray-400 font-mono tracking-wider">{{ unlockedAchievementCount }}/{{
                achievementCards.length }}
                unlocked</span>
            </div>
            <div
              class="grid gap-2 max-h-102 p-0.5 overflow-hidden grid-cols-[repeat(auto-fill,minmax(100px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
              <div v-for="ach in achievementCards" :key="ach.key"
                class="flex flex-col items-center gap-1.5 p-3 rounded-3xl text-center transition-all duration-200 relative"
                :class="[
                  ach.unlocked ? 'shadow-sm' : 'bg-black/4 opacity-55 grayscale',
                  ach.unlocked && ach.tierColor === 'gold' ? 'bg-amber-50 border border-amber-200' : '',
                  ach.unlocked && ach.tierColor === 'silver' ? 'bg-slate-50 border border-slate-200' : '',
                  ach.unlocked && ach.tierColor === 'bronze' ? 'bg-orange-50 border border-orange-200' : '',
                  ach.unlocked && ach.tierColor === 'special' ? 'bg-primary-50 border border-primary/20' : '',
                ]">
                <span class="text-3xl select-none leading-none mt-0.5">{{ ach.icon }}</span>
                <span class="text-xs font-medium leading-none text-gray-700 mt-0.5">{{ ach.name }}</span>
                <span v-if="ach.badge" class="text-[10px] uppercase tracking-wide font-semibold text-gray-400">{{
                  ach.badge }}</span>
                <span class="text-[10px] leading-tight text-gray-400 font-mono">{{ ach.progressLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Cook Level -->
          <div class="bg-primary-5/50 main-card-rounded p-6 space-y-4">
            <h3 class="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Cook Level</h3>
            <div class="flex-1 flex flex-col justify-center gap-2">
              <p>
                <span class="text-4xl italic tracking-tight font-headers">{{ levelDisplay.title }}</span>
                <span class="text-[10px] font-mono tracking-wider text-gray-500 ml-4">Lv {{ levelDisplay.level }} · {{
                  levelDisplay.xp }} / {{ levelDisplay.nextFloor }} XP</span>
              </p>
              <div class="w-full h-2.5 rounded-full bg-black/10 overflow-hidden mt-2">
                <div class="h-full rounded-full bg-primary transition-all"
                  :style="{ width: levelDisplay.progressPct + '%' }"></div>
              </div>
              <p class="uppercase text-[10px] font-mono tracking-wider">
                <span class=" text-gray-500">{{ levelDisplay.nextFloor -
                  levelDisplay.xp }} XP to <span class="text-primary">{{ levelDisplay.nextTitle
                  }}</span></span>
              </p>
            </div>
          </div>
        </div>
        <Skeleton class="h-200" v-else />

        <!-- RIGHT COLUMN -->
        <div class="flex flex-col gap-6" v-if="user && !metricsLoading">

          <!-- Taste Radar -->
          <div class="bg-primary-5/50 main-card-rounded main-card-padding overflow-hidden">
            <h3 class="text-xl font-headers tracking-tighter">Taste Radar</h3>
            <p class="text-xs text-gray-400 mb-5 leading-none">Your cooking profile & taste neighbors</p>

            <div class="relative flex items-center justify-center" style="height: 290px">
              <ClientOnly>
                <apexchart v-if="hasRadarData" type="radar" height="280" :options="radarChartOptions"
                  class="-mt-20 -mb-6" :series="radarChartSeries" />
                <template #fallback>
                  <div class="text-xs text-gray-300">Loading chart…</div>
                </template>
              </ClientOnly>

              <div v-if="!hasRadarData" class="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span class="text-sm font-semibold text-gray-400">Not enough data yet</span>
                <span class="text-xs text-gray-300">Cook & save more recipes to unlock</span>
              </div>
            </div>

            <div v-if="tasteNeighbors.length > 0" class="h-px bg-gray-200 mx-2 my-4 -mt-10"></div>
            <div v-if="tasteNeighbors.length > 0" class="flex flex-col -mb-2 lg:mx-2">
              <div class="flex justify-between">
                <NuxtLink v-for="(neighbor, index) in tasteNeighbors" :key="neighbor.id" :to="getProfileUrl(neighbor)"
                  class="flex p-2 flex-col items-center rounded-2xl hover:bg-primary-5 transition-colors animated-button">
                  <Avatar :user="neighbor" class="w-12" />
                  <span class="text-sm leading-tight mt-1">{{ neighbor.username }}</span>
                  <span class="text-[11px] font-mono whitespace-nowrap text-gray-500 flex items-center gap-0.5">
                    <span class="" v-if="index === 0">⭐</span>
                    {{ neighbor.match }}% Match
                  </span>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-primary-5/50 main-card-rounded main-card-padding">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-headers tracking-tighter">Recent Activity</h3>
              <NuxtLink :to="getProfileUrl(user) + '/activity'" class="text-xs text-gray-600 flex items-center gap-0.5">
                See all
                <IconChevronRight class="w-4 h-4" :strokeWidth="1.5" />
              </NuxtLink>
            </div>
            <div v-if="recentActivity.length > 0" class="flex flex-col gap-3 mt-2">
              <component :is="item.href ? NuxtLink : 'div'" v-for="(item, i) in recentActivity" :key="item.id"
                v-bind="item.href ? { to: item.href } : {}" class="flex items-start gap-3 pt-3"
                :class="[{ 'border-t border-black/5': i > 0 }, item.href ? 'group cursor-pointer' : '']">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 mt-0.5"
                  :class="item.bgClass">
                  {{ item.emoji }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] leading-snug">
                    {{ item.text }}
                  </p>
                  <p class="text-[11px] font-mono text-gray-400 mt-0.5">{{ item.time }}</p>
                </div>
              </component>
            </div>
            <div v-else class="text-center py-8 text-xs text-gray-400">
              No activity yet.
            </div>
          </div>
        </div>
        <Skeleton class="h-200" v-else />
      </div>

      <!-- ── DEV: Archetype Affinity Widget ──────────────────────── -->
      <div v-if="metrics && metrics.all && metrics.all.length > 0 && isAdmin"
        class="main-card main-card-padding main-card-rounded">
        <div class="flex items-baseline justify-between mb-4">
          <h3 class="text-xl font-headers tracking-tighter">Archetype Affinity <span
              class="text-[10px] text-gray-400 uppercase tracking-wide ml-1">dev</span></h3>
          <span class="text-xs text-gray-400">|T| = {{ metrics.tSize }} · ranked by O = ½S + ½percentile</span>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="r in metrics.all" :key="r.key" class="flex items-center gap-3 text-sm"
            :class="{ 'opacity-40': r.status !== 'ranked' }">
            <span class="w-44 truncate font-medium flex items-center gap-1">
              {{ r.label }}
              <span v-if="r.status === 'gated'" class="text-[9px] uppercase text-gray-400">gated</span>
              <span v-else-if="r.status === 'no_data'" class="text-[9px] uppercase text-gray-400">no data</span>
              <span v-else-if="r.status === 'below_threshold'" class="text-[9px] uppercase text-gray-400">
                < thr</span>
              </span>
              <div class="flex-1 h-2 bg-black/5 rounded-full overflow-hidden relative">
                <div v-if="r.S != null" class="absolute inset-y-0 left-0 bg-primary/40" :style="{ width: r.S + '%' }" />
                <div v-if="r.O != null" class="absolute inset-y-0 left-0 primary-gradient"
                  :style="{ width: r.O + '%' }" />
                <div class="absolute inset-y-0" :style="{ left: r.threshold + '%' }">
                  <div class="w-px h-full bg-gray-400/70"></div>
                </div>
              </div>
              <span class="w-40 text-right text-xs text-gray-500 font-mono">
                S {{ r.S != null ? r.S.toFixed(0) : '-' }} ·
                p{{ r.percentile != null ? r.percentile.toFixed(0) : '-' }} ·
                O {{ r.O != null ? r.O.toFixed(0) : '-' }}
              </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ProfileSignatureRecipeModal v-model="signatureModalOpen" :recipe="selectedSignatureRecipe"
    @saved="handleSignatureSaved" />
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';
import {
  ACHIEVEMENT_DISPLAY,
  ACHIEVEMENT_ORDER,
  getLevelInfo,
  tierLabel,
} from '~/utils/constants/gamification';

const user = inject<Ref<FullUser | null>>('profileUser');
const isOwn = inject<ComputedRef<boolean>>('profileIsOwn');
const isAdmin = inject<ComputedRef<boolean>>('profileIsAdmin');

const supabase = useSupabaseClient();
const auth = useAuthStore();

const signatureModalOpen = ref(false);
const selectedSignatureRecipe = ref<RecipeOverview | null>(null);
const signatureImageVersion = ref<number | null>(null);
const signatureImageVisible = ref(true);

const signatureRecipe = computed(() => {
  const signatureRecipeId = user?.value?.signature_recipe;
  if (!signatureRecipeId) return null;
  return user?.value?.recipes?.find((recipe) => recipe.id === signatureRecipeId) ?? null;
});

const signatureImageUrl = computed(() => {
  if (!user?.value?.id || !signatureRecipe.value) return null;
  const { data } = supabase.storage.from('signature').getPublicUrl(`${user.value.id}.webp`);
  const cacheBust = signatureImageVersion.value ?? user?.value?.signature_recipe ?? 'signature';
  return `${data.publicUrl}?v=${cacheBust}`;
});

function openSignatureModal(recipe: RecipeOverview) {
  selectedSignatureRecipe.value = recipe;
  signatureModalOpen.value = true;
}

function goToSignatureSelection() {
  navigateTo(getProfileUrl(user?.value) + '/recipes?mode=signature');
}

function handleSignatureSaved(payload: { recipeId: number; publicUrl: string }) {
  if (user?.value) {
    user.value.signature_recipe = payload.recipeId;
  }

  if (auth.user?.id === user?.value?.id && auth.user) {
    auth.user.signature_recipe = payload.recipeId;
  }

  signatureImageVisible.value = true;
  signatureImageVersion.value = Date.now();
}

// ── User metrics (live) ───────────────────────────────────────────────────
type Metrics = {
  coldStart: boolean;
  tSize: number;
  minTSize?: number;
  archetype: { key: string; label: string; subtitle: string; S: number; percentile: number; O: number } | null;
  ranked: { key: string; label: string; subtitle: string; S: number; percentile: number; O: number }[];
  all: { key: string; label: string; subtitle: string; S: number | null; percentile: number | null; O: number | null; threshold: number; status: 'ranked' | 'below_threshold' | 'gated' | 'no_data' }[];
  neighbors: { id: string; username: string | null; picture: string | null; match: number }[];
  radar: { complexity: number; spiciness: number; comfort: number; freshness: number; plantBased: number; healthiness: number; exoticness: number } | null;
  counts: { created: number; saved: number; rated: number; highlyRated: number };
  gamification: {
    xp: number;
    level: {
      level: number;
      xp: number;
      currentFloor: number;
      nextFloor: number;
      progressPct: number;
      title: string;
      icon: string;
      nextTitle: string | null;
    };
    counts: {
      commented: number;
      trackedDays: number;
      visitStreak: number;
      cuisineCount: number;
    };
    achievements: {
      key: string;
      unlocked: boolean;
      currentTier: number | null;
      currentValue: number | null;
      nextThreshold: number | null;
    }[];
  };
};

const metrics = ref<Metrics | null>(null);
const metricsLoading = ref(false);
const recomputing = ref(false);
const devMessage = ref('');

const counts = computed(() => metrics.value?.counts ?? {
  created: user?.value?.stats?.recipesCount ?? 0,
  saved: user?.value?.stats?.bookmarksCount ?? 0,
  rated: 0,
});

async function loadMetrics() {
  if (!user?.value?.id) return;
  metricsLoading.value = true;
  devMessage.value = '';
  try {
    metrics.value = await $fetch<Metrics>(`/api/metrics/user/${user.value.id}`);
    devMessage.value = `ok · ${metrics.value.ranked.length} archetypes computed`;
  } catch (e: any) {
    devMessage.value = `err: ${e?.statusMessage ?? e?.message ?? 'unknown'}`;
  } finally {
    metricsLoading.value = false;
  }
}

async function recomputePercentiles() {
  recomputing.value = true;
  devMessage.value = '';
  try {
    const res = await $fetch<any>('/api/cron/recompute-archetype-percentiles');
    devMessage.value = `cron ok · ${res.users} users · ${res.archetypes} archetypes · ${res.durationMs}ms`;
  } catch (e: any) {
    devMessage.value = `cron err: ${e?.statusMessage ?? e?.message ?? 'unknown'}`;
  } finally {
    recomputing.value = false;
  }
}

watch(() => user?.value?.id, (id) => { if (id) loadMetrics(); }, { immediate: true });
watch(() => user?.value?.signature_recipe, () => {
  signatureImageVisible.value = true;
});

// ── Header derived ────────────────────────────────────────────────────────
const joinDate = computed(() => {
  const raw = user?.value?.created_at;
  if (!raw) return '';
  return new Date(raw).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
});

// ── Radar chart ───────────────────────────────────────────────────────────
const RADAR_AXES = [
  { key: 'complexity', label: 'Complexity' },
  { key: 'spiciness', label: 'Spiciness' },
  { key: 'comfort', label: 'Comfort' },
  { key: 'freshness', label: 'Freshness' },
  { key: 'plantBased', label: 'Plant-Based' },
  { key: 'healthiness', label: 'Healthiness' },
  { key: 'exoticness', label: 'Exoticness' },
] as const;

const hasRadarData = computed(() => !!metrics.value?.radar);

const radarChartSeries = computed(() => {
  const r = metrics.value?.radar;
  if (!r) return [];
  return [{
    name: 'Your taste',
    data: RADAR_AXES.map((a) => Number(((r as any)[a.key] ?? 0).toFixed(2))),
  }];
});

const RADAR_PRIMARY_COLOR = 'var(--color-primary)';

const radarChartOptions = computed(() => ({
  chart: {
    type: 'radar',
    background: 'transparent',
    toolbar: { show: false },
    fontFamily: 'Libertinus Sans, sans-serif',
    animations: { enabled: true, easing: 'easeinout', speed: 400, animateGradually: { enabled: false } },
  },
  xaxis: {
    categories: RADAR_AXES.map((a) => a.label),
    labels: { style: { colors: Array(RADAR_AXES.length).fill('gray'), fontSize: '9px', fontFamily: 'var(--font-mono)' } },
  },
  yaxis: { min: 0, max: 10, tickAmount: 5, labels: { show: false } },
  stroke: { width: 2.5, colors: [RADAR_PRIMARY_COLOR] },
  fill: { opacity: 0.18, colors: [RADAR_PRIMARY_COLOR] },
  markers: { size: 4, colors: [RADAR_PRIMARY_COLOR], strokeColors: '#ffffff', strokeWidth: 2, hover: { size: 6 } },
  dataLabels: { enabled: false },
  plotOptions: {
    radar: {
      polygons: {
        strokeColors: '#e2e8f0',
        connectorColors: '#e2e8f0',
        fill: { colors: ['#fafafa', 'var(--color-primary-20)'] },
      },
    },
  },
  tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)} / 10` } },
  legend: { show: false },
}));

// ── Static sample data (kept as in profile-sample.vue) ────────────────────
const achievements = [
  { id: 1, name: 'First Recipe', icon: '🍽️', tier: 'bronze', earned: true },
  { id: 2, name: 'Top Rated', icon: '⭐', tier: 'gold', earned: true },
  { id: 3, name: 'Prolific Creator', icon: '✍️', tier: 'silver', earned: true },
  { id: 4, name: 'Flavor Explorer', icon: '🧭', tier: 'gold', earned: true },
  { id: 5, name: 'Bookworm', icon: '📚', tier: 'silver', earned: true },
  { id: 6, name: "Critic's Eye", icon: '🔍', tier: 'bronze', earned: true },
  { id: 7, name: 'Speed Chef', icon: '⚡', tier: 'bronze', earned: false },
  { id: 8, name: 'Plant Powered', icon: '🌿', tier: 'silver', earned: false },
  { id: 9, name: 'Master Chef', icon: '👨‍🍳', tier: 'gold', earned: false },
  { id: 10, name: 'Social Butterfly', icon: '🦋', tier: 'bronze', earned: false },
];

// ── Taste neighbors (live from endpoint) ─────────────────────────────────
const gamification = computed(() => {
  if (metrics.value?.gamification) return metrics.value.gamification;
  return {
    xp: Number(user?.value?.xp ?? 0),
    level: getLevelInfo(Number(user?.value?.xp ?? 0)),
    counts: {
      commented: 0,
      trackedDays: 0,
      visitStreak: 0,
      cuisineCount: 0,
    },
    achievements: [],
  };
});

const levelDisplay = computed(() => gamification.value.level);

const achievementCards = computed(() => {
  const states = new Map(
    (gamification.value.achievements ?? []).map((entry) => [entry.key, entry]),
  );

  return ACHIEVEMENT_ORDER.map((key) => {
    const display = ACHIEVEMENT_DISPLAY[key];
    const state = states.get(key);
    const currentTierLabel = tierLabel(state?.currentTier);
    const badge = display.kind === 'special'
      ? (state?.unlocked ? 'special' : null)
      : currentTierLabel;

    let progressLabel = display.description;
    if (display.kind === 'tiered' && state) {
      if (state.currentTier === 3) {
        progressLabel = `${state.currentValue ?? 0} ${display.targetLabel ?? ''}`.trim();
      } else if (state.nextThreshold != null) {
        progressLabel = `${state.currentValue ?? 0}/${state.nextThreshold} ${display.targetLabel ?? ''}`.trim();
      }
    } else if (key === 'signature_dish') {
      progressLabel = state?.unlocked ? 'Unlocked' : 'Set your signature';
    } else if (key === 'passport_pantry') {
      progressLabel = `${state?.currentValue ?? 0}/10 cuisines`;
    } else if (key === 'alchemist') {
      progressLabel = `${Number(state?.currentValue ?? 0).toFixed(1)}/8 exoticness`;
    } else if (key === 'crowd_pleaser') {
      progressLabel = state?.unlocked ? 'Unlocked' : 'Need traction on one recipe';
    }

    return {
      key,
      name: display.name,
      icon: display.icon,
      unlocked: Boolean(state?.unlocked),
      tierColor: display.kind === 'special' ? (state?.unlocked ? 'special' : null) : currentTierLabel,
      badge,
      progressLabel,
    };
  });
});

const unlockedAchievementCount = computed(() =>
  achievementCards.value.filter((entry) => entry.unlocked).length,
);

const tasteNeighbors = computed(() => (metrics.value?.neighbors ?? []).map((n) => ({
  id: n.id,
  username: n.username ?? 'Anon',
  picture: n.picture,
  match: n.match,
})));

// ── Recent activity (from injected user) ─────────────────────────────────
type ActivityEntry = {
  id: number;
  emoji: string;
  bgClass: string;
  text: string;
  time: string;
  href: string | null;
};

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function activityToEntry(item: Activity): ActivityEntry {
  const time = timeAgo(item.created_at);
  const id = item.id!;
  switch (item.type) {
    case 'RECIPE_CREATION': {
      const title = htmlEscape(item.recipe?.title ?? 'a recipe');
      const verb = item.recipe?.source_type === 'PREPARSED' || item.recipe?.source_type === 'TEXT' ? 'Created' : 'Added';
      return {
        id, emoji: '🍳', bgClass: 'bg-primary-5', time,
        text: `${verb} ${title}`,
        href: item.recipe?.id ? getRecipeUrl(item.recipe.id, item.recipe.title ?? '') : null,
      };
    }
    case 'RATING_CREATION': {
      const title = htmlEscape(item.rating?.recipe?.title ?? 'a recipe');
      const stars = item.rating?.rating ?? 0;
      return {
        id, emoji: '⭐', bgClass: 'bg-amber-50', time,
        text: `Rated ${title} ${stars}/5`,
        href: item.rating?.recipe?.id ? getRecipeUrl(item.rating.recipe.id, item.rating.recipe.title ?? '') : null,
      };
    }
    case 'COMMENT_CREATION': {
      const title = htmlEscape(item.comment?.recipe?.title ?? 'a recipe');
      return {
        id, emoji: '💬', bgClass: 'bg-blue-50', time,
        text: `Commented on ${title}`,
        href: item.comment?.recipe?.id ? getRecipeUrl(item.comment.recipe.id, item.comment.recipe.title ?? '') : null,
      };
    }
    case 'USER_CREATION':
      return { id, emoji: '✨', bgClass: 'bg-purple-50', time, text: 'Joined the community', href: null };
    case 'FOOD_CREATION': {
      const name = htmlEscape(item.food?.name ?? 'a food');
      return {
        id, emoji: '🌿', bgClass: 'bg-teal-50', time,
        text: `Added ${name} to the database`,
        href: item.food_name_id ? getFoodUrl(item.food_name_id, item.food?.name ?? '') : null,
      };
    }
    default:
      return { id, emoji: '•', bgClass: 'bg-gray-100', time, text: 'Activity', href: null };
  }
}

const recentActivity = computed<ActivityEntry[]>(() =>
  (user?.value?.activity ?? []).slice(0, 3).map(activityToEntry),
);
</script>

<style scoped></style>
