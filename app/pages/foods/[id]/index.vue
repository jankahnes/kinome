<template>
  <div class="my-8 mx-auto max-w-[1360px]" v-if="food">
    <p class="text-lg m-4">
      <NuxtLink to="/" class="text-gray-500">Home</NuxtLink> ›
      <NuxtLink to="/foods" class="text-gray-500">Foods</NuxtLink> ›
      <span class="font-bold">{{ foodName }}</span>
    </p>
    <div class="flex flex-col 2xl:flex-row gap-6">
      <div class="contents xl:flex flex-col gap-6 lg:flex-1">

        <div class="bg-primary-10/40 rounded-4xl main-card-padding flex gap-6 flex-col xl:flex-row order-1 xl:order-none xl:items-start">
          <div class="relative xl:basis-1/5 h-40">
            <img class="object-cover rounded-4xl h-full" src="/wood.png" :alt="foodName" />

            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-10 h-[60%] aspect-square flex items-center justify-center">
              <img :src="`/foods/${food?.visual_category ?? 'herb_fresh'}.webp`" class="h-[60%] object-contain"
                :alt="(food?.visual_category ?? 'herb_fresh') + ' illustration'" />
            </div>
          </div>
          <div class="flex-1 flex flex-col gap-4">
            <div class="flex justify-between items-start">
              <div class="">
                <h1 class="text-5xl font-bold">{{ foodName }}</h1>
                <p class="text-xs text-gray-400">
                  {{ food?.aisle?.toUpperCase() || 'Food' }}
                </p>
              </div>
              <button class="flex justify-center items-center w-15 h-15 rounded-2xl p-2 shrink-0 hover:opacity-80 transition-opacity"
                :class="gradeColors[getGrade(food?.hidx, 'ovr')]"
                @click="openHealthReport">
                <span class="text-3xl font-bold leading-none">{{
                  getGrade(food?.hidx, 'ovr')
                }}</span>
              </button>
            </div>

            <p v-if="food?.description" class="text-lg leading-snug">
              {{
                mobileDescExpanded
                  ? food.description
                  : food.description.slice(0, 300) + '...'
              }}
              <span class="text-gray-500 text-sm cursor-pointer" @click="mobileDescExpanded = !mobileDescExpanded">
                {{ mobileDescExpanded ? 'Show less' : 'Show more' }}
              </span>
            </p>
            <div v-else class="flex items-center h-full gap-2 text-gray-400">
              <IconInfo class="w-5 h-5" />
              <p>No description yet</p>
            </div>
          </div>
        </div>
        <div class="order-2 xl:order-none">
          <NutritionOverviewCard mode="info" :nutrition="food" :portion-multiplier="portionMultiplier"
            :dropdown-choices="dropdownChoices" v-model:selected-unit="selectedUnit"
            @view-full-nutrition="contextMode = 'nutrition'; contextModalOpen = true" />
        </div>
        <div class="order-3 xl:order-none" v-if="qualityCards.length">
          <NutritionQualityCards :cards="qualityCards" mode="info" @view-overall-report="openHealthReport" />
          <div class="flex gap-2 flex-wrap mt-2 px-1">
            <div v-for="pill in dietaryPills" :key="pill.text"
              class="flex items-center gap-1.5 rounded-4xl px-2 py-1 text-xs  text-slate-500">
              <IconCheck v-if="pill.active" class="w-3" />
              <IconX v-else class="w-3" />
              <span>{{ pill.text }}</span>
            </div>
            <div class="flex items-center gap-1.5 rounded-4xl px-2 py-1 text-xs  text-slate-500 ml-auto">
              <IconDollarSign class="w-3" />
              <span>~{{ formatMoney(food?.price ?? 0) }}/100g</span>
            </div>
            <div class="flex items-center gap-1.5 rounded-4xl px-2 py-1 text-xs  text-slate-500">
              <IconWeight class="w-3" />
              <span>{{ food?.density.toFixed(1) ?? 0 }}g/ml</span>
            </div>
          </div>
        </div>
      </div>
      <div class="contents xl:flex xl:flex-col gap-6 lg:basis-1/3">
        <!-- Healthy Swaps Card -->
        <div class="space-y-2 order-4 xl:order-none bg-primary-10/40 rounded-4xl p-4"
          v-if="(food as any)?.suggested_swaps && (food as any).suggested_swaps.length > 0">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Healthy Swaps
          </h2>
          <div class="flex flex-col gap-2 order-4 2xl:order-none">
            <div class="flex gap-4 justify-between items-center cursor-pointer bg-primary-10 rounded-3xl p-2"
              v-for="swap in (food as any)?.suggested_swaps" @click="navigateTo(getFoodUrl(swap.id, swap.name))"
              :key="swap.id">
              <div class="flex gap-3 items-center">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  :class="gradeColors[getGrade(swap.hidx, 'ovr')]">
                  <span class="text-2xl font-bold leading-none">{{
                    getGrade(swap.hidx, 'ovr')
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <p class="text-lg font-bold leading-none line-clamp-3">
                    {{ swap.name }}
                  </p>
                  <span class="text-sm text-gray-500 leading-none flex items-center gap-1">
                    <IconChevronsUp class="w-4" />
                    <span>{{ getSwapReason(swap) }}</span>
                  </span>
                </div>
              </div>
              <IconArrowLeftRight class="w-5 mr-2 shrink-0" />
            </div>
          </div>
        </div>

        <!-- Found in Card -->
        <div class="space-y-2 order-5 xl:order-none bg-primary-10/40 rounded-4xl p-4" v-if="containedInRecipes?.length">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Found in
          </h2>
          <div class="flex flex-col order-5 2xl:order-none gap-2">
            <RecipeCardHorizontal v-for="recipe in containedInRecipes" :key="recipe.id" :recipe="recipe"
              class="text-[22px] lg:text-[30px]" />
          </div>
        </div>
      </div>
    </div>
    <BlocksResponsiveInfo v-model="contextModalOpen" sidePanelClass="w-120">
      <div v-if="contextMode === 'nutrition'" class="m-4">
        <h2 class="text-4xl font-bold tracking-tighter mb-8">Full Nutrition</h2>
        <FoodNutritionFacts :computable="food" />
        <FoodFullNutritionFacts :food="food" class="mt-10" />
      </div>
      <PagesReport v-if="contextMode === 'health' && id" :id="id" :isFood="true" class="" />
    </BlocksResponsiveInfo>
  </div>
</template>

<script setup lang="ts">
import { getGrade, gradeColors } from '~/utils/constants/grades';
import capitalize from '~/utils/format/capitalize';
import type { Food } from '~/types/types';
import { getDailyQualityCards } from '~/utils/nutrition/getDailyQualityCards';

const route = useRoute();
const paramValue = route.params.id as string;
const id = paramValue.split('-')[0];
const supabase = useSupabaseClient<Database>();

const selectedUnit = ref({ value: 100, displayName: '100g' });
const mobileDescExpanded = ref(false);
const contextModalOpen = ref(false);
const contextMode = ref<'nutrition' | 'health'>('nutrition');

const openHealthReport = () => {
  contextMode.value = 'health';
  contextModalOpen.value = true;
};

const dropdownChoices = computed(() => {
  const choices = [{ value: 100, displayName: '100g' }];
  for (const [unit, weight] of Object.entries(
    food.value?.countable_units ?? {}
  )) {
    if (unit === '') {
      choices.push({
        value: Number(weight),
        displayName: '1 ' + capitalize(foodName.value) + ' (' + weight + 'g)',
      });
    } else {
      choices.push({
        value: Number(weight),
        displayName: capitalize(unit) + ' (' + weight + 'g)',
      });
    }
  }
  return choices;
});

const { data: foodData } = await useAsyncData(
  `food-details-${id}`,
  () => getFoodName(supabase, { eq: { id: Number(id) } }),
  {
    lazy: import.meta.client,
  }
);

const foodName = computed(() => foodData.value?.name || '');
const food = computed(() => foodData.value?.food);

// Get the swap reason by comparing scores
function getSwapReason(swap: NonNullable<Food['suggested_swaps']>[0]): string {
  if (!food.value) return '';

  const categories = [
    { key: 'fiber_score', label: 'More Fiber' },
    { key: 'protein_score', label: 'More Protein' },
    { key: 'fat_profile_score', label: 'Better Fats' },
    { key: 'salt_score', label: 'Less Salt' },
    { key: 'sugar_score', label: 'Less Sugar' },
    { key: 'satiety', label: 'Less Calories' },
    { key: 'mnidx', label: 'More Nutrients' },
    { key: 'protective_score', label: 'More Antioxidants' },
  ] as const;

  let maxDiff = -Infinity;
  let bestCategory = '';

  for (const category of categories) {
    const currentValue = (food.value as any)[category.key] ?? 0;
    const swapValue = swap[category.key] ?? 0;
    const diff = swapValue - currentValue;

    if (diff > maxDiff && diff > 5) {
      maxDiff = diff;
      bestCategory = category.label;
    }
  }

  return bestCategory || 'Healthier Overall';
}

const portionMultiplier = computed(() => {
  return selectedUnit.value.value / 100;
});

const novaLabels: Record<number, string> = {
  1: 'Unprocessed',
  2: 'Minimally processed',
  3: 'Processed',
  4: 'Ultra-processed',
};

const novaPillClass: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-orange-100 text-orange-700',
  4: 'bg-red-100 text-red-700',
};

const qualityCards = computed(() => {
  if (!food.value) return [];
  const cards = getDailyQualityCards(food.value.report, {
    totalFat: food.value.fat,
    protectiveScore: food.value.protective_score,
  }).map((c) => ({ ...c, clickable: false }));
  const wholeIdx = cards.findIndex((c) => c.title === 'Whole Food %');
  if (wholeIdx >= 0) {
    const nova = food.value.nova as number | undefined;
    cards[wholeIdx] = {
      ...cards[wholeIdx]!,
      title: 'Processing',
      rating: nova ? (novaLabels[nova] ?? '–') : '–',
      pillClass: nova ? (novaPillClass[nova] ?? 'bg-secondary') : 'bg-secondary',
      subtitle: nova ? `NOVA ${nova}` : '',
    };
  }
  return cards;
});

const dietaryPillKeys = ['vegan', 'vegetarian', 'gluten_free', 'lactose_free'] as const;

const dietaryPills = computed(() => {
  if (!food.value) return [];
  return dietaryPillKeys.map((key) => {
    const label = capitalize(key.replace('_', ' '));
    const active = (food.value as any)[key] as boolean | null;
    return { text: active ? label : `Not ${label}`, active };
  });
});

// Load recipes containing this food - non-blocking
const { data: containedInRecipes } = useAsyncData(
  `recipes-containing-${id}`,
  () => getRecipesContaining(supabase, [Number(id)])
);

// Redirect from non-slugified URL to slugified URL
watchEffect(() => {
  if (foodName.value && !paramValue.includes('-')) {
    navigateTo(getFoodUrl(Number(id), foodName.value), { replace: true });
  }
});

// SEO meta data - computed for reactive updates
const healthGrade = computed(() =>
  food.value?.hidx ? getGrade(food.value.hidx, 'ovr') : null
);

const description = computed(
  () =>
    `${foodName.value} nutrition facts: ${food.value?.kcal} kcal/100g, Nutrition Quality: ${healthGrade.value}. Discover in-depth nutritional analyis and healthy alternatives.`
);

const foodUrl = computed(
  () => `https://kinome.app${getFoodUrl(Number(id), foodName.value)}`
);

useHead(() => ({
  title: `${foodName.value} - Complete Nutrition Facts & Analysis`,
  meta: [
    {
      name: 'description',
      content: description.value.slice(0, 160),
    },
    {
      property: 'og:title',
      content: `${foodName.value} - Complete Nutrition Facts & Analysis`,
    },
    {
      property: 'og:description',
      content: description.value.slice(0, 200),
    },
    {
      property: 'og:type',
      content: 'article',
    },
    {
      property: 'og:url',
      content: foodUrl.value,
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: foodUrl.value,
    },
  ],
}));
</script>
