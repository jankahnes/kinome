<template>
  <Transition name="loaded-content">
    <div v-if="auth.profileFetched">

      <!-- ─── GUEST VIEW ────────────────────────────────────────────── -->
      <div v-if="!auth.isUser()">
        <HerocardsHome />
        <div class="mt-10">
          <div class="">
            <h2 class="text-2xl font-headers tracking-tight">For You</h2>
            <span class="text-sm text-gray-500 -mt-1 ">
              <NuxtLink to="/login" class="underline">Sign in</NuxtLink> to personalise
            </span>
          </div>
          <ForYouGrid :results="allResults.slice(0, 23)" :is-loading="isLoading" />
        </div>
      </div>

      <!-- ─── LOGGED IN VIEW ───────────────────────────────────────── -->
      <div v-else class="space-y-6 lg:space-y-10 mt-4 lg:mt-10">
        <h1 class="text-4xl sm:text-5xl font-headers tracking-tight">Welcome back, <span class="text-primary italic">{{
          auth.user?.username }}</span>.</h1>

        <!-- NUTRITION AUTOPILOT ─────────────────────────────────────── -->
        <section v-if="hasTracking">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-headers tracking-tight">Nutrition Autopilot</h2>
          </div>

          <div class="flex gap-4 sm:items-end flex-col sm:flex-row flex-wrap">
            <!-- Progress card -->
            <div
              class="main-card main-card-rounded main-card-padding shrink-0 flex-1 basis-full md:basis-80 flex flex-col gap-5 md:mb-4 mt-4">
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-gray-500 font-mono uppercase tracking-widest">Today's progress</span>

                <NuxtLink to="/tracking/daily" class="flex items-center self-center gap-1 text-xs text-gray-500">
                  See details
                  <IconChevronRight class="w-4" />
                </NuxtLink>
              </div>
              <!-- Calories -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between text-xs">
                  <span class="">Calories</span>
                  <span class="transition-all duration-400 font-mono"
                    :class="previewConsumed.kcal > kcalGoal * 1.2 ? 'text-amber-500 font-medium' : 'text-gray-500'">
                    <strong>{{ Math.round(previewConsumed.kcal) }}</strong> / {{ kcalGoal }} kcal
                  </span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-200/70 overflow-hidden relative">
                  <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    :class="previewConsumed.kcal > kcalGoal * 1.2 ? 'bg-amber-400' : 'bg-primary'"
                    :style="{ width: Math.min(100, (todayConsumed.kcal / kcalGoal) * 100) + '%' }" />
                  <div v-if="hoveredRecipe && todayConsumed.kcal <= kcalGoal"
                    class="absolute inset-y-0 rounded-full bg-primary/30 transition-all duration-400"
                    :style="previewBarStyle(todayConsumed.kcal, hoveredRecipe.kcal ?? 0, kcalGoal)" />
                </div>
              </div>

              <!-- Protein -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between text-xs">
                  <span class="">Protein</span>
                  <span class="font-mono text-gray-500">
                    <strong>{{ Math.round(previewConsumed.protein) }}</strong> / {{ proteinGoal }} g
                  </span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-200/70 overflow-hidden relative">
                  <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-protein"
                    :style="{ width: Math.min(100, (todayConsumed.protein / proteinGoal) * 100) + '%' }" />
                  <div v-if="hoveredRecipe"
                    class="absolute inset-y-0 rounded-full bg-protein/40 transition-all duration-300"
                    :style="previewBarStyle(todayConsumed.protein, hoveredRecipe.protein ?? 0, proteinGoal)" />
                </div>
              </div>

              <!-- Carbs -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between text-xs">
                  <span class="">Carbs</span>
                  <span class="transition-all duration-400 font-mono"
                    :class="previewConsumed.carbohydrates > carbsGoal * 1.2 ? 'text-amber-500 font-medium' : 'text-gray-500'">
                    <strong>{{ Math.round(previewConsumed.carbohydrates) }}</strong> / {{ carbsGoal }} g
                  </span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-200/70 overflow-hidden relative">
                  <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    :class="previewConsumed.carbohydrates > carbsGoal * 1.2 ? 'bg-amber-300' : 'bg-carbs'"
                    :style="{ width: Math.min(100, (todayConsumed.carbohydrates / carbsGoal) * 100) + '%' }" />
                  <div v-if="hoveredRecipe"
                    class="absolute inset-y-0 rounded-full bg-carbs/40 transition-all duration-400"
                    :style="previewBarStyle(todayConsumed.carbohydrates, hoveredRecipe.carbohydrates ?? 0, carbsGoal)" />
                </div>
              </div>

              <!-- Fat -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between text-xs">
                  <span class="">Fat</span>
                  <span class="transition-all duration-400 font-mono"
                    :class="previewConsumed.fat > fatGoal * 1.2 ? 'text-amber-500 font-medium' : 'text-gray-500'">
                    <strong>{{ Math.round(previewConsumed.fat) }}</strong> / {{ fatGoal }} g
                  </span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-200/70 overflow-hidden relative">
                  <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    :class="previewConsumed.fat > fatGoal * 1.2 ? 'bg-amber-300' : 'bg-fat'"
                    :style="{ width: Math.min(100, (todayConsumed.fat / fatGoal) * 100) + '%' }" />
                  <div v-if="hoveredRecipe && todayConsumed.fat <= fatGoal"
                    class="absolute inset-y-0 rounded-full bg-fat/40 transition-all duration-400"
                    :style="previewBarStyle(todayConsumed.fat, hoveredRecipe.fat ?? 0, fatGoal)" />
                </div>
              </div>

              <!-- Fiber -->
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between text-xs">
                  <span class="">Fiber</span>
                  <span class="font-mono text-gray-500">
                    <strong>{{ Math.round(previewConsumed.fiber) }}</strong> / {{ fiberGoal }} g
                  </span>
                </div>
                <div class="h-2.5 rounded-full bg-gray-200/70 overflow-hidden relative">
                  <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-fiber"
                    :style="{ width: Math.min(100, (todayConsumed.fiber / fiberGoal) * 100) + '%' }" />
                  <div v-if="hoveredRecipe"
                    class="absolute inset-y-0 rounded-full bg-fiber/40 transition-all duration-300"
                    :style="previewBarStyle(todayConsumed.fiber, hoveredRecipe.fiber ?? 0, fiberGoal)" />
                </div>
              </div>



            </div>
              <!-- Macro-fit recipe suggestions -->
              <template v-if="isFamiliarLoading">
                <Skeleton v-for="i in 4" :key="i" class="basis-44 max-w-80 flex-1 h-86 rounded-xl" />
              </template>
              <template v-else-if="macroFitRecipes.length">
                <RecipeCard v-for="recipe in macroFitRecipes" :key="recipe.id" :recipe="recipe"
                  :reason-text="getMacroBadgeText(recipe)" class="basis-50 text-[28px] max-w-80 hidden sm:flex flex-1"
                  @mouseenter="hoveredRecipe = recipe" @mouseleave="hoveredRecipe = null" />
                <RecipeCardHorizontal v-for="recipe in macroFitRecipes" :key="recipe.id" :recipe="recipe"
                  :reason-text="getMacroBadgeText(recipe)" class="text-[24px] sm:hidden flex-1" />
              </template>
              <p v-else class="text-sm text-gray-400 self-center">
                Save some recipes to get personalised meal suggestions.
              </p>
          </div>
        </section>

        <!-- FOR YOU ────────────────────────────────────────────────── -->
        <section>
          <div class="">
            <h2 class="text-2xl font-headers tracking-tight">For You</h2>
            <NuxtLink to="/kitchen/recommendations" class="text-xs -mt-1 flex items-center text-gray-500">See all
              <IconChevronRight class="w-4" />
            </NuxtLink>
          </div>
          <ForYouGrid :results="forYouResults" :is-loading="isLoading" />
        </section>

        <!-- QUICK WINS + FRIDGE ─────────────────────────────────────── -->
        <section class="flex gap-8 flex-wrap lg:flex-nowrap">

          <!-- Quick Wins carousel -->
          <div v-if="quickWins.length" class="flex-1 min-w-0 space-y-4 basis-80">
            <div class="flex items-baseline gap-3">
              <h2 class="text-2xl font-headers tracking-tight">Quick Wins</h2>
              <span class="text-sm text-gray-400">Under 30 minutes</span>
            </div>
            <BlocksCarousel flex-class="gap-3">
              <RecipeCard v-for="recipe in quickWins" :key="recipe.id" :recipe="recipe"
                :reason-text="getQuickTimeLabel(recipe)" class="w-50 flex-shrink-0 ml-2 mb-2 text-[24px]" />
            </BlocksCarousel>
          </div>

          <!-- Fridge Widget -->
          <div :class="quickWins.length ? 'basis-80 flex-1 max-w-104' : 'w-full'" class="flex flex-col gap-4 mb-4">
            <h2 class="text-2xl font-headers tracking-tight">What's in your fridge?</h2>
            <div class="main-card main-card-rounded main-card-padding space-y-4 flex-1">

              <!-- Input state -->
              <template v-if="fridgeResults === null">
                <p class="text-sm text-gray-500 leading-snug">Enter ingredients - we'll find recipes that use them all.
                </p>
                <div v-if="fridgeIngredients.length" class="flex flex-wrap gap-2">
                  <div v-for="(ing, i) in fridgeIngredients" :key="i"
                    class="flex items-center gap-1.5 px-2.5 py-1 bg-primary-5 rounded-xl text-sm">
                    <span>{{ ing }}</span>
                    <button @click="removeFridgeIngredient(i)"
                      class="text-gray-400 hover:text-gray-600 leading-none text-base">×</button>
                  </div>
                </div>
                <div class="flex gap-2">
                  <input v-model="fridgeInput" placeholder="e.g. chicken…" @keydown.enter.prevent="addFridgeIngredient"
                    class="flex-1 bg-primary-5 rounded-2xl px-3 py-2 text-sm focus:outline-none" />
                  <button @click="addFridgeIngredient"
                    class="main-button animated-button bg-primary-5 px-3 py-2 rounded-2xl">
                    <IconPlus class="w-4" />
                  </button>
                </div>
                <button @click="searchFridge" :disabled="fridgeIngredients.length === 0 || fridgeLoading"
                  class="main-button animated-button bg-primary text-white w-full py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-40 transition-opacity mt-auto">
                  <span v-if="fridgeLoading">Searching…</span>
                  <span v-else>Find Recipes</span>
                </button>
              </template>

              <!-- Results state -->
              <template v-else>
                <div class="flex items-center justify-between">
                  <p class="text-sm text-gray-500">
                    {{ fridgeResults.length ? `${fridgeResults.length} recipe${fridgeResults.length === 1 ? '' : 's'}
                    found` : 'No recipes found' }}
                  </p>
                  <button @click="clearFridge" class="text-xs text-primary font-semibold">Try again</button>
                </div>
                <div v-if="fridgeResults.length" class="flex flex-col gap-2">
                  <RecipeCardHorizontal v-for="recipe in fridgeResults" :key="recipe.id" :recipe="recipe"
                    class="text-[20px]" />
                </div>
                <p v-else class="text-sm text-gray-400">Try fewer or different ingredients.</p>
              </template>

            </div>
          </div>
        </section>

        <!-- RECENTLY SEEN ───────────────────────────────────────────── -->
        <section v-if="recentlySeen.length">
          <h2 class="text-2xl font-headers tracking-tight mb-4">You Looked at These</h2>
          <BlocksCarousel flex-class="gap-3">
            <RecipeCard v-for="recipe in recentlySeen" :key="recipe.id" :recipe="recipe"
              class="w-50 flex-shrink-0 ml-2 mb-2 text-[24px]" />
          </BlocksCarousel>
        </section>

        <!-- EQUIPMENT ───────────────────────────────────────────────── -->
        <section v-if="userEquipmentIds.length">
          <h2 class="text-2xl font-bold tracking-tight mb-8">For Your Kitchen</h2>
          <div class="space-y-10">
            <template v-for="eqId in userEquipmentIds" :key="eqId">
              <div v-if="equipmentRecipes[eqId]?.length">
                <h3 class="text-lg font-semibold tracking-tight mb-4">{{ getEquipmentLabel(eqId) }}</h3>
                <BlocksCarousel flex-class="gap-3">
                  <RecipeCard v-for="recipe in equipmentRecipes[eqId]" :key="recipe.id" :recipe="recipe"
                    :reason-text="'For your ' + getEquipmentName(eqId)"
                    class="w-50 flex-shrink-0 ml-2 mb-2 text-[24px]" />
                </BlocksCarousel>
              </div>
            </template>
          </div>
        </section>

      </div>

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { todayLogicalDate } from '~/utils/format/logicalDate';

type RecommendationRow = RecipeOverview & {
  nearest_recipe: { id: number; title: string; set: 'own' | 'bookmarks' | 'ratings' } | null;
  matched_tags: number[];
  dominant_signal: 'taste' | 'tags' | 'trending';
};

const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();

useHead({
  title: 'Healthy Recipe Dashboard | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Get personalized recipe picks, nutrition autopilot ideas, quick meals, and fridge-based inspiration for healthier cooking.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Healthy Recipe Dashboard | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content: 'Get personalized recipe picks, nutrition autopilot ideas, quick meals, and fridge-based inspiration for healthier cooking.',
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'website',
    },
    {
      key: 'og:url',
      property: 'og:url',
      content: 'https://kinome.app/kitchen/home',
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: 'https://kinome.app/kitchen/home',
    },
  ],
});


// ─── Tracking config ─────────────────────────────────────────────────────────
// @ts-ignore
const hasTracking = computed(() => !!(auth.user?.user_data as any)?.tracking);
const trackingTargets = computed(() => (auth.user?.user_data as any)?.tracking?.targets);
const kcalGoal = computed(() => trackingTargets.value?.kcal ?? 2000);
const proteinGoal = computed(() => trackingTargets.value?.protein ?? 100);
const fiberGoal = computed(() => trackingTargets.value?.fiber ?? 30);
const fatGoal = computed(() => trackingTargets.value?.fat ?? 70);
const carbsGoal = computed(() => trackingTargets.value?.carbohydrates ?? 275);

// ─── Today's nutrition ───────────────────────────────────────────────────────
const todayConsumed = ref({ kcal: 0, protein: 0, fiber: 0, fat: 0, carbohydrates: 0 });
const isTodayLoading = ref(false);

async function fetchTodayNutrition() {
  if (!auth.user?.id) return;
  const today = todayLogicalDate();
  isTodayLoading.value = true;
  try {
    const { data } = await supabase
      .from('tracked_meals')
      .select('kcal, protein, fat, carbohydrates, fiber')
      .eq('user_id', auth.user.id)
      .eq('meal_date', today)
      .not('is_template', 'is', true);

    if (data?.length) {
      todayConsumed.value = {
        kcal: data.reduce((s, m) => s + (m.kcal ?? 0), 0),
        protein: data.reduce((s, m) => s + (m.protein ?? 0), 0),
        fiber: data.reduce((s, m) => s + (m.fiber ?? 0), 0),
        fat: data.reduce((s, m) => s + (m.fat ?? 0), 0),
        carbohydrates: data.reduce((s, m) => s + (m.carbohydrates ?? 0), 0),
      };
    }
  } finally {
    isTodayLoading.value = false;
  }
}

// ─── Hover preview ───────────────────────────────────────────────────────────
const hoveredRecipe = ref<RecipeOverview | null>(null);

const previewConsumed = computed(() => ({
  kcal: todayConsumed.value.kcal + (hoveredRecipe.value?.kcal ?? 0),
  protein: todayConsumed.value.protein + (hoveredRecipe.value?.protein ?? 0),
  fiber: todayConsumed.value.fiber + (hoveredRecipe.value?.fiber ?? 0),
  fat: todayConsumed.value.fat + (hoveredRecipe.value?.fat ?? 0),
  carbohydrates: todayConsumed.value.carbohydrates + (hoveredRecipe.value?.carbohydrates ?? 0),
}));

function previewBarStyle(consumed: number, recipeVal: number, goal: number) {
  const consumedPct = Math.min(100, (consumed / goal) * 100);
  const addPct = Math.min(100 - consumedPct, (recipeVal / goal) * 100);
  return { left: consumedPct + '%', width: Math.max(0, addPct) + '%' };
}

// ─── Macro-fit scoring ───────────────────────────────────────────────────────
// Scores by how evenly a recipe fills all macro targets (low variance = good),
// with extra penalties for exceeding kcal or fat.
function macroFitScore(recipe: RecipeOverview): number {
  const c = todayConsumed.value;

  // Post-meal fill % for each macro (1.0 = exactly at target)
  const pcts = [
    { v: (c.protein + (recipe.protein ?? 0)) / Math.max(1, proteinGoal.value), w: 2.0 },
    { v: (c.kcal + (recipe.kcal ?? 0)) / Math.max(1, kcalGoal.value), w: 1.5 },
    { v: (c.fiber + (recipe.fiber ?? 0)) / Math.max(1, fiberGoal.value), w: 1.0 },
    { v: (c.fat + (recipe.fat ?? 0)) / Math.max(1, fatGoal.value), w: 0.8 },
    { v: (c.carbohydrates + (recipe.carbohydrates ?? 0)) / Math.max(1, carbsGoal.value), w: 0.6 },
  ];

  const totalW = pcts.reduce((s, e) => s + e.w, 0);
  const mean = pcts.reduce((s, e) => s + e.v * e.w, 0) / totalW;
  const variance = pcts.reduce((s, e) => s + e.w * (e.v - mean) ** 2, 0) / totalW;

  // Quadratic penalty for going over kcal or fat
  const kcalOver = Math.max(0, pcts[1].v - 1);
  const fatOver = Math.max(0, pcts[3].v - 1);

  return variance + 2.5 * kcalOver ** 2 + 1.5 * fatOver ** 2;
}

// ─── Familiar recipes (for nutrition section) ────────────────────────────────
const familiarRecipes = ref<RecipeOverview[]>([]);
const isFamiliarLoading = ref(false);

const macroFitRecipes = computed(() => {
  if (!familiarRecipes.value.length) return [];
  return [...familiarRecipes.value]
    .sort((a, b) => macroFitScore(a) - macroFitScore(b))
    .slice(0, 4);
});

const macroFitIds = computed(() => new Set(macroFitRecipes.value.map((r) => r.id)));

function getMacroBadgeText(recipe: RecipeOverview): string {
  const c = todayConsumed.value;
  const candidates = [
    { label: `+${Math.round(recipe.protein ?? 0)}g Protein`, shortfall: Math.max(0, proteinGoal.value - c.protein) / Math.max(1, proteinGoal.value), value: recipe.protein ?? 0 },
    { label: `+${Math.round(recipe.fiber ?? 0)}g Fiber`, shortfall: Math.max(0, fiberGoal.value - c.fiber) / Math.max(1, fiberGoal.value), value: recipe.fiber ?? 0 },
    { label: `≈ ${Math.round(recipe.kcal ?? 0)} kcal`, shortfall: Math.abs(kcalGoal.value - c.kcal) / Math.max(1, kcalGoal.value), value: recipe.kcal ?? 0 },
  ].filter((c) => c.value > 0).sort((a, b) => b.shortfall - a.shortfall);
  return candidates[0]?.label ?? 'Good match';
}

async function fetchFamiliarRecipes() {
  if (!auth.user?.id) return;
  isFamiliarLoading.value = true;
  try {
    const { data, error } = await (supabase as any).rpc('get_recommendations', {
      p_user_id: auth.user.id,
      max: 24,
      explore: false,
    });
    if (!error) {
      familiarRecipes.value = (data ?? []).map((row: any) => ({ ...row, tags: row.tags ?? [] }));
    }
  } finally {
    isFamiliarLoading.value = false;
  }
}

// ─── Recommendations (shared: For You + Quick Wins) ──────────────────────────
const allResults = ref<RecommendationRow[]>([]);
const isLoading = ref(true);

function isQuickRecipe(r: RecipeOverview): boolean {
  if (r.total_time_mins && r.total_time_mins >= 30) return false;
  if (r.total_time_mins && r.total_time_mins <= 30) return true;
  return (r.tags ?? []).some((t) => t == 2);
}

function getQuickTimeLabel(recipe: RecipeOverview): string {
  const mins = recipe.total_time_mins;
  if (!mins) return 'Ready in <25min';
  const rounded = Math.max(5, mins < 60 ? Math.floor(mins / 5) * 5 : Math.floor(mins / 10) * 10);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `Ready in ${m}min`;
}

const quickWins = computed(() =>
  allResults.value
    .filter((r) => !macroFitIds.value.has(r.id) && isQuickRecipe(r))
    .slice(0, 5)
);

const quickWinIds = computed(() => new Set(quickWins.value.map((r) => r.id)));

const forYouResults = computed(() =>
  allResults.value.filter((r) => !macroFitIds.value.has(r.id) && !quickWinIds.value.has(r.id)).slice(0, 13)
);

const allUsedIds = computed(() => new Set([
  ...macroFitIds.value,
  ...quickWinIds.value,
  ...forYouResults.value.map((r) => r.id),
]));

async function fetchRecommendations() {
  isLoading.value = true;
  try {
    const { data, error } = await (supabase as any).rpc('get_recommendations', {
      p_user_id: auth.user?.id,
      max: 24,
      explore: true,
      anchor_boost: 6,
    });
    if (!error) {
      allResults.value = (data ?? []).map((row: any) => ({
        ...row,
        tags: row.tags ?? [],
      })) as RecommendationRow[];
    }
  } finally {
    isLoading.value = false;
  }
}

// ─── Recently Seen ────────────────────────────────────────────────────────────
const recentlySeenRecipes = ref<RecipeOverview[]>([]);

const recentlySeen = computed(() =>
  recentlySeenRecipes.value.filter((r) => !allUsedIds.value.has(r.id))
);

async function fetchRecentlySeen() {
  const ids: number[] = ((auth.user as any)?.recently_seen ?? []).slice(0, 14);
  if (ids.length === 0) return;
  const recipes = await getRecipeOverviews(supabase, { in: { id: ids }, limit: 14 });
  recentlySeenRecipes.value = ids
    .map((id) => recipes.find((r) => r.id === id))
    .filter(Boolean) as RecipeOverview[];
}

// ─── Equipment ────────────────────────────────────────────────────────────────
const equipmentRecipes = ref<Record<number, RecipeOverview[]>>({});

const userEquipmentIds = computed<number[]>(() =>
  ((auth.user as any)?.liked_tags ?? []).filter((id: number) => id >= 400)
);

const EQUIPMENT_LABELS: Record<number, string> = {
  400: '🌪️ Air Fryer',
  401: '⚡ Instant Pot',
  402: '🍲 Slow Cooker',
  403: '🤖 Thermomix',
  404: '🍰 Stand Mixer',
  405: '🍦 Ice Cream Machine',
  406: '🌡️ Sous Vide',
  407: '🧇 Waffle Iron',
  408: '☀️ Dehydrator',
  409: '🔵 Cast Iron',
  410: '🫕 Dutch Oven',
  411: '🥢 Wok',
  412: '🍞 Bread Machine',
  413: '🔥 Smoker',
  414: '🍚 Rice Cooker',
};

function getEquipmentLabel(id: number): string {
  return EQUIPMENT_LABELS[id] ?? 'Special Equipment';
}

function getEquipmentName(id: number): string {
  return (EQUIPMENT_LABELS[id] ?? '').replace(/^\S+\s/, '');
}

async function fetchEquipmentRecipes() {
  const eqIds = userEquipmentIds.value;
  if (eqIds.length === 0) return;
  await Promise.all(
    eqIds.map(async (eqId) => {
      const recipes = await getRecipeOverviews(supabase, {
        filtering: { tags: [eqId], hidx: null, kcal: null, price: null },
        orderBy: { column: 'relevancy', ascending: false },
        or: 'picture.not.eq.null,source_type.eq.MEDIA',
        limit: 8,
      });
      equipmentRecipes.value[eqId] = recipes;
    })
  );
}

// ─── Fridge Widget ────────────────────────────────────────────────────────────
const fridgeInput = ref('');
const fridgeIngredients = ref<string[]>([]);
const fridgeResults = ref<RecipeOverview[] | null>(null);
const fridgeLoading = ref(false);

function addFridgeIngredient() {
  const val = fridgeInput.value.trim().replace(/,+$/, '');
  if (val && !fridgeIngredients.value.includes(val)) {
    fridgeIngredients.value.push(val);
  }
  fridgeInput.value = '';
}

function removeFridgeIngredient(index: number) {
  fridgeIngredients.value.splice(index, 1);
}

function clearFridge() {
  fridgeResults.value = null;
}

async function searchFridge() {
  if (fridgeIngredients.value.length === 0 || fridgeLoading.value) return;
  fridgeLoading.value = true;
  try {
    const foodNameIds: number[] = [];
    for (const ingredient of fridgeIngredients.value) {
      const { data } = await (supabase as any).rpc('search_foods', { query: ingredient, max: 1 });
      if (data?.[0]?.best_similarity > 0.7) {
        const { data: fnData } = await supabase
          .from('food_names')
          .select('id')
          .eq('food_id', data[0].food_id)
          .limit(1)
          .single();
        if (fnData?.id) foodNameIds.push(fnData.id);
      }
    }
    fridgeResults.value = foodNameIds.length
      ? await getRecipesContaining(supabase, foodNameIds)
      : [];
  } catch {
    fridgeResults.value = [];
  } finally {
    fridgeLoading.value = false;
  }
}

// ─── Watchers ────────────────────────────────────────────────────────────────
watchEffect(() => {
  if (!auth.profileFetched) return;
  fetchRecommendations();
  fetchRecentlySeen();
  if (auth.isUser()) {
    fetchEquipmentRecipes();
    if (hasTracking.value) {
      fetchTodayNutrition();
      fetchFamiliarRecipes();
    }
  }
});
</script>
