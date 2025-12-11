<template>
  <Transition name="fade">
    <div
      class="flex flex-col items-center lg:ml-1 mb-30"
      v-if="recipeStore.recipe && recipeStore.recipe?.id === id"
    >
      <NuxtImg
        class="w-full h-64 object-cover rounded-b-4xl object-top"
        :class="{ 'h-26!': !recipeStore.recipe?.picture }"
        src="/wood-2.webp"
        alt="Light wooden background"
      />
      <div
        class="hidden xl:flex absolute top-60 -translate-y-full right-4 bg-white/30 z-10 rounded-4xl items-center justify-center py-1 px-4"
        :class="{ 'top-22!': !recipeStore.recipe?.picture }"
      >
        <p
          class="text-lg flex items-center gap-2 font-bold"
          v-if="displayType === 'cuisine'"
        >
          <template
            v-if="getCuisineDescription(recipeStore.recipe?.collection ?? '')"
          >
            <span
              class="rounded-md overflow-hidden flex items-center justify-center"
              v-for="flag in getCuisineDescription(
                recipeStore.recipe?.collection ?? ''
              )?.flags"
              :key="flag"
            >
              <img
                :src="`/flags/${flag}.svg`"
                :alt="flag"
                class="h-5 inline-block"
              />
            </span>
          </template>
          {{ capitalize(recipeStore.recipe?.collection?.split('-')[1] ?? '') }}
        </p>
        <p
          class="text-base flex items-center gap-2"
          v-if="displayType === 'website'"
        >
          <IconGlobe class="w-4 h-4" />
          Imported from {{ capitalize(websiteName) }}
        </p>
        <p
          class="text-base flex items-center gap-2"
          v-if="displayType === 'creator'"
        >
          <IconVideo class="w-4 h-4" />
          Created by {{ recipeStore.recipe?.original_creator_channel_name }}
        </p>
        <p
          class="text-lg flex items-center gap-2"
          v-if="displayType === 'user'"
        >
          <Avatar :user="recipeStore.recipe?.user!" class="w-8 h-8" />
          <span class="text-lg font-semibold leading-none">{{
            recipeStore.recipe?.user?.username
          }}</span>
        </p>
      </div>
      <NuxtImg
        v-if="recipeStore.recipe?.picture"
        class="h-82 -mt-60 shadow-[#00000034] [filter:drop-shadow(10px_10px_30px_var(--tw-shadow-color))_drop-shadow(0_0_10px_#00000015)]"
        :src="recipeStore.recipe?.picture"
        :alt="recipeStore.recipe?.title ?? 'Recipe picture'"
      />
      <!-- Central overview -->
      <div
        class="max-w-[800px] flex flex-col items-center text-center mx-2 lg:mx-8 mt-2"
        :class="{ 'mt-8!': !recipeStore.recipe?.picture }"
      >
        <h1
          class="text-5xl xl:text-6xl font-bold tracking-tighter text-balance"
        >
          {{ recipeStore.recipe?.title }}
        </h1>
        <p class="text-lg text-gray-600 mt-2 leading-normal hidden xl:block">
          {{ recipeStore.recipe?.description }}
        </p>
        <p
          class="text-lg text-gray-600 mt-2 leading-normal block xl:hidden"
          v-if="mobileDescriptionExpanded"
          @click="mobileDescriptionExpanded = false"
        >
          {{ recipeStore.recipe?.description }}
        </p>
        <p
          class="text-lg text-gray-600 mt-2 leading-normal block xl:hidden"
          v-else
          @click="mobileDescriptionExpanded = true"
        >
          {{ mobileDescription }}...
          <span class="text-gray-500 text-sm cursor-pointer font-bold"
            >Show more
          </span>
        </p>
        <p class="flex gap-2 mt-2">
          <button
            class="animated-button bg-primary text-white flex-1 flex justify-center items-center gap-2 py-0.5 rounded-4xl! text-lg font-bold px-4"
          >
            <IconRocket class="w-6" :size="30" />
            Start Cooking
          </button>
          <button
            class="animated-button flex justify-center items-center gap-2 p-1 rounded-4xl! text-slate-600"
            v-if="true"
          >
            <IconNotebookPen class="w-5.5" />
          </button>
          <button
            class="animated-button flex justify-center items-center gap-0.5 pt-0.5 px-3 rounded-4xl! bg-green-200 text-green-800"
            v-else
          >
            <IconNotebookPen class="w-5.5" />
            <div class="flex flex-col items-start ml-2">
              <span class="text-lg leading-none">Track</span>
              <div class="flex items-center gap-1 leading-none text-xs -mt-1.5">
                <span class="leading-none ml-px">Fits your Diet</span>
                <IconCheck class="w-4 leading-none" />
              </div>
            </div>
          </button>
          <button
            class="animated-button flex justify-center items-center gap-2 p-1 rounded-4xl! text-slate-600"
          >
            <IconBookmark class="w-6" />
          </button>
        </p>
        <div
          class="flex items-center gap-3 mt-4"
          v-if="recipeStore.recipe?.rating != null"
        >
          <div class="flex items-center gap-2">
            <FormsRatingField
              :model-value="recipeStore.recipe?.rating"
              :star-width="26"
              :star-height="26"
              :spacing="1.5"
              :select="false"
              :uniqueId="`card-highlight-${recipeStore.recipe?.id}`"
              class="text-primary"
            />
            <span class="text-lg font-semibold leading-none mt-0.5">{{
              recipeStore.recipe?.rating?.toFixed(1)
            }}</span>
          </div>
          <template v-if="getTotalTime()">
            <span class="text-lg text-gray-600">•</span>
            <span class="text-base md:text-lg text-gray-600 leading-none"
              >⏳{{ getTotalTime() }}</span
            >
          </template>
          <template v-if="recipeStore.recipe?.difficulty">
            <span class="text-lg text-gray-600">•</span>
            <span class="text-base md:text-lg text-gray-600 leading-none"
              >👨‍🍳{{ capitalize(recipeStore.recipe?.difficulty) }}</span
            >
          </template>
        </div>

        <div
          v-if="top7Tags.length > 0"
          class="flex gap-1.5 flex-wrap overflow-hidden py-0.5 text-sm mt-2 justify-center"
        >
          <div
            class="flex items-center justify-center text-nowrap bg-slate-200/60 px-3 py-1 rounded-4xl"
            v-for="(tag, index) in top7Tags"
            :key="index"
          >
            {{ tag?.name }}
          </div>
        </div>
      </div>
      <div
        class="max-w-[1200px] flex-col xl:flex-row flex gap-10 md:mt-14 mx-2 lg:mx-8 xl:items-start"
      >
        <div class="contents xl:flex flex-col gap-8 flex-3">
          <PagesRecipeInstructionContainer
            :instructions="recipeStore.recipe?.instructions"
            :ingredients="recipeStore.recipe?.ingredients"
            :servingSize="servingSize"
            class="hidden xl:block"
            :hideHeader="false"
            :formalizationLoading="job?.step === 'formalizing_instructions'"
            ref="instructionListRef"
          >
          </PagesRecipeInstructionContainer>
          <div class="xl:hidden order-1">
            <div class="w-0 h-0" ref="mobileTabTarget"></div>
            <div
              class="flex gap-4 justify-between sticky top-0 bg-main p-4 rounded-b-4xl z-10 select-none cursor-pointer"
            >
              <h2
                class="text-3xl 2xs:text-4xl font-bold tracking-tighter flex-1"
                @click="
                  mobileTab = 'ingredients';
                  scrollIntoView(mobileTabTarget);
                "
                :class="mobileTab === 'ingredients' ? '' : 'text-gray-300'"
              >
                Ingredients
              </h2>
              <h2
                class="text-3xl 2xs:text-4xl font-bold tracking-tighter"
                @click="
                  mobileTab = 'method';
                  scrollIntoView(mobileTabTarget);
                "
                :class="mobileTab === 'method' ? '' : 'text-gray-300'"
              >
                Method
              </h2>
            </div>
            <PagesRecipeInstructionContainer
              v-if="mobileTab === 'method'"
              :instructions="recipeStore.recipe?.instructions"
              :ingredients="recipeStore.recipe?.ingredients"
              :servingSize="servingSize"
              :hideHeader="true"
              :formalizationLoading="job?.step === 'formalizing_instructions'"
            />
            <PagesRecipeIngredientList
              v-if="mobileTab === 'ingredients'"
              :addedInfo="{
                addedFat: recipeStore.recipe?.added_fat ?? 0,
                addedSalt: recipeStore.recipe?.added_salt ?? 0,
                batchSize: recipeStore.recipe?.batch_size ?? 1,
              }"
              :ingredients="recipeStore.recipe?.ingredients"
              :baseIngredients="recipeStore.recipe?.base_ingredients ?? []"
              :batchSize="recipeStore.recipe?.batch_size ?? undefined"
              :recipeId="recipeStore.recipe?.id"
              v-model:servingSize="servingSize"
              :formalizationLoading="job?.step === 'formalizing_ingredients'"
              :price="recipeStore.recipe?.price ?? 0"
              :hideHeader="true"
              :metaPills="metaPills"
            />
          </div>
          <div
            class="space-y-2 order-4 xl:order-none"
            v-if="recipeStore.recipe?.kcal"
          >
            <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
              Health & Nutrition
            </h2>
            <div class="flex flex-wrap gap-4">
              <div class="main-card p-6 flex flex-col basis-120 flex-1">
                <div class="flex gap-2 justify-between">
                  <div class="flex flex-col flex-1 gap-1">
                    <div class="flex justify-between">
                      <span class="text-7xl font-bold leading-14">
                        <span>{{ recipeStore.recipe?.kcal ?? 0 }}</span>
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
                    <div class="flex items-center gap-2">
                      <div class="bg-carbs px-2 py-1 rounded-4xl">
                        <span>{{
                          recipeStore.recipe?.carbohydrates?.toFixed(0) ?? 0
                        }}</span>
                        <span>g Carbs</span>
                      </div>
                      <div class="bg-protein px-2 py-1 rounded-4xl">
                        <span>{{
                          recipeStore.recipe?.protein?.toFixed(0) ?? 0
                        }}</span>
                        <span>g Protein</span>
                      </div>
                      <div class="bg-fat px-2 py-1 rounded-4xl">
                        <span>{{
                          recipeStore.recipe?.fat?.toFixed(0) ?? 0
                        }}</span>
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
                <div class="flex gap-2 flex-wrap mt-4 self-start">
                  <button
                    class="animated-button bg-slate-100 rounded-4xl px-4 py-1 flex items-center gap-2"
                    @click="
                      contextMode = 'nutrition';
                      contextModalOpen = true;
                    "
                  >
                    <IconTag class="w-5" />
                    <span>View Full Nutrition</span>
                  </button>
                  <button
                    class="animated-button bg-slate-100 rounded-4xl px-2 md:px-4 py-1 flex items-center gap-2"
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
              <div
                class="bg-primary-10 flex flex-col gap-1 p-2 md:p-4 rounded-4xl items-center justify-center flex-1 basis-auto sm:basis-1/4"
                v-if="nutritionHighlights.length > 0"
              >
                <div
                  class="flex justify-center items-center text-4xl font-bold h-18 min-w-18 rounded-2xl"
                  :class="
                    gradeColors[getGrade(recipeStore.recipe?.hidx, 'ovr')]
                  "
                >
                  {{ getGrade(recipeStore.recipe?.hidx, 'ovr') }}
                </div>
                <span class="text-lg font-bold tracking-tighter text-center"
                  >Health Grade</span
                >
              </div>
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
          <div class="space-y-2 order-5 xl:order-none" v-if="auth.isAdmin()">
            <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
              Publish
            </h2>
            <PagesRecipePublishChecklist
              :recipe="recipeStore.recipe!"
              :refresh="async (r, f) => {}"
            />
          </div>
          <div class="space-y-2 order-5 xl:order-none">
            <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
              {{
                recipeStore.recipe?.comments?.length
                  ? 'What others say'
                  : 'Comments'
              }}
            </h2>
            <PagesRecipeCommentSection :id="recipeStore.recipe?.id" />
          </div>
        </div>
        <div
          class="contents xl:flex flex-col gap-8 flex-2"
          ref="rightRailRef"
          :style="stickyStyle"
          :class="{
            'xl:sticky xl:top-4': shouldStick,
          }"
        >
          <div>
            <PagesRecipeIngredientList
              :addedInfo="{
                addedFat: recipeStore.recipe?.added_fat ?? 0,
                addedSalt: recipeStore.recipe?.added_salt ?? 0,
                batchSize: recipeStore.recipe?.batch_size ?? 1,
              }"
              :ingredients="recipeStore.recipe?.ingredients"
              :baseIngredients="recipeStore.recipe?.base_ingredients ?? []"
              :batchSize="recipeStore.recipe?.batch_size ?? undefined"
              :recipeId="recipeStore.recipe?.id"
              v-model:servingSize="servingSize"
              class="hidden xl:block"
              :formalizationLoading="job?.step === 'formalizing_ingredients'"
              :price="recipeStore.recipe?.price ?? 0"
              ref="ingredientListRef"
              :metaPills="metaPills"
            ></PagesRecipeIngredientList>
          </div>
          <div class="space-y-2 order-6 xl:order-none">
            <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
              Similar Recipes
            </h2>
            <div class="flex flex-col gap-4">
              <RecipeCardHorizontal
                v-for="recipe in similarRecipes"
                :key="recipe.id"
                :recipe="recipe"
                class="-ml-2"
              />
            </div>
          </div>
        </div>
      </div>
      <BlocksResponsiveInfo
        v-if="recipeStore.recipe?.kcal && recipeStore.recipe?.hidx"
        v-model="contextModalOpen"
        :sidePanelClass="`w-${contextMode === 'health' ? '150' : '120'}`"
      >
        <div v-if="contextMode === 'nutrition'" class="m-4">
          <h2 class="text-4xl font-bold tracking-tighter mb-8">
            Full Nutrition
          </h2>
          <FoodNutritionFacts :computable="recipeStore.recipe" />
          <FoodFullNutritionFacts :recipe="recipeStore.recipe" class="mt-10" />
        </div>
        <PagesReport
          v-if="contextMode === 'health'"
          :id="recipeStore.recipe?.id?.toString() ?? ''"
          :isFood="false"
        />
      </BlocksResponsiveInfo>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';

const route = useRoute();
const router = useRouter();
const recipeStore = useRecipeStore();
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 1280);
const mobileTab = ref<'method' | 'ingredients'>('ingredients');
const mobileDescriptionExpanded = ref(false);
const mobileDescription = computed(() => {
  return recipeStore.recipe?.description?.slice(0, 150);
});

const mobileTabTarget = ref<HTMLElement | null>(null);

const contextModalOpen = ref(false);
const contextMode = ref<'nutrition' | 'health'>('nutrition');

// Refs for sticky behavior
const instructionListRef = ref<any>(null);
const ingredientListRef = ref<any>(null);
const rightRailRef = ref<HTMLElement | null>(null);

// Heights and sticky state
const instructionHeight = ref(0);
const ingredientHeight = ref(0);
const containerTop = ref(0);
const maxScrollPosition = ref(0);
const scrollY = ref(0);

const topOffset = 16;
// Computed properties for sticky behavior
const shouldStick = computed(() => {
  if (isMobile.value) return false;
  return (
    ingredientHeight.value > 0 &&
    instructionHeight.value > 0 &&
    ingredientHeight.value < instructionHeight.value - topOffset
  );
});

const stickyStyle = computed(() => {
  if (!shouldStick.value) return {};
  const maxScroll =
    containerTop.value +
    instructionHeight.value -
    ingredientHeight.value -
    topOffset;

  if (scrollY.value >= maxScroll) {
    const offset = maxScroll - containerTop.value;
    return {
      position: 'relative' as const,
      top: `${offset + topOffset}px`,
    };
  }

  return {};
});

const measureHeights = () => {
  if (isMobile.value || !import.meta.client) return;

  nextTick(() => {
    const instructionComponent = instructionListRef.value;
    const ingredientComponent = ingredientListRef.value;
    const containerEl = rightRailRef.value;

    if (!instructionComponent || !ingredientComponent || !containerEl) return;

    const instructionRoot = instructionComponent.root;
    const ingredientRoot = ingredientComponent.root;

    const instructionEl =
      instructionRoot?.value || instructionRoot || instructionComponent.$el;
    const ingredientEl =
      ingredientRoot?.value || ingredientRoot || ingredientComponent.$el;

    if (instructionEl && ingredientEl && containerEl) {
      const instructionHeightNew =
        instructionEl.offsetHeight ||
        instructionEl.getBoundingClientRect().height;
      const ingredientHeightNew =
        ingredientEl.offsetHeight ||
        ingredientEl.getBoundingClientRect().height;

      if (instructionHeightNew > 0 && ingredientHeightNew > 0) {
        instructionHeight.value = instructionHeightNew;
        ingredientHeight.value = ingredientHeightNew;

        const containerRect = containerEl.getBoundingClientRect();
        containerTop.value = containerRect.top + window.scrollY;

        maxScrollPosition.value =
          containerTop.value +
          instructionHeight.value -
          ingredientHeight.value -
          topOffset;
      }
    }
  });
};

const paramValue = route.params.id as string;
const id = Number(paramValue.split('-')[0]);

const similarRecipes = ref<RecipeOverview[]>([]);

// Serving size state - managed at page level for both IngredientList and InstructionContainer
const servingSize = ref(2); // Default to 2 servings

const top7Tags = computed(() => {
  if (!recipeStore.recipe?.tags) return [];
  const tags = recipeStore.recipe.tags.map((tag) => getTagByID(tag));
  tags?.sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));
  return tags?.slice(0, 7);
});

const cuisines = ref([
  { name: 'basque', flags: ['es-pv'] },
  { name: 'eastern-european', flags: ['pl', 'cz', 'hu'] },
  { name: 'greek', flags: ['gr'] },
  { name: 'italian', flags: ['it'] },
  { name: 'korean', flags: ['kr'] },
  { name: 'malaysian', flags: ['my'] },
  { name: 'middle-eastern', flags: ['lb', 'tr', 'jo'] },
  { name: 'portuguese', flags: ['pt'] },
  { name: 'russian', flags: ['ru'] },
  { name: 'scandinavian', flags: ['se', 'no', 'dk'] },
  { name: 'thai', flags: ['th'] },
  { name: 'vietnamese', flags: ['vn'] },
  { name: 'german', flags: ['de'] },
  { name: 'american', flags: ['us'] },
  { name: 'indian', flags: ['in'] },
  { name: 'japanese', flags: ['jp'] },
  { name: 'chinese', flags: ['cn'] },
  { name: 'mexican', flags: ['mx'] },
  { name: 'spanish', flags: ['es'] },
  { name: 'turkish', flags: ['tr'] },
  { name: 'south-african', flags: ['za'] },
  { name: 'egyptian', flags: ['eg'] },
  { name: 'moroccan-maghreb', flags: ['ma', 'dz', 'tn'] },
  { name: 'west-african', flags: ['ng', 'gh', 'sn'] },
  { name: 'ethiopian', flags: ['et'] },
  { name: 'brazilian', flags: ['br'] },
  { name: 'british', flags: ['gb'] },
  { name: 'french', flags: ['fr'] },
]);

const displayType = computed(() => {
  if (
    recipeStore.recipe?.collection &&
    recipeStore.recipe?.collection.startsWith('traditional')
  )
    return 'cuisine';
  else if (recipeStore.recipe?.source_type === 'WEBSITE') return 'website';
  else if (recipeStore.recipe?.source_type === 'MEDIA') return 'creator';
  else if (recipeStore.recipe?.user_id) return 'user';
  return null;
});

const websiteName = computed(() => {
  if (!recipeStore.recipe?.source) return '';
  const url = new URL(recipeStore.recipe.source);
  const parts = url.hostname.split('.');
  const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  return domain;
});

const iconStyles = {
  youtube: 'w-4 h-3 my-1',
  tiktok: 'w-5 h-5',
  instagram: 'w-4 h-4 my-0.5',
};
const bgStyles = {
  youtube: 'bg-red-200/90',
  instagram: 'bg-yellow-100/90',
  tiktok: 'bg-gray-200/90',
};

const getCuisineDescription = (collection: string) => {
  if (displayType.value !== 'cuisine') return null;
  const cuisineName = collection.split('-')[1];
  const cuisine = cuisines.value.find(
    (cuisine) => cuisine.name === cuisineName
  );
  return cuisine ?? null;
};

// Job polling
const jobId = ref(Number(route.query.poll as string) || null);
const { job, isPolling, error, start, stop, restart, fetchJob } = useJobPolling(
  jobId,
  supabase
);

const loadingStore = useLoadingStore();

const loadingMessages = {
  formalizing_ingredients: 'Analyzing ingredients ✨',
  formalizing_instructions: 'Analyzing instructions ✨',
  pre_publish: 'Finishing up 🎉',
  '': '',
  idle: '',
} as Record<string, string>;

function onJobStepChange(newStep: string | null, oldStep: string | null) {
  loadingStore.displayToast(loadingMessages[newStep ?? ''] ?? '');
  if (newStep === 'formalizing_ingredients' && job.value?.message) {
    loadingStore.displayToast(job.value?.message);
  }
  if (newStep !== oldStep && oldStep != null) {
    loadRecipeWithoutLoading();
    if (!newStep) {
      loadingStore.displayTransientToast('Done! 🎉');
      stop();
    }
  }
}

watch(
  () => job.value?.step,
  (newStep, oldStep) => {
    onJobStepChange(newStep, oldStep);
  }
);

const {
  data: recipeData,
  error: recipeError,
  refresh: refreshRecipe,
} = await useAsyncData(
  `recipe-details-${id}`,
  () => getRecipe(supabase, { eq: { id } }),
  {
    lazy: import.meta.client,
  }
);

// Re-fetch recipe data without showing loading state (for job polling updates)
const loadRecipeWithoutLoading = async () => {
  await refreshRecipe();
};

// Set recipe in store and handle redirects
watchEffect(async () => {
  if (recipeData.value) {
    recipeStore.setRecipe(recipeData.value as Recipe);
    servingSize.value = recipeData.value.batch_size ?? 2;

    // Redirect from non-slugified URL to slugified URL
    if (recipeData.value.title && !paramValue.includes('-')) {
      navigateTo(getRecipeUrl(id, recipeData.value.title), { replace: true });
    }

    similarRecipes.value = await getRecipeOverviews(supabase, {
      neq: { id },
      or: 'picture.not.eq.null,source_type.eq.MEDIA',
      trigram_search: {
        query: recipeStore.recipe?.title ?? '',
        column: 'title',
      },
      limit: 3,
    });
  }
});

const recipeUrl = computed(
  () =>
    `https://kinome.app${getRecipeUrl(
      recipeStore.recipe?.id ?? 0,
      recipeStore.recipe?.title ?? ''
    )}`
);

const imageUrl = computed(
  () =>
    recipeStore.recipe?.picture ||
    recipeStore.recipe?.social_picture ||
    'https://kinome.app/feast.png'
);

const healthGrade = computed(() =>
  recipeStore.recipe?.hidx ? getGrade(recipeStore.recipe?.hidx, 'ovr') : null
);

const description = computed(
  () =>
    `${recipeStore.recipe?.title} recipe nutrition facts: ${recipeStore.recipe?.kcal} kcal/100g, Nutrition Quality: ${healthGrade.value}. Discover in-depth nutritional analyis.`
);

useHead(() => ({
  title: `${recipeStore.recipe?.title} Recipe - Method & Nutrition | Kinome`,
  meta: [
    {
      name: 'description',
      content: description.value,
    },
    {
      property: 'og:title',
      content: `${recipeStore.recipe?.title} Recipe | Kinome`,
    },
    {
      property: 'og:description',
      content: description.value,
    },
    {
      property: 'og:type',
      content: 'article',
    },
    {
      property: 'og:url',
      content: recipeUrl.value,
    },
    {
      property: 'og:image',
      content: imageUrl.value,
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: `${recipeStore.recipe?.title} Recipe`,
    },
    {
      name: 'twitter:description',
      content: description.value,
    },
    {
      name: 'twitter:image',
      content: imageUrl.value,
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: recipeUrl.value,
    },
  ],
}));

const scrollIntoView = async (target: any, offset: number = 0) => {
  if (!target) return;

  let domElement: HTMLElement;
  if (target.$el) {
    domElement = target.$el;
  } else {
    domElement = target;
  }

  if (!domElement || !domElement.getBoundingClientRect) return;

  const targetRect = domElement.getBoundingClientRect();
  const targetTop = targetRect.top + window.pageYOffset;

  window.scrollTo({
    top: targetTop - offset,
    behavior: 'smooth',
  });
};

const handleScroll = () => {
  scrollY.value = window.scrollY;
};

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  if (
    !recipeStore.recipe?.picture &&
    recipeStore.recipe?.source_type === 'MEDIA'
  ) {
    recipeStore.recipe.social_picture = await recipeStore.getSocialPicture(
      recipeStore.recipe.source ?? ''
    );
  }
  start();
  const { track, trackTimeSpent } = useEngagement();
  track(id, 'click');
  trackTimeSpent(id);

  // Set up sticky behavior
  scrollY.value = window.scrollY;
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', measureHeights, { passive: true });

  // Set up ResizeObserver for dynamic height changes
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      measureHeights();
    });

    nextTick(() => {
      const instructionComponent = instructionListRef.value;
      const ingredientComponent = ingredientListRef.value;

      if (instructionComponent?.root) {
        const instructionEl =
          instructionComponent.root?.value || instructionComponent.root;
        if (instructionEl) resizeObserver?.observe(instructionEl);
      }

      if (ingredientComponent?.root) {
        const ingredientEl =
          ingredientComponent.root?.value || ingredientComponent.root;
        if (ingredientEl) resizeObserver?.observe(ingredientEl);
      }
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', measureHeights);
  resizeObserver?.disconnect();
});

const deleteRecipe = async () => {
  await $fetch('/api/db/delete-recipe', {
    method: 'POST',
    body: {
      recipeId: id,
    },
  });
  recipeStore.deleteRecipe(id);
  recipeStore.setRecipe({} as Recipe);
  router.push('/');
};

function getTotalTime() {
  if (recipeStore.recipe?.total_time_mins) {
    return `${recipeStore.recipe?.total_time_mins}min`;
  }
  if (recipeStore.recipe?.effort === 'LIGHT') {
    return '<20min';
  }
  if (recipeStore.recipe?.effort === 'MODERATE') {
    return '40min';
  }
  if (recipeStore.recipe?.effort === 'HEAVY') {
    return '>60min';
  }
  return null;
}

// Macro percentages for ring display
const macroRingPercentages = computed(() => {
  if (!recipeStore.recipe || !recipeStore.recipe?.kcal) return null;
  const recipe = recipeStore.recipe;
  const usedKcal =
    4 * (recipe.carbohydrates ?? 0) +
    4 * (recipe.protein ?? 0) +
    9 * (recipe.fat ?? 0);
  const percentages = {
    carbsPercent: ((recipe.carbohydrates ?? 0) * 4) / usedKcal,
    proteinPercent: ((recipe.protein ?? 0) * 4) / usedKcal,
    fatPercent: ((recipe.fat ?? 0) * 9) / usedKcal,
  };
  for (const [key, value] of Object.entries(percentages)) {
    if (value > 0) {
      percentages[key as keyof typeof percentages] = value;
    }
  }
  return percentages;
});

const nutritionHighlights = computed(() => {
  //@ts-ignore
  return getNutritionHighlightCards(recipeStore.recipe);
});

const metaGenerics: { name: string; value: number }[] = [
  { name: 'Vegetarian', value: 103 },
  { name: 'Vegan', value: 102 },
  { name: 'Gluten Free', value: 107 },
  { name: 'Lactose Free', value: 112 },
];

const metaPills = computed(() => {
  if (!recipeStore.recipe) return [];
  const pills = [];
  for (const generic of metaGenerics) {
    const hasGeneric = recipeStore.recipe.tags.includes(generic.value);
    pills.push({
      text: hasGeneric ? generic.name : `Not ${generic.name}`,
      class: hasGeneric ? 'bg-green-100' : 'bg-red-100',
      icon: hasGeneric ? 'check' : 'x',
    });
  }
  return pills;
});
</script>
