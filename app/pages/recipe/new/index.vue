<template>
  <div class="space-y-8 lg:space-y-12">
    <!-- Hero -->
    <div class="space-y-3 max-w-2xl">
      <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
        CREATE / FROM SCRATCH
      </span>
      <h1 class="text-4xl md:text-5xl font-headers tracking-tight leading-none">
        New recipe<span class="text-primary">.</span>
      </h1>
      <p class="text-base text-gray-600 max-w-xl leading-relaxed">
        Type your ingredients freely. We'll match each one against our nutrition database so you can fine-tune amounts
        before publishing.
      </p>
    </div>

    <!-- Recipe meta -->
    <div class="main-card main-card-rounded p-5 md:p-6 space-y-4">
      <div>
        <label class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">TITLE</label>
        <textarea v-model="baseRecipe.title" v-auto-resize rows="1" placeholder="Lemon pesto pasta"
          class="w-full mt-1 bg-transparent text-2xl md:text-3xl font-headers tracking-tight focus:outline-none resize-none overflow-hidden scrollbar-hide placeholder:text-gray-300 leading-tight" />
      </div>
      <div class="h-px bg-gray-100"></div>
      <div>
        <label class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">DESCRIPTION ·
          OPTIONAL</label>
        <textarea v-model="baseRecipe.description" v-auto-resize rows="1"
          placeholder="A weeknight pasta with bright lemon and basil…"
          class="w-full mt-1 bg-transparent text-sm focus:outline-none resize-none overflow-hidden scrollbar-hide placeholder:text-gray-300 leading-relaxed" />
      </div>
    </div>

    <!-- Ingredients + Method -->
    <div class="grid lg:grid-cols-2 gap-4 lg:gap-6">
      <!-- Ingredients card -->
      <div class="main-card main-card-rounded p-5 md:p-6 space-y-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h2 class="text-2xl md:text-3xl font-headers tracking-tight">Ingredients</h2>
          <div class="flex bg-primary/8 rounded-full p-0.5 text-xs font-mono">
            <button type="button" class="px-3 py-1 rounded-full transition-all"
              :class="mode === 'nl' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
              @click="switchMode('nl')">Paste</button>
            <button type="button" class="px-3 py-1 rounded-full transition-all"
              :class="mode === 'structured' ? 'bg-linear-to-br from-primary to-primary-700 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
              @click="switchMode('structured')">Structured</button>
          </div>
        </div>

        <Transition name="slide" mode="out-in">
          <div v-if="mode === 'nl' && !hasParsed" key="textarea" class="space-y-2">
            <textarea v-model="base_ingredients" rows="10"
              placeholder="200g chicken breast&#10;1 cup of rice&#10;2 tbsp olive oil&#10;&#10;For the sauce:&#10;2 tbsp soy sauce&#10;1 tbsp sesame oil"
              class="w-full bg-primary-5/70 rounded-2xl p-4 outline-none resize-y font-mono text-sm leading-relaxed focus:bg-primary-5 transition-colors" />
            <p class="text-xs text-gray-500 leading-snug">
              Lines ending with
              <code class="font-mono bg-primary/8 px-1 py-px rounded">:</code>
              become categories. Empty lines reset.
            </p>
          </div>

          <div v-else key="structured" class="space-y-3">
            <div v-if="hasParsed" class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-sm text-gray-500 leading-snug">
                Tap any ingredient to adjust the match, amount, or unit.
              </p>
              <button type="button"
                class="text-xs font-mono uppercase tracking-wider text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                @click="resetToText">
                <IconArrowLeft class="w-3.5" />
                Edit text
              </button>
            </div>
            <p v-else class="text-sm text-gray-500 leading-snug">
              Add ingredients one at a time. Amounts, units, and food names are recognized as you type.
            </p>

            <EditableGroupList v-model="categories" :show-collapse="false" :show-group-header="true" :show-kcal="true"
              group-name-placeholder="For the sauce" add-group-label="Add category" new-group-name="" />
          </div>
        </Transition>

        <!-- Bottom controls -->
        <div class="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="bg-primary-5 main-card-rounded">
              <BlocksServesStepper v-model="serves" />
            </div>
          </div>

          <button v-if="mode === 'nl' && !hasParsed" type="button"
            class="main-button animated-button bg-primary! text-white font-medium px-5 py-2 rounded-[25px]! flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="parsing || !canAnalyze" @click="analyze">
            <IconLoaderCircle v-if="parsing" class="w-4 h-4 animate-spin" />
            <span>{{ parsing ? 'Analyzing…' : 'Analyze' }}</span>
            <IconArrowRight v-if="!parsing" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Method card -->
      <div class="main-card main-card-rounded p-5 md:p-6 space-y-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-headers tracking-tight">Method</h2>
          <p class="text-sm text-gray-500 mt-1">One step per line. Short and clear is best.</p>
        </div>
        <PagesRecipeInstructionContainerEditable v-model="instructionsEditableInformation.instructions" />
      </div>
    </div>

    <!-- Submit bar -->
    <div class="main-card main-card-rounded px-5 md:px-7 py-5 flex items-center justify-between gap-4 flex-wrap">
      <div class="min-w-0">
        <p class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">READY?</p>
        <p class="text-sm text-gray-700 mt-1">
          <template v-if="hasParsed">
            All ingredients matched. Submit publishes with the nutrition shown above.
          </template>
          <template v-else>
            Submitting raw text - our AI will parse ingredients on the server.
          </template>
        </p>
      </div>

      <button type="button"
        class="main-button animated-button bg-primary! text-white font-medium px-6 py-3 rounded-[25px]! flex items-center gap-2 shrink-0"
        @click="submit">
        Submit recipe
        <IconArrowRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';
import { parseIngredientString } from '~/utils/format/parseIngredientString';
import type { EditableIngredient } from '~/types/types';

const submitFromPreparsed = inject<(recipe: ComputableRecipe) => void>('submitFromPreparsed')!;
const submitFromNaturalLanguage = inject<(recipe: BaseRecipe) => void>('submitFromNaturalLanguage')!;

const supabase = useSupabaseClient();
const route = useRoute();
const recipeStore = useRecipeStore();

useHead({
  title: 'Create a Recipe | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content:
        'Build a recipe from structured ingredients or natural language and preview nutrition before publishing it on Kinome.',
    },
    { key: 'og:title', property: 'og:title', content: 'Create a Recipe | Kinome' },
    {
      key: 'og:description',
      property: 'og:description',
      content:
        'Build a recipe from structured ingredients or natural language and preview nutrition before publishing it on Kinome.',
    },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'og:url', property: 'og:url', content: 'https://kinome.app/recipe/new' },
  ],
  link: [{ key: 'canonical', rel: 'canonical', href: 'https://kinome.app/recipe/new' }],
});

// ---- State ----
const serves = ref(4);
const categories = ref<TrackedMeal[]>([
  { name: null, editableIngredients: [{ rawText: '', displayText: '' }], collapsed: false },
]);
const base_ingredients = ref('');
const mode = ref<'nl' | 'structured'>('nl');
const hasParsed = ref(false);
const parsing = ref(false);

const baseRecipe = ref({
  title: '',
  description: '',
  user_id: null,
  source: null,
});

const instructionsEditableInformation = ref<{ instructions: string[] }>({
  instructions: ['', '', ''],
});

const computedRecipe = ref<InsertableRecipe | null>(null);

// ---- Derived ingredient projections ----
function groupsToFullIngredients(mealCategories: TrackedMeal[]): FullIngredient[] {
  return mealCategories.flatMap((category) =>
    category.editableIngredients
      .filter((ing) => ing.foodNameId && ing.rawText.trim())
      .map((ing) => ({
        ...ing.foodData,
        id: ing.foodNameId!,
        name: ing.ingredientName ?? '',
        amount: ing.amount ?? 0,
        unit: ing.unit ?? 'G',
        category: category.name || 'uncategorized',
        preparation_description: ing.preparationDescription ?? null,
      } as unknown as FullIngredient))
  );
}

const parsingRecipe = computed<ComputableRecipe>(() => ({
  ...baseRecipe.value,
  serves: serves.value,
  source_type: 'PREPARSED',
  fullIngredients: groupsToFullIngredients(categories.value),
  instructions: instructionsEditableInformation.value.instructions,
} as unknown as ComputableRecipe));

const naturalLanguageBaseRecipe = computed<BaseRecipe>(() => ({
  ...baseRecipe.value,
  base_ingredients: base_ingredients.value
    .split('\n')
    .map((s: string) => s.trim())
    .filter(Boolean),
  serves: serves.value,
  instructions: instructionsEditableInformation.value.instructions,
  source_type: 'TEXT',
}));

const canAnalyze = computed(() =>
  base_ingredients.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean).length > 0
);

// ---- NL → grouped lines (categories via lines ending with ":") ----
function parseRawTextIntoGroups(raw: string): { name: string | null; lines: string[] }[] {
  const groups: { name: string | null; lines: string[] }[] = [
    { name: null, lines: [] },
  ];

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();

    if (!line) {
      const last = groups[groups.length - 1]!;
      if (last.lines.length > 0 || last.name !== null) {
        groups.push({ name: null, lines: [] });
      }
      continue;
    }

    if (line.endsWith(':')) {
      let name = line.slice(0, -1).trim().replace(/^for the\s+/i, '');
      if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
      const last = groups[groups.length - 1]!;
      if (last.lines.length === 0 && last.name === null) {
        last.name = name || null;
      } else {
        groups.push({ name: name || null, lines: [] });
      }
      continue;
    }

    groups[groups.length - 1]!.lines.push(line);
  }

  return groups.filter((g) => g.lines.length > 0);
}

// ---- Actions ----
async function analyze() {
  if (parsing.value) return;
  const groups = parseRawTextIntoGroups(base_ingredients.value);
  if (!groups.length) return;

  parsing.value = true;
  try {
    const newCategories: TrackedMeal[] = [];
    for (const group of groups) {
      const parsed = await Promise.all(
        group.lines.map((line) => parseIngredientString(supabase as any, line)),
      );
      const editable: EditableIngredient[] = parsed.map((p, i) => ({
        rawText: p.displayText || group.lines[i]!,
        displayText: p.displayText || group.lines[i]!,
        displayTextContext: p.displayTextContext,
        displayTextIngredient: p.displayTextIngredient,
        displayTextExtra: p.displayTextExtra,
        amount: p.amount ?? null,
        unit: p.unit ?? 'G',
        preparationDescription: p.preparationDescription ?? null,
        foodNameId: p.foodNameId,
        ingredientName: p.ingredientName,
        foodData: p.foodData,
        foodVariants: p.foodVariants,
      }));
      newCategories.push({
        name: group.name,
        editableIngredients: editable.length
          ? editable
          : [{ rawText: '', displayText: '' }],
        collapsed: false,
      });
    }
    if (!newCategories.length) {
      newCategories.push({
        name: null,
        editableIngredients: [{ rawText: '', displayText: '' }],
        collapsed: false,
      });
    }
    categories.value = newCategories;
    hasParsed.value = true;
    mode.value = 'structured';
  } finally {
    parsing.value = false;
  }
}

function switchMode(next: 'nl' | 'structured') {
  if (next === mode.value) return;
  if (next === 'nl') {
    resetToText();
    return;
  }
  mode.value = next;
}

function resetToText() {
  mode.value = 'nl';
  hasParsed.value = false;
  categories.value = [
    { name: null, editableIngredients: [{ rawText: '', displayText: '' }], collapsed: false },
  ];
  computedRecipe.value = null;
}

function submit() {
  if (mode.value === 'structured') {
    submitFromPreparsed(parsingRecipe.value);
  } else {
    submitFromNaturalLanguage(naturalLanguageBaseRecipe.value);
  }
}

// ---- Edit-mode hydration ----
function fullIngredientToEditableItem(
  ing: FullIngredient,
  batchSize: number,
): EditableIngredient {
  const amount = (ing.amount ?? 0) * batchSize;
  const displayTextContext = getStringFromAmountInfo([amount, ing.unit ?? 'G'], 1).trim();
  const displayText = [displayTextContext, ing.name].filter(Boolean).join(' ');
  return {
    rawText: displayText,
    displayText,
    displayTextContext,
    displayTextIngredient: ing.name,
    displayTextExtra: '',
    amount,
    unit: ing.unit ?? undefined,
    foodNameId: ing.id,
    ingredientName: ing.name,
    foodData: ing as unknown as FullFoodRow,
    preparationDescription: ing.preparation_description ?? undefined,
  };
}

function setEditableInformation(computableRecipe: ComputableRecipe | null) {
  if (!computableRecipe) return;
  const batchSize = computableRecipe.batch_size ?? 1;

  const grouped = new Map<string, FullIngredient[]>();
  for (const ing of computableRecipe.fullIngredients) {
    const key = ing.category ?? '';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ing);
  }

  if (grouped.size === 0) {
    categories.value = [
      { name: null, editableIngredients: [{ rawText: '', displayText: '' }], collapsed: false },
    ];
  } else {
    categories.value = [...grouped.entries()].map(([catName, ings]) => ({
      name: catName ?? null,
      editableIngredients: ings.map((ing) =>
        fullIngredientToEditableItem(ing, batchSize),
      ),
      collapsed: false,
    }));
  }
  serves.value = batchSize;
  base_ingredients.value = computableRecipe.fullIngredients
    .map((ing) => {
      const amount = (ing.amount ?? 0) * batchSize;
      const context = getStringFromAmountInfo([amount, ing.unit ?? 'G'], 1).trim();
      return [context, ing.name].filter(Boolean).join(' ');
    })
    .join('\n');

  instructionsEditableInformation.value.instructions =
    removeInstructionFormatting(computableRecipe.instructions);
  Object.assign(baseRecipe.value, computableRecipe);

  // Pre-populated structured data → start in structured mode.
  hasParsed.value = true;
  mode.value = 'structured';
}

// ---- Live nutrition compute ----
async function compute() {
  if (groupsToFullIngredients(categories.value).length === 0) {
    computedRecipe.value = null;
    return;
  }
  const response = (await $fetch('/api/calculate/recipe', {
    method: 'POST',
    body: {
      nutritionEngineArgs: {
        recipe: parsingRecipe.value,
        useGpt: false,
        logToReport: false,
        considerProcessing: false,
        disableSatiety: true,
      },
    },
  })) as { recipeRow: InsertableRecipe };
  computedRecipe.value = response.recipeRow;
}

watch(parsingRecipe, compute, { deep: true });

onMounted(async () => {
  const isEditing = route.query.editCurrent === 'true';
  if (isEditing && recipeStore.recipe) {
    const computableRecipe = await convertUploadableToComputable(
      recipeStore.recipe,
      supabase,
    );
    setEditableInformation(computableRecipe);
  } else if (recipeStore.isEditingNew) {
    setEditableInformation(recipeStore.editingRecipe);
  }
  compute();
});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 220ms ease,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
