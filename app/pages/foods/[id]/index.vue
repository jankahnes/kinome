<template>
  <div class="mb-20 m-4 lg:m-10 lg:ml-16" v-if="food">
    <p class="text-lg m-4">
      <NuxtLink to="/" class="text-gray-500">Home</NuxtLink> >
      <NuxtLink to="/foods" class="text-gray-500">Foods</NuxtLink> >
      <span class="font-bold">{{ foodName }}</span>
    </p>
    <div class="flex flex-col 2xl:flex-row gap-6">
      <div class="contents xl:flex flex-col gap-6 lg:flex-1">
        <div
          class="main-card p-4 xl:pr-10 flex gap-4 xl:gap-8 flex-col xl:flex-row order-1 xl:order-none"
        >
          <div class="relative xl:basis-1/3">
            <img
              class="w-full h-full object-cover rounded-4xl"
              src="/blurred-backdrop.webp"
              :alt="foodName"
            />

            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white w-[45%] aspect-square flex items-center justify-center"
            >
              <img
                :src="`/foods/${food?.visual_category ?? 'herb_fresh'}.webp`"
                class="h-[60%] object-contain"
                :alt="(food?.visual_category ?? 'herb_fresh') + ' illustration'"
              />
            </div>
          </div>
          <div class="flex-1 flex flex-col my-4 gap-4">
            <div class="flex justify-between items-start">
              <div class="">
                <h1 class="text-5xl font-bold">{{ foodName }}</h1>
                <p class="text-xs text-gray-400">
                  {{ food?.aisle?.toUpperCase() || 'Food' }}
                </p>
              </div>
              <div
                class="flex justify-center items-center w-15 h-15 rounded-2xl p-2"
                :class="gradeColors[getGrade(food?.hidx, 'ovr')]"
              >
                <span class="text-3xl font-bold leading-none">{{
                  getGrade(food?.hidx, 'ovr')
                }}</span>
              </div>
            </div>

            <p
              v-if="food?.description"
              class="text-lg hidden 2xl:block leading-normal"
            >
              {{ food.description }}
            </p>
            <p
              v-if="food?.description"
              class="text-lg block 2xl:hidden leading-snug"
            >
              {{
                mobileDescExpanded
                  ? food.description
                  : food.description.slice(0, 300) + '...'
              }}
              <span
                class="text-gray-500 text-sm cursor-pointer"
                @click="mobileDescExpanded = !mobileDescExpanded"
              >
                {{ mobileDescExpanded ? 'Show less' : 'Show more' }}
              </span>
            </p>
            <div v-else class="flex items-center h-full gap-2 text-gray-400">
              <IconInfo class="w-5 h-5" />
              <p>No description yet</p>
            </div>
          </div>
        </div>
        <div
          class="space-y-2 order-2 xl:order-none"
          v-if="nutritionHighlights.length > 0"
        >
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Nutrition Highlights
          </h2>
          <div class="flex flex-wrap gap-2 md:gap-4">
            <div
              v-for="highlight in nutritionHighlights"
              :key="highlight.title"
              class="bg-primary-10 flex flex-col p-2 md:p-4 rounded-4xl items-center flex-1 basis-auto sm:basis-1/4"
            >
              <NuxtImg
                :src="`/nutrition-highlights/${highlight.illustration}`"
                :alt="highlight.title"
                class="w-14 h-14 object-contain"
              />
              <span
                class="text-lg font-bold tracking-tighter leading-none mt-1"
                >{{ highlight.title }}</span
              >
              <span
                class="text-sm text-gray-600 text-center px-2"
                v-if="highlight.subtitle"
              >
                {{ highlight.subtitle }}
              </span>
              <div
                class="px-3 py-0.5 rounded-full text-sm font-semibold mt-2"
                :class="highlight.background"
              >
                {{ highlight.rating }}
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-2 order-3 xl:order-none">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Nutrition Overview
          </h2>
          <div class="space-y-2 main-card p-6 order-2 2xl:order-none">
            <div class="flex flex-col lg:flex-row gap-8">
              <div class="flex flex-col flex-1 justify-between">
                <div class="flex flex-col">
                  <div class="flex gap-2 justify-between">
                    <div class="flex flex-col flex-1 gap-1">
                      <div class="flex justify-between">
                        <span class="text-8xl font-bold leading-14">
                          <RollingNumber
                            :number="scaledFood?.kcal ?? 0"
                            class="inline-block"
                            :refDist="35"
                          />
                          <span class="text-xl text-gray-500">kcal</span>
                        </span>
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
                            {
                              value: macroRingPercentages?.fatPercent ?? 0,
                              color: 'stroke-fat',
                            },
                          ]"
                          :strokeWidth="16"
                        />
                      </div>
                      <div class="items-center gap-2 hidden lg:flex">
                        <div class="bg-carbs px-2 py-1 rounded-4xl">
                          <RollingNumber
                            :number="scaledFood?.carbohydrates ?? 0"
                            class="inline-block"
                          />
                          <span>g Carbs</span>
                        </div>
                        <div class="bg-protein px-2 py-1 rounded-4xl">
                          <RollingNumber
                            :number="scaledFood?.protein ?? 0"
                            class="inline-block"
                          />
                          <span>g Protein</span>
                        </div>
                        <div class="bg-fat px-2 py-1 rounded-4xl">
                          <RollingNumber
                            :number="scaledFood?.fat ?? 0"
                            class="inline-block"
                          />
                          <span>g Fat</span>
                        </div>
                      </div>
                    </div>
                    <span>
                      <Ring
                        class="hidden lg:block w-24 h-24"
                        :segments="[
                          {
                            value: macroRingPercentages?.carbsPercent ?? 0,
                            color: 'stroke-carbs',
                          },
                          {
                            value: macroRingPercentages?.proteinPercent ?? 0,
                            color: 'stroke-protein',
                          },
                          {
                            value: macroRingPercentages?.fatPercent ?? 0,
                            color: 'stroke-fat',
                          },
                        ]"
                        :strokeWidth="16"
                      />
                    </span>
                  </div>
                  <div
                    class="flex flex-wrap gap-2 mt-6"
                    :class="{
                      'max-h-8.5 overflow-hidden': !servingPillsExpanded,
                    }"
                  >
                    <button
                      class="animated-button border border-primary rounded-4xl px-4 py-1 flex items-center gap-2 bg-primary-10"
                      :class="{
                        'bg-primary! text-white': selectedUnit === '100g',
                      }"
                      @click="selectedUnit = '100g'"
                    >
                      <span>100g</span>
                    </button>
                    <button
                      class="animated-button border border-primary rounded-4xl px-4 py-1 flex items-center gap-2 bg-primary-10"
                      :class="{
                        'bg-primary! text-white': selectedUnit === unit,
                      }"
                      v-for="unit in Object.keys(food?.countable_units ?? {})"
                      :key="unit"
                      @click="selectedUnit = unit"
                    >
                      <span
                        >{{
                          unit ? capitalize(unit) : '1 ' + capitalize(foodName)
                        }}
                        ({{ food?.countable_units?.[unit] ?? 100 }}g)</span
                      >
                    </button>
                  </div>
                  <button
                    class="animated-button ring ring-primary rounded-4xl px-4 py-1 flex items-center gap-2 bg-primary-10 self-start mt-2"
                    @click="servingPillsExpanded = !servingPillsExpanded"
                  >
                    <span>{{
                      servingPillsExpanded ? 'Show less' : 'Show more'
                    }}</span>
                  </button>
                  <div class="flex items-center gap-2 flex-wrap mt-2">
                    <button
                      class="animated-button rounded-4xl px-4 py-1 flex items-center gap-2 bg-slate-100"
                    >
                      <IconPlus class="w-5" />
                      <span>Shopping List</span>
                    </button>
                    <button
                      class="animated-button rounded-4xl px-4 py-1 flex items-center gap-2 bg-slate-100"
                    >
                      <IconChartLine class="w-5" />
                      <span>Track for today</span>
                    </button>
                  </div>
                </div>
                <div class="flex flex-col gap-2 mt-4">
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="pill in bottomMetaPillsGeneric.slice(0, 2)"
                      :key="pill.text"
                      :class="pill.class"
                      class="flex items-center gap-2 rounded-4xl px-4 py-1"
                    >
                      <Icon :name="pill.icon" :size="20" />
                      <span>{{ pill.text }}</span>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="pill in bottomMetaPillsGeneric.slice(2)"
                      :key="pill.text"
                      :class="pill.class"
                      class="flex items-center gap-2 rounded-4xl px-4 py-1"
                    >
                      <Icon :name="pill.icon" :size="20" />
                      <span>{{ pill.text }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <FoodNutritionFacts
                :computable="food"
                :portionMultiplier="portionMultiplier"
                :referencingName="refencingName"
                class="flex-1"
              />
            </div>
            <div class="flex flex-wrap gap-2 mt-2">
              <div
                v-for="pill in bottomMetaPillsSpecific"
                :key="pill.text"
                :class="pill.class"
                class="flex items-center gap-2 rounded-4xl px-4 py-1"
              >
                <Icon :name="pill.icon" :size="20" />
                <span>{{ pill.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="contents xl:flex xl:flex-col gap-6 lg:basis-1/3">
        <!-- Healthy Swaps Card -->
        <div
          class="space-y-2 order-4 xl:order-none"
          v-if="(food as any)?.suggested_swaps && (food as any).suggested_swaps.length > 0"
        >
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Healthy Swaps
          </h2>
          <div class="main-card p-6 flex flex-col gap-2 order-4 2xl:order-none">
            <div
              class="flex gap-4 justify-between items-center cursor-pointer hover:bg-slate-100 rounded-2xl p-1"
              v-for="swap in (food as any)?.suggested_swaps"
              @click="navigateTo(getFoodUrl(swap.id, swap.name))"
              :key="swap.id"
            >
              <div class="flex gap-3 items-center">
                <div
                  class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
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
        </div>

        <!-- Found in Card -->
        <div
          class="space-y-2 order-5 xl:order-none"
          v-if="containedInRecipes?.length"
        >
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Found in
          </h2>
          <div class="main-card p-6 flex flex-col order-5 2xl:order-none gap-2">
            <RecipeCardHorizontal
              v-for="recipe in containedInRecipes"
              :key="recipe.id"
              :recipe="recipe"
              class="text-[22px] lg:text-[30px]"
            />
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
const selectedUnit = ref('100g');
const mobileDescExpanded = ref(false);

const { data: foodData } = await useAsyncData(
  `food-details-${id}`,
  () => getFoodName(supabase, { eq: { id: Number(id) } }),
  {
    lazy: import.meta.client,
  }
);

const foodName = computed(() => foodData.value?.name || '');
const isPrimary = computed(() => foodData.value?.is_primary ?? false);
const food = computed(() => foodData.value?.food);

const servingPillsExpanded = ref(false);

// Get the swap reason by comparing scores
function getSwapReason(swap: NonNullable<Food['suggested_swaps']>[0]): string {
  if (!food.value) return '';

  const categories = [
    { key: 'fiber_score', label: 'More Fiber'},
    { key: 'protein_score', label: 'More Protein'},
    { key: 'fat_profile_score', label: 'Better Fats'},
    { key: 'salt_score', label: 'Less Salt'},
    { key: 'sugar_score', label: 'Less Sugar'},
    { key: 'satiety', label: 'Less Calories'},
    { key: 'mnidx', label: 'More Nutrients'},
    { key: 'protective_score', label: 'More Antioxidants'},
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
  if (selectedUnit.value === '100g') return 1;
  return (food.value?.countable_units?.[selectedUnit.value] ?? 100) / 100;
});

const bottomMetaGenerics: (keyof FullFoodRow)[] = [
  'vegan',
  'vegetarian',
  'gluten_free',
  'lactose_free',
];

const bottomMetaPillsGeneric = computed(() => {
  if (!food.value) return [];
  const pills = [];
  for (const generic of bottomMetaGenerics) {
    const formattedGeneric = capitalize(generic.replace('_', ' '));
    pills.push({
      text: food.value[generic] ? formattedGeneric : `Not ${formattedGeneric}`,
      class: food.value[generic] ? 'bg-green-200' : 'bg-red-200',
      icon: food.value[generic] ? 'check' : 'x',
    });
  }
  return pills;
});

const bottomMetaPillsSpecific = computed(() => {
  if (!food.value) return [];
  const pills = [];
  pills.push({
    text: `NOVA Classification: ${food.value.nova}`,
    class: 'bg-slate-200',
    icon: 'factory',
  });
  pills.push({
    text: `Estimated Price: ${formatMoney(food.value.price)}/100g`,
    class: 'bg-slate-200',
    icon: 'banknote',
  });
  pills.push({
    text: `Density: ${food.value.density} g/ml`,
    class: 'bg-slate-200',
    icon: 'weight',
  });
  return pills;
});

// Load recipes containing this food - non-blocking
const { data: containedInRecipes } = useAsyncData(
  `recipes-containing-${id}`,
  () => getRecipesContaining(supabase, [Number(id)])
);

// Scaled food values for display in overview card
const scaledFood = computed(() => {
  if (!food.value) return null;
  return {
    kcal: food.value.kcal * portionMultiplier.value,
    carbohydrates: food.value.carbohydrates * portionMultiplier.value,
    protein: food.value.protein * portionMultiplier.value,
    fat: food.value.fat * portionMultiplier.value,
  };
});

// Macro percentages for ring display
const macroRingPercentages = computed(() => {
  if (!scaledFood.value) return null;
  const f = scaledFood.value;
  const usedKcal = 4 * f.carbohydrates + 4 * f.protein + 9 * f.fat;
  const percentages = {
    carbsPercent: (f.carbohydrates * 4) / usedKcal,
    proteinPercent: (f.protein * 4) / usedKcal,
    fatPercent: (f.fat * 9) / usedKcal,
  };
  for (const [key, value] of Object.entries(percentages)) {
    if (value > 0) {
      percentages[key as keyof typeof percentages] = value;
    }
  }
  return percentages;
});

const refencingName = computed(() =>
  isPrimary.value ? null : food.value?.primary_name ?? ''
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

const nutritionHighlights = computed(() => {
  return getNutritionHighlightCards(food.value);
});

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
