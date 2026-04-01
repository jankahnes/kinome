<template>
  <div class="flex justify-center w-full">
    <div class="w-full flex flex-col gap-4 items-start">
      <textarea v-model="baseRecipe.title" v-auto-resize rows="1" placeholder="✍️ New Recipe"
        class="w-full md:w-auto min-w-[40%] font-bold text-3xl border-box bg-primary-10/40! rounded-2xl p-2 outline-none resize-none overflow-hidden h-auto break-words scrollbar-hide" />

      <textarea v-model="baseRecipe.description" v-auto-resize rows="1" placeholder="✍️ Description"
        class="min-w-[60%] bg-primary-10/40! rounded-2xl p-2 outline-none resize-none overflow-hidden h-auto break-words scrollbar-hide text-sm" />

      <div class="flex w-full flex-wrap gap-4 mt-6">
        <!-- Ingredients column -->
        <div class="flex-1 space-y-2">
          <h2 class="text-4xl font-bold tracking-tighter">Ingredients</h2>
          <div class="main-card bg-primary-10/40! main-card-padding space-y-2">
            <div class="flex gap-4 flex-wrap justify-between">
              <div class="flex gap-4">
                <!-- Serves -->
                <div class="flex items-center gap-2 bg-primary-10 rounded-4xl px-3 py-1">
                  <span class="text-xs uppercase text-gray-400 font-bold">Serves</span>
                  <div class="w-px bg-gray-300 self-stretch"></div>
                  <input v-model.number="serves" type="number" min="1" max="16"
                    class="w-8 text-center font-bold focus:outline-none bg-transparent" />
                </div>

                <!-- Nutrition preview -->
                <div class="flex items-center gap-2 bg-primary-10 rounded-4xl px-3 py-1">
                  <span class="text-xs uppercase text-gray-400 font-bold">kcal/serving</span>
                  <div class="w-px bg-gray-300 self-stretch"></div>
                  <span class="font-semibold text-slate-700">
                    {{ Math.round((computedRecipe ?? {}).kcal ?? 0) }}
                  </span>
                </div>
              </div>
              <!-- NL toggle -->
              <button class="animated-button flex items-center gap-2 px-3 py-1 text-sm bg-primary-10"
                @click="useNaturalLanguage = !useNaturalLanguage">
                <IconRefreshCcw class="w-4" />
                {{ !useNaturalLanguage ? 'Natural language' : 'Structured' }}
              </button>
            </div>

            <!-- Natural language textarea -->
            <div v-if="useNaturalLanguage">
              <textarea v-model="base_ingredients" rows="10"
                placeholder="For the sauce: &#10;1 cup of wine&#10;1 cup of tomato sauce&#10;2 tbsp of olive oil"
                class="w-full bg-primary-20/70! rounded-4xl p-3 outline-none resize-y text-sm font-mono" />
            </div>

            <!-- Structured ingredient groups -->
            <div v-else>
              <EditableGroupList v-model="categories" :show-collapse="false" :show-group-header="false"
                group-name-placeholder="Category name" add-group-label="Add category" new-group-name="New Category" />
            </div>
          </div>
        </div>

        <!-- Method column -->
        <div class="space-y-2 flex-1">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">Method</h2>
          <PagesRecipeInstructionContainerEditable v-model="instructionsEditableInformation.instructions" />
        </div>
      </div>

      <div class="flex gap-2 w-full justify-start md:mt-6">
        <button
          class="flex gap-2 items-center justify-center bg-primary text-white border-3 border-primary rounded-xl px-2 py-1 font-bold shadow-lg"
          @click="submit()">
          Submit
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';

const submitFromPreparsed = inject<(recipe: ComputableRecipe) => void>('submitFromPreparsed')!;
const submitFromNaturalLanguage = inject<(recipe: BaseRecipe) => void>('submitFromNaturalLanguage')!;

const supabase = useSupabaseClient();
const route = useRoute();
const recipeStore = useRecipeStore();

// Flat state replacing the old `ingredientListEditableInformation` blob
const serves = ref(4);
const categories = ref<TrackedMeal[]>([
  { name: '', editableIngredients: [{ rawText: '', displayText: '' }], collapsed: false },
]);
const useNaturalLanguage = ref(false);
const base_ingredients = ref('');

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

// Convert TrackedMeal groups → FullIngredient[] for the preparsed submit path
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
        category: category.name || null,
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

function submit() {
  if (useNaturalLanguage.value) {
    submitFromNaturalLanguage(naturalLanguageBaseRecipe.value);
  } else {
    submitFromPreparsed(parsingRecipe.value);
  }
}

// Convert FullIngredient[] → EditableIngredient[] for edit mode
function fullIngredientToEditableItem(ing: FullIngredient, batchSize: number): EditableIngredient {
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

  // Group full ingredients by category → TrackedMeal[]
  const grouped = new Map<string, FullIngredient[]>();
  for (const ing of computableRecipe.fullIngredients) {
    const key = ing.category ?? '';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ing);
  }

  if (grouped.size === 0) {
    categories.value = [
      { name: '', editableIngredients: [{ rawText: '', displayText: '' }], collapsed: false },
    ];
  } else {
    categories.value = [...grouped.entries()].map(([catName, ings]) => ({
      name: catName,
      editableIngredients: ings.map((ing) => fullIngredientToEditableItem(ing, batchSize)),
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
}

async function compute() {
  if (groupsToFullIngredients(categories.value).length === 0) return;
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
