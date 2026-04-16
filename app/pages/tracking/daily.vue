<template>
  <Transition name="loaded-content">
    <div class="pt-10 pb-20 sm:pb-4 relative" v-if="mounted">
      <div class="flex gap-8 flex-wrap">
        <div class="space-y-2 flex-1 2xl:min-w-100 bg-primary-10/40 rounded-4xl p-4">
          <h2 class="text-4xl font-bold tracking-tighter">Tracking</h2>
          <div class="flex flex-col gap-4">
            <div class="flex flex-wrap gap-2 sm:text-lg">

              <button v-for="mealPreset in savedTemplates" :key="mealPreset.id"
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
                @click="addMealFromTemplate(mealPreset.id)">
                <IconBookMarked class="w-5" />
                Add {{ mealPreset.name }}
              </button>
              <button class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
                @click="showRecipeSearchModal = true">
                <IconSalad class="w-5" />
                Add Meal from Recipe
              </button>
              <button v-for="mealPreset in mealPresets" :key="mealPreset"
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10" @click="addMeal(mealPreset)">
                Add {{ mealPreset }}
              </button>

            </div>

            <EditableGroupList v-model="trackedMeals" :show-collapse="true" :show-group-header="true"
              group-name-placeholder="Meal name" :show-kcal="true">
              <template #header-actions="{ group }">
                <button v-if="group.editableIngredients?.some((ingredient) => ingredient.rawText?.trim())" type="button"
                  class="animated-button rounded-xl p-1.5"
                  :title="savedMealActionState[groupKey(group)] === 'saved' ? 'Meal saved' : 'Save meal'"
                  @click.stop="saveMealAsTemplate(group)">
                  <IconCheck v-if="savedMealActionState[groupKey(group)] === 'saved'" class="w-5 text-emerald-600" />
                  <IconBookmark v-else class="w-5" />
                </button>
              </template>
            </EditableGroupList>
          </div>
        </div>

        <div class="flex-1 flex flex-col gap-6 2xl:min-w-140">
          <NutritionOverviewCard mode="tracking" :nutrition="computedDailyNutrition"
            :tracking-goals="userTrackingGoals?.targets" @view-overall-report="showOverallReportPanel = true" />
          <div class="flex flex-col bg-primary-10/40 rounded-4xl p-4">
            <div class="flex justify-between items-center mb-3 mx-2">
              <h3 class="text-4xl font-bold tracking-tighter">Nutrition Quality</h3>
              <button @click="showOverallReportPanel = true"
                class="flex items-center gap-0.5 animated-button text-sm p-2 text-slate-400">
                <IconChevronRight class="w-5" />
              </button>
            </div>
            <NutritionQualityCards mode="full" :cards="qualityItems" :gut-health="gutHealth" :fat-profile="fatProfile"
              :fat-profile-readable="fatProfileReadable"
              :micronutrients="computedDailyNutrition?.report?.details?.micronutrients"
              :kcal-progress="kcalProgress"
              @view-overall-report="showOverallReportPanel = true" />
          </div>
        </div>
      </div>

      <div class="fixed bottom-16 lg:bottom-4 right-2 lg:right-10 z-50">
        <button @click="saveMeals" :disabled="isSaving || !hasUnsavedChanges"
          class="animated-button flex items-center gap-2 px-4 py-2 shadow-lg transition-all" :class="{
            'bg-primary-10': hasUnsavedChanges,
            'bg-primary-10/20': !hasUnsavedChanges,
            'opacity-50 cursor-not-allowed': isSaving,
          }">
          <IconLoader class="w-4 animate-spin" v-if="isSaving" />
          <IconSave class="w-4" v-else-if="hasUnsavedChanges" />
          <IconCheck class="w-4" v-else />
          <span class="text-sm font-medium">
            {{ isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved' }}
          </span>

          <span v-if="lastSavedAt && !hasUnsavedChanges" class="text-xs opacity-70">
            {{ formatTimeAgo(lastSavedAt) }}
          </span>
        </button>
      </div>

      <BlocksResponsiveInfo v-model="showOverallReportPanel" sidePanelClass="w-96">
        <PagesReport id="tracking-day" :is-food="false" :computedRecipe="computedDailyNutrition as any" />
      </BlocksResponsiveInfo>

      <BlocksResponsiveModal v-model="showRecipeSearchModal">
        <template #default="{ isMobile }">
          <div class="flex flex-col gap-6 p-6 max-h-[50%] sm:min-w-120 mb-10 md:mb-0" @click.stop>
            <div class="flex flex-col gap-2">
              <h3 class="text-2xl font-bold">Add a meal from a recipe</h3>
              <input type="text" placeholder="Search..."
                class="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:border-gray-500"
                v-model="recipeSearchQuery" />
            </div>
            <div class="overflow-y-auto flex flex-col gap-2 scrollbar-hide" v-if="recipeSearchResults.length > 0">
              <RecipeCardHorizontal v-for="recipe in recipeSearchResults" :recipe="recipe" class="w-full text-2xl"
                :key="`${isMobile ? 'mobile' : 'desktop'}-${recipe.id}`"
                :uniqueId="`${isMobile ? 'mobile' : 'desktop'}-${recipe.id}`"
                @click.stop.prevent.capture="handleAddMealFromRecipe(recipe.id)" />
            </div>
          </div>
        </template>
      </BlocksResponsiveModal>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { TrackedMeal } from '~/types/types';
import { parseLogicalDate } from '~/utils/format/logicalDate';

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();
const loadingStore = useLoadingStore();

function parseDateFromQuery(): Date {
  const q = route.query.date;
  if (typeof q === 'string') return parseLogicalDate(q) ?? new Date();
  return new Date();
}
const userTrackingGoals = computed(() => auth.user?.user_data?.tracking);
const mounted = ref(false);

const computedDailyNutrition = ref<InsertableRecipe | null>(null);
const showRecipeSearchModal = ref(false);

const recipeSearchQuery = ref('');
const recipeSearchResults = ref<RecipeOverview[]>([]);

const {
  trackedMeals,
  selectedDate,
  isSaving,
  isLoading,
  lastSavedAt,
  hasUnsavedChanges,
  addMeal,
  addMealFromRecipe,
  addMealFromTemplate,
  loadMeals,
  saveMeals,
  formatTimeAgo,
  getMealNutrition,
  setupAutoSave,
} = useMealTracking();

const savedTemplates = ref<TrackedMeal[]>([]);
const savedMealActionState = ref<Record<string, 'idle' | 'saved'>>({});
const savedMealActionTimers = new Map<string, ReturnType<typeof setTimeout>>();

const mealPresets = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
];

const handleAddMealFromRecipe = async (recipeId: number) => {
  showRecipeSearchModal.value = false;
  await addMealFromRecipe(recipeId);
  await computeNutrition();
};

async function loadSavedTemplates() {
  try {
    savedTemplates.value = await $fetch<TrackedMeal[]>('/api/tracking/templates');
  } catch (error) {
    console.error('Failed to load saved meal templates:', error);
  }
}

async function saveMealAsTemplate(meal: TrackedMeal) {
  const key = groupKey(meal);
  try {
    await $fetch('/api/tracking/templates/save-from-meal', {
      method: 'POST',
      body: meal.id
        ? { mealId: meal.id }
        : {
          meal: {
            ...meal,
            summary: getMealNutrition(meal),
          },
        },
    });
    await loadSavedTemplates();
    savedMealActionState.value[key] = 'saved';
    if (savedMealActionTimers.has(key)) {
      clearTimeout(savedMealActionTimers.get(key)!);
    }
    savedMealActionTimers.set(key, setTimeout(() => {
      savedMealActionState.value[key] = 'idle';
      savedMealActionTimers.delete(key);
    }, 1800));
    loadingStore.displayTransientToast('Saved meal template');
  } catch (error) {
    console.error('Failed to save meal template:', error);
    loadingStore.displayTransientToast('Failed to save meal template');
  }
}

function groupKey(meal: TrackedMeal) {
  return meal.id != null ? `persisted-${meal.id}` : `${meal.name}-${trackedMeals.value.indexOf(meal)}`;
}

const computeNutrition = async () => {
  const fullIngredients = trackedMeals.value
    .flatMap((meal) => meal.editableIngredients)
    .filter((ingredient) => ingredient && ingredient.foodNameId !== undefined && ingredient.amount)
    .map((ingredient) => ({
      ...ingredient,
      ...ingredient.foodData,
      id: ingredient.foodNameId,
      name: ingredient.ingredientName,
    }));

  if (fullIngredients.length === 0) {
    computedDailyNutrition.value = null;
    return;
  }

  const sendingRecipe = {
    title: 'Daily Tracking',
    fullIngredients,
    serves: 1,
  } as unknown as ComputableRecipe;

  const nutrition = await $fetch('/api/calculate/recipe', {
    method: 'POST',
    body: {
      nutritionEngineArgs: {
        recipe: sendingRecipe,
        useGpt: false,
        logToReport: true,
        considerProcessing: false,
        disableSatiety: true,
        isDiet: true,
      },
    },
  });
  computedDailyNutrition.value = nutrition.recipeRow;
};

const searchRecipes = async () => {
  const recipes = await getRecipeOverviews(supabase, {
    trigram_search: { query: recipeSearchQuery.value, column: 'title' },
    limit: 4,
  });
  recipeSearchResults.value = recipes;
};

const qualityItems = computed(() =>
  getDailyQualityCards(computedDailyNutrition.value?.report, {
    totalFat: computedDailyNutrition.value?.fat,
    protectiveScore: computedDailyNutrition.value?.protective_score,
  }),
);

const showOverallReportPanel = ref(false);

const kcalProgress = computed(() => {
  const goal = userTrackingGoals.value?.targets?.kcal ?? 2000;
  return Math.max(0, (computedDailyNutrition.value?.kcal ?? 0) / goal);
});

const fatProfile = computed(() => computedDailyNutrition.value?.report?.details?.fatProfile);
const fatProfileReadable = computed<{ description: string; subtitle: string; color: string; bgColor: string }[]>(
  () => computedDailyNutrition.value?.report?.humanReadable?.fatProfile ?? [],
);
const gutHealth = computed(() => computedDailyNutrition.value?.report?.details?.gutHealth);

const computeNutritionDebounced = debounce(computeNutrition, 1000);
const searchRecipesDebounced = debounce(searchRecipes, 1000);

watch(
  trackedMeals,
  () => {
    computeNutritionDebounced();
    hasUnsavedChanges.value = true;
  },
  { deep: true },
);

watch(recipeSearchQuery, () => {
  searchRecipesDebounced();
});

watch(() => route.query.date, async () => {
  selectedDate.value = parseDateFromQuery();
  await loadMeals(selectedDate.value);
  await computeNutrition();
});

onMounted(async () => {
  mounted.value = true;
  selectedDate.value = parseDateFromQuery();
  await loadSavedTemplates();
  await loadMeals(selectedDate.value);

  const addRecipeId = route.query.addRecipe;
  if (addRecipeId) {
    await handleAddMealFromRecipe(Number(addRecipeId));
  }

  await computeNutrition();
  setupAutoSave();
});

onBeforeUnmount(() => {
  savedMealActionTimers.forEach((timer) => clearTimeout(timer));
  savedMealActionTimers.clear();
});
</script>

<style scoped></style>
