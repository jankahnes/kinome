<template>
  <div class="sm:mt-10 mb-20 space-y-6 sm:space-y-10 m-4 sm:mx-10 lg:ml-22 lg:mr-18">
    <!-- Header -->
    <div class="md:hidden flex justify-between items-center">
      <Logo />
      <NuxtLink :to="getProfileUrl(auth.user)" v-if="auth.isUser()">
        <Avatar :user="auth.user" class="rounded-full w-10 h-10" />
      </NuxtLink>
      <NuxtLink to="/login" class="main-button animated-button mt-1" v-else>
        <IconLogIn :size="26" />
      </NuxtLink>
    </div>
    <h1 class="text-3xl sm:text-4xl font-headers pt-2 md:pt-4 flex items-end gap-1">
      <IconRss class="" :size="44" :strokeWidth="2" />
      <span class="ml-1">Feed</span>
    </h1>

    <div class="flex flex-col lg:flex-row gap-12">
      <div class="flex-1 flex flex-col gap-8">
        <!-- Trending on Social Media -->
        <section v-if="socialRecipes.length" class="">
          <div class="flex items-center gap-2 mb-4">
            <IconTrendingUp class="w-6 h-6 " />
            <h2 class="text-xl sm:text-2xl font-headers">Trending this month</h2>
            <NuxtLink to="/kitchen/social" class="ml-auto text-xs text-gray-600 flex items-center gap-0.5">
              See all
              <IconChevronRight class="w-4 h-4 inline" />
            </NuxtLink>
          </div>
          <div class="flex flex-wrap gap-4">
            <RecipeCardSocialMedia v-for="recipe in socialRecipes" :key="recipe.id" :recipe="recipe"
              class="basis-120" />
          </div>
        </section>
        <!-- Latest Articles -->
        <section v-if="articles.length">
          <div class="flex items-center gap-2 mb-4">
            <IconBookOpen class="w-6 h-6" />
            <h2 class="text-xl sm:text-2xl font-headers">Latest Articles</h2>
          </div>
          <div class="flex flex-col sm:flex-row gap-4">
            <NuxtLink v-for="article in articles" :key="article.path" :to="article.path"
              class="flex-1 main-card main-card-rounded overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg">
              <div class="h-36 sm:h-44 overflow-hidden">
                <div class="w-full h-full bg-linear-to-br flex items-center justify-center text-5xl"
                  :class="article.gradient">
                  {{ article.emoji }}
                </div>
              </div>
              <div class="main-card-padding flex flex-col gap-2">
                <span class="text-xs text-gray-400 uppercase tracking-wider">{{ article.category }}</span>
                <h3 class="font-bold text-lg leading-snug line-clamp-2">{{ article.title }}</h3>
                <p class="text-sm text-gray-500 line-clamp-2">{{ article.excerpt }}</p>
                <span class="text-xs text-gray-400 mt-1">{{ article.readTime }}</span>
              </div>
            </NuxtLink>
          </div>
        </section>
        <!-- Guess the Score -->
        <section class="overflow-hidden">
          <div class="flex items-center gap-2 mb-4">
            <IconBrain class="w-6 h-6" />
            <h2 class="text-xl sm:text-2xl font-headers">Guess the Health Score</h2>
          </div>
          <div v-if="guessRecipe"
            class="flex flex-col sm:flex-row gap-6 items-center main-card main-card-padding main-card-rounded">
            <NuxtLink :to="getRecipeUrl(guessRecipe.id, guessRecipe.title)" class="shrink-0 w-40 h-40 sm:w-52 sm:h-52">
              <NuxtImg v-if="guessRecipe.picture" :src="guessRecipe.picture" :alt="guessRecipe.title"
                class="w-full h-full object-contain filter-[drop-shadow(0_0_8px_rgba(0,0,0,0.1))]" />
            </NuxtLink>
            <div class="flex-1 flex flex-col gap-4 items-center sm:items-start w-full">
              <NuxtLink :to="getRecipeUrl(guessRecipe.id, guessRecipe.title)">
                <h3 class="text-2xl sm:text-3xl font-headers tracking-tight text-center sm:text-left">
                  {{ guessRecipe.title }}
                </h3>
              </NuxtLink>
              <p class="text-gray-500 text-sm line-clamp-2 text-center sm:text-left">
                {{ guessRecipe.description }}
              </p>

              <Transition name="fade" mode="out-in">
                <!-- Guess buttons -->
                <div v-if="!guessRevealed" key="buttons" class="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button v-for="grade in guessGrades" :key="grade"
                    class="px-5 py-2.5 rounded-2xl font-bold text-lg cursor-pointer transition-all duration-200" :class="guessSelected === grade
                      ? 'bg-primary text-white scale-105 shadow-md'
                      : 'bg-primary-5 hover:bg-primary/20'" @click="selectGuess(grade)">
                    {{ grade }}
                  </button>
                  <button v-if="guessSelected" @click="revealGuess"
                    class="px-6 py-2.5 rounded-2xl font-bold text-lg bg-gray-800 text-white ml-2 cursor-pointer hover:bg-gray-700 transition-colors">
                    Reveal
                  </button>
                </div>
                <!-- Result -->
                <div v-else key="result" class="flex items-center gap-4">
                  <div class="flex flex-col items-center">
                    <span class="text-xs text-gray-400 uppercase tracking-wider">Actual Grade</span>
                    <span class="text-5xl font-black" :class="guessCorrect ? 'text-green-500' : 'text-primary'">
                      {{ actualGrade }}
                    </span>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span v-if="guessCorrect" class="text-green-600 font-bold text-lg">Nailed it!</span>
                    <span v-else class="text-gray-600 font-medium text-lg">
                      {{ guessDistance === 1 ? 'So close!' : 'Not quite!' }} You guessed {{ guessSelected }}.
                    </span>
                    <span class="text-sm text-gray-400">Health score: {{ guessRecipe.hidx }}/100</span>
                  </div>
                  <button @click="nextGuessRecipe"
                    class="px-4 py-2 rounded-2xl bg-primary-5 hover:bg-primary/20 font-medium ml-auto text-sm cursor-pointer transition-colors">
                    Next
                    <IconChevronRight class="w-4 h-4 inline" />
                  </button>
                </div>
              </Transition>
            </div>
          </div>
          <Skeleton v-else class="h-52 rounded-3xl" />
        </section>
        <!-- Nutrition Showdown -->
        <section v-if="showdownPair.length === 2">
          <div class="flex items-center gap-2 mb-4">
            <IconSwords class="w-6 h-6" />
            <h2 class="text-xl sm:text-2xl font-headers">Nutrition Showdown</h2>
          </div>
          <div class="flex flex-col sm:flex-row gap-6">
            <div v-for="(recipe, i) in showdownPair" :key="recipe.id"
              class="flex-1  flex flex-col sm:flex-row sm:first:flex-[1.1] items-center gap-6 group">
              <NuxtLink :to="getRecipeUrl(recipe.id, recipe.title)"
                class="w-full main-card main-card-rounded main-card-padding flex flex-col items-center gap-3 group transition-all duration-300 hover:shadow-lg">
                <div class="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                  <NuxtImg v-if="recipe.picture" :src="recipe.picture" :alt="recipe.title"
                    class="w-full h-full object-contain [filter:drop-shadow(0_0_6px_rgba(0,0,0,0.1))] transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <h3 class="text-lg sm:text-xl font-headers tracking-tight text-center line-clamp-2">{{ recipe.title }}
                </h3>
                <div class="flex flex-wrap gap-2 justify-center text-sm">
                  <span class="tag bg-primary/8">{{ Math.round(recipe.kcal ?? 0) }} kcal</span>
                  <span class="tag bg-primary/8">{{ Math.round(recipe.protein ?? 0) }}g protein</span>
                  <span class="tag" :class="(recipe.hidx ?? 0) >= 60 ? 'bg-green-100' : 'bg-amber-100'">
                    Health: {{ getGradeFromScore(recipe.hidx ?? 0) }}
                  </span>
                </div>
                <!-- Comparison bars -->
                <div class="w-full space-y-2 mt-2">
                  <div v-for="stat in showdownStats" :key="stat.key" class="flex items-center gap-2 text-xs">
                    <span class="w-16 text-gray-500 text-right shrink-0">{{ stat.label }}</span>
                    <div class="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700"
                        :class="isShowdownWinner(recipe, showdownPair[1 - i], stat.key) ? 'bg-primary' : 'bg-gray-300'"
                        :style="{ width: getShowdownBarWidth(recipe, stat.key) + '%' }">
                      </div>
                    </div>
                    <span class="w-10 text-gray-600 font-medium shrink-0">
                      {{ formatShowdownValue(recipe, stat.key) }}
                    </span>
                  </div>
                </div>
              </NuxtLink>
              <div class="hidden group-first:flex items-center text-4xl font-headers italic text-gray-300">vs</div>
            </div>
          </div>
        </section>
      </div>
      <div class="lg:basis-[28%] flex flex-col gap-8">
        <!-- Recipes Added Today -->
        <section v-if="todayRecipes.length">
          <div class="flex items-center gap-2 mb-4">
            <IconSparkles class="w-6 h-6" :strokeWidth="1.5" />
            <h2 class="text-xl sm:text-2xl font-headers">Added Today</h2>
            <NuxtLink to="/kitchen/recipes" class="ml-auto text-xs text-gray-600 flex items-center gap-0.5">
              Browse all
              <IconChevronRight class="w-4 h-4 inline" />
            </NuxtLink>
          </div>
          <div class="flex flex-col gap-4">
            <RecipeCardHorizontal v-for="(recipe, index) in todayRecipes" :key="recipe.id" :recipe="recipe"
              :id="'today-' + index" :uniqueId="'today-' + recipe.id" class="w-full" />
          </div>
        </section>
        <!-- Recent Activity -->
        <section>
          <div class="flex items-center gap-2 mb-4">
            <IconActivity class="w-6 h-6" />
            <h2 class="text-xl sm:text-2xl font-headers">Recent Activity</h2>
          </div>
          <div class="space-y-3">
            <div v-for="item in activityFeed" :key="item.id"
              class="main-card rounded-3xl px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md">
              <Avatar :user="item.user ?? null" class="w-9 h-9 shrink-0" />
              <div class="flex-1 flex flex-col gap-0.5">
                <p class="text-sm flex items-center gap-1 justify-between">
                  <span>
                    <span class="">{{ item.user?.username ?? 'Guest' }}</span>
                    <span class=""> {{ ' ' + getActivityVerb(item) + ' ' }} </span>
                  </span>
                  <span class="text-xs text-gray-400">{{ timeAgo(item.created_at) }}</span>
                </p>
                <p class="flex items-center gap-1">
                  <NuxtLink v-if="getActivityRecipe(item)"
                    :to="getRecipeUrl(getActivityRecipe(item)!.id, getActivityRecipe(item)!.title)"
                    class="line-clamp-1">
                    {{ getActivityRecipe(item)!.title }}
                  </NuxtLink>
                  <span v-if="item.type === 'RATING_CREATION' && item.rating" class="inline-flex items-center ml-1">
                    <FormsRatingField :model-value="item.rating.rating" :star-width="12" :star-height="12"
                      :select="false" :uniqueId="'activity-' + item.id" />
                  </span>
                </p>
                <p v-if="item.type === 'COMMENT_CREATION' && item.comment?.content"
                  class="text-xs text-gray-400 truncate mt-0.5 max-w-md">
                  "{{ item.comment.content }}"
                </p>
              </div>
            </div>
            <div v-if="!activityFeed.length" class="text-center text-gray-400 py-8">
              No recent activity yet
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();

useHead({
  title: 'Recipe Feed - Trending Recipes, Nutrition Games & Community Activity | Kinome',
  meta: [
    {
      name: 'description',
      content:
        'Explore the Kinome recipe feed with trending healthy recipes, latest nutrition articles, new community recipes, and interactive nutrition challenges.',
    },
    {
      property: 'og:title',
      content: 'Recipe Feed | Kinome',
    },
    {
      property: 'og:description',
      content:
        'Explore trending healthy recipes, latest nutrition articles, new community recipes, and interactive nutrition challenges on Kinome.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://kinome.app/feed',
    },
    {
      name: 'twitter:card',
      content: 'summary',
    },
    {
      name: 'twitter:title',
      content: 'Recipe Feed | Kinome',
    },
    {
      name: 'twitter:description',
      content:
        'Explore trending healthy recipes, latest nutrition articles, new community recipes, and interactive nutrition challenges on Kinome.',
    },
    {
      name: 'robots',
      content: 'index, follow, max-image-preview:large',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://kinome.app/feed',
    },
  ],
});

// --- Guess the Score ---
const guessGrades = ['S', 'A', 'B', 'C', 'D', 'F'] as const;
const guessSelected = ref<string | null>(null);
const guessRevealed = ref(false);
const guessRecipeIndex = ref(0);

function getGradeFromScore(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

const guessPool = ref<RecipeOverview[]>([]);
const guessRecipe = computed(() => guessPool.value[guessRecipeIndex.value] ?? null);
const actualGrade = computed(() => guessRecipe.value ? getGradeFromScore(guessRecipe.value.hidx ?? 0) : 'C');
const guessCorrect = computed(() => guessSelected.value === actualGrade.value);
const guessDistance = computed(() => {
  if (!guessSelected.value) return 99;
  const grades = [...guessGrades];
  return Math.abs(grades.indexOf(guessSelected.value) - grades.indexOf(actualGrade.value));
});

function selectGuess(grade: string) {
  if (guessRevealed.value) return;
  guessSelected.value = guessSelected.value === grade ? null : grade;
}

function revealGuess() {
  guessRevealed.value = true;
}

function nextGuessRecipe() {
  guessRevealed.value = false;
  guessSelected.value = null;
  guessRecipeIndex.value = (guessRecipeIndex.value + 1) % guessPool.value.length;
}

// --- Showdown ---
const showdownPair = computed(() => {
  if (guessPool.value.length < 4) return [];
  // Pick two recipes from the end of the pool (different from guess recipe)
  const pool = guessPool.value.filter((_, i) => i !== guessRecipeIndex.value);
  return pool.slice(0, 2);
});

const showdownStats = [
  { key: 'kcal', label: 'Calories' },
  { key: 'protein', label: 'Protein' },
  { key: 'fiber', label: 'Fiber' },
  { key: 'hidx', label: 'Health' },
] as const;

function isShowdownWinner(recipe: RecipeOverview, other: RecipeOverview, key: string) {
  const val = (recipe as any)[key] ?? 0;
  const otherVal = (other as any)[key] ?? 0;
  if (key === 'kcal') return val <= otherVal; // Lower kcal wins
  return val >= otherVal;
}

function getShowdownBarWidth(recipe: RecipeOverview, key: string) {
  const val = (recipe as any)[key] ?? 0;
  const maxes: Record<string, number> = { kcal: 1200, protein: 80, fiber: 30, hidx: 100 };
  return Math.min(100, (val / (maxes[key] ?? 100)) * 100);
}

function formatShowdownValue(recipe: RecipeOverview, key: string) {
  const val = (recipe as any)[key] ?? 0;
  if (key === 'hidx') return getGradeFromScore(val);
  if (key === 'protein' || key === 'fiber') return Math.round(val) + 'g';
  return Math.round(val);
}

// --- Social Media Trending ---
const socialRecipes = ref<RecipeOverview[]>([]);

// --- Recipes Added Today ---
const todayRecipes = ref<RecipeOverview[]>([]);

// --- Articles ---
const articles = ref<any[]>([]);

// --- Activity Feed ---
const activityFeed = ref<Activity[]>([]);

function getActivityVerb(item: Activity): string {
  switch (item.type) {
    case 'RECIPE_CREATION': return 'added a new recipe';
    case 'COMMENT_CREATION': return 'commented on';
    case 'RATING_CREATION': return 'rated';
    case 'USER_CREATION': return 'joined the community';
    case 'FOOD_CREATION': return 'added a new food';
    default: return 'did something on';
  }
}

function getActivityRecipe(item: Activity): { id: number; title: string } | null {
  if (item.type === 'RECIPE_CREATION' && item.recipe) {
    return { id: item.recipe.id, title: item.recipe.title };
  }
  if (item.type === 'COMMENT_CREATION' && item.comment?.recipe) {
    return { id: item.comment.recipe.id, title: item.comment.recipe.title };
  }
  if (item.type === 'RATING_CREATION' && item.rating?.recipe) {
    return { id: item.rating.recipe.id, title: item.rating.recipe.title };
  }
  return null;
}

// --- Data Fetching ---

onMounted(async () => {
  queryCollection('articles').order('date', 'DESC').limit(3).all().then((data) => {
    articles.value = data;
  });
  getTrendingThisMonth(supabase).then((recipes) => {
    socialRecipes.value = recipes.slice(0, 6);
  });
  getRecipeOverviews(supabase, {
    eq: { visibility: 'PUBLIC' },
    not: { picture: null },
    orderBy: { column: 'relevancy', ascending: false },
    limit: 8,
  }).then((recipes) => {
    guessPool.value = [...recipes].sort(() => Math.random() - 0.5);
  });
  getRecipeOverviews(supabase, {
    orderBy: { column: 'created_at', ascending: false },
    eq: { visibility: 'PUBLIC' },
    not: { picture: null },
    limit: 5,
  }).then((recipes) => {
    todayRecipes.value = recipes;
  });
  getActivity(supabase, {
    orderBy: { column: 'created_at', ascending: false },
    limit: 8,
  }).then((activity) => {
    activityFeed.value = activity;
  });
});

</script>

<style scoped></style>
