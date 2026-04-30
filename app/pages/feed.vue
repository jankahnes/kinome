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
              <NuxtLink :to="getProfileUrl(item.user)">
                <Avatar :user="item.user ?? null" class="w-9 h-9 shrink-0" />
              </NuxtLink>
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
  getTrendingThisMonth(supabase, 6).then((recipes) => {
    socialRecipes.value = recipes.slice(0, 6);
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
