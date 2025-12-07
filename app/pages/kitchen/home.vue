<template>
  <Transition name="loaded-content">
    <div v-if="auth.profileFetched && auth.isUser()">
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight mt-12">
        {{ greeting }}
      </h1>
      <div class="flex flex-wrap gap-4 gap-y-8 mt-12" v-if="auth.isUser()">
        <!-- Today's Nutrition -->
        <div class="shrink-0 flex flex-col gap-6">
          <h2 class="text-2xl font-bold tracking-tight mx-2">
            Today's Nutrition
          </h2>
          <div
            class="action-card p-6 flex flex-col justify-between gap-6 flex-1"
          >
            <div class="flex gap-4">
              <div class="flex flex-col items-center gap-1">
                <Ring
                  class="w-26 h-26"
                  :segments="[{ value: 0.6, color: 'stroke-primary' }]"
                  :strokeWidth="10"
                >
                  <span class="text-xl font-bold text-gray-500">1450</span>
                </Ring>
                <p class="font-bold text-lg leading-none mt-2">Calories</p>
                <p class="font-light text-sm text-gray-500 leading-none">
                  1450/2000
                </p>
              </div>
              <div class="flex flex-col items-center gap-1">
                <Ring
                  class="w-26 h-26"
                  :segments="[{ value: 0.4, color: 'stroke-primary' }]"
                  :strokeWidth="10"
                >
                  <span class="text-xl font-bold text-gray-500">50g</span>
                </Ring>
                <p class="font-bold text-lg leading-none mt-2">Protein</p>
                <p class="font-light text-sm text-gray-500 leading-none">
                  50/120
                </p>
              </div>
              <div class="flex flex-col items-center gap-1">
                <Ring
                  class="w-26 h-26"
                  :segments="[{ value: 0.7, color: 'stroke-primary' }]"
                  :strokeWidth="10"
                >
                  <span class="text-xl font-bold text-gray-500">20g</span>
                </Ring>
                <p class="font-bold text-lg leading-none mt-2">Fiber</p>
                <p class="font-light text-sm text-gray-500 leading-none">
                  20/30
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <NuxtLink
                to="/tracking"
                class="animated-button outline-primary outline-2 p-3 text-lg leading-none"
                >View details</NuxtLink
              >
              <button
                @click="() => {}"
                class="animated-button outline-primary outline-2 bg-primary p-3 text-lg leading-none flex-1"
              >
                Quick add meal
              </button>
            </div>
          </div>
        </div>
        <!-- Shopping List -->
        <div class="shrink-0 flex flex-col gap-6">
          <h2 class="text-2xl font-bold tracking-tight mx-2">Shopping List</h2>
          <div
            class="action-card p-6 flex flex-col justify-between gap-6 flex-1"
          >
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5" />
                <p class="text-lg leading-none">100g of Chicken</p>
              </div>
              <div class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5" />
                <p class="text-lg leading-none">500g of Rice</p>
              </div>
              <div class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5" />
                <p class="text-lg leading-none">200g of Salmon</p>
              </div>
              <div class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5" />
                <p class="text-lg leading-none">100g of Carrots</p>
              </div>
            </div>
            <NuxtLink
              to="/shopping-list"
              class="p-3 text-lg leading-none text-center self-center text-primary font-bold"
              >View all (12 items) ›</NuxtLink
            >
          </div>
        </div>
        <!-- Your Cookbook -->
        <div
          class="space-y-6 pb-0 basis-80 w-80 md:basis-120 md:w-120 flex-1 md:max-w-300"
        >
          <h2 class="text-2xl font-bold tracking-tight">From your Cookbook</h2>
          <BlocksCarousel class="" :flexClass="'gap-2'">
            <NuxtLink
              :to="'/recipe/new'"
              class="animated-button flex flex-col gap-2 justify-center items-center p-4 outline-2 outline-primary rounded-4xl! w-44 h-56 self-end ml-2 mb-2"
            >
              <div
                class="rounded-full primary-gradient p-2 leading-none text-white w-10 aspect-square flex items-center justify-center"
              >
                <IconPlus class="w-6" strokeWidth="3" />
              </div>
              <p class="text-lg leading-none">Add a recipe</p>
            </NuxtLink>
            <RecipeCard
              v-for="recipe in yourKitchenRecipes"
              :key="recipe.id"
              :recipe="recipe"
              class="w-50 ml-2 mb-2 text-[24px] sm:text-[30px]"
            />
          </BlocksCarousel>
        </div>
      </div>
      <div v-else class="basis-100 w-full bg-primary-300 rounded-4xl p-6"></div>
      <!-- Recommendations -->
      <div class="mt-6">
        <h2 class="text-2xl font-bold tracking-tight mx-2">For You</h2>
        <p
          class="text-sm text-gray-500 leading-none mx-2"
          v-if="!auth.isUser()"
        >
          <NuxtLink to="/login" class="underline">Sign in</NuxtLink> to get
          tailored recommendations
        </p>
        <div class="flex flex-wrap gap-6 mt-6">
          <RecipeCardHorizontal
            v-for="recipe in recommendedRecipes"
            :key="recipe.id"
            :recipe="recipe"
            class="basis-95 max-w-150 flex-1 text-[24px] sm:text-[30px]"
          />
        </div>
      </div>
    </div>
    <div v-else-if="auth.profileFetched && !auth.isUser()">
      <HerocardsHome />
      <div class="pt-20">
        <h2 class="text-2xl font-bold tracking-tight mx-2">For You</h2>
        <p
          class="text-sm text-gray-500 leading-none mx-2"
          v-if="!auth.isUser()"
        >
          <NuxtLink to="/login" class="underline">Sign in</NuxtLink> to get
          tailored recommendations
        </p>
        <div class="flex flex-wrap gap-6 mt-6">
          <RecipeCardHorizontal
            v-for="recipe in recommendedRecipes"
            :key="recipe.id"
            :recipe="recipe"
            class="basis-95 max-w-150 flex-1 text-[24px] sm:text-[30px]"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const recommendedRecipes = ref<RecipeOverview[] | null>(null);

const yourKitchenRecipes = computed(() => {
  const all = new Set([
    ...(auth.user?.recipes ?? []),
    ...(auth.user?.bookmarks ?? []),
  ]);
  const unique = Array.from(all).sort((a, b) => b.relevancy - a.relevancy);
  return unique.slice(0, 9);
});

const fetchRecipes = async () => {
  if (!auth.user?.id) return;
  recommendedRecipes.value = await getRecipeOverviews(supabase, {
    orderBy: { column: 'relevancy', ascending: false },
    range: { from: 15, to: 23 },
    eq: { visibility: 'PUBLIC' },
    not: { picture: null },
  });
};

watchEffect(() => {
  fetchRecipes();
});

const greeting = computed(() => {
  if (auth.user?.username) {
    return `Welcome back, ${auth.user?.username}!`;
  }
  return 'Welcome back!';
});
</script>

<style scoped></style>
