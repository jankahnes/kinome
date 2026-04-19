<template>
  <div class="mt-4 mb-20 md:mb-10 mx-2 lg:px-14 flex justify-center">
    <div class="max-w-[1360px]" v-if="food">
      <p class="text-xs font-mono uppercase m-4 leading-tight tracking-wider">
        <NuxtLink to="/" class="text-gray-500">Home</NuxtLink> ›
        <NuxtLink to="/foods" class="text-gray-500">Foods</NuxtLink> ›
        <span class="text-primary font-headers">{{ foodName }}</span>
      </p>
      <div class="flex flex-col 2xl:flex-row gap-10">
        <div class="contents xl:flex flex-col gap-6 lg:flex-1">
          <div
            class="bg-primary-5 main-card-rounded main-card-padding flex gap-6 flex-col xl:flex-row order-1 xl:order-0 xl:items-start">
            <div class="relative xl:basis-1/5 h-40">
              <img class="object-cover main-card-rounded h-full" src="/wood.png" :alt="foodName" />

              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-5/80 h-[70%] aspect-square flex items-center justify-center">
                <img :src="`/foods/${food?.visual_category ?? 'herb_fresh'}.webp`" class="h-[50%] object-contain"
                  :alt="(food?.visual_category ?? 'herb_fresh') + ' illustration'" />
              </div>
            </div>
            <div class="flex-1 flex flex-col gap-2">
              <div class="flex justify-between items-end">
                <div class="flex flex-col">
                  <h1 class="text-5xl font-headers tracking-tight leading-tighter">{{ foodName }}</h1>
                  <p class="text-[11px] text-gray-400 uppercase font-mono ml-1 mt-1">
                    {{ food?.aisle ?? 'Food' }}
                  </p>
                </div>
                <div class="flex flex-col items-end text-end gap-0.5">
                  <GradeContainer :score="food?.hidx" type="ovr" class="text-2xl" />
                  <p class="text-[11px] text-gray-400 uppercase font-mono text-nowrap">
                    Health Grade
                  </p>
                </div>
              </div>

              <p v-if="food?.description" class="text-sm text-gray-700">
                <span class="hidden lg:inline">
                  {{
                    descExpanded
                      ? food.description
                      : food.description.slice(0, 300) + '...'
                  }}
                </span>
                <span class="inline lg:hidden">
                  {{
                    descExpanded
                      ? food.description
                      : food.description.slice(0, 160) + '...'
                  }}
                </span>
                <span class="text-gray-500 text-sm cursor-pointer" @click="descExpanded = !descExpanded">
                  {{ descExpanded ? ' Show less' : ' Show more' }}
                </span>
              </p>
              <div v-else class="flex items-center h-full gap-2 text-gray-400">
                <IconInfo class="w-5 h-5" />
                <p>No description yet</p>
              </div>
            </div>
          </div>
          <div class="order-2 xl:order-0">
            <NutritionOverviewCard mode="info" :nutrition="food" :portion-multiplier="portionMultiplier"
              :dropdown-choices="dropdownChoices" v-model:selected-unit="selectedUnit"
              @view-full-nutrition="contextMode = 'nutrition'; contextModalOpen = true" />
          </div>
          <div class="order-3 xl:order-0" v-if="qualityCards.length">
            <div class="flex flex-col">
              <div class="flex justify-between items-center mb-3 mx-2">
                <h3 class="text-4xl font-headers tracking-tighter">Nutrition Quality</h3>
                <button @click="openHealthReport"
                  class="flex items-center gap-0.5 main-button animated-button text-sm p-2 main-card hover:bg-white!">
                  <span class="hidden sm:inline">Full Analysis</span>
                  <IconChevronRight class="w-5" />
                </button>
              </div>
              <NutritionQualityCards :cards="qualityCards" :gut-health="food?.report?.details?.gutHealth"
                :fat-profile="food?.report?.details?.fatProfile"
                :fat-profile-readable="food?.report?.humanReadable?.fatProfile ?? []"
                :micronutrients="food?.report?.details?.micronutrients" :kcal-progress="food?.kcal / 2000"
                mode="info" />
            </div>
            <div class="flex flex-col sm:flex-row gap-2 gap-y-0 mt-2 px-6 justify-between">
              <div class="flex flex-wrap gap-3 gap-y-0">
                <div v-for="pill in dietaryPills" :key="pill.text"
                  class="flex items-center gap-1.5 main-card-rounded text-xs  text-slate-500">
                  <IconCheck v-if="pill.active" class="w-3" />
                  <IconX v-else class="w-3" />
                  <span>{{ pill.text }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <div class="flex items-center gap-1.5 main-card-rounded px-2 py-1 text-xs  text-slate-500">
                  <IconDollarSign class="w-3" />
                  <span>~{{ formatMoney(food?.price ?? 0) }}/100g</span>
                </div>
                <div class="flex items-center gap-1.5 main-card-rounded px-2 py-1 text-xs  text-slate-500">
                  <IconWeight class="w-3" />
                  <span>{{ food?.density.toFixed(1) ?? 0 }}g/ml</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="contents xl:flex xl:flex-col gap-6 lg:basis-1/3">
          <!-- Healthy Swaps Card -->
          <div class="space-y-2 order-5 xl:order-0"
            v-if="(food as any)?.suggested_swaps && (food as any).suggested_swaps.length > 0">
            <h2 class="text-4xl font-headers tracking-tighter ml-2 mb-2">
              Healthy Swaps
            </h2>
            <div class="flex flex-col gap-2 order-4 2xl:order-0">
              <div class="flex gap-4 justify-between items-center cursor-pointer main-card rounded-3xl px-4 py-3"
                v-for="swap in (food as any)?.suggested_swaps" @click="navigateTo(getFoodUrl(swap.id, swap.name))"
                :key="swap.id">
                <div class="flex gap-3 items-center">
                  <GradeContainer :score="swap.hidx" type="ovr" class="text-xl shrink-0" />
                  <div class="flex flex-col">
                    <p class="text-lg font-headers line-clamp-3 leading-tight">
                      {{ swap.name }}
                    </p>
                    <span class="text-sm text-gray-500 leading-none flex items-center gap-1 -mt-1">
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
          <div class="space-y-2 order-6 xl:order-0" v-if="containedInRecipes?.length">
            <h2 class="text-4xl font-headers tracking-tighter ml-2 mb-2">
              Found in
            </h2>
            <div class="flex flex-col order-5 2xl:order-0 gap-2">
              <RecipeCardHorizontal v-for="recipe in containedInRecipes" :key="recipe.id" :recipe="recipe"
                class="text-[22px] lg:text-[30px]" />
            </div>
          </div>
          <!-- FAQ Card -->
          <div class="space-y-2 order-7 xl:order-0" v-if="faqItems.length">
            <h2 class="text-4xl font-headers tracking-tighter ml-2 mb-3">FAQ</h2>
            <div class="space-y-2 ml-2">
              <details v-for="item in faqItems" :key="item.question" class="group">
                <summary
                  class="cursor-pointer font-semibold text-sm list-none flex justify-between items-center gap-2 py-1">
                  {{ item.question }}
                  <IconChevronDown class="w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p class="text-sm text-gray-500 mt-1 pb-2 leading-snug">{{ item.answer }}</p>
              </details>
            </div>
          </div>
        </div>
      </div>
      <BlocksResponsiveInfo v-model="contextModalOpen" sidePanelClass="w-120">
        <div v-if="contextMode === 'nutrition'" class="m-4">
          <h2 class="text-3xl font-headers tracking-tighter mb-8">Full Nutrition</h2>
          <FoodNutritionFacts :computable="food" :portion-multiplier="portionMultiplier" subtitle="per 100g" />
          <FoodFullNutritionFacts :food="food" :portion-multiplier="portionMultiplier" class="mt-10" />
        </div>
        <PagesReport v-if="contextMode === 'health' && id" :id="id" :isFood="true" class="m-4" :showTitle="true" />
      </BlocksResponsiveInfo>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getGrade } from '~/utils/constants/grades';
import capitalize from '~/utils/format/capitalize';
import type { Food } from '~/types/types';
import { getDailyQualityCards } from '~/utils/nutrition/getDailyQualityCards';
import pluralize from 'pluralize';

const route = useRoute();
const paramValue = route.params.id as string;
const id = paramValue.split('-')[0];
const supabase = useSupabaseClient<Database>();

const selectedUnit = ref({ value: 100, displayName: '100g' });
const descExpanded = ref(false);
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
  });
  const wholeIdx = cards.findIndex((c) => c.title === 'Whole Food %');
  if (wholeIdx >= 0) {
    const nova = food.value.nova as number | undefined;
    cards[wholeIdx] = {
      ...cards[wholeIdx]!,
      title: 'Processing',
      rating: nova ? (novaLabels[nova] ?? '–') : '–',
      pillClass: nova ? (novaPillClass[nova] ?? 'bg-primary/8') : 'bg-primary/8',
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

const description = computed(() => {
  const f = food.value;
  if (!f) return `${foodName.value}: calories, protein, carbs and fat per 100g.`;

  const grade = healthGrade.value;
  const gradeText = grade && (grade.startsWith('A') || grade.startsWith('B') || grade.startsWith('C') || grade.startsWith('S')) ? ` Health Grade: ${grade}.` : '';

  return `100g of ${foodName.value} contains ${f.kcal} kcal, ${f.protein}g protein, ${f.carbohydrates}g carbs and ${f.fat}g fat.${gradeText} See the full macro & micronutrient breakdown.`;
});

const foodUrl = computed(
  () => `https://kinome.app${getFoodUrl(Number(id), foodName.value)}`
);

function getFoodHealthHighlight(f: FullFoodRow, isPlural: boolean): string {
  const report = f.report as any;

  const candidates = [
    { key: 'mnidx', score: f.mnidx ?? 0 },
    { key: 'protein_score', score: f.protein_score ?? 0 },
    { key: 'fiber_score', score: f.fiber_score ?? 0 },
    { key: 'fat_profile_score', score: f.fat_profile_score ?? 0 },
    { key: 'protective_score', score: f.protective_score ?? 0 },
    { key: 'satiety', score: f.satiety ?? 0 },
  ].filter(c => c.score > 60)
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top) return '';

  switch (top.key) {
    case 'mnidx': {
      const micros = (report?.details?.micronutrients ?? []) as { displayName: string; rdaPerServing: number }[];
      const top2 = [...micros].sort((a, b) => b.rdaPerServing - a.rdaPerServing).slice(0, 2);
      if (top2.length >= 2) return `${isPlural ? 'They are' : 'It is'} an excellent source of ${top2[0]!.displayName} and ${top2[1]!.displayName}.`;
      if (top2.length === 1) return `${isPlural ? 'They are' : 'It is'} an excellent source of ${top2[0]!.displayName}.`;
      return 'It is rich in essential micronutrients.';
    }
    case 'protein_score':
      return `${isPlural ? 'They are' : 'It is'} high in protein with ${f.protein}g per 100g.`;
    case 'fiber_score':
      return `${isPlural ? 'They are' : 'It is'} a great source of dietary fiber (${f.fiber}g per 100g).`;
    case 'fat_profile_score': {
      const fp = report?.details?.fatProfile as Record<string, number> | undefined;
      if (fp) {
        const best = [
          { key: 'o3Score', label: 'rich in omega-3 fatty acids' },
          { key: 'mufaScore', label: 'rich in healthy unsaturated fats' },
          { key: 'satFatScore', label: 'low in saturated fat' },
        ].reduce((a, b) => (fp[b.key] ?? 0) > (fp[a.key] ?? 0) ? b : a);
        return `${isPlural ? 'They have' : 'It has'} an excellent fat profile — ${best.label}.`;
      }
      return `${isPlural ? 'They have' : 'It has'} an excellent fat quality profile.`;
    }
    case 'protective_score': {
      const cp = report?.details?.protectiveCompounds as Record<string, number> | undefined;
      const best = [
        { key: 'polyphenolsPer2000kcal', label: 'polyphenols' },
        { key: 'carotenoidsPer2000kcal', label: 'carotenoids' },
        { key: 'glucosinolatesPer2000kcal', label: 'glucosinolates' },
      ].filter(c => (cp?.[c.key] ?? 0) > 0)
        .sort((a, b) => (cp?.[b.key] ?? 0) - (cp?.[a.key] ?? 0))[0];
      return best ? `${isPlural ? 'They are' : 'It is'} rich in ${best.label}.` : `${isPlural ? 'They are' : 'It is'} rich in protective compounds.`;
    }
    case 'satiety':
      return `${isPlural ? 'They are' : 'It is'} high in satiety, helping you stay full for longer.`;
    default:
      return '';
  }
}

const schemaScripts = computed(() => {
  const f = food.value;
  if (!f) return [];

  const scripts: { type: string; children: string }[] = [];

  scripts.push({
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: foodName.value,
      description: description.value,
      url: foodUrl.value,
      nutrition: {
        '@type': 'NutritionInformation',
        servingSize: '100g',
        calories: `${f.kcal} kcal`,
        proteinContent: `${f.protein}g`,
        carbohydrateContent: `${f.carbohydrates}g`,
        fatContent: `${f.fat}g`,
        saturatedFatContent: `${f.saturated_fat}g`,
        fiberContent: `${f.fiber}g`,
        sugarContent: `${f.sugar}g`,
        ...(f.trans_fats_mg != null && { transFatContent: `${(f.trans_fats_mg / 1000).toFixed(2)}g` }),
        ...(f.salt != null && { sodiumContent: `${Math.round((f.salt / 2.5) * 1000)}mg` }),
      },
    }),
  });

  if (faqItems.value.length > 0) {
    scripts.push({
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.value.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }),
    });
  }

  return scripts;
});

const faqItems = computed<{ question: string; answer: string }[]>(() => {
  const f = food.value;
  if (!f) return [];

  const name = foodName.value;
  const isPlural = pluralize.isPlural(name);
  const isOrAre = isPlural ? 'are' : 'is';
  const IsOrAre = isOrAre === 'are' ? 'Are' : 'Is';
  const items: { question: string; answer: string }[] = [];
  const grade = healthGrade.value;

  if (grade) {
    const highlight = getFoodHealthHighlight(f, isPlural);
    let answer: string;
    if (grade.startsWith('S')) {
      answer = `Yes, ${name} ${isOrAre} exceptionally healthy, earning an S Health Grade — among the highest possible. ${highlight}`;
    } else if (grade.startsWith('A')) {
      answer = `Yes, ${name} ${isOrAre} very healthy with a Health Grade of ${grade}. ${highlight}`;
    } else if (grade.startsWith('B')) {
      answer = `Yes, ${name} ${isOrAre} considered healthy with a Health Grade of ${grade}. ${highlight}`;
    } else if (grade.startsWith('C')) {
      answer = `${name} ${isOrAre} rated moderate (Health Grade ${grade}) per 100g and can be part of a balanced diet.`;
    } else {
      answer = `${name} ${isOrAre} rated ${grade} on overall nutritional quality. Best consumed in moderation alongside nutrient-dense foods.`;
    }
    items.push({ question: `${IsOrAre} ${name} healthy?`, answer: answer.trim() });
  }

  items.push({
    question: `What are the macros in ${name}?`,
    answer: `100g of ${name} ${isPlural ? 'contain' : 'contains'} ${f.kcal} kcal, ${f.protein}g protein, ${f.carbohydrates}g carbohydrates and ${f.fat}g fat (of which ${f.saturated_fat}g saturated), and ${f.fiber}g fiber.`,
  });

  const nova = f.nova as number | undefined;
  if (nova) {
    items.push({
      question: `What NOVA processing level ${isOrAre} ${name}?`,
      answer: `${name} ${isOrAre} NOVA ${nova} - ${novaLabels[nova]}.`.trim(),
    });
  }

  if (f.vegan) {
    items.push({ question: `${IsOrAre} ${name} vegan?`, answer: `Yes, ${name} ${isOrAre} vegan.` });
  } else if (f.vegetarian) {
    items.push({ question: `${IsOrAre} ${name} vegetarian?`, answer: `Yes, ${name} ${isOrAre} vegetarian but not vegan.` });
  }

  if (f.gluten_free) {
    items.push({ question: `${IsOrAre} ${name} gluten free?`, answer: `Yes, ${name} ${isOrAre} gluten free.` });
  }

  return items;
});


defineOgImage('Food.takumi', {
  name: foodName,
  aisle: computed(() => food.value?.aisle ?? 'Food'),
  illustration: computed(() =>
    `https://kinome.app/foods/${food.value?.visual_category ?? 'herb_fresh'}.webp`
  ),
  grade: healthGrade,
  kcal: computed(() => food.value?.kcal ?? 0),
  protein: computed(() => food.value?.protein ?? 0),
  carbs: computed(() => food.value?.carbohydrates ?? 0),
  fat: computed(() => food.value?.fat ?? 0),
  fiber: computed(() => food.value?.fiber ?? 0),
})

useHead(() => ({
  title: `${foodName.value} - Complete Nutrition Facts & Analysis`,
  script: schemaScripts.value,
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
