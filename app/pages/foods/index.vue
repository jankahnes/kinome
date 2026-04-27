<template>
  <div class="mb-20 space-y-6 sm:space-y-10 m-4 lg:my-10 lg:mx-16">
    <!-- Hero -->
    <div class="flex items-end justify-between gap-4">
      <div>
        <span class="font-mono text-[10px] text-gray-400 uppercase">PANTRY / {{ todayString }}</span>
        <h1 class="text-5xl font-headers leading-none">
          Pantry<span class="text-primary">.</span>
        </h1>
        <p class="text-sm text-gray-500 mt-2 max-w-md">
          Search every ingredient in our database — or scan a barcode for packaged products.
        </p>
      </div>
      <div class="hidden sm:flex items-center gap-6">
        <div class="flex flex-col items-end">
          <p class="text-3xl text-primary leading-none font-headers">{{ FOOD_CATEGORY_COUNT }}</p>
          <p class="text-[10px] text-gray-400 font-mono uppercase mr-0.5">Categories</p>
        </div>
        <div class="flex flex-col items-end">
          <RollingNumber :number="8890" class="text-3xl text-primary leading-none font-headers" />
          <p class="text-[10px] text-gray-400 font-mono uppercase mr-0.5">Foods</p>
        </div>
      </div>
    </div>

    <!-- Search row -->
    <div class="flex gap-2 w-full">
      <div class="ai-ring main-card-rounded p-px flex items-center flex-1 min-w-0">
        <div class="flex items-center rounded-[31px] px-4 bg-primary-5 flex-1 min-w-0">
          <IconSearch class="w-4 shrink-0" />
          <input type="text" placeholder="Search the pantry — apples, oats, salmon..."
            v-model="foodResultsStore.searchQuery"
            class="text-sm focus:outline-none flex-1 min-w-0 px-2 py-2.5 bg-transparent" />
          <button v-if="foodResultsStore.searchQuery || activeCategory" @click.stop="clearAll"
            class="text-gray-400 hover:text-gray-700 transition-colors p-1 shrink-0" aria-label="Clear">
            <IconX class="w-4" />
          </button>
        </div>
      </div>
      <button class="main-button animated-button main-card px-3.5 flex items-center gap-2 shrink-0"
        @click="navigateTo('/foods/new')">
        <IconPlus class="w-4" />
        <span class="text-xs font-mono uppercase tracking-wider hidden sm:inline">Add</span>
      </button>
      <button class="main-button animated-button main-card px-3.5 flex items-center gap-2 shrink-0"
        @click="navigateTo('/foods/scan')">
        <IconScanBarcode class="w-4" />
        <span class="text-xs font-mono uppercase tracking-wider hidden sm:inline">Scan</span>
      </button>
    </div>

    <!-- Results: text search OR category browse -->
    <template v-if="foodResultsStore.searchQuery || activeCategory">
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline justify-between px-1 gap-3">
          <p class="font-mono text-[10px] uppercase tracking-wider text-gray-400 truncate">
            <template v-if="loading">
              Searching…
            </template>
            <template v-else-if="activeCategory">
              {{ foodResultsStore.foodResults.length }} in {{ activeCategory.label }}
            </template>
            <template v-else-if="foodResultsStore.foodResults.length">
              {{ foodResultsStore.foodResults.length }}
              {{ foodResultsStore.foodResults.length === 1 ? 'match' : 'matches' }}
              for &quot;{{ foodResultsStore.searchQuery }}&quot;
            </template>
            <template v-else>
              No matches for &quot;{{ foodResultsStore.searchQuery }}&quot;
            </template>
          </p>
          <button @click="clearAll"
            class="font-mono text-[10px] uppercase tracking-wider text-gray-400 hover:text-primary transition-colors shrink-0">
            Browse all →
          </button>
        </div>

        <!-- Skeletons while loading -->
        <template v-if="loading">
          <Skeleton v-for="i in 6" :key="'sk-' + i" class="h-[68px] main-card-rounded" />
        </template>

        <template v-else>
          <NuxtLink v-for="food in foodResultsStore.foodResults" :key="food.id"
            :to="getFoodUrl(food.id, food.name)"
            class="group main-card main-card-rounded animated-button px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 hover:bg-primary-10/50 transition-colors">
            <img v-if="food.food?.visual_category" :src="`/foods/${food.food.visual_category}.webp`"
              :alt="ALTS[`/foods/${food.food.visual_category}.webp`] ?? ''"
              class="w-10 h-10 object-contain shrink-0" />
            <div v-else class="w-10 h-10 shrink-0 rounded-full bg-primary-5" />
            <div class="flex-1 min-w-0">
              <h2 class="font-medium truncate">{{ food.name }}</h2>
              <p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 truncate">
                <span>{{ food.food?.aisle ?? 'Uncategorized' }}</span>
                <span v-if="food.food?.kcal != null">
                  <span class="mx-1.5 text-gray-300">·</span>{{ Math.round(food.food.kcal) }} kcal / 100g
                </span>
              </p>
            </div>
            <GradeContainer :score="food.food?.hidx ?? 0" type="ovr" class="text-base w-11! h-11! shrink-0" />
          </NuxtLink>

          <div v-if="!foodResultsStore.foodResults.length && foodResultsStore.searchQuery"
            class="main-card main-card-rounded main-card-padding text-center text-sm text-gray-500">
            <p>Nothing found. Try a different name, or
              <button @click="clearAll" class="text-primary underline underline-offset-2">browse categories</button>.
            </p>
          </div>
        </template>
      </div>
    </template>

    <!-- Discovery (no active search / category) -->
    <template v-else>
      <!-- Scan barcode CTA -->
      <NuxtLink to="/foods/scan"
        class="block main-card-rounded animated-button overflow-hidden relative group p-5 md:p-7 bg-gradient-to-br from-primary-100 via-primary-50 to-primary-5">
        <div class="flex items-start gap-4 md:gap-6">
          <div class="rounded-full bg-white p-3 md:p-4 shrink-0 shadow-[0_0_12px_rgba(0,0,0,0.08)]">
            <IconScanBarcode class="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <div class="flex-1 min-w-0 space-y-1">
            <p class="text-[10px] font-mono uppercase tracking-wider text-primary">Beta · Barcode</p>
            <h2 class="text-2xl md:text-3xl font-headers tracking-tight leading-none">
              Scan any product
            </h2>
            <p class="text-sm text-gray-600 max-w-md leading-relaxed">
              Point your camera at a barcode to pull nutrition, ingredients, and a Kinome health grade — even for products not yet in the pantry.
            </p>
          </div>
          <IconChevronRight
            class="w-5 h-5 text-primary shrink-0 mt-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </NuxtLink>

      <!-- Browse by category -->
      <section class="space-y-6">
        <div class="flex items-baseline justify-between">
          <h2 class="text-2xl md:text-3xl font-headers tracking-tight">Browse the pantry</h2>
          <span class="font-mono text-[10px] uppercase tracking-wider text-gray-400">
            {{ FOOD_CATEGORY_COUNT }} categories
          </span>
        </div>

        <div v-for="group in FOOD_CATEGORY_GROUPS" :key="group.title" class="space-y-3">
          <h3 class="font-mono text-[11px] uppercase tracking-[0.22em] text-gray-500 ml-1">
            {{ group.title }}
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
            <button v-for="cat in group.categories" :key="cat.slug" type="button"
              @click="onCategoryClick(cat)"
              class="main-card main-card-rounded animated-button px-3 py-2.5 flex items-center gap-3 hover:bg-primary-10/50 transition-colors text-left">
              <img :src="`/foods/${cat.slug}.webp`" :alt="cat.label"
                class="w-9 h-9 object-contain shrink-0" />
              <span class="text-xs font-medium truncate">{{ cat.label }}</span>
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const foodResultsStore = useFoodResultsStore();

const todayString = new Date().toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
});

const loading = ref(false);
const activeCategory = ref<{ slug: string; label: string } | null>(null);
let requestId = 0;

useHead({
  title: 'Food Nutrition Database | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content:
        'Search foods by name to compare nutrition data, health scores, calories, macros, and ingredient matches for recipes.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Food Nutrition Database | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content:
        'Search foods by name to compare nutrition data, health scores, calories, macros, and ingredient matches for recipes.',
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'website',
    },
    {
      key: 'og:url',
      property: 'og:url',
      content: 'https://kinome.app/foods',
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: 'https://kinome.app/foods',
    },
  ],
});

// ---- Initial state from URL ----
const urlSearch = (route.query.search as string) || '';
const urlCategory = (route.query.category as string) || '';

if (urlCategory && FOOD_CATEGORY_LABELS[urlCategory]) {
  foodResultsStore.searchQuery = '';
  void runCategorySearch({ slug: urlCategory, label: FOOD_CATEGORY_LABELS[urlCategory] });
} else if (urlSearch) {
  foodResultsStore.searchQuery = urlSearch;
  void runTextSearch(urlSearch);
} else {
  foodResultsStore.foodResults = [];
}

// ---- Auto-search on input ----
// Flip loading on synchronously so the "no matches" branch can't flash
// during the debounce window between keystrokes.
watch(
  () => foodResultsStore.searchQuery,
  (q) => {
    const trimmed = (q ?? '').trim();
    if (trimmed) {
      if (activeCategory.value) activeCategory.value = null;
      loading.value = true;
    } else if (!activeCategory.value) {
      foodResultsStore.foodResults = [];
      loading.value = false;
      requestId++;
      if (route.query.search || route.query.category) {
        navigateTo('/foods', { replace: true });
      }
    }
  },
);

watchDebounced(
  () => foodResultsStore.searchQuery,
  (q) => {
    const trimmed = (q ?? '').trim();
    if (trimmed) void runTextSearch(trimmed);
  },
  { debounce: 250 },
);

// ---- Searches ----
async function runTextSearch(query: string) {
  const myId = ++requestId;
  loading.value = true;
  const { data, error } = (await supabase.rpc('search_foods_deduplicated', {
    query,
    max: 12,
  })) as unknown as { data: Food[]; error: Error | null };
  if (myId !== requestId) return;
  loading.value = false;
  if (error) {
    console.error(error);
    return;
  }
  foodResultsStore.setFoodResults(data ?? [], query);
  navigateTo(`/foods?search=${encodeURIComponent(query)}`, { replace: true });
}

async function runCategorySearch(cat: { slug: string; label: string }) {
  const myId = ++requestId;
  activeCategory.value = cat;
  loading.value = true;
  const { data, error } = await supabase
    .from('food_names')
    .select('*, food:foods!inner(*)')
    .eq('is_primary', true)
    .eq('food.visual_category', cat.slug)
    .order('hidx', { referencedTable: 'food', ascending: false })
    .limit(200);
  if (myId !== requestId) return;
  loading.value = false;
  if (error) {
    console.error(error);
    return;
  }
  foodResultsStore.setFoodResults((data ?? []) as unknown as Food[], '');
  navigateTo(`/foods?category=${encodeURIComponent(cat.slug)}`, { replace: true });
}

// ---- Handlers ----
function onCategoryClick(cat: { slug: string; label: string }) {
  foodResultsStore.searchQuery = '';
  void runCategorySearch(cat);
}

function clearAll() {
  requestId++;
  foodResultsStore.searchQuery = '';
  foodResultsStore.foodResults = [];
  activeCategory.value = null;
  loading.value = false;
  navigateTo('/foods', { replace: true });
}
</script>

<style scoped></style>
