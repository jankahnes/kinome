<template>
  <div class="pb-16 m-4 sm:m-10 sm:ml-20">
    <div class="flex gap-4 flex-wrap" v-if="auth.isUser()">
      <button
        v-for="view in views"
        :key="view.value"
        @click="setView(view.value)"
        class="animated-button bg-primary-10/40 ring-1 ring-primary px-3 py-2"
        :class="{
          'primary-gradient text-gray-800 px-3 py-2':
            currentView === view.value,
        }"
      >
        {{ view.displayName }}
      </button>
    </div>
    <Transition name="loaded-content">
      <div v-if="auth.profileFetched && auth.isUser()">
        <div v-if="currentView === 'home'">
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
                      :segments="[
                        { value: 0.6, color: 'var(--color-primary)' },
                      ]"
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
                      :segments="[
                        { value: 0.4, color: 'var(--color-primary)' },
                      ]"
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
                      :segments="[
                        { value: 0.7, color: 'var(--color-primary)' },
                      ]"
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
              <h2 class="text-2xl font-bold tracking-tight mx-2">
                Shopping List
              </h2>
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
            <div class="space-y-6 pb-0 basis-120 w-120 flex-1 max-w-300">
              <h2 class="text-2xl font-bold tracking-tight">
                From your Cookbook
              </h2>
              <BlocksCarousel class="" :flexClass="'gap-2'">
                <NuxtLink
                  :to="'/recipe/new'"
                  class="animated-button flex flex-col gap-2 justify-center items-center p-4 outline-2 outline-primary rounded-4xl! w-44 h-56 self-end ml-2 mb-2"
                >
                  <span
                    class="material-symbols-outlined !text-2xl rounded-full primary-gradient p-2 leading-none text-white"
                    >add</span
                  >
                  <p class="text-lg leading-none">Add a recipe</p>
                </NuxtLink>
                <RecipeCard
                  v-for="recipe in yourKitchenRecipes"
                  :key="recipe.id"
                  :recipe="recipe"
                  truncate
                  class="w-50 ml-2 mb-2 text-[24px] sm:text-[30px]"
                />
              </BlocksCarousel>
            </div>
          </div>
          <div
            v-else
            class="basis-100 w-full bg-primary-300 rounded-4xl p-6"
          ></div>
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
      </div>
      <div v-else-if="auth.profileFetched && !auth.isUser()">
        <div
          class="flex action-card py-10 shadow-lg mt-12 justify-between items-center relative overflow-hidden"
        >
          <div
            class="flex flex-col gap-2 flex-1 2xl:mr-84 min-w-0 mx-4 sm:mx-10 text-center sm:text-left"
          >
            <h1 class="text-3xl sm:text-5xl font-bold tracking-tight leading-7 sm:leading-12">
              Unlock the full power of Kinome
            </h1>
            <p class="text-base sm:text-lg leading-5 sm:leading-7">
              Sign up to get access to your personal intelligent cookbook.
            </p>
            <div
              class="flex gap-4 mt-2 py-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:overflow-visible md:pr-10"
            >
              <div
                class="flex flex-col items-center gap-2 p-6 action-card shadow-md flex-1 min-w-[80%] snap-start md:min-w-0 shrink-0"
              >
                <img src="/blob.webp" alt="Blob" class="h-50" />
                <img
                  src="/smart_tracking.webp"
                  alt="Smart Tracking"
                  class="h-30 -mt-40"
                />
                <h2 class="text-2xl font-bold tracking-tight mt-8">
                  Smart Tracking
                </h2>
                <p
                  class="text-lg tracking-tight text-center leading-tight -mt-2"
                >
                  Track macros & nutrients automatically using our smart
                  ingredient parser.
                </p>
              </div>
              <div
                class="flex flex-col items-center gap-2 p-6 action-card shadow-md flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
              >
                <img src="/blob.webp" alt="Blob" class="h-50 rotate-340 z-0" />
                <img
                  src="/tailored_discovery.webp"
                  alt="Tailored Discovery"
                  class="h-38 -mt-44 z-10"
                />
                <h2 class="text-2xl font-bold tracking-tight mt-4">
                  Tailored Discovery
                </h2>
                <p
                  class="text-lg tracking-tight text-center leading-tight -mt-2"
                >
                  Get recipe suggestions based on your taste preferences and
                  health goals.
                </p>
              </div>
              <div
                class="flex flex-col items-center gap-2 p-6 action-card shadow-md flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
              >
                <img src="/blob.webp" alt="Blob" class="h-50 z-0 rotate-160" />
                <img
                  src="/universal_cookbook.webp"
                  alt="Universal Cookbook"
                  class="h-30 -mt-44 z-10"
                />
                <h2 class="text-2xl font-bold tracking-tight mt-12">
                  Universal Cookbook
                </h2>
                <p
                  class="text-lg tracking-tight text-center leading-tight -mt-2"
                >
                  Save recipes from any website, TikTok or Youtube in seconds.
                </p>
              </div>
            </div>
            <NuxtLink
              to="/onboarding"
              class="animated-button rounded-full! bg-primary text-2xl mt-4 p-3 min-w-1/4 text-center font-bold"
              >Create your account</NuxtLink
            >
            <p class="text-sm text-gray-500 leading-none m-2 self-center">
              Already have an account?
              <NuxtLink to="/login" class="underline">Sign in</NuxtLink>
            </p>
          </div>
          <img
            src="/feast.png"
            alt="Blob"
            class="hidden 2xl:block absolute -right-20 h-[120%]"
          />
        </div>
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
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const recommendedRecipes = ref<RecipeOverview[] | null>(null);

const route = useRoute();
const router = useRouter();

const currentView = ref((route.query.view as string) || 'home');
const views = computed(() => [
  {
    value: 'home',
    displayName: 'Home',
  },
  ...(auth.isUser()
    ? [
        {
          value: 'recommendations',
          displayName: 'Recommendations',
        },
        {
          value: 'cookbook',
          displayName: 'Your Cookbook',
        },
        {
          value: 'saved',
          displayName: 'Your Saved Recipes',
        },
      ]
    : []),
]);

const yourKitchenRecipes = computed(() => {
  const all = new Set([
    ...(auth.user?.recipes ?? []),
    ...(auth.user?.bookmarks ?? []),
  ]);
  const unique = Array.from(all).sort((a, b) => b.relevancy - a.relevancy);
  return unique.slice(0, 9);
});

useHead({
  title: 'Your Collection | Kinome',
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

const setView = (view: string) => {
  currentView.value = view;
  router.push({ query: { view } });
};

const greeting = computed(() => {
  if (auth.user?.username) {
    return `Welcome back, ${auth.user?.username}!`;
  }
  return 'Welcome back!';
});
</script>

<style scoped></style>
