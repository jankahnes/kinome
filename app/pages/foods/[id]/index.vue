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
              src="/wood-2.webp"
              :alt="foodName"
            />

            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 w-[45%] aspect-square flex items-center justify-center"
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

            <p v-if="food?.description" class="text-lg leading-snug">
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
        <div class="space-y-2 order-2 xl:order-none" v-if="food">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Nutrition Highlights
          </h2>
          <NutritionHighlightGrid :nutrition-data="food" type="highlights" />
        </div>
        <div class="space-y-2 order-3 xl:order-none">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Nutrition Overview
          </h2>
          <div class="space-y-6 main-card p-6 order-2 2xl:order-none max-w-250">
            <div class="flex gap-4 flex-col xl:flex-row">
              <div class="flex flex-1 flex-col gap-6 justify-between">
                <div class="relative self-start flex flex-col">
                  <p class="text-lg">Portion Size</p>
                  <FormsDropdown
                    :choices="dropdownChoices"
                    v-model="selectedUnit"
                    class="min-w-60"
                    :style="'bg-slate-100'"
                  />
                </div>
                <NutritionMacroCard
                  :kcal="scaledFood?.kcal ?? 0"
                  :carbohydrates="scaledFood?.carbohydrates ?? 0"
                  :protein="scaledFood?.protein ?? 0"
                  :fat="scaledFood?.fat ?? 0"
                />
                <div class="flex flex-col gap-2">
                  <div class="flex flex-wrap gap-2">
                    <button
                      class="animated-button bg-slate-100 rounded-4xl px-4 py-1 flex items-center gap-2"
                    >
                      <IconShoppingBag class="w-5" />
                      <span>Shopping List</span>
                    </button>
                    <button
                      class="animated-button bg-slate-100 rounded-4xl px-4 py-1 flex items-center gap-2"
                    >
                      <IconChartLine class="w-5" />
                      <span>Track for today</span>
                    </button>
                  </div>
                  <div class="flex gap-2 flex-wrap">
                    <button
                      class="animated-button bg-slate-200 rounded-4xl px-2 md:px-4 py-1 flex items-center gap-2"
                      @click="
                        contextMode = 'nutrition';
                        contextModalOpen = true;
                      "
                    >
                      <IconTag class="w-5" />
                      <span>View Full Nutrition</span>
                    </button>
                    <button
                      class="animated-button bg-slate-200 rounded-4xl px-2 md:px-4 py-1 flex items-center gap-2"
                      @click="
                        contextMode = 'health';
                        contextModalOpen = true;
                      "
                    >
                      <IconApple class="w-5" />
                      <span>View Full Analysis</span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="w-px bg-gray-200 mx-6 hidden xl:block"></div>
              <div class="flex flex-1 mt-4">
                <FoodNutritionFacts
                  :computable="food"
                  :portionMultiplier="portionMultiplier"
                  :referencingName="refencingName"
                  class="flex-1"
                />
              </div>
            </div>
            <div class="h-px bg-gray-200 w-full"></div>
            <div
              class="flex gap-6 justify-between items-center flex-wrap text-sm"
            >
              <div class="flex gap-2 flex-wrap">
                <div
                  v-for="pill in bottomMetaPillsGeneric"
                  :key="pill.text"
                  :class="pill.class"
                  class="flex items-center gap-2 rounded-4xl px-2 py-1"
                >
                  <Icon :name="pill.icon" :size="20" />
                  <span>{{ pill.text }}</span>
                </div>
              </div>
              <div class="flex gap-2 flex-wrap">
                <div
                  v-for="pill in bottomMetaPillsSpecific"
                  :key="pill.text"
                  :class="pill.class"
                  class="flex items-center gap-2 rounded-4xl px-2 py-1"
                >
                  <Icon :name="pill.icon" :size="20" />
                  <span>{{ pill.text }}</span>
                </div>
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
                  <p class="text-lg font-bold leading-none line-clamp-3">
                    {{ swap.name }}
                  </p>
                  <span
                    class="text-sm text-gray-500 leading-none flex items-center gap-1"
                  >
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
        <div
          class="space-y-2 order-5 xl:order-none"
          v-if="containedInRecipes?.length"
        >
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Found in
          </h2>
          <div class="flex flex-col order-5 2xl:order-none gap-2">
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
    <BlocksResponsiveInfo
      v-model="contextModalOpen"
      :sidePanelClass="`w-${contextMode === 'health' ? '150' : '120'}`"
    >
      <div v-if="contextMode === 'nutrition'" class="m-4">
        <h2 class="text-4xl font-bold tracking-tighter mb-8">Full Nutrition</h2>
        <FoodNutritionFacts :computable="food" />
        <FoodFullNutritionFacts :food="food" class="mt-10" />
      </div>
      <PagesReport
        v-if="contextMode === 'health' && id"
        :id="id"
        :isFood="true"
        class=""
      />
    </BlocksResponsiveInfo>
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

const selectedUnit = ref({ value: 100, displayName: '100g' });
const mobileDescExpanded = ref(false);

const contextModalOpen = ref(false);
const contextMode = ref<'nutrition' | 'health'>('nutrition');

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
const isPrimary = computed(() => foodData.value?.is_primary ?? false);
const food = computed(() => foodData.value?.food);

const servingPillsExpanded = ref(true);

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
      class: food.value[generic] ? 'bg-green-100' : 'bg-red-100',
      icon: food.value[generic] ? 'check' : 'x',
    });
  }
  return pills;
});

const bottomMetaPillsSpecific = computed(() => {
  if (!food.value) return [];
  const pills = [];
  pills.push({
    text: `NOVA ${food.value.nova}`,
    class: 'bg-slate-100',
    icon: 'factory',
  });
  pills.push({
    text: `~${formatMoney(food.value.price)}/100g`,
    class: 'bg-slate-100',
    icon: 'banknote',
  });
  pills.push({
    text: `${food.value.density}g/ml`,
    class: 'bg-slate-100',
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
