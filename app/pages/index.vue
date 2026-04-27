<template>
  <div class="mb-20 space-y-4 sm:space-y-10 m-4 lg:my-10 lg:mx-16">
    <div class="md:hidden flex justify-between items-center">
      <Logo class="" />
      <NuxtLink :to="getProfileUrl(auth.user)" v-if="auth.isUser()">
        <Avatar :user="auth.user" class="rounded-full w-10 h-10" />
      </NuxtLink>
      <NuxtLink to="/login" class="mt-1" v-else>
        <IconLogIn :size="26" />
      </NuxtLink>
    </div>
    <div class="justify-between items-center gap-6 hidden md:flex">
      <div class="flex gap-2 flex-1 items-center">
        <div class="ai-ring main-card-rounded p-px flex items-center">
          <div class="flex items-center rounded-[31px] px-4 main-button">
            <IconSearch class="w-4 " />
            <input type="text" :placeholder="'Search recipes, ingredients, techniques...'" v-model="searchQuery"
              @keyup.enter="handleSearch" @blur="handleSearch" class="text-xs grow focus:outline-none w-80 px-2 py-2" />
          </div>
        </div>
        <NuxtLink to="/kitchen/recipes" class="subnav-pill" active-class="active">
          All Recipes</NuxtLink>
        <NuxtLink to="/foods" class="subnav-pill" active-class="active">
          All Foods
        </NuxtLink>
      </div>
      <div class="items-center gap-2 shrink-0 hidden sm:flex">
        <NuxtLink to="/account" class="text-gray-500 items-center gap-2">
          <IconSettings2 class="w-6" />
        </NuxtLink>
      </div>
    </div>
    <div class="items-center gap-2 justify-between flex">
      <div>
        <span class="font-mono text-[10px] text-gray-400 uppercase">TODAY / {{ getTodayString() }}</span>
        <h1 class="text-5xl font-headers">
          Discover<span class="text-primary">.</span>
        </h1>
      </div>
      <div class="items-center gap-5 hidden sm:flex">
        <div class="flex flex-col items-end">
          <RollingNumber :number="recipeCount" class="text-3xl text-primary leading-none font-headers" />
          <p class="text-[10px] text-gray-400 font-mono uppercase mr-0.5">Recipes</p>
        </div>
        <div class="flex flex-col items-end">
          <p class="text-3xl text-primary leading-none font-headers">8890</p>
          <p class="text-[10px] text-gray-400 font-mono uppercase mr-0.5">Foods</p>
        </div>
      </div>
    </div>

    <!-- Categories -->
    <BlocksCarousel show-progress show-arrows>
      <div class="flex items-center gap-x-1 px-3 py-0.5 text-gray-700 main-button animated-button my-2 mr-2 sm:mr-3"
        :class="{ 'carousel-active bg-dark! text-white': isTrendingSelected }" @click="onClickTrending">
        <span class="text-lg">🔥</span>
        <span class="text-sm text-nowrap">Trending</span>
      </div>
      <div v-for="category in categories" :key="category.tag"
        :class="{ 'carousel-active bg-dark! text-white': selectedCategoryTag === category.tag }"
        class="flex items-center gap-x-1 px-3 py-0.5 text-gray-700 main-button animated-button my-2 mr-2 sm:mr-3"
        @click="onClickCategory(category.tag)">
        <span class="text-lg">{{ category.icon }}</span>
        <span class="text-sm text-nowrap">{{
          category.name
        }}</span>
      </div>
    </BlocksCarousel>

    <!-- Recommendations: Mobile -->
    <div class="flex flex-wrap gap-x-2 gap-y-4 2lg:hidden justify-center">
      <template v-if="isRecommendationsLoading">
        <Skeleton v-for="i in 2" :key="'mobile-card-skeleton-top-' + i"
          class="text-[20px] basis-40 flex-1 h-[210px] mt-8 md:mt-16" />
        <Skeleton class="basis-full min-h-[250px]" />
        <Skeleton v-for="i in 4" :key="'mobile-card-skeleton-bottom-' + i"
          class="text-[20px] basis-40 flex-1 h-[210px] mt-8 md:mt-16" />
        <Skeleton class="basis-full min-h-[250px]" />
      </template>
      <template v-else>
        <RecipeCard v-for="(recipe, index) in displayedRecipes.slice(2, 4)" :key="recipe.id + 'mobile'" :recipe="recipe"
          :id="'mobile-' + index + '-' + recipe.id" :uniqueId="'mobile-' + index + '-' + recipe.id"
          :showSocialInfo="isTrendingSelected" class="text-[20px] basis-40 flex-1" />
        <RecipeCardHighlight v-if="displayedRecipes[0]" :key="displayedRecipes[0].id + 'mobile'"
          :recipe="displayedRecipes[0]" :id="'mdh-0-0'" :uniqueId="'mdh-0-0'" :showSocialInfo="isTrendingSelected"
          class="basis-full" />
        <RecipeCard v-for="(recipe, index) in displayedRecipes.slice(4, 8)" :key="recipe.id + 'mobile'" :recipe="recipe"
          :id="'mobile-' + index + '-' + recipe.id" :uniqueId="'mobile-' + (index + 3) + '-' + recipe.id"
          :showSocialInfo="isTrendingSelected" class="text-[20px] basis-40 flex-1" />
        <RecipeCardHighlight v-if="displayedRecipes[1]" :key="displayedRecipes[1].id + 'mobile'"
          :recipe="displayedRecipes[1]" :id="'mdh-0-1'" :uniqueId="'mdh-0-1'" :showSocialInfo="isTrendingSelected"
          class="basis-full" />
      </template>
    </div>

    <!-- Recommendations: Desktop -->
    <div class="hidden 2lg:block transition-all duration-150" :class="isRecommendationsLoading || rowMaxHeight ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-x-2'
      ">
      <div class="flex gap-8 py-1 overflow-hidden"
        :class="isRecommendationsLoading || rowMaxHeight ? 'flex-wrap' : 'flex-nowrap'" :style="{
          maxHeight: rowMaxHeight ? rowMaxHeight + 'px' : undefined,
        }">
        <template v-if="isRecommendationsLoading">
          <Skeleton v-for="i in 6" :key="'desktop-card-skeleton-' + i"
            class="flex-1 text-[30px] basis-54 max-w-92 2xl:basis-62 2xl:max-w-110 h-[320px] mt-8 md:mt-16" />
        </template>
        <template v-else>
          <RecipeCard v-for="(recipe, index) in desktopRecipes" :key="recipe.id + 'desktop'" :recipe="recipe"
            :id="'desktop-' + (index - 1) + '-' + recipe.id" :uniqueId="index === 0
              ? 'desktop-0-0'
              : 'desktop-' + (index - 1) + '-' + recipe.id
              " :showSocialInfo="isTrendingSelected"
            class="flex-1 text-[30px] basis-54 max-w-92 2xl:basis-62 2xl:max-w-110" :ref="(el) => {
              if (el) desktopCards[index] = el;
            }
              " />
        </template>
      </div>
      <div class="flex mt-6 flex-wrap gap-8 items-stretch">
        <template v-if="isRecommendationsLoading">
          <Skeleton class="flex-1 basis-244 3xl:max-w-6xl min-h-[250px]" />
          <div class="flex flex-wrap gap-4 shrink-0 basis-80 flex-1 items-center">
            <Skeleton v-for="i in 2" :key="'desktop-horizontal-skeleton-' + i"
              class="text-[30px] basis-95 flex-1 h-[140px]" />
            <Skeleton v-for="i in 2" :key="'desktop-horizontal-wide-skeleton-' + i"
              class="text-[30px] hide-below-2200 basis-95 flex-1 h-[140px]" />
          </div>
        </template>
        <template v-else>
          <RecipeCardHighlight v-if="displayedRecipes[0]" :recipe="displayedRecipes[0]"
            :showSocialInfo="isTrendingSelected" :uniqueId="'desktop-0-0'" class="flex-1 basis-244 3xl:max-w-6xl" />
          <div class="flex flex-wrap gap-4 shrink-0 basis-80 flex-1 items-center">
            <RecipeCardHorizontal v-for="(recipe, index) in displayedRecipes.slice(7, 9)" :key="recipe.id + 'desktop'"
              :recipe="recipe" :id="'desktop-' + index + '-' + recipe.id"
              :uniqueId="'desktop-' + index + '-' + recipe.id" :showSocialInfo="isTrendingSelected"
              class="text-[30px] basis-95 flex-1" />
            <RecipeCardHorizontal v-for="(recipe, index) in displayedRecipes.slice(9, 11)" :key="recipe.id + 'desktop'"
              :recipe="recipe" :id="'desktop-' + index + '-' + recipe.id"
              :uniqueId="'desktop-' + index + '-' + recipe.id" :showSocialInfo="isTrendingSelected"
              class="text-[30px] hide-below-2200 basis-95 flex-1" />
          </div>
        </template>
      </div>
    </div>

    <!-- Social Media Cards -->
    <Transition name="loaded-content">
      <div class="flex flex-wrap pt-4">
        <div class="flex flex-col gap-6">
          <div class="flex gap-2 justify-between items-baseline">
            <h2 class="text-2xl font-headers tracking-tight">
              <NuxtLink to="/kitchen/social">
                <span> Trending - around the web</span>
              </NuxtLink>
            </h2>
            <NuxtLink to="/kitchen/social" class="text-xs text-gray-600 flex items-center gap-0.5">
              See all
              <IconChevronRight class="w-4 h-4" :strokeWidth="1.5" />
            </NuxtLink>
          </div>
          <div class="flex flex-wrap gap-4">
            <RecipeCardSocialMedia v-for="recipe in recipeStore.socialIndexRecipes" :key="recipe.id" :recipe="recipe"
              :uniqueId="'social-' + recipe.id" class="max-w-240 basis-140" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient<Database>();
const recipeStore = useRecipeStore();
const loadingStore = useLoadingStore();
const searchQuery = ref('');
const auth = useAuthStore();

const recipeCount = ref(1000);
const selectedCategoryTag = ref<number | null>(null);
const filteredIndexRecipes = ref<RecipeOverview[]>([]);
const trendingRecipes = ref<RecipeOverview[]>([]);
const isTrendingSelected = ref(false);
const isRecommendationsLoading = ref(false);
let recommendationRequestId = 0;

const getTodayString = () => {
  const today = new Date();
  return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

defineOgImage('Default.takumi', {
  eyebrow: 'Kinome',
  title: 'Recipes worth eating.',
  subtitle: '2000+ recipes with deep nutrition analysis, imported from any site or video.',
})

useHead({
  title: 'Kinome - Smart Recipe Platform with Nutrition Analysis',
  meta: [
    {
      name: 'description',
      content:
        'Discover healthy recipes and import from any website or social media. Access 2000+ recipes with detailed health reports, based on the latest nutrition science.',
    },
    {
      property: 'og:title',
      content: 'Kinome - Smart Recipe Platform with Nutrition Analysis',
    },
    {
      property: 'og:description',
      content:
        'Discover healthy recipes with detailed nutrition scores, save recipes from any website or social media, and track your diet with AI-powered ingredient parsing.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://kinome.app',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: 'Kinome - Smart Recipe Platform with Nutrition Analysis',
    },
    {
      name: 'twitter:description',
      content:
        'Discover healthy recipes with detailed nutrition scores, save recipes from any website or social media, and track your diet with AI-powered ingredient parsing.',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://kinome.app',
    },
  ],
});

const desktopCards = ref<any[]>([]);
const rowMaxHeight = useTruncateRow(desktopCards, 12);
const displayedRecipes = computed(() =>
  isTrendingSelected.value
    ? trendingRecipes.value
    : selectedCategoryTag.value
      ? filteredIndexRecipes.value
      : recipeStore.indexRecipes
);
const desktopRecipes = computed(() => displayedRecipes.value.slice(1, 7));

const getIndexRecipes = (tag?: number) =>
  getRecipeOverviews(supabase, {
    eq: { visibility: 'PUBLIC' },
    not: { picture: null },
    orderBy: { column: 'relevancy', ascending: false },
    limit: 11,
    ...(tag
      ? { filtering: { tags: [tag], hidx: null, kcal: null, price: null } }
      : {}),
  });

onBeforeUpdate(() => {
  desktopCards.value = [];
});

if (!recipeStore.indexRecipes.length) {
  const { data } = await useLazyAsyncData('index', () =>
    getIndexRecipes()
  );
  watchEffect(() => {
    recipeStore.setIndexRecipes(data.value ?? []);
  });
}

if (!recipeStore.socialIndexRecipes.length) {
  const { data: socialData } = await useLazyAsyncData('social', () =>
    getRecipeOverviews(supabase, {
      orderBy: { column: 'created_at', ascending: false },
      limit: 6,
      eq: { source_type: 'MEDIA', visibility: 'PUBLIC' },
    })
  );
  watchEffect(() => {
    if (socialData.value) recipeStore.setSocialIndexRecipes(socialData.value);
  });
}

const categories = ref([
  {
    name: 'Breakfast',
    icon: '🥐',
    tag: 201,
  },
  {
    name: 'Dinner',
    icon: '🍝',
    tag: 200,
  },
  {
    name: 'Snacks',
    icon: '🍟',
    tag: 203,
  },
  {
    name: 'Dessert',
    icon: '🍰',
    tag: 204,
  },
  {
    name: 'Quick and Easy',
    icon: '⚡',
    tag: 3,
  },
  {
    name: 'Healthy',
    icon: '🏵️',
    tag: 100,
  },
  {
    name: 'Budget',
    icon: '💰',
    tag: 4,
  },
  {
    name: 'Meal Prep',
    icon: '🍱',
    tag: 5,
  },
]);

const onClickCategory = async (category: number) => {
  if (selectedCategoryTag.value === category) {
    recommendationRequestId++;
    isRecommendationsLoading.value = false;
    selectedCategoryTag.value = null;
    filteredIndexRecipes.value = [];
    return;
  }

  const requestId = ++recommendationRequestId;
  isTrendingSelected.value = false;
  selectedCategoryTag.value = category;
  isRecommendationsLoading.value = true;
  try {
    const recipes = await getIndexRecipes(category);
    if (requestId === recommendationRequestId && !isTrendingSelected.value && selectedCategoryTag.value === category) {
      filteredIndexRecipes.value = recipes;
    }
  } finally {
    if (requestId === recommendationRequestId) {
      isRecommendationsLoading.value = false;
    }
  }
};

const onClickTrending = async () => {
  if (isTrendingSelected.value) {
    recommendationRequestId++;
    isRecommendationsLoading.value = false;
    isTrendingSelected.value = false;
    return;
  }

  const requestId = ++recommendationRequestId;
  isTrendingSelected.value = true;
  selectedCategoryTag.value = null;
  if (!trendingRecipes.value.length) {
    isRecommendationsLoading.value = true;
    try {
      const recipes = await getTrendingThisMonth(supabase, 11);
      if (requestId === recommendationRequestId && isTrendingSelected.value) {
        trendingRecipes.value = recipes;
      }
    } finally {
      if (requestId === recommendationRequestId) {
        isRecommendationsLoading.value = false;
      }
    }
  } else {
    isRecommendationsLoading.value = false;
  }
};

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    return;
  }
  const params = new URLSearchParams({ q: searchQuery.value });
  navigateTo(`/kitchen/recipes?${params.toString()}`);
};

onMounted(async () => {
  recipeCount.value = await getCount(supabase);
});

const handleQuickImport = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();
    const url = new URL(clipboardText);
    if (!clipboardText.trim()) {
      loadingStore.displayTransientToast('❌ Clipboard is empty');
      return;
    }
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      navigateTo(
        `/recipe/new?view=loading&link=${encodeURIComponent(clipboardText)}`
      );
    } else {
      loadingStore.displayTransientToast('❌ Clipboard is not a valid URL');
    }
  } catch (error) {
    loadingStore.displayTransientToast('❌ Clipboard is not a valid URL');
  }
};
</script>

<style scoped>
.hide-below-2200 {
  display: none;
}

@media (min-width: 2199px) {
  .hide-below-2200 {
    display: flex;
  }
}
</style>
