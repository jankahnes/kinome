<template>
  <Transition name="loaded-content">
    <div class="pt-10 pb-20 sm:pb-4 relative" v-if="mounted">
      <div class="flex gap-8 flex-wrap">
        <!-- Tracking section-->
        <div class="space-y-2 flex-1 2xl:min-w-100 bg-primary-10/40 rounded-4xl p-4">
          <h2 class="text-4xl font-bold tracking-tighter">Tracking</h2>
          <div class="flex flex-col gap-4">
            <!-- Meal adding buttons -->
            <div class="flex flex-wrap gap-2 text-lg">
              <button class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
                @click="showRecipeSearchModal = true">
                <IconPlus class="w-4" />
                Add Meal from Recipe
              </button>
              <button v-for="mealPreset in mealPresets" :key="mealPreset"
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10" @click="addMeal(mealPreset)">
                {{ mealPreset }}
              </button>
              <button v-if="!showCustomMealInput"
                class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10"
                @click="showCustomMealInput = true">
                <IconPlus class="w-4" />
                Add Other Meal
              </button>
              <div v-else class="animated-button flex items-center gap-2 px-4 py-1 bg-primary-10">
                <input v-model="customMealName" placeholder="Enter meal name" class="focus:outline-none" />
                <button @click="addMeal(customMealName)">
                  <IconCheck class="w-4" />
                </button>
              </div>
            </div>

            <!-- Meals list -->
            <EditableGroupList v-model="trackedMeals" :show-collapse="true" :show-group-header="true"
              group-name-placeholder="✍️ Meal name" :show-kcal="true" />
          </div>
        </div>
        <!-- Nutrition summary -->
        <div class="flex-1 flex flex-col gap-6 2xl:min-w-140">
          <!-- Companion -->
          <div class="flex-col gap-2 bg-primary! main-card main-card-padding mt-4 hidden">
            <div class="flex justify-between gap-10">
              <h3 class="text-4xl font-bold tracking-tighter mx-2">
                Companion
              </h3>

              <img
                class="w-30 h-30 -mt-14 object-contain rounded-full border-2 bg-primary-10 border-primary-10 hidden sm:block"
                src="/nutritionist.png" alt="Companion" />
            </div>
            <div class="flex flex-col mt-2">
              <div class="bg-green-100 w-4 h-4 z-0 rotate-45 -mb-2.5 self-end mr-13"></div>
              <div class="bg-green-100 rounded-4xl p-6 z-1 text-xl font-bold text-green-800">
                Great start! Your protein intake is on track for the morning.
              </div>
            </div>
            <div class="flex flex-col">
              <div class="bg-primary-10 w-4 h-4 z-0 rotate-45 -mb-2.5 self-end mr-13"></div>
              <div class="bg-primary-10 rounded-4xl pl-6 p-4 z-1">
                Maybe focus on adding more fiber for lunch.
              </div>
            </div>
            <div class="flex flex-col">
              <div class="bg-primary-10 w-4 h-4 z-0 rotate-45 -mb-2.5 self-end mr-13"></div>
              <div class="bg-primary-10 rounded-4xl pl-6 p-4 z-1">
                You've hit your iron intake goal already!
              </div>
            </div>
          </div>
          <!-- Nutrition Overview -->
          <NutritionOverviewCard mode="tracking" :nutrition="computedDailyNutrition"
            :tracking-goals="userTrackingGoals?.targets" @view-overall-report="showOverallReportPanel = true" />
          <!-- Nutrition Quality -->
          <NutritionQualityCards mode="info" :cards="qualityItems" :has-overall-report="true"
            @view-overall-report="showOverallReportPanel = true" @card-click="handleQualityCardClick" />
        </div>
      </div>
      <!-- Save button -->
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

      <!--Overall Report panel-->

      <BlocksResponsiveInfo v-model="showOverallReportPanel" sidePanelClass="w-96">
        <PagesReport :computedRecipe="computedDailyNutrition" />
      </BlocksResponsiveInfo>

      <!-- Micronutrient detail panel -->
      <BlocksResponsiveInfo v-model="showMicroPanel" sidePanelClass="w-96">
        <div class="p-5 flex flex-col gap-5">
          <div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Nutrition Quality</div>
            <h2 class="text-2xl font-bold">Micronutrients</h2>
          </div>
          <template v-if="micronutrientGroups.hasAny">
            <!-- Vitamins -->
            <div v-if="micronutrientGroups.vitamins.length">
              <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Vitamins</div>
              <div class="flex flex-col gap-3">
                <div v-for="nutrient in micronutrientGroups.vitamins" :key="nutrient.name">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-sm font-semibold">{{ nutrient.displayName }}</span>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs text-slate-400">{{ Math.min(nutrient.rdaPerServing, 999) }}%</span>
                      <span v-if="getOnTrackBadge(nutrient.rdaPerServing)" class="text-xs px-1.5 py-0.5 rounded-full"
                        :class="getOnTrackBadge(nutrient.rdaPerServing)!.cls">
                        {{ getOnTrackBadge(nutrient.rdaPerServing)!.label }}
                      </span>
                    </div>
                  </div>
                  <div class="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-300"
                      :class="getMicroBarClass(nutrient.rdaPerServing)"
                      :style="{ width: Math.min(120, nutrient.rdaPerServing) + '%' }" />
                  </div>
                </div>
              </div>
            </div>
            <!-- Minerals -->
            <div v-if="micronutrientGroups.minerals.length">
              <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Minerals</div>
              <div class="flex flex-col gap-3">
                <div v-for="nutrient in micronutrientGroups.minerals" :key="nutrient.name">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-sm font-semibold">{{ nutrient.displayName }}</span>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs text-slate-400">{{ Math.min(nutrient.rdaPerServing, 999) }}%</span>
                      <span v-if="getOnTrackBadge(nutrient.rdaPerServing)" class="text-xs px-1.5 py-0.5 rounded-full"
                        :class="getOnTrackBadge(nutrient.rdaPerServing)!.cls">
                        {{ getOnTrackBadge(nutrient.rdaPerServing)!.label }}
                      </span>
                    </div>
                  </div>
                  <div class="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-300"
                      :class="getMicroBarClass(nutrient.rdaPerServing)"
                      :style="{ width: Math.min(120, nutrient.rdaPerServing) + '%' }" />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-slate-400">Log some food to see micronutrient data.</p>
        </div>
      </BlocksResponsiveInfo>

      <!-- Fat quality detail panel -->
      <BlocksResponsiveInfo v-model="showFatPanel" sidePanelClass="w-96">
        <div class="p-5 flex flex-col gap-5">
          <div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Nutrition Quality</div>
            <h2 class="text-2xl font-bold">Fat Profile</h2>
          </div>
          <div v-if="fatProfile" class="flex flex-col items-center gap-4">
            <!-- Donut chart -->
            <div class="w-44 h-44">
              <Ring :segments="fatDonutSegments.map(s => ({ value: s.value, color: s.color }))" :stroke-width="13">
                <div class="text-center leading-tight">
                  <div class="text-2xl font-bold">{{ fatProfile.totalFatPer100g?.toFixed(0) }}g</div>
                  <div class="text-xs text-slate-400">per 100g</div>
                </div>
              </Ring>
            </div>
            <!-- Legend -->
            <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm w-full">
              <div v-for="seg in fatDonutSegments.filter(s => s.pct > 0)" :key="seg.label"
                class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full shrink-0" :class="seg.bgClass" />
                <span class="text-slate-600 flex-1">{{ seg.label }}</span>
                <span class="font-semibold">{{ seg.pct }}%</span>
              </div>
            </div>
          </div>
          <!-- Text insights -->
          <div class="flex flex-col gap-2">
            <div v-for="item in fatProfileReadable" :key="item.description"
              class="flex items-start gap-3 p-3 rounded-xl" :class="item.bgColor">
              <div>
                <div class="font-semibold text-sm" :class="item.color">{{ item.description }}</div>
                <div class="text-xs text-slate-500 mt-0.5">{{ item.subtitle }} of total fat</div>
              </div>
            </div>
            <p v-if="!fatProfileReadable.length" class="text-sm text-slate-400">Log some food with fat content to see
              fat
              profile data.</p>
          </div>
        </div>
      </BlocksResponsiveInfo>

      <!-- Gut health detail panel -->
      <BlocksResponsiveInfo v-model="showGutPanel" sidePanelClass="w-96">
        <div class="p-5 flex flex-col gap-5">
          <div>
            <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Nutrition Quality</div>
            <h2 class="text-2xl font-bold">Gut Health</h2>
          </div>
          <div v-if="gutHealth">
            <!-- Overall bar -->
            <div class="mb-1 flex justify-between text-sm">
              <span class="font-semibold text-slate-600">Overall Score</span>
              <span class="font-bold">{{ gutHealth.overallScore }}/100</span>
            </div>
            <div class="h-2 rounded-full bg-secondary overflow-hidden mb-5">
              <div class="h-full rounded-full bg-emerald-400 transition-all duration-300"
                :style="{ width: Math.max(0, gutHealth.overallScore) + '%' }" />
            </div>

            <!-- Gut-friendly factors -->
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Gut-friendly factors</div>
            <div class="flex flex-col gap-2 mb-5">
              <div class="flex justify-between items-center p-3 rounded-xl"
                :class="gutHealth.fiberSubScore > 50 ? 'bg-emerald-50' : gutHealth.fiberSubScore > 20 ? 'bg-secondary' : 'bg-orange-50'">
                <div>
                  <div class="font-semibold text-sm"
                    :class="gutHealth.fiberSubScore > 50 ? 'text-emerald-800' : gutHealth.fiberSubScore > 20 ? 'text-slate-600' : 'text-orange-800'">
                    Fiber density</div>
                  <div class="text-xs text-slate-500">{{ gutHealth.fiberPer2000kcal }}g per 2000 kcal</div>
                </div>
                <span class="text-xl font-bold"
                  :class="gutHealth.fiberSubScore > 50 ? 'text-emerald-700' : gutHealth.fiberSubScore > 20 ? 'text-slate-500' : 'text-orange-700'">
                  {{ gutHealth.fiberSubScore }}</span>
              </div>
              <div class="flex justify-between items-center p-3 rounded-xl"
                :class="gutHealth.polyphenolSubScore > 50 ? 'bg-emerald-50' : gutHealth.polyphenolSubScore > 20 ? 'bg-secondary' : 'bg-orange-50'">
                <div>
                  <div class="font-semibold text-sm"
                    :class="gutHealth.polyphenolSubScore > 50 ? 'text-emerald-800' : gutHealth.polyphenolSubScore > 20 ? 'text-slate-600' : 'text-orange-800'">
                    Polyphenols</div>
                  <div class="text-xs text-slate-500">Concentration {{ gutHealth.polyphenolRaw }}/10</div>
                </div>
                <span class="text-xl font-bold"
                  :class="gutHealth.polyphenolSubScore > 50 ? 'text-emerald-700' : gutHealth.polyphenolSubScore > 20 ? 'text-slate-500' : 'text-orange-700'">
                  {{ gutHealth.polyphenolSubScore }}</span>
              </div>
              <div v-if="gutHealth.uniquePlantCount > 0"
                class="flex justify-between items-center p-3 rounded-xl bg-emerald-50">
                <div>
                  <div class="font-semibold text-sm text-emerald-800">Plant variety</div>
                  <div class="text-xs text-slate-500">{{ gutHealth.uniquePlantCount }} unique plants · +{{
                    gutHealth.diversityBonus }} bonus</div>
                </div>
                <span class="text-xl font-bold text-emerald-700">{{ gutHealth.uniquePlantCount }}</span>
              </div>
            </div>

            <!-- Impact factors -->
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Impact factors</div>
            <div class="flex flex-col gap-2 mb-5">
              <div class="flex justify-between items-center p-3 rounded-xl"
                :class="gutHealth.processingSubScore > 50 ? 'bg-secondary' : gutHealth.processingSubScore > 15 ? 'bg-orange-50' : 'bg-red-50'">
                <div>
                  <div class="font-semibold text-sm"
                    :class="gutHealth.processingSubScore > 50 ? 'text-slate-600' : gutHealth.processingSubScore > 15 ? 'text-orange-800' : 'text-red-800'">
                    Processing level</div>
                  <div class="text-xs text-slate-500">NOVA {{ gutHealth.novaValue }}</div>
                </div>
                <span class="text-xl font-bold"
                  :class="gutHealth.processingSubScore > 50 ? 'text-slate-500' : gutHealth.processingSubScore > 15 ? 'text-orange-700' : 'text-red-700'">
                  {{ gutHealth.processingSubScore }}</span>
              </div>
              <div class="flex justify-between items-center p-3 rounded-xl"
                :class="gutHealth.sugarSubScore > 40 ? 'bg-secondary' : gutHealth.sugarSubScore > 15 ? 'bg-orange-50' : 'bg-red-50'">
                <div>
                  <div class="font-semibold text-sm"
                    :class="gutHealth.sugarSubScore > 40 ? 'text-slate-600' : gutHealth.sugarSubScore > 15 ? 'text-orange-800' : 'text-red-800'">
                    Sugar</div>
                  <div class="text-xs text-slate-500">{{ gutHealth.sugarPer100g }}g per 100g</div>
                </div>
                <span class="text-xl font-bold"
                  :class="gutHealth.sugarSubScore > 40 ? 'text-slate-500' : gutHealth.sugarSubScore > 15 ? 'text-orange-700' : 'text-red-700'">
                  {{ gutHealth.sugarSubScore }}</span>
              </div>
              <div class="flex justify-between items-center p-3 rounded-xl"
                :class="gutHealth.sfatSubScore > 30 ? 'bg-secondary' : gutHealth.sfatSubScore > 0 ? 'bg-orange-50' : 'bg-red-50'">
                <div>
                  <div class="font-semibold text-sm"
                    :class="gutHealth.sfatSubScore > 30 ? 'text-slate-600' : gutHealth.sfatSubScore > 0 ? 'text-orange-800' : 'text-red-800'">
                    Saturated fat</div>
                  <div class="text-xs text-slate-500">{{ gutHealth.sfatPer100g }}g per 100g</div>
                </div>
                <span class="text-xl font-bold"
                  :class="gutHealth.sfatSubScore > 30 ? 'text-slate-500' : gutHealth.sfatSubScore > 0 ? 'text-orange-700' : 'text-red-700'">
                  {{ gutHealth.sfatSubScore }}</span>
              </div>
              <div class="flex justify-between items-center p-3 rounded-xl"
                :class="gutHealth.sodiumSubScore > 30 ? 'bg-secondary' : gutHealth.sodiumSubScore > 0 ? 'bg-orange-50' : 'bg-red-50'">
                <div>
                  <div class="font-semibold text-sm"
                    :class="gutHealth.sodiumSubScore > 30 ? 'text-slate-600' : gutHealth.sodiumSubScore > 0 ? 'text-orange-800' : 'text-red-800'">
                    Sodium</div>
                  <div class="text-xs text-slate-500">{{ gutHealth.saltPer100g }}g salt per 100g</div>
                </div>
                <span class="text-xl font-bold"
                  :class="gutHealth.sodiumSubScore > 30 ? 'text-slate-500' : gutHealth.sodiumSubScore > 0 ? 'text-orange-700' : 'text-red-700'">
                  {{ gutHealth.sodiumSubScore }}</span>
              </div>
            </div>

            <!-- Daily details (recipe/diet level) -->
            <template v-if="gutHealth.addedSugarG > 0 || gutHealth.upfKcalPct > 0 || gutHealth.animalProteinG > 0">
              <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Daily details</div>
              <div class="flex flex-col gap-2">
                <div v-if="gutHealth.addedSugarG > 0" class="flex justify-between items-center p-3 rounded-xl"
                  :class="gutHealth.addedSugarG > 25 ? 'bg-red-50' : 'bg-secondary'">
                  <div>
                    <div class="font-semibold text-sm"
                      :class="gutHealth.addedSugarG > 25 ? 'text-red-800' : 'text-slate-600'">
                      Added sugar</div>
                    <div class="text-xs text-slate-500">Goal &lt; 25g per day</div>
                  </div>
                  <span class="text-xl font-bold"
                    :class="gutHealth.addedSugarG > 25 ? 'text-red-700' : 'text-slate-500'">
                    {{ gutHealth.addedSugarG }}g</span>
                </div>
                <div v-if="gutHealth.upfKcalPct > 0" class="flex justify-between items-center p-3 rounded-xl"
                  :class="gutHealth.upfKcalPct > 20 ? 'bg-red-50' : 'bg-secondary'">
                  <div>
                    <div class="font-semibold text-sm"
                      :class="gutHealth.upfKcalPct > 20 ? 'text-red-800' : 'text-slate-600'">
                      Ultra-processed foods</div>
                    <div class="text-xs text-slate-500">% of calories · goal &lt; 20%</div>
                  </div>
                  <span class="text-xl font-bold"
                    :class="gutHealth.upfKcalPct > 20 ? 'text-red-700' : 'text-slate-500'">
                    {{ gutHealth.upfKcalPct }}%</span>
                </div>
                <div v-if="gutHealth.animalProteinG > 0"
                  class="flex justify-between items-center p-3 rounded-xl bg-secondary">
                  <div>
                    <div class="font-semibold text-sm text-slate-600">Animal protein</div>
                    <div class="text-xs text-slate-500">Ideally paired with fiber</div>
                  </div>
                  <span class="text-xl font-bold text-slate-500">{{ gutHealth.animalProteinG }}g</span>
                </div>
              </div>
            </template>
          </div>
          <p v-else class="text-sm text-slate-400">Log some food to see gut health data.</p>
        </div>
      </BlocksResponsiveInfo>

      <!-- Modal for adding a meal from a recipe-->
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
const route = useRoute();
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();

function parseDateFromQuery(): Date {
  const q = route.query.date;
  if (typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
    return new Date(q + 'T12:00:00');
  }
  return new Date();
}
const userTrackingGoals = computed(() => auth.user?.user_data?.tracking);
const mounted = ref(false);

const computedDailyNutrition = ref<InsertableRecipe | null>(null);
const showRecipeSearchModal = ref(false);
const showCustomMealInput = ref(false);
const customMealName = ref('');

const recipeSearchQuery = ref('');
const recipeSearchResults = ref<RecipeOverview[]>([]);

const chosenCard = ref<'overview' | 'quality' | 'details'>('quality');

// Use the meal tracking composable
const {
  trackedMeals,
  selectedDate,
  isSaving,
  isLoading,
  lastSavedAt,
  hasUnsavedChanges,
  addMeal,
  addMealFromRecipe,
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
      name: ingredient.ingredientName
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
  })
);

// --- Quality detail panels ---
const showOverallReportPanel = ref(false);
const showMicroPanel = ref(false);
const showFatPanel = ref(false);
const showGutPanel = ref(false);

function handleQualityCardClick(title: string) {
  if (title === 'Micronutrients') showMicroPanel.value = true;
  else if (title === 'Fat Quality') showFatPanel.value = true;
  else if (title === 'Gut Health') showGutPanel.value = true;
}

const kcalProgress = computed(() => {
  const goal = userTrackingGoals.value?.targets?.kcal ?? 2000;
  return Math.max(0, (computedDailyNutrition.value?.kcal ?? 0) / goal);
});

const VITAMIN_ORDER = [
  'vitamin_a_ug_rae', 'thiamine_b1_mg', 'riboflavin_b2_mg', 'niacin_b3_mg',
  'vitamin_b6_mg', 'folate_ug_dfe', 'vitamin_b12_ug',
  'vitamin_c_mg', 'vitamin_d_ug', 'vitamin_e_mg_alpha_te', 'vitamin_k_ug',
];
const MINERAL_ORDER = [
  'calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'zinc_mg',
  'selenium_ug', 'iodine_ug', 'copper_mg', 'manganese_mg',
];
const VITAMIN_SET = new Set(VITAMIN_ORDER);

type MicroNutrient = { name: string; displayName: string; rdaPerServing: number };

const micronutrientGroups = computed(() => {
  const all: MicroNutrient[] = computedDailyNutrition.value?.report?.details?.micronutrients ?? [];
  const vitamins = all
    .filter((n) => VITAMIN_SET.has(n.name))
    .sort((a, b) => VITAMIN_ORDER.indexOf(a.name) - VITAMIN_ORDER.indexOf(b.name));
  const minerals = all
    .filter((n) => !VITAMIN_SET.has(n.name))
    .sort((a, b) => {
      const ai = MINERAL_ORDER.indexOf(a.name);
      const bi = MINERAL_ORDER.indexOf(b.name);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  return { vitamins, minerals, hasAny: all.length > 0 };
});

const fatProfile = computed(() => computedDailyNutrition.value?.report?.details?.fatProfile);
const fatProfileReadable = computed<{ description: string; subtitle: string; color: string; bgColor: string }[]>(
  () => computedDailyNutrition.value?.report?.humanReadable?.fatProfile ?? []
);

const gutHealth = computed(() => computedDailyNutrition.value?.report?.details?.gutHealth);

const fatDonutSegments = computed(() => {
  const fp = fatProfile.value;
  if (!fp) return [];
  const other = Math.max(0, 100 - fp.satFatPercent - fp.o3Percent - fp.o6Percent - fp.mufaPercent);
  return [
    { value: fp.satFatPercent / 100, color: 'stroke-orange-400', bgClass: 'bg-orange-400', label: 'Saturated', pct: Math.round(fp.satFatPercent) },
    { value: fp.o3Percent / 100, color: 'stroke-emerald-500', bgClass: 'bg-emerald-500', label: 'Omega-3', pct: Math.round(fp.o3Percent) },
    { value: fp.mufaPercent / 100, color: 'stroke-blue-400', bgClass: 'bg-blue-400', label: 'MUFA', pct: Math.round(fp.mufaPercent) },
    { value: fp.o6Percent / 100, color: 'stroke-yellow-400', bgClass: 'bg-yellow-400', label: 'Omega-6', pct: Math.round(fp.o6Percent) },
    { value: other / 100, color: 'stroke-secondary', bgClass: 'bg-secondary', label: 'Other', pct: Math.round(other) },
  ];
});

function getMicroBarClass(rda: number): string {
  if (rda >= 100) return 'bg-blue-400';
  if (rda >= 70) return 'bg-emerald-400';
  if (rda >= 40) return 'bg-yellow-400';
  return 'bg-red-400';
}

function getOnTrackBadge(rda: number): { label: string; cls: string } | null {
  if (kcalProgress.value <= 0.05) return null;
  const projected = rda / kcalProgress.value;
  if (projected >= 100) return { label: 'On track', cls: 'bg-blue-100 text-blue-700' };
  if (projected >= 70) return { label: 'On track', cls: 'bg-green-100 text-green-700' };
  if (projected >= 40) return { label: 'Moderate', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Low', cls: 'bg-red-100 text-red-700' };
}

const computeNutritionDebounced = debounce(computeNutrition, 1000);
const searchRecipesDebounced = debounce(searchRecipes, 1000);

// Track unsaved changes and compute nutrition
watch(
  trackedMeals,
  () => {
    computeNutritionDebounced();
    hasUnsavedChanges.value = true;
  },
  { deep: true }
);

watch(recipeSearchQuery, () => {
  searchRecipesDebounced();
});

// Reload when the ?date query param changes (arrow navigation from parent)
watch(() => route.query.date, async () => {
  selectedDate.value = parseDateFromQuery();
  await loadMeals(selectedDate.value);
  await computeNutrition();
});

// Load meals on mount
onMounted(async () => {
  mounted.value = true;
  selectedDate.value = parseDateFromQuery();
  await loadMeals(selectedDate.value);

  // Auto-add recipe when arriving from cook mode
  const addRecipeId = route.query.addRecipe;
  if (addRecipeId) {
    await handleAddMealFromRecipe(Number(addRecipeId));
  }

  await computeNutrition();
  setupAutoSave();
});
</script>

<style scoped></style>
