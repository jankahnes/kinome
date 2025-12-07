<template>
  <div class="m-4 lg:m-10 lg:ml-16">
    <div class="flex flex-col 2xl:flex-row gap-6">
      <div class="flex flex-col gap-6 lg:basis-1/3">
        <div class="action-card p-1 flex flex-col items-center justify-center">
          <div class="relative w-full mb-8">
            <img
              class="w-full h-full object-cover rounded-4xl"
              src="/blurred-backdrop.webp"
              :alt="foodName.name"
            />

            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white h-1/2 aspect-square flex items-center justify-center"
            >
              <img :src="`/foods/${food.visual_category ?? 'herb_fresh'}.webp`" class="h-[60%] object-contain"/>
            </div>
            <div
              class="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-3 translate-y-1/2"
            >
              <div
                class="flex justify-center items-center w-15 h-15 rounded-2xl border-2 border-white p-2"
                :class="gradeColors[getGrade(food?.hidx, 'ovr')]"
              >
                <span class="text-3xl font-bold leading-none">{{
                  getGrade(food?.hidx, 'ovr')
                }}</span>
              </div>
            </div>
          </div>
          <h1 class="text-4xl font-bold">{{ foodName.name }}</h1>
          <p class="text-sm text-gray-500 mb-4">
            {{ food.aisle || 'Grains' }}
          </p>
        </div>
        <div class="action-card p-6 flex flex-col">
          <div class="flex flex-wrap gap-2">
            <button
              class="animated-button ring ring-primary rounded-4xl px-4 py-1 flex items-center gap-2"
              :class="{ 'bg-primary text-white': selectedPortionSize === 100 }"
              @click="selectedPortionSize = 100"
            >
              <span>100g</span>
            </button>
            <button
              class="animated-button ring ring-primary rounded-4xl px-4 py-1 flex items-center gap-2"
              :class="{
                'bg-primary text-white':
                  selectedPortionSize === food.countable_units[unit],
              }"
              v-for="unit in Object.keys(food.countable_units ?? {})"
              :key="unit"
              @click="selectedPortionSize = (food.countable_units as any)[unit]"
            >
              <span
                >{{ unit ? capitalize(unit) : ("1 " + capitalize(foodName.name)) }} ({{
                  (food.countable_units as any)[unit]
                }}g)</span
              >
            </button>
          </div>
          <div class="w-full h-px bg-gray-200 my-6"></div>
          <div class="flex gap-2 justify-between">
            <div class="flex flex-col flex-1 gap-1">
              <div class="flex justify-between">
                <span class="text-8xl font-bold leading-14"
                  >{{ scaledFood?.kcal?.toFixed(0) ?? 0
                  }}<span class="text-xl text-gray-500">kcal</span></span
                >
                <Ring
                  class="block lg:hidden w-14 h-14"
                  :segments="[
                    {
                      value: macroRingPercentages?.carbsPercent ?? 0,
                      color: 'stroke-carbs',
                    },
                    {
                      value: macroRingPercentages?.proteinPercent ?? 0,
                      color: 'stroke-protein',
                    },
                    { value: macroRingPercentages?.fatPercent ?? 0, color: 'stroke-fat' },
                  ]"
                  :strokeWidth="16"
                />
              </div>
              <div class="items-center gap-2 hidden lg:flex">
                <div class="bg-carbs px-2 py-1 rounded-4xl">
                  {{ scaledFood?.carbohydrates?.toFixed(0) ?? 0 }}g Carbs
                </div>
                <div class="bg-protein px-2 py-1 rounded-4xl">
                  {{ scaledFood?.protein?.toFixed(0) ?? 0 }}g Protein
                </div>
                <div class="bg-fat px-2 py-1 rounded-4xl">
                  {{ scaledFood?.fat?.toFixed(0) ?? 0 }}g Fat
                </div>
              </div>
            </div>
            <span>
              <Ring
                class="hidden lg:block w-24 h-24"
                :segments="[
                  { value: macroRingPercentages?.carbsPercent ?? 0, color: 'stroke-carbs' },
                  {
                    value: macroRingPercentages?.proteinPercent ?? 0,
                    color: 'stroke-protein',
                  },
                  { value: macroRingPercentages?.fatPercent ?? 0, color: 'stroke-fat' },
                ]"
                :strokeWidth="16"
              />
            </span>
          </div>
          <div class="flex items-center gap-2 mt-8 flex-wrap">
            <button
              class="animated-button ring ring-primary rounded-4xl px-4 py-1 flex items-center gap-2"
            >
              <IconPlus class="w-5" />
              <span>Shopping List</span>
            </button>
            <button
              class="animated-button ring ring-primary rounded-4xl px-4 py-1 flex items-center gap-2"
            >
              <IconChartLine class="w-5" />
              <span>Track for today</span>
            </button>
          </div>
        </div>
        <div
          class="action-card p-6 flex flex-col gap-2"
          v-if="food.suggested_swaps?.length > 0"
        >
          <h2 class="text-2xl font-bold mb-4">Healthy Swaps</h2>
          <div
            class="flex gap-4 justify-between items-center cursor-pointer hover:bg-slate-100 rounded-2xl p-1"
            v-for="swap in food.suggested_swaps"
            @click="navigateTo(getFoodUrl(swap.id, swap.name))"
            :key="swap.id"
          >
            <div class="flex gap-3 items-center">
              <div
                class="w-12 h-12 rounded-2xl flex items-center justify-center"
                :class="gradeColors[getGrade(swap.hidx, 'ovr')]"
              >
                <span class="text-2xl font-bold leading-none">{{
                  getGrade(swap.hidx, 'ovr')
                }}</span>
              </div>
              <div class="flex flex-col">
                <p class="text-lg font-bold leading-none">{{ swap.name }}</p>
                <span
                  class="text-sm text-gray-500 leading-none flex items-center gap-1"
                >
                  <IconChevronsUp class="w-4" />
                  <span>{{ getSwapReason(swap) }}</span>
                </span>
              </div>
            </div>
            <IconArrowLeftRight class="w-5 mr-2" />
          </div>
        </div>
        <div class="action-card p-6 flex flex-col">
          <h2 class="text-2xl font-bold mb-4">Found in</h2>
          <RecipeCardHorizontal
            v-for="recipe in containedInRecipes"
            :key="recipe.id"
            :recipe="recipe"
            class="text-[22px] lg:text-[30px]"
          />
        </div>
      </div>
      <div class="flex flex-col gap-6 lg:flex-1 my-2">
        <p class="text-lg mx-4">
          <NuxtLink to="/" class="text-gray-500">Home</NuxtLink> >
          <NuxtLink to="/foods" class="text-gray-500">Foods</NuxtLink> >
          <span class="font-bold">{{ foodName.name }}</span>
        </p>
        <div class="action-card p-6 text-xl">
          {{ food.description }}
        </div>
        <div class="action-card p-6 flex flex-col gap-4">
          <!-- Tabs -->
          <div class="flex gap-2 mb-2">
            <button
              class="animated-button ring ring-primary rounded-4xl px-4 py-1"
              :class="{ 'bg-primary': activeTab === 'summary' }"
              @click="activeTab = 'summary'"
            >
              Summary
            </button>
            <button
              class="animated-button ring ring-primary rounded-4xl px-4 py-1"
              :class="{ 'bg-primary': activeTab === 'full-nutrition' }"
              @click="activeTab = 'full-nutrition'"
            >
              Full Nutrition
            </button>
            <button
              class="animated-button ring ring-primary rounded-4xl px-4 py-1"
              :class="{ 'bg-primary': activeTab === 'full-health-analysis' }"
              @click="activeTab = 'full-health-analysis'"
            >
              Full Health Analyis
            </button>
          </div>

          <!-- Summary -->
          <div
            v-show="activeTab === 'summary'"
            class="flex gap-x-4 gap-y-12 flex-col lg:flex-row"
          >
            <!-- Nutrition Facts Component -->
            <FoodNutritionFacts
              :food="food"
              :portionSize="selectedPortionSize"
              :foodName="foodName.name ?? ''"
              :referencingName="refencingName"
            />
            <div class="w-px h-full bg-gray-200 hidden lg:block"></div>
            <!-- Health Summary Component -->
            <FoodHealthSummary :food="food" />
          </div>

          <!-- Full Nutrition -->
          <div v-show="activeTab === 'full-nutrition'"></div>

          <!-- Full Health Analysis -->
          <div v-show="activeTab === 'full-health-analysis'">
            <PagesReport :id="id ?? ''" :isFood="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getGrade, gradeColors } from '~/utils/constants/grades';
import capitalize from '~/utils/format/capitalize';
import type { Food } from '~/types/types';

const route = useRoute();
const paramValue = route.params.id as string;
const id = paramValue.split('-')[0];
const supabase = useSupabaseClient<Database>();

const activeTab = ref('summary');
const selectedPortionSize = ref(100);

// Get the swap reason by comparing scores
function getSwapReason(swap: NonNullable<Food['suggested_swaps']>[0]): string {
  if (!food) return '';

  const categories = [
    { key: 'fiber_score', label: 'More Fiber', reverse: false },
    { key: 'protein_score', label: 'More Protein', reverse: false },
    { key: 'fat_profile_score', label: 'Better Fats', reverse: false },
    { key: 'salt_score', label: 'Less Salt', reverse: true },
    { key: 'sugar_score', label: 'Less Sugar', reverse: true },
    { key: 'satiety', label: 'More Satiating', reverse: false },
    { key: 'mnidx', label: 'More Nutrients', reverse: false },
    { key: 'protective_score', label: 'More Antioxidants', reverse: false },
  ] as const;

  let maxDiff = -Infinity;
  let bestCategory = '';

  for (const category of categories) {
    const currentValue = (food as any)[category.key] ?? 0;
    const swapValue = swap[category.key] ?? 0;
    const diff = category.reverse
      ? currentValue - swapValue
      : swapValue - currentValue;

    if (diff > maxDiff && diff > 5) {
      maxDiff = diff;
      bestCategory = category.label;
    }
  }

  return bestCategory || 'Healthier Overall';
}

const portionMultiplier = computed(() => selectedPortionSize.value / 100);

// Scaled food values for display in overview card
const scaledFood = computed(() => {
  if (!food) return null;
  return {
    kcal: food.kcal * portionMultiplier.value,
    carbohydrates: food.carbohydrates * portionMultiplier.value,
    protein: food.protein * portionMultiplier.value,
    fat: food.fat * portionMultiplier.value,
  };
});

// Macro percentages for ring display
const macroRingPercentages = computed(() => {
  if (!scaledFood.value) return null;
  const f = scaledFood.value;
  return {
    carbsPercent: (f.carbohydrates * 4) / f.kcal,
    proteinPercent: (f.protein * 4) / f.kcal,
    fatPercent: (f.fat * 9) / f.kcal,
  };
});

const containedInRecipes = await getRecipeOverviews(supabase, {
  in: { id: [247, 672, 805] },
});

const foodName = await getFoodName(supabase, { eq: { id: Number(id) } });
const food = foodName.food;

const refencingName = foodName.is_primary ? null : food?.primary_name ?? '';

//redirect from non-slugified URL to slugified URL
if (foodName.name && !paramValue.includes('-')) {
  navigateTo(getFoodUrl(Number(id), foodName.name), { replace: true });
}

const healthGrade = food.hidx ? getGrade(food.hidx, 'ovr') : null;

const description = `${foodName.name} nutrition facts: ${food.kcal} kcal/100g, HealthScore: ${healthGrade}. Discover in-depth nutritional analyis and healthy alternatives.`;
const foodUrl = `https://kinome.app${getFoodUrl(Number(id), foodName.name)}`;

useHead({
  title: `${foodName.name} - Complete Nutrition Facts & Health Analysis | Kinome`,
  meta: [
    {
      name: 'description',
      content: description.slice(0, 160),
    },
    {
      property: 'og:title',
      content: `${foodName.name} Nutrition Facts | Kinome`,
    },
    {
      property: 'og:description',
      content: description.slice(0, 200),
    },
    {
      property: 'og:type',
      content: 'article',
    },
    {
      property: 'og:url',
      content: foodUrl,
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: foodUrl,
    },
  ],
});
</script>
