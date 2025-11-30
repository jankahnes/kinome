<template>
  <div class="mx-4 sm:mx-10 md:mx-20 space-y-4 sm:space-y-10 py-6">
    <div class="flex justify-between items-center gap-6">
      <div class="flex gap-4 flex-1">
        <div
          class="flex ring-1 ring-primary focus-within:ring-2 transition-all rounded-2xl px-4 items-center gap-2 text-gray-600 bg-primary-10/40 shrink-1 flex-1 min-w-0! max-w-80"
        >
          <input
            type="text"
            placeholder="Search for a recipe"
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            @blur="handleSearch"
            class="flex-1 focus:outline-none py-2 min-w-0! max-w-none! w-0"
          />
          <span class="material-symbols-outlined shrink-0">search</span>
        </div>
        <NuxtLink
          to="/collection/recipes"
          class="animated-button bg-primary-10/40 ring-1 ring-primary px-3 py-2 shrink-0"
          >All Recipes</NuxtLink
        >
      </div>
      <div class="items-center gap-2 shrink-0 hidden sm:flex">
        <NuxtLink to="/" class="text-gray-500 items-center gap-2">
          <span class="material-symbols-outlined font-bold!">tune</span>
        </NuxtLink>
      </div>
    </div>
    <div class="flex items-center gap-2 justify-between">
      <h1 class="text-5xl font-bold pt-4">🌟 Discover</h1>
      <div class="items-center gap-4 hidden sm:flex">
        <div class="flex flex-col items-center">
          <p class="text-3xl font-bold text-primary leading-none">1194</p>
          <p class="text-xs text-gray-600 leading-none">Recipes</p>
        </div>
        <div class="flex flex-col items-center">
          <p class="text-3xl font-bold text-primary leading-none">8890</p>
          <p class="text-xs text-gray-600 leading-none">Foods</p>
        </div>
      </div>
    </div>

    <!-- Categories -->
    <BlocksCarousel>
      <div
        class="flex items-center gap-x-1 px-3 py-1 transition-all duration-300 flex-shrink-0 animated-button rounded-2xl! my-2 mr-2 sm:mr-4 text-gray-600 bg-primary-10"
        @click="navigateTo('/collection/social')"
      >
        <span class="text-2xl">🔥</span>
        <span class="text-sm sm:text-base sm:tracking-wider text-nowrap"
          >Trending</span
        >
      </div>
      <div
        v-for="category in categories"
        :key="category.tag"
        class="flex items-center gap-x-1 px-3 py-1 transition-all duration-300 flex-shrink-0 animated-button rounded-2xl! my-2 mr-2 sm:mr-4 text-gray-600 bg-primary-10"
        @click="onClickCategory(category.tag)"
      >
        <span class="text-2xl">{{ category.icon }}</span>
        <span class="text-sm sm:text-base sm:tracking-wider text-nowrap">{{
          category.name
        }}</span>
      </div>
    </BlocksCarousel>

    <!-- Recommendations: Mobile -->
    <div
      class="2lg:hidden space-y-2"
      v-if="recipeStore.indexRecipes.length > 0"
    >
      <BlocksCarousel class="" :flexClass="'!items-stretch'">
        <RecipeCard
          v-for="(recipe, index) in recipeStore.indexRecipes.slice(1)"
          :key="recipe.id + 'mobile'"
          :id="'mobile'"
          :recipe="recipe"
          class="w-50 min-h-60 text-[20px] sm:w-70 sm:min-h-95 sm:text-[30px] flex-shrink-0 mb-2 mr-4"
        />
      </BlocksCarousel>
      <RecipeCardHighlight
        v-if="recipeStore.indexRecipes[0]"
        :recipe="recipeStore.indexRecipes[0]"
        :uniqueId="'mobile-0-0'"
        class="md:-ml-10! text-[20px] md:text-[30px]"
      />
    </div>

    <!-- Recommendations: Desktop -->
    <div
      class="hidden 2lg:block transition-all duration-150"
      :class="
        rowMaxHeight ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-x-2'
      "
    >
      <div
        class="flex gap-8 py-1 overflow-hidden"
        :class="rowMaxHeight ? 'flex-wrap' : 'flex-nowrap'"
        :style="{
          maxHeight: rowMaxHeight ? rowMaxHeight + 'px' : undefined,
        }"
      >
        <RecipeCard
          v-for="(recipe, index) in desktopRecipes"
          :key="recipe.id + 'desktop'"
          :recipe="recipe"
          :id="'desktop-' + (index - 1) + '-' + recipe.id"
          :uniqueId="
            index === 0
              ? 'desktop-0-0'
              : 'desktop-' + (index - 1) + '-' + recipe.id
          "
          class="flex-1 text-[30px] basis-54 max-w-92 2xl:basis-62 2xl:max-w-110"
          :ref="
            (el) => {
              if (el) desktopCards[index] = el;
            }
          "
        />
      </div>
      <div class="flex mt-6 flex-wrap gap-8 items-stretch">
        <RecipeCardHighlight
          v-if="recipeStore.indexRecipes[0]"
          :recipe="recipeStore.indexRecipes[0]"
          :uniqueId="'desktop-0-0'"
          class="-ml-10! flex-1 basis-220"
        />
        <div class="flex flex-wrap gap-4 shrink-0 basis-80 flex-1 items-center">
          <RecipeCardHorizontal
            v-for="(recipe, index) in recipeStore.indexRecipes.slice(7, 9)"
            :key="recipe.id + 'desktop'"
            :recipe="recipe"
            :id="'desktop-' + index + '-' + recipe.id"
            :uniqueId="'desktop-' + index + '-' + recipe.id"
            class="text-[30px] basis-95 flex-1"
          />
          <RecipeCardHorizontal
            v-for="(recipe, index) in recipeStore.indexRecipes.slice(9, 11)"
            :key="recipe.id + 'desktop'"
            :recipe="recipe"
            :id="'desktop-' + index + '-' + recipe.id"
            :uniqueId="'desktop-' + index + '-' + recipe.id"
            class="text-[30px] hidden 3xl:flex basis-95 flex-1"
          />
        </div>
      </div>
    </div>

    <!-- Social Media Cards -->
    <Transition name="loaded-content">
      <div class="flex flex-wrap pt-4">
        <div class="flex flex-col gap-4 items-start">
          <NuxtLink
            to="/collection/social"
            class="inline-block text-xl font-bold"
          >
            Trending on Social Media
          </NuxtLink>
          <div class="flex flex-wrap gap-4">
            <RecipeCardSocialMedia
              v-for="recipe in recipeStore.socialIndexRecipes"
              :key="recipe.id"
              :recipe="recipe"
              :uniqueId="'social-' + recipe.id"
              class="max-h-60 max-w-240 basis-150"
            />
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

useHead({ title: 'Kinome' });

const desktopCards = ref<any[]>([]);
const rowMaxHeight = useTruncateRow(desktopCards, 12);
const desktopRecipes = computed(() => recipeStore.indexRecipes.slice(1, 7));

if (!recipeStore.indexRecipes.length) {
  const { data } = await useLazyAsyncData('index', () =>
    getRecipeOverviews(supabase, {
      eq: { visibility: 'PUBLIC' },
      not: { picture: null },
      orderBy: { column: 'relevancy', ascending: false },
      limit: 11,
    })
  );
  watchEffect(() => {
    recipeStore.setIndexRecipes(data.value ?? []);
  });
}

if (!recipeStore.socialIndexRecipes.length) {
  useAsyncData('social', () =>
    getRecipeOverviews(supabase, {
      orderBy: { column: 'created_at', ascending: false },
      limit: 6,
      eq: { source_type: 'MEDIA' },
    })
  ).then(({ data }) => recipeStore.setSocialIndexRecipes(data.value ?? []));
}

const categories = ref([
  {
    name: 'Breakfast',
    icon: '🥐',
    tag: 201,
  },
  {
    name: 'Lunch',
    icon: '🍔',
    tag: 205,
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

const onClickCategory = (category: number) => {
  navigateTo(`/collection/recipes?tags=${category}`);
};

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    return;
  }
  navigateTo(`/collection/recipes?q=${searchQuery.value}&sort=Relevancy`);
};

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

<style scoped></style>
