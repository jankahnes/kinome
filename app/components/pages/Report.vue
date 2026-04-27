<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4 ">
      <Skeleton class="w-full h-80 shadow-sm rounded-2xl" />
      <div class="flex flex-wrap gap-10 items-start w-full">
        <Skeleton v-for="i in 9" :key="i" class="min-w-80 max-w-120 h-80 shadow-sm rounded-2xl flex-1" />
      </div>
    </div>

    <div v-else>
      <div v-if="showTitle">
        <p class="text-[11px] text-gray-400 font-mono uppercase tracking-wider">NUTRITIONAL ANALYSIS</p>
        <h2 class="text-3xl font-headers tracking-tight mb-2">
          {{ title }}
        </h2>
      </div>
      <div class="flex flex-wrap gap-6 " :class="{ 'gap-12 mt-6': showTitle }">
        <!-- Hero Card -->
        <div class="basis-100 flex-1" :class="{ 'rounded-3xl bg-white shadow-xs p-4 ': !showTitle }">

          <div class="flex items-center justify-between mb-4">
            <div class="flex flex-col">
              <h3 class="text-2xl font-headers mb-1">Overview</h3>
              <div class="percentile-badge py-1 px-2" :class="report.percentiles?.hidx?.color"
                v-if="report.percentiles?.hidx">
                <span>{{ report.percentiles.hidx.description }}</span>
              </div>
            </div>
            <GradeContainer :score="report.overall.hidx" :type="'ovr'" class="rounded-lg text-2xl" />
          </div>

          <div class="space-y-3">
            <div v-for="grade of report.humanReadable.overall" :key="grade.description" class="flex gap-3 items-center"
              :class="[grade.color, { 'italic': grade.capped, 'lowAbs-row': grade.lowAbs }]">
              <Icon :name="grade.icon" :size="24" />
              <div class="flex flex-col">
                <span class="text-[15px]">{{ grade.description }}</span>
                <span class="text-xs font-light" v-if="grade.subtitle">{{
                  grade.subtitle
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Readable Summary Cards -->
        <div class="basis-100 flex-1 space-y-4 flex flex-col"
          :class="{ 'rounded-3xl bg-white shadow-xs p-4': !showTitle, [card.class]: true, 'card-trace': card.allTrace }"
          v-for="card in readableSummaryCards" :key="card.title">
          <div class="flex items-center justify-between mb-4">
            <div class="flex flex-col items-start">
              <h3 class="text-2xl font-headers mb-1">
                {{ card.title }}
              </h3>
              <!-- N/A label takes precedence over percentile when this axis
                   is inherently absent (salmon-fiber, olive-oil-protein). -->
              <div v-if="card.naLabel" class="text-xs text-gray-600 italic flex items-center gap-2">
                <Icon name="info" :size="14" />
                <span>{{ card.naLabel }}</span>
              </div>
              <div v-else-if="card.percentile" class="percentile-badge py-1 px-2" :class="card.percentile?.color">
                <span>{{ card.percentile.description }}</span>
              </div>
              <Skeleton v-else-if="!computedRecipe" class="w-52 h-8 rounded-xl" />
            </div>
            <!-- Suppress the score grade pill for trace cards: salmon shouldn't
                 show "F" for fiber it never had, cucumber shouldn't show "S+"
                 for MNIDX it doesn't really deliver. -->
            <GradeContainer v-if="!card.suppressGrade" :score="card.score" :type="'single'"
              class="rounded-lg text-2xl" />
            <span v-else class="rounded-lg text-2xl px-3 py-1 text-gray-400 font-headers">—</span>
          </div>
          <div v-for="nutrient in card.humanReadable" :key="nutrient.description" :class="{ 'italic': nutrient.trace }">
            <div class="flex gap-2" :class="nutrient.color">
              <Icon :name="nutrient.icon" :size="24" />
              <div class="flex flex-col">
                <span class="">{{ nutrient.description }}</span>
                <span class="text-xs font-light" v-if="nutrient.subtitle">{{
                  nutrient.subtitle
                }}</span>
              </div>
            </div>
          </div>
          <button
            class="main-button animated-button flex items-center gap-2 px-2 py-1 text-xs will-change-transform self-start ml-8"
            v-if="
              card.name == 'micronutrients' &&
              report.humanReadable.micronutrients.length > 5
            " @click="toggleMicronutrientOverview">
            {{ micronutrientOverviewExpanded ? 'Show less' : 'Show more' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VITAMINS, MINERALS } from '~/utils/constants/recipeFields';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';

const props = defineProps<{
  id: string;
  isFood: boolean;
  hideNutrition?: boolean;
  computedRecipe?: ComputedRecipe;
  showTitle?: boolean;
}>();

const id = isNaN(Number(props.id)) ? props.id : Number(props.id);
const showTitle = props.showTitle ?? true;
const recipeStore = useRecipeStore();
const loading = ref(true);
const recipeComputed = ref<any>(null);
const supabase = useSupabaseClient();
const report = computed(() => recipeComputed.value?.report);
const readableSummaryCards = ref<any[]>([
  {
    title: 'Micronutrients',
    baseRelevancy: 9,
    col: 'mnidx',
    name: 'micronutrients',
  },
  {
    title: 'Fat Profile',
    baseRelevancy: 8,
    col: 'fat_profile_score',
    name: 'fatProfile',
  },
  {
    title: 'Processing Level',
    baseRelevancy: 8,
    col: props.isFood ? 'nova' : 'processing_level_score',
    name: 'processingLevel',
  },
  {
    title: 'Protein',
    baseRelevancy: 6,
    col: 'protein_score',
    name: 'protein',
  },
  {
    title: 'Sugar',
    baseRelevancy: 6,
    col: 'sugar_score',
    name: 'sugar',
  },
  {
    title: 'Sodium',
    baseRelevancy: 6,
    col: 'salt_score',
    name: 'salt',
  },
  {
    title: 'Fiber',
    baseRelevancy: 4,
    col: 'fiber_score',
    name: 'fiber',
  },
  {
    title: 'Satiety',
    baseRelevancy: 4,
    col: 'sidx',
    name: 'satiety',
  },
  {
    title: 'Protective Compounds',
    baseRelevancy: 0,
    col: 'protective_score',
    name: 'protectiveCompounds',
  },
]);

const micronutrientOverviewExpanded = ref(false);

const title = computed(() => {
  return (
    recipeComputed.value?.title ||
    recipeStore.recipe?.title ||
    foodName.value ||
    'New Recipe'
  );
});

const foodName = ref<string | null>(null);

function toggleMicronutrientOverview() {
  micronutrientOverviewExpanded.value = !micronutrientOverviewExpanded.value;
  if (micronutrientOverviewExpanded.value) {
    readableSummaryCards.value.find(
      (card) => card.name == 'micronutrients'
    )!.humanReadable = report.value?.humanReadable.micronutrients;
  } else {
    readableSummaryCards.value.find(
      (card) => card.name == 'micronutrients'
    )!.humanReadable = report.value?.humanReadable.micronutrients.slice(0, 5);
  }
}

// Map card.name (Report.vue) -> displayHints axis key (displayHints.ts).
const cardHintKey: Record<string, string> = {
  micronutrients: 'micronutrients',
  fatProfile: 'fat_profile',
  protein: 'protein',
  sugar: 'sugar',
  salt: 'salt',
  fiber: 'fiber',
  protectiveCompounds: 'protective',
  // satiety/processingLevel intentionally not gated.
};

// Per-card "this nutrient isn't really on offer" badge text. Negative-axis
// cards (sugar/salt) get a different framing — the absence is fine, just
// don't dress it up as a virtue.
const naLabelByCard: Record<string, string> = {
  fiber: 'Not a fiber source',
  protein: 'Not a protein source',
  fatProfile: 'Negligible fat content',
  protectiveCompounds: 'Not a phytonutrient source',
  micronutrients: 'Low micronutrient density',
  sugar: 'Inherently low sugar',
  salt: 'Inherently low sodium',
};

function fillReadableSummaryCards() {
  const hints = report.value?.displayHints ?? report.value?.humanReadable?.displayHints;
  for (const card of readableSummaryCards.value) {
    const percentile = report.value?.percentiles?.[card.col];
    const humanReadable = report.value?.humanReadable[card.name];
    const score = report.value?.overall[card.col];
    const roundedGrade = getGrade(score, 'single')[0];
    let relevancy =
      card.baseRelevancy +
      gradeValues[roundedGrade as keyof typeof gradeValues] * 2;

    const hintKey = cardHintKey[card.name];
    const hint = hintKey ? hints?.[hintKey] : null;
    const isTrace = hint?.state === 'trace';
    const isLow = hint?.state === 'low';
    // Positive-axis trace: card is informationally empty. Suppress grade pill,
    // show N/A badge, sort to bottom.
    // Negative-axis trace: similar — "Minimal sugar" with S+ flourish reads
    // comical for a piece of meat. Suppress grade and N/A-style the card.
    const suppressGrade = isTrace;
    const naLabel = isTrace ? (naLabelByCard[card.name] ?? null) : null;
    // Cards whose entire content is trace ALSO sort to bottom (legacy path
    // for sections like fatProfile that emit a single trace item).
    const allTrace =
      isTrace ||
      (Array.isArray(humanReadable) &&
        humanReadable.length > 0 &&
        humanReadable.every((item: any) => item.trace));
    if (allTrace) relevancy = -100;
    if (isLow) relevancy -= 4; // de-emphasise but don't bury

    card.percentile = percentile;
    card.humanReadable = humanReadable;
    card.score = score;
    card.relevancy = relevancy;
    card.allTrace = allTrace;
    card.suppressGrade = suppressGrade;
    card.naLabel = naLabel;
    card.class = '';
  }
  if (props.isFood) {
    readableSummaryCards.value.find(
      (card) => card.name == 'processingLevel'
    ).score = report.value?.overall.processing_level_score;
  }
  readableSummaryCards.value.sort((a, b) => b.relevancy - a.relevancy);
  micronutrientOverviewExpanded.value = true;
  toggleMicronutrientOverview();
  // Set the first three cards to have the "highlight" class
  for (let i = 0; i < 3 && i < readableSummaryCards.value.length; i++) {
    readableSummaryCards.value[i].class = 'highlight';
  }
  for (let i = 3; i < 6 && i < readableSummaryCards.value.length; i++) {
    readableSummaryCards.value[i].class = 'highlight-light';
  }
}

function addPercentilesToSummaryCards() {
  for (const card of readableSummaryCards.value) {
    card.percentile = report.value?.percentiles[card.col];
  }
}

// Load everything on client side
onMounted(async () => {

  try {
    if (props.computedRecipe) {
      recipeComputed.value = props.computedRecipe;
    }
    else if (props.isFood) {
      // Case 1: Food
      const food = await getFoodName(supabase, {
        eq: { id: id },
      });

      foodName.value = food.name;

      // Check if report is preloaded in DB
      if (food.food.report && food.food.report.humanReadable) {
        recipeComputed.value = food.food;
      } else {
        // Calculate nutrition using endpoint
        const response = (await $fetch('/api/calculate/nutrition', {
          method: 'POST',
          body: {
            nutritionEngineArgs: {
              food: food,
              useGpt: false,
              logToReport: true,
              considerProcessing: false,
            },
          },
        })) as { nutritionComputed: InsertableRecipe; nutrition: any };
        recipeComputed.value = response.nutritionComputed;
      }
    } else if (props.id === 'new') {
      // Case 3: User is editing a new recipe - use calculate without convert
      const response = (await $fetch('/api/calculate/recipe', {
        method: 'POST',
        body: {
          nutritionEngineArgs: {
            recipe: recipeStore.editingRecipe,
            useGpt: false,
            logToReport: true,
            considerProcessing: false,
          },
        },
      })) as { recipeRow: InsertableRecipe };
      recipeComputed.value = response.recipeRow;
    } else {
      // Case 2: Recipe with ID
      // Fetch recipe if not already in store
      if (!recipeStore.recipe || recipeStore.recipe.id != id) {
        const data = await getRecipe(supabase, {
          eq: { id: id },
        });
        recipeStore.setRecipe(data as Recipe);
      }

      // Check if report is preloaded in DB
      // @ts-ignore
      if (recipeStore.recipe?.report) {
        recipeComputed.value = recipeStore.recipe;
      } else {
        // Convert and calculate using endpoint
        const convertedRecipe = await convertUploadableToComputable(
          recipeStore.recipe!,
          supabase,
          false
        );
        const response = (await $fetch('/api/calculate/recipe', {
          method: 'POST',
          body: {
            nutritionEngineArgs: {
              recipe: convertedRecipe,
              useGpt: false,
              logToReport: true,
              considerProcessing: false,
            },
          },
        })) as { recipeRow: InsertableRecipe };
        recipeComputed.value = response.recipeRow;
      }
    }
  } catch (error) {
    console.error('Error loading recipe report:', error);
  } finally {
    fillReadableSummaryCards();
    loading.value = false;
    if (!props.computedRecipe) {
      await fillReportPercentiles(supabase, report.value, props.isFood);
      addPercentilesToSummaryCards();
    }
  }
});

</script>

<style scoped>
.percentile-badge {
  font-size: 12px !important;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 0.75rem;
  background-color: color-mix(in srgb, currentColor 5%, white);
}

/* Trace cards: subtle background tint, no opacity (so text contrast is
   preserved). The N/A badge + suppressed grade pill carry the visual
   "this is dimmed" signal instead. */
.card-trace {
  filter: saturate(0.70);
  opacity: 0.9;
}

/* Low-absolute rows in the overview: slight vertical compression and a
   softer background — a hair less prominent than normal rows but still
   fully legible. */
.lowAbs-row {
  /* No opacity — it stacks badly on already-coloured grade rows. */
  font-size: 0.95em;
}
</style>
