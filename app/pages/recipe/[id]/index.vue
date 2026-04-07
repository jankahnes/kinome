<template>
  <div class="flex flex-col items-center lg:ml-1 mb-30" v-if="recipeStore.recipe && recipeStore.recipe?.id === id">
    <NuxtImg class="w-full h-64 object-cover rounded-br-4xl object-top"
      :class="{ 'h-26!': !recipeStore.recipe?.picture }" src="/wood.png" alt="Light wooden background" />
    <div
      class="hidden absolute top-60 -translate-y-full right-4 bg-white/30 z-10 rounded-4xl items-center justify-center py-1 px-3 overflow-hidden"
      :class="{ 'top-22!': !recipeStore.recipe?.picture }">
      <p class="text-lg flex items-center gap-2 font-bold" v-if="displayType === 'cuisine'">
        <template v-if="getCuisineDescription(recipeStore.recipe?.collection ?? '')">
          <span class="rounded-md overflow-hidden flex items-center justify-center" v-for="flag in getCuisineDescription(
            recipeStore.recipe?.collection ?? '',
          )?.flags" :key="flag">
            <img :src="`/flags/${flag}.svg`" :alt="flag" class="h-5 inline-block" />
          </span>
        </template>
        {{ capitalize(recipeStore.recipe?.collection?.split('-')[1] ?? '') }}
      </p>
      <p class="text-base flex items-center gap-2" v-if="displayType === 'website'">
        <IconGlobe class="w-4 h-4" />
        Imported from {{ capitalize(websiteName) }}
      </p>
      <a class="text-base flex items-center gap-2 cursor-pointer" v-if="displayType === 'creator'"
        :href="effectiveSource ?? ''" target="_blank">
        <IconVideo class="w-4 h-4" />
        Created by {{ (recipeStore.recipe?.video_metadata as any)?.channel }}
      </a>
      <p class="text-lg flex items-center gap-2" v-if="displayType === 'user'">
        <Avatar :user="recipeStore.recipe?.user!" class="w-10 -my-1 -ml-3" />
        <span class="text-lg font-semibold leading-none">{{
          recipeStore.recipe?.user?.username
          }}</span>
      </p>
      <NuxtLink :to="`/recipe/new?editCurrent=true`" class="hidden items-center gap-2 cursor-pointer">
        <IconPencil class="w-4 h-4" />
      </NuxtLink>
    </div>
    <NuxtImg v-if="recipeStore.recipe?.picture"
      class="h-82 -mt-60 shadow-[#00000034] [filter:drop-shadow(10px_10px_30px_var(--tw-shadow-color))_drop-shadow(0_0_10px_#00000015)]"
      :src="recipeStore.recipe?.picture" :alt="recipeStore.recipe?.title ?? 'Recipe picture'" />
    <!-- Central overview -->
    <div class="max-w-[800px] flex flex-col items-center text-center mx-2 lg:mx-8 mt-2"
      :class="{ 'mt-8!': !recipeStore.recipe?.picture }">
      <h1 class="text-5xl xl:text-6xl font-bold tracking-tighter text-balance">
        {{ recipeStore.recipe?.title }}
      </h1>
      <p class="text-lg text-gray-600 mt-2 leading-normal hidden xl:block">
        {{ recipeStore.recipe?.description }}
      </p>
      <p class="text-lg text-gray-600 mt-2 leading-normal block xl:hidden" v-if="mobileDescriptionExpanded"
        @click="mobileDescriptionExpanded = false">
        {{ recipeStore.recipe?.description }}
      </p>
      <p class="text-lg text-gray-600 mt-2 leading-normal block xl:hidden" v-else
        @click="mobileDescriptionExpanded = true">
        {{ mobileDescription }}...
        <span class="text-gray-500 text-sm cursor-pointer font-bold">Show more
        </span>
      </p>
      <p class="flex gap-2 mt-2">
        <button
          class="animated-button bg-primary text-white flex-1 flex justify-center items-center gap-2 py-0.5 text-lg font-bold px-4"
          @click="cookModeOpen = true">
          <IconRocket class="w-6" :size="30" />
          Start Cooking
        </button>
        <button class="animated-button bg-primary-10 flex justify-center items-center gap-1 px-2"
          v-if="effectiveSource && recipeStore.recipe?.source_type === 'MEDIA'" @click="scrollToWatchSection()">
          <IconChevronDown class="h-5" />
          <span class="leading-none font-bold">Watch Video</span>
        </button>
        <button v-if="!trackingAdded" class="animated-button flex justify-center items-center gap-2 p-1 text-slate-600"
          :class="{ 'opacity-60 cursor-not-allowed': trackingLoading }" :disabled="trackingLoading"
          title="Track this meal" @click="trackFromRecipePage">
          <IconLoaderCircle v-if="trackingLoading" class="w-5.5 animate-spin" />
          <IconNotebookPen v-else class="w-5.5" />
        </button>
        <button v-else
          class="animated-button flex justify-center items-center gap-0.5 pt-0.5 px-3 bg-green-100 text-green-800"
          disabled>
          <IconCheck class="w-5" />
          <div class="flex flex-col items-start ml-2">
            <span class="text-lg leading-none">Tracked</span>
            <span class="leading-none text-[11px] -mt-0.5">Added to today</span>
          </div>
        </button>
        <button
          class="animated-button flex justify-center items-center gap-2 p-1 text-slate-600 transition-all duration-200"
          :class="{
            '': isBookmarked,
            'opacity-60 cursor-not-allowed': bookmarkLoading,
          }" :disabled="bookmarkLoading" :title="isBookmarked ? 'Remove bookmark' : 'Bookmark this recipe'"
          @click="toggleBookmark">
          <IconLoaderCircle v-if="bookmarkLoading" class="w-5.5 animate-spin" />
          <IconBookmark v-else class="w-6" :class="{ 'fill-current': isBookmarked }" />
        </button>
      </p>
      <div class="flex items-center gap-3 mt-4" v-if="recipeStore.recipe?.rating != null">
        <div class="flex items-center gap-2">
          <FormsRatingField :model-value="recipeStore.recipe?.rating" :star-width="26" :star-height="26" :spacing="1.5"
            :select="false" :uniqueId="`card-highlight-${recipeStore.recipe?.id}`" class="text-primary" />
          <span class="text-lg font-semibold leading-none mt-0.5">{{
            recipeStore.recipe?.rating?.toFixed(1)
            }}</span>
        </div>
        <template v-if="getTotalTime()">
          <span class="text-lg text-gray-600">•</span>
          <span class="text-base md:text-lg text-gray-600 leading-none">⏳{{ getTotalTime() }}</span>
        </template>
        <template v-if="recipeStore.recipe?.difficulty">
          <span class="text-lg text-gray-600">•</span>
          <span class="text-base md:text-lg text-gray-600 leading-none">👨‍🍳{{
            capitalize(recipeStore.recipe?.difficulty) }}</span>
        </template>
      </div>

      <div v-if="top7Tags.length > 0" class="flex gap-1.5 flex-wrap overflow-hidden py-0.5 text-sm mt-2 justify-center">
        <div
          class="flex items-center justify-center text-nowrap bg-slate-200/50 px-2 py-1 rounded-4xl gap-2 leading-none"
          :class="specialTags.includes(tag?.id ?? 0) || tag?.id === 4
            ? 'bg-slate-200/70!'
            : ''
            " v-for="(tag, index) in top7Tags" :key="index">
          <img :src="`/${tag?.name}.webp`" :alt="tag?.name" class="h-4" v-if="specialTags.includes(tag?.id ?? 0)" />
          <IconDollarSign class="h-4 -mx-2" v-else-if="tag?.id === 4" />
          {{ tag?.name }}
        </div>
      </div>
    </div>
    <div class="max-w-[1200px] flex-col xl:flex-row flex gap-10 md:mt-14 mx-2 lg:mx-8 xl:items-start">
      <div class="contents xl:flex flex-col gap-8 flex-3">
        <PagesRecipeCookSteps :fullInstructions="recipeStore.recipe?.full_instructions ??
          recipeStore.recipe?.instructions?.map((i) => ({
            formatted_text: i,
          })) ??
          []
          " :ingredients="recipeStore.recipe?.ingredients" :servingSize="servingSize"
          :formalizationLoading="job?.step === 'formalizing_instructions'" v-model:markedIngredients="markedIngredients"
          class="hidden xl:block" ref="instructionListRef" />
        <div class="xl:hidden order-1">
          <div class="w-0 h-0" ref="mobileTabTarget"></div>
          <div
            class="flex gap-4 justify-between sticky top-0 bg-main p-4 rounded-b-4xl z-10 select-none cursor-pointer">
            <h2 class="text-3xl 2xs:text-4xl font-bold tracking-tighter flex-1" @click="
              mobileTab = 'ingredients';
            scrollIntoView(mobileTabTarget);
            " :class="mobileTab === 'ingredients' ? '' : 'text-gray-300'">
              Ingredients
            </h2>
            <h2 class="text-3xl 2xs:text-4xl font-bold tracking-tighter" @click="
              mobileTab = 'method';
            scrollIntoView(mobileTabTarget);
            " :class="mobileTab === 'method' ? '' : 'text-gray-300'">
              Method
            </h2>
          </div>
          <PagesRecipeCookSteps v-if="mobileTab === 'method'" v-model:markedIngredients="markedIngredients"
            :fullInstructions="recipeStore.recipe?.full_instructions ??
              recipeStore.recipe?.instructions?.map((i) => ({
                formatted_text: i,
              })) ??
              []
              " :ingredients="recipeStore.recipe?.ingredients" :servingSize="servingSize"
            :formalizationLoading="job?.step === 'formalizing_instructions'" :hideHeader="true" />
          <PagesRecipeIngredientList v-if="mobileTab === 'ingredients'" :addedInfo="{
            addedFat: recipeStore.recipe?.added_fat ?? 0,
            addedSalt: recipeStore.recipe?.added_salt ?? 0,
            batchSize: recipeStore.recipe?.batch_size ?? 1,
          }" :ingredients="recipeStore.recipe?.ingredients"
            :baseIngredients="recipeStore.recipe?.base_ingredients ?? []"
            :batchSize="recipeStore.recipe?.batch_size ?? undefined" :recipeId="recipeStore.recipe?.id"
            v-model:servingSize="servingSize" :formalizationLoading="job?.step === 'formalizing_ingredients'"
            :price="recipeStore.recipe?.price ?? 0" :hideHeader="true" :metaPills="metaPills" />
        </div>
        <div class="space-y-2 order-3 xl:order-none" v-if="recipeStore.recipe?.kcal">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
            Health & Nutrition
          </h2>
          <NutritionHighlightGrid :nutrition-data="recipeStore.recipe" type="full" @viewFullNutrition="
            contextMode = 'nutrition';
          contextModalOpen = true;
          " @viewFullAnalysis="
            contextMode = 'health';
          contextModalOpen = true;
          " />
        </div>
        <div class="space-y-2 order-4 xl:order-none" v-if="auth.isAdmin()">
          <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">Publish</h2>
          <PagesRecipePublishChecklist :recipe="recipeStore.recipe!" :refresh="async (r, f) => { }" />
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
      <div class="contents xl:block flex-2" :style="rightColumnStyle">
        <div class="contents xl:flex flex-col gap-8" ref="rightRailRef" :style="stickyStyle" :class="{
          'xl:sticky xl:top-4': shouldStick,
        }">
          <div>
            <PagesRecipeIngredientList :addedInfo="{
              addedFat: recipeStore.recipe?.added_fat ?? 0,
              addedSalt: recipeStore.recipe?.added_salt ?? 0,
              batchSize: recipeStore.recipe?.batch_size ?? 1,
            }" :ingredients="recipeStore.recipe?.ingredients"
              :baseIngredients="recipeStore.recipe?.base_ingredients ?? []"
              :batchSize="recipeStore.recipe?.batch_size ?? undefined" :recipeId="recipeStore.recipe?.id"
              v-model:servingSize="servingSize" class="hidden xl:block"
              :formalizationLoading="job?.step === 'formalizing_ingredients'" :price="recipeStore.recipe?.price ?? 0"
              ref="ingredientListRef" :metaPills="metaPills" :markedIngredients="markedIngredients">
            </PagesRecipeIngredientList>
          </div>
          <div class="space-y-2 order-2 xl:order-none rounded-4xl" :class="{ 'watch-flash': watchSectionFlashing }"
            v-if="effectiveSource && recipeStore.recipe?.source_type === 'MEDIA'">
            <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2" ref="watchSectionTarget">Watch</h2>
            <div class="flex main-card main-card-padding sm:gap-6">
              <div class="flex flex-col flex-1 justify-between ">
                <div>
                  <a class="text-sm uppercase text-slate-400 tracking-tight" :href="effectiveSource ?? ''"
                    target="_blank">
                    Original video
                  </a>
                  <p class="text-xs text-slate-400 tracking-tight -mt-1">Uploaded {{ uploadDate }}</p>
                </div>
                <div class="flex flex-col gap-2 items-center p-4 -mx-6 bg-secondary">
                  <img class="w-20 h-20 object-cover rounded-full opacity-80 shadow-[0_0_10px_#00000020]"
                    src="/neutral-avatar1.webp" alt="Guest avatar" />
                  <div class="flex items-center gap-2 bg-primary-10 px-3 rounded-3xl ">
                    <img :src="`/${getWebsiteName(effectiveSource)}.webp`" :alt="getWebsiteName(effectiveSource)"
                      class="h-5" />
                    <h3 class="text-lg sm:text-xl font-bold tracking-tight truncate max-w-48">
                      {{ (recipeStore.recipe?.video_metadata as any)?.channel }}
                    </h3>
                  </div>
                </div>
                <div class="flex flex-col gap-2 pt-2 sm:pt-6">
                  <div class="flex flex-wrap gap-2 max-h-5 overflow-hidden">
                    <span class="text-sm text-blue-500" v-for="hashtag in (
                      recipeStore.recipe?.video_metadata as any
                    )?.tags ?? []" :key="hashtag">
                      #{{ hashtag }}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-sm uppercase bg-slate-100 px-2 py-1 rounded-3xl flex items-center gap-1" v-if="
                      (recipeStore.recipe?.video_metadata as any)?.view_count
                    ">
                      <IconEye class="w-4 h-4" />
                      {{
                        getSocialProof(
                          (recipeStore.recipe?.video_metadata as any)?.view_count,
                        )
                      }}
                    </span>
                    <span class="text-sm uppercase bg-slate-100 px-2 py-1 rounded-3xl flex items-center gap-1" v-if="
                      (recipeStore.recipe?.video_metadata as any)?.like_count
                    ">
                      <IconHeart class="w-4 h-4" />
                      {{
                        getSocialProof(
                          (recipeStore.recipe?.video_metadata as any)?.like_count,
                        )
                      }}
                    </span>
                  </div>
                </div>
              </div>
              <iframe :src="embedSrc" title="Video" frameborder="0"
                class="rounded-3xl self-center w-[150px] h-[270px] sm:w-[202px] sm:h-[360px]" allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
                web-share;
              " allowfullscreen v-if="embedSrc">
              </iframe>
            </div>
          </div>
          <div class="space-y-2 order-6 xl:order-none">
            <h2 class="text-4xl font-bold tracking-tighter ml-2 mb-2">
              You might also like
            </h2>
            <div class="flex flex-col gap-4">
              <RecipeCardHorizontal v-for="recipe in similarRecipes" :key="recipe.id" :recipe="recipe" class="-ml-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <PagesRecipeCookMode v-model="cookModeOpen" :steps="recipeStore.recipe?.full_instructions ??
      recipeStore.recipe?.instructions?.map((i) => ({
        formatted_text: i,
      })) ??
      []
      " :ingredients="recipeStore.recipe?.ingredients" :title="recipeStore.recipe?.title" :servingSize="servingSize"
      :recipeId="recipeStore.recipe?.id" :totalTime="recipeStore.recipe?.total_time_mins ?? 0"
      :equipment="recipeStore.recipe?.equipment ?? []" />
    <BlocksResponsiveInfo v-if="recipeStore.recipe?.kcal && recipeStore.recipe?.hidx" v-model="contextModalOpen"
      :sidePanelClass="`w-${contextMode === 'health' ? '150' : '120'}`">
      <div v-if="contextMode === 'nutrition'" class="m-4">
        <h2 class="text-4xl font-bold tracking-tighter mb-8">Full Nutrition</h2>
        <FoodNutritionFacts :computable="recipeStore.recipe" />
        <FoodFullNutritionFacts :recipe="recipeStore.recipe" class="mt-10" />
      </div>
      <PagesReport v-if="contextMode === 'health'" :id="recipeStore.recipe?.id?.toString() ?? ''" :isFood="false" />
    </BlocksResponsiveInfo>
  </div>
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
const watchSectionTarget = ref<HTMLElement | null>(null);

const contextModalOpen = ref(false);
const contextMode = ref<'nutrition' | 'health'>('nutrition');

const markedIngredients = ref<number[]>([]);


// Cook mode
const cookModeOpen = ref(false);

const effectiveSource = computed(() => {
  return (recipeStore.recipe?.video_metadata as any)?.url ?? recipeStore.recipe?.source;
});

const uploadDate = computed(() => {
  const raw = (recipeStore.recipe?.video_metadata as any)?.upload_date as
    | string
    | undefined;
  if (!raw) return '';
  const iso =
    /^\d{8}$/.test(raw)
      ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
      : raw;
  return timeAgo(iso);
});

const embedSrc = computed(() => {
  const src = effectiveSource.value;
  if (!src) return null;

  // Handle YouTube links
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    let videoId = '';
    try {
      if (src.includes('youtube.com')) {
        // e.g. https://www.youtube.com/watch?v=JbC14Zn7plU
        const url = new URL(src);
        videoId = url.searchParams.get('v') || '';
      } else if (src.includes('youtu.be')) {
        // e.g. https://youtu.be/JbC14Zn7plU
        // or https://youtu.be/JbC14Zn7plU?t=123
        const url = new URL(src);
        videoId = url.pathname.split('/')[1] || '';
      }
    } catch (e) {
      // fallback: try extracting after last slash
      videoId = src.split('/').pop() || '';
    }
    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  } else if (src?.includes('tiktok')) {
    return `https://www.tiktok.com/player/v1/${src.split('/').pop()}`;
  }
  return null;
});

const getWebsiteName = (source: string | null | undefined) => {
  if (!source) return '';
  const url = new URL(source);
  const parts = url.hostname.split('.');
  const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  return domain;
};

const getSocialProof = (number: number | null | undefined) => {
  if (!number) return '0';
  if (number >= 1000000) return `${Math.floor(number / 1000000)}M`;
  else if (number >= 1000) return `${Math.floor(number / 1000)}K`;
  else return number.toString();
};

// Tracking from recipe page
const {
  addMealFromRecipe,
  loadMeals,
  saveMeals,
  hasUnsavedChanges,
  selectedDate,
} = useMealTracking();
const trackingLoading = ref(false);
const trackingAdded = ref(false);

async function trackFromRecipePage() {
  if (!id || trackingAdded.value) return;
  trackingLoading.value = true;
  try {
    const today = new Date();
    selectedDate.value = today;
    await loadMeals(today);
    await addMealFromRecipe(id);
    hasUnsavedChanges.value = true;
    await saveMeals();
    trackingAdded.value = true;
  } catch (e) {
    console.error('Failed to track meal:', e);
  } finally {
    trackingLoading.value = false;
  }
}

// Refs for sticky behavior
const instructionListRef = ref<any>(null);
const ingredientListRef = ref<any>(null);
const rightRailRef = ref<HTMLElement | null>(null);

// Heights and sticky state
const instructionHeight = ref(0);
const ingredientHeight = ref(0);
const rightRailHeight = ref(0);
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

const rightColumnStyle = computed(() => {
  if (!shouldStick.value) return {};
  const needed = rightRailHeight.value + instructionHeight.value - ingredientHeight.value;
  return { 'min-height': `${needed}px` };
});

const measureHeights = () => {
  if (isMobile.value || !import.meta.client) return;

  nextTick(() => {
    const instructionComponent = instructionListRef.value;
    const ingredientComponent = ingredientListRef.value;
    const railEl = rightRailRef.value;

    if (!instructionComponent || !ingredientComponent) return;

    const instructionRoot = instructionComponent.root;
    const ingredientRoot = ingredientComponent.root;

    const instructionEl =
      instructionRoot?.value || instructionRoot || instructionComponent.$el;
    const ingredientEl =
      ingredientRoot?.value || ingredientRoot || ingredientComponent.$el;

    if (instructionEl && ingredientEl) {
      const instructionHeightNew =
        instructionEl.offsetHeight ||
        instructionEl.getBoundingClientRect().height;
      const ingredientHeightNew =
        ingredientEl.offsetHeight ||
        ingredientEl.getBoundingClientRect().height;

      if (instructionHeightNew > 0 && ingredientHeightNew > 0) {
        instructionHeight.value = instructionHeightNew;
        ingredientHeight.value = ingredientHeightNew;
        if (railEl) {
          rightRailHeight.value =
            railEl.offsetHeight || railEl.getBoundingClientRect().height;
        }

        // Use instruction element for containerTop — the right rail may be
        // in sticky position, which skews getBoundingClientRect
        const instructionRect = instructionEl.getBoundingClientRect();
        containerTop.value = instructionRect.top + window.scrollY;

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

const getBudgetDescription = (price: number): string => {
  if (price >= 1) return `~$${Math.floor(price)}$ / serving`;
  else return `~${formatMoney(Math.round(price * 10) / 10)} / serving`;
};

// Serving size state - managed at page level for both IngredientList and InstructionContainer
const servingSize = ref(2); // Default to 2 servings

const specialTags = [102, 103, 107, 112];
const top7Tags = computed(() => {
  if (!recipeStore.recipe?.tags) return [];
  const tags = recipeStore.recipe.tags
    .map((tag) => getTagByID(tag))
    .filter((tag) => tag?.id !== 112);
  tags?.sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));
  const budgetTag = tags.find((tag) => tag?.id === 4);
  if (budgetTag) {
    budgetTag.name = getBudgetDescription(recipeStore.recipe?.price ?? 0);
  }
  //extract special tags: vegan, vegetarian, gluten free, lactose free
  if (tags.some((tag) => tag?.id === 102)) {
    return tags.filter((tag) => tag?.id !== 103).slice(0, 6);
  }
  return tags.slice(0, 7);
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
  const src = effectiveSource.value;
  if (!src) return '';
  const url = new URL(src);
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
    (cuisine) => cuisine.name === cuisineName,
  );
  return cuisine ?? null;
};

// Job polling
const jobId = ref(Number(route.query.poll as string) || null);
const { job, isPolling, error, start, stop, restart, fetchJob } = useJobPolling(
  jobId,
  supabase,
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
  },
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
  },
);

const isBookmarked = ref(false);
const bookmarkLoading = ref(false);



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
      vector_search: {
        embedding: recipeData.value.embedding as number[],
      },
      limit: 3,
    });
  }
});

const recipeUrl = computed(
  () =>
    `https://kinome.app${getRecipeUrl(
      recipeStore.recipe?.id ?? 0,
      recipeStore.recipe?.title ?? '',
    )}`,
);

const imageUrl = computed(
  () =>
    recipeStore.recipe?.picture ||
    recipeStore.recipe?.social_picture ||
    'https://kinome.app/feast.png',
);

const healthGrade = computed(() =>
  recipeStore.recipe?.hidx ? getGrade(recipeStore.recipe?.hidx, 'ovr') : null,
);

const description = computed(
  () =>
    `${recipeStore.recipe?.title} recipe nutrition facts: ${recipeStore.recipe?.kcal} kcal/100g, Nutrition Quality: ${healthGrade.value}. Discover in-depth nutritional analyis.`,
);

const jsonLd = computed(() => {
  const recipe = recipeStore.recipe;
  if (!recipe) return null;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    url: recipeUrl.value,
    image: imageUrl.value,
  };

  if (recipe.description) schema.description = recipe.description;
  if (recipe.created_at) schema.datePublished = recipe.created_at.split('T')[0];
  const channel = (recipe.video_metadata as any)?.channel as string | undefined;
  if (channel) {
    schema.author = {
      '@type': 'Organization',
      name: channel,
    };
  }
  const cookTimeMins =
    recipe.total_time_mins ??
    (recipe.effort === 'LIGHT'
      ? 20
      : recipe.effort === 'MODERATE'
        ? 35
        : recipe.effort === 'HEAVY'
          ? 60
          : null);
  if (cookTimeMins != null) schema.cookTime = `PT${cookTimeMins}M`;
  if (recipe.total_time_mins) schema.totalTime = `PT${recipe.total_time_mins}M`;
  if (recipe.batch_size) {
    schema.recipeYield = `${recipe.batch_size} serving${recipe.batch_size !== 1 ? 's' : ''}`;
  }
  const categoryTag = recipe.tags
    ?.map((tagId) => getTagByID(tagId))
    .find((tag) => tag && tag.id >= 200 && tag.id <= 209);
  if (categoryTag?.name) {
    schema.recipeCategory = capitalize(categoryTag.name.replace('main/', ''));
  }

  if (recipe.ingredients?.length) {
    schema.recipeIngredient = recipe.ingredients.map((ing) =>
      `${ing.amount} ${ing.unit} ${ing.name}`.trim(),
    );
  }

  if (recipe.full_instructions?.length) {
    schema.recipeInstructions = recipe.full_instructions.map(
      (step: CookStep) => ({
        '@type': 'HowToStep',
        text: step.formatted_text,
        ...(step.title ? { name: step.title } : {}),
      }),
    );
  } else if (recipe.instructions?.length) {
    schema.recipeInstructions = recipe.instructions.map((step: string) => ({
      '@type': 'HowToStep',
      text: step,
    }));
  }

  if (recipe.kcal != null) {
    const nutrition: Record<string, any> = {
      '@type': 'NutritionInformation',
      servingSize: '1 serving',
      calories: `${Math.round(recipe.kcal)} kcal`,
    };
    if (recipe.protein != null)
      nutrition.proteinContent = `${recipe.protein.toFixed(1)} g`;
    if (recipe.fat != null) nutrition.fatContent = `${recipe.fat.toFixed(1)} g`;
    if (recipe.carbohydrates != null)
      nutrition.carbohydrateContent = `${recipe.carbohydrates.toFixed(1)} g`;
    if (recipe.fiber != null)
      nutrition.fiberContent = `${recipe.fiber.toFixed(1)} g`;
    if (recipe.sugar != null)
      nutrition.sugarContent = `${recipe.sugar.toFixed(1)} g`;
    if (recipe.saturated_fat != null)
      nutrition.saturatedFatContent = `${recipe.saturated_fat.toFixed(1)} g`;
    schema.nutrition = nutrition;
  }

  if (recipe.rating_count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recipe.rating.toFixed(1),
      ratingCount: recipe.rating_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (recipe.price != null) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: recipe.price.toFixed(2),
    };
  }

  if (recipe.collection?.startsWith('traditional-')) {
    const cuisineSlug = recipe.collection.slice('traditional-'.length);
    schema.recipeCuisine = cuisineSlug
      .split('-')
      .map((w: string) => capitalize(w))
      .join(' ');
  }

  return schema;
});

useHead(() => ({
  title: `${recipeStore.recipe?.title} Recipe - Method & Nutrition | Kinome`,
  script: jsonLd.value
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }]
    : [],
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

const watchSectionFlashing = ref(false);

const scrollToWatchSection = () => {
  if (!watchSectionTarget.value) return;

  if (!isMobile.value) {
    // On xl+: the Watch section is in the sticky right rail below the ingredient list.
    // The sticky behaviour makes getBoundingClientRect().top on the watch section stay
    // constant as the page scrolls, so a plain scrollIntoView undershoots. We correct
    // by adding the "overhang" — how much further the cook-steps column extends past
    // the bottom of the ingredient list (b2 - b1). If the ingredient list is already
    // longer (b1 >= b2) the stickiness isn't causing a problem, so we fall through to
    // the normal path.
    const ingredientComponent = ingredientListRef.value;
    const instructionComponent = instructionListRef.value;

    const ingredientRoot = ingredientComponent?.root;
    const instructionRoot = instructionComponent?.root;
    const ingredientEl: HTMLElement | null =
      ingredientRoot?.value || ingredientRoot || ingredientComponent?.$el || null;
    const instructionEl: HTMLElement | null =
      instructionRoot?.value || instructionRoot || instructionComponent?.$el || null;

    if (ingredientEl && instructionEl) {
      const b1 = ingredientEl.getBoundingClientRect().bottom;
      const b2 = instructionEl.getBoundingClientRect().bottom;

      if (b2 > b1) {
        let domElement: HTMLElement = (watchSectionTarget.value as any).$el ?? watchSectionTarget.value;
        const targetRect = domElement.getBoundingClientRect();
        const targetTop = targetRect.top + window.pageYOffset + (b2 - b1);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });

        setTimeout(() => {
          watchSectionFlashing.value = true;
          setTimeout(() => { watchSectionFlashing.value = false; }, 900);
        }, 700);
        return;
      }
    }
  }

  scrollIntoView(watchSectionTarget.value);

  setTimeout(() => {
    watchSectionFlashing.value = true;
    setTimeout(() => { watchSectionFlashing.value = false; }, 900);
  }, 700);
};

const handleScroll = () => {
  scrollY.value = window.scrollY;
};

let resizeObserver: ResizeObserver | null = null;

const initStickyBehavior = () => {
  if (!import.meta.client || typeof ResizeObserver === 'undefined') return;

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => {
    measureHeights();
  });

  const instructionComponent = instructionListRef.value;
  const ingredientComponent = ingredientListRef.value;
  const railEl = rightRailRef.value;

  if (instructionComponent?.root) {
    const instructionEl =
      instructionComponent.root?.value || instructionComponent.root;
    if (instructionEl) resizeObserver.observe(instructionEl);
  }

  if (ingredientComponent?.root) {
    const ingredientEl =
      ingredientComponent.root?.value || ingredientComponent.root;
    if (ingredientEl) resizeObserver.observe(ingredientEl);
  }

  if (railEl) resizeObserver.observe(railEl);

  measureHeights();
};

// Re-attach observers when components mount after lazy data load (client-side nav)
watch(
  () => instructionListRef.value,
  (val) => {
    if (val) nextTick(() => initStickyBehavior());
  },
  { flush: 'post' },
);

const fetchBookmarkStatus = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('bookmarks')
    .select('recipe_id')
    .eq('user_id', user.id)
    .eq('recipe_id', id)
    .maybeSingle();
  isBookmarked.value = data != null;
};

async function toggleBookmark() {
  if (!id || bookmarkLoading.value) return;
  bookmarkLoading.value = true;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (isBookmarked.value) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        recipe_id: id,
      });
      if (error) throw error;
    }
    await fetchBookmarkStatus();
  } catch (e) {
    console.error('Bookmark toggle failed:', e);
  } finally {
    bookmarkLoading.value = false;
  }
}

onMounted(async () => {
  fetchBookmarkStatus();
  if (
    !recipeStore.recipe?.picture &&
    recipeStore.recipe?.source_type === 'MEDIA'
  ) {
    recipeStore.recipe.social_picture = await recipeStore.getSocialPicture(
      effectiveSource.value ?? '',
    );
  }
  start();
  const { track, trackTimeSpent } = useEngagement();
  track(id, 'click');
  trackTimeSpent(id);

  if (auth.user?.id) {
    trackRecipeView(supabase, auth.user.id, id).catch(() => { });
  }

  // Set up sticky behavior
  scrollY.value = window.scrollY;
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', measureHeights, { passive: true });

  nextTick(() => initStickyBehavior());
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
  const total = recipeStore.recipe?.total_time_mins;

  if (total) {
    let rounded;

    if (total < 60) {
      rounded = Math.floor(total / 5) * 5;
    } else if (total < 120) {
      rounded = Math.floor(total / 10) * 10;
    } else {
      rounded = Math.floor(total / 30) * 30;
    }

    rounded = Math.max(5, rounded);

    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}min`;
  }

  if (recipeStore.recipe?.effort === 'LIGHT') {
    return '<20min';
  }
  if (recipeStore.recipe?.effort === 'MODERATE') {
    return '35min';
  }
  if (recipeStore.recipe?.effort === 'HEAVY') {
    return '>60min';
  }

  return null;
}

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
      text: hasGeneric
        ? generic.name
        : generic.name == 'Gluten Free'
          ? 'Contains Gluten'
          : `Not ${generic.name}`,
      class: hasGeneric ? 'bg-green-100' : 'bg-red-50',
      icon: hasGeneric ? 'check' : 'x',
    });
  }
  return pills;
});
</script>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}

@keyframes watchFlash {
  0% {
    filter: brightness(1);
  }

  20% {
    filter: brightness(1.1);
  }

  100% {
    filter: brightness(1);
  }
}

.watch-flash {
  animation: watchFlash 0.8s ease-out;
}
</style>
