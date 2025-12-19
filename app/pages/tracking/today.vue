<template>
  <Transition name="loaded-content">
    <div class="pt-10 pb-20" v-if="mounted">
      <div class="flex gap-8 flex-wrap">
        <!-- Tracking section-->
        <div class="space-y-2 flex-1">
          <h2 class="text-4xl font-bold tracking-tighter">Tracking</h2>
          <div class="flex flex-col gap-4">
            <!-- Meal adding buttons -->
            <div class="flex flex-wrap gap-2 text-lg">
              <button
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
                @click="showRecipeSearchModal = true"
              >
                <IconPlus class="w-4" />
                Add Meal from Recipe
              </button>
              <button
                v-for="mealPreset in mealPresets"
                :key="mealPreset"
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
                @click="addMeal(mealPreset)"
              >
                {{ mealPreset }}
              </button>
              <button
                v-if="!showCustomMealInput"
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
                @click="showCustomMealInput = true"
              >
                <IconPlus class="w-4" />
                Add Other Meal
              </button>
              <div
                v-else
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
              >
                <input
                  v-model="customMealName"
                  placeholder="Enter meal name"
                  class="focus:outline-none"
                />
                <button @click="addMeal(customMealName)">
                  <IconCheck class="w-4" />
                </button>
              </div>
            </div>

            <!-- Meals list -->
            <div class="flex flex-col gap-4">
              <div
                v-for="(meal, index) in trackedMeals"
                class="flex flex-col main-card main-card-padding"
              >
                <div
                  class="flex items-center gap-2 animated-button justify-between"
                  @click="meal.collapsed = !meal.collapsed"
                >
                  <div class="relative flex mx-1 ">
                    <span
                      class="text-xl font-bold invisible whitespace-pre px-4 py-0.5"
                      aria-hidden="true"
                      >{{
                        trackedMeals[index].mealName || '✍️ Meal name'
                      }}</span
                    >
                    <input
                      v-model="trackedMeals[index].mealName"
                      class="animated-button text-xl font-bold focus:outline-none absolute inset-0 px-4 py-0.5 text-center bg-main/30  cursor-text!"
                      @click.stop
                      placeholder="✍️ Meal name"
                    />
                  </div>
                  <div class="flex items-center gap-2 text-gray-600">
                    <NuxtLink
                      :to="`/recipe/${meal.recipe_id}`"
                      class="flex items-center justify-center rounded-md px-2 py-1 gap-1"
                      v-if="meal.recipe_id !== undefined"
                      @click.stop
                    >
                      <span class="text-xs hidden sm:block"
                        >Jump to recipe</span
                      >
                      <IconExternalLink class="w-5 text-base!" />
                    </NuxtLink>
                    <IconChevronDown class="w-5" v-if="meal.collapsed" />
                    <IconChevronUp class="w-5" v-else />
                    <button class="rounded-md p-1" @click="removeMeal(index)">
                      <IconTrash class="w-5" />
                    </button>
                  </div>
                </div>
                <BlocksCollapsible
                  v-model="meal.collapsed"
                  class="flex flex-col"
                >
                  <div
                    v-for="(
                      ingredient, ingredientIndex
                    ) in meal.editableIngredients"
                    :key="`${index}-${ingredientIndex}`"
                    class="pt-2"
                  >
                    <TrackingInput
                      :ref="(el) => setInputRef(index, ingredientIndex, el)"
                      v-model="
                        trackedMeals[index].editableIngredients[ingredientIndex]
                      "
                      @focus-next="focusNextInput(index, ingredientIndex)"
                      @delete-ingredient="
                        deleteIngredient(index, ingredientIndex)
                      "
                    />
                  </div>
                </BlocksCollapsible>
              </div>
            </div>
          </div>
        </div>
        <!-- Nutrition summary -->
        <div class="flex-1 flex flex-col">
          <div
            class="flex flex-col gap-2 bg-primary! main-card main-card-padding mt-4"
          >
            <div class="flex justify-between gap-10">
              <h3 class="text-4xl font-bold tracking-tighter mx-2">
                Companion
              </h3>

              <img
                class="w-30 h-30 -mt-14 object-contain rounded-full border-2 bg-primary-10 border-primary-10 hidden sm:block"
                src="/nutritionist.png"
                alt="Companion"
              />
            </div>
            <div class="flex flex-col mt-2">
              <div
                class="bg-green-100 w-4 h-4 z-0 rotate-45 -mb-2.5 self-end mr-13"
              ></div>
              <div
                class="bg-green-100 rounded-4xl p-6 z-1 text-xl font-bold text-green-800"
              >
                Great start! Your protein intake is on track for the morning.
              </div>
            </div>
            <div class="flex flex-col">
              <div
                class="bg-primary-10 w-4 h-4 z-0 rotate-45 -mb-2.5 self-end mr-13"
              ></div>
              <div class="bg-primary-10 rounded-4xl pl-6 p-4 z-1">
                Maybe focus on adding more fiber for lunch.
              </div>
            </div>
            <div class="flex flex-col">
              <div
                class="bg-primary-10 w-4 h-4 z-0 rotate-45 -mb-2.5 self-end mr-13"
              ></div>
              <div class="bg-primary-10 rounded-4xl pl-6 p-4 z-1">
                You've hit your iron intake goal already!
              </div>
            </div>
          </div>
          <img
            class="w-[80%] self-center opacity-50"
            src="/arch.png"
            alt="Summarizing grey lines"
          />
          <div class="relative">
            <div
              class="absolute top-1.5 left-1.5 w-full h-full main-card main-card-padding z-3 shadow-sm"
            ></div>
            <div
              class="absolute top-3 left-3 w-full h-full main-card main-card-padding z-2 shadow-sm"
            ></div>

            <div
              class="relative main-card main-card-padding flex flex-col items-center z-10 shadow-sm"
            >
              <h3
                class="text-4xl font-bold tracking-tighter self-start mb-4 mx-2"
              >
                Nutrition Overview
              </h3>
              <SemiRing
                :segments="[
                  {
                    value: (computedDailyNutrition?.kcal || 0) / 2100,
                    color: 'stroke-carbs',
                  },
                ]"
                ringBackground="stroke-carbs/20"
                class="w-60 sm:w-92 mt-4"
                :strokeWidth="10"
              >
                <div class="flex flex-col mb-8 items-center">
                  <h4 class="text-5xl font-bold leading-none">
                    {{ computedDailyNutrition?.kcal?.toFixed(0) || 0
                    }}<span class="text-xl font-normal">/2100</span>
                  </h4>
                  <span class="text-xl leading-none">kcal</span>
                </div>
              </SemiRing>
              <div class="flex flex-col w-full mt-6">
                <p class="text-lg">Protein</p>
                <div class="flex rounded-4xl bg-protein/10 relative h-8">
                  <div
                    class="absolute top-0 left-0 h-full rounded-4xl bg-protein flex items-center gap-2 px-2 transition-all duration-300 ease-in-out text-nowrap"
                    :style="{
                      width: `${
                        ((computedDailyNutrition?.protein || 0) / 156) * 90 + 6.5
                      }%`,
                    }"
                  >
                    <IconBeef class="w-6 shrink-0" />
                    <span class="text-xl font-bold"
                      >{{ computedDailyNutrition?.protein?.toFixed(0) || 0 }}g /
                      156g</span
                    >
                  </div>
                </div>
              </div>
              <div class="flex flex-col w-full mt-3">
                <p class="text-lg">Carbs</p>
                <div class="flex rounded-4xl bg-carbs/10 relative h-8">
                  <div
                    class="absolute top-0 left-0 h-full rounded-4xl bg-carbs flex items-center gap-2 px-2 text-nowrap"
                    :style="{
                      width: `${
                        ((computedDailyNutrition?.carbohydrates || 0) / 210) *
                          90 +
                        6.5
                      }%`,
                    }"
                  >
                    <IconWheat class="w-6 shrink-0" />
                    <span class="text-xl font-bold"
                      >{{
                        computedDailyNutrition?.carbohydrates?.toFixed(0) || 0
                      }}g / 210g</span
                    >
                  </div>
                </div>
              </div>
              <div class="flex flex-col w-full mt-3">
                <p class="text-lg">Fat</p>
                <div class="flex rounded-4xl bg-fat/10 relative h-8">
                  <div
                    class="absolute top-0 left-0 h-full rounded-4xl bg-fat flex items-center gap-2 px-2 text-nowrap"
                    :style="{
                      width: `${
                        ((computedDailyNutrition?.fat || 0) / 70) * 90 + 6.5
                      }%`,
                    }"
                  >
                    <IconDroplet class="w-6 shrink-0" />
                    <span class="text-xl font-bold"
                      >{{ computedDailyNutrition?.fat.toFixed(0) || 0 }}g /
                      70g</span
                    >
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-10">
                <div class="w-2 h-2 bg-gray-700 rounded-full"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="fixed bottom-4 right-10 z-50">
        <button
          @click="saveMeals"
          :disabled="isSaving || !hasUnsavedChanges"
          class="animated-button flex items-center gap-2 px-4 py-2 shadow-lg transition-all"
          :class="{
            'bg-primary-10': hasUnsavedChanges,
            'bg-primary-10/20': !hasUnsavedChanges,
            'opacity-50 cursor-not-allowed': isSaving,
          }"
        >
          <IconLoader class="w-4 animate-spin" v-if="isSaving" />
          <IconSave class="w-4" v-else-if="hasUnsavedChanges" />
          <IconCheck class="w-4" v-else />
          <span class="text-sm font-medium">
            {{ isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved' }}
          </span>

          <span
            v-if="lastSavedAt && !hasUnsavedChanges"
            class="text-xs opacity-70"
          >
            {{ formatTimeAgo(lastSavedAt) }}
          </span>
        </button>
      </div>

      <!-- Modal for adding a meal from a recipe-->
      <BlocksResponsiveModal v-model="showRecipeSearchModal">
        <template #default="{ isMobile }">
          <div
            class="flex flex-col gap-6 p-6 max-h-[50%] sm:min-w-120 mb-10 md:mb-0"
            @click.stop
          >
            <div class="flex flex-col gap-2">
              <h3 class="text-2xl font-bold">Add a meal from a recipe</h3>
              <input
                type="text"
                placeholder="Search..."
                class="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:border-gray-500"
                v-model="recipeSearchQuery"
              />
            </div>
            <div
              class="overflow-y-auto flex flex-col gap-2 scrollbar-hide"
              v-if="recipeSearchResults.length > 0"
            >
              <RecipeCardHorizontal
                v-for="recipe in recipeSearchResults"
                :recipe="recipe"
                class="w-full text-2xl"
                :key="`${isMobile ? 'mobile' : 'desktop'}-${recipe.id}`"
                :uniqueId="`${isMobile ? 'mobile' : 'desktop'}-${recipe.id}`"
                @click.stop.prevent.capture="handleAddMealFromRecipe(recipe.id)"
              />
            </div>
          </div>
        </template>
      </BlocksResponsiveModal>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const auth = useAuthStore();
const mounted = ref(false);

const computedDailyNutrition = ref<InsertableRecipe | null>(null);
const showRecipeSearchModal = ref(false);
const showCustomMealInput = ref(false);
const customMealName = ref('');

const recipeSearchQuery = ref('');
const recipeSearchResults = ref<RecipeOverview[]>([]);

// Use the meal tracking composable
const {
  trackedMeals,
  selectedDate,
  isSaving,
  isLoading,
  lastSavedAt,
  hasUnsavedChanges,
  setInputRef,
  focusNextInput,
  addMeal,
  addMealFromRecipe,
  removeMeal,
  deleteIngredient,
  ensureOneEmptyInput,
  loadMeals,
  saveMeals,
  formatTimeAgo,
  setupAutoSave,
} = useMealTracking();

const mealPresets = [
  'Breakfast 🥐',
  'Lunch 🍔',
  'Dinner 🍝',
  'Snack 🍟',
  'Dessert 🍰',
];

const handleAddMealFromRecipe = async (recipeId: number) => {
  showRecipeSearchModal.value = false;
  await addMealFromRecipe(recipeId);
  await computeNutrition();
};

const computeNutrition = async () => {
  //@ts-ignore
  const fullIngredients = trackedMeals.value
    .flatMap((meal) => meal.editableIngredients)
    .filter(
      (ingredient) =>
        ingredient && ingredient.foodNameId !== undefined && ingredient.amount
    )
    .map((ingredient) => ({
      ...ingredient,
      ...ingredient.foodData,
      id: ingredient.foodNameId,
    }));
  if (fullIngredients.length === 0) {
    computedDailyNutrition.value = null;
    return;
  }
  const sendingRecipe = {
    title: 'Daily Tracking',
    fullIngredients,
    serves: 1,
  } as ComputableRecipe;
  const nutrition = await $fetch('/api/calculate/recipe', {
    method: 'POST',
    body: {
      nutritionEngineArgs: {
        recipe: sendingRecipe,
        useGpt: false,
        logToReport: false,
        considerProcessing: false,
        disableSatiety: true,
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

const computeNutritionDebounced = debounce(computeNutrition, 1000);
const searchRecipesDebounced = debounce(searchRecipes, 1000);

// Track unsaved changes and compute nutrition
watch(
  trackedMeals,
  () => {
    ensureOneEmptyInput();
    computeNutritionDebounced();
    hasUnsavedChanges.value = true;
  },
  { deep: true }
);

watch(recipeSearchQuery, () => {
  searchRecipesDebounced();
});

// Load meals on mount
onMounted(async () => {
  mounted.value = true;
  await loadMeals(selectedDate.value);
  //temp
  trackedMeals.value.forEach((meal) => {
    meal.collapsed = !meal.collapsed;
  });
  await computeNutrition();
  setupAutoSave();
});
</script>

<style scoped></style>
