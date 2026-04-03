<template>
  <div class="mt-8 flex flex-col gap-10 items-start">
    <!-- Profile Header -->
    <div v-if="loading" class="flex flex-col sm:flex-row gap-6 items-start">
      <Skeleton class="w-28 h-28 rounded-3xl flex-shrink-0" />
      <div class="flex flex-col gap-3 flex-1">
        <Skeleton class="h-8 w-48 rounded-xl" />
        <Skeleton class="h-5 w-32 rounded-xl" />
        <Skeleton class="h-6 w-24 rounded-xl" />
      </div>
    </div>

    <div v-else-if="user" class="flex flex-col sm:flex-row gap-6 items-start bg-cover p-4 rounded-4xl"
      :style="{ backgroundImage: 'url(/wood.png)' }">
      <Avatar :user="user" class="w-28 flex-shrink-0" />
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold tracking-tight">{{ user.username }}</h1>
        <p class="text-gray-500 text-sm">
          {{ badge.label
          }} · Member since {{ joinDate }}
        </p>

        <!-- Stats row -->
        <div class="flex gap-3 mt-2 flex-wrap">
          <NuxtLink :to="'/profile/' + user.id + '/recipes'"
            class="animated-button bg-primary-10 px-4 py-2 flex flex-col items-center min-w-20">
            <span class="text-2xl font-bold tracking-tight">{{ user.stats?.recipesCount ?? 0 }}</span>
            <span class="text-xs text-gray-500 font-medium">Recipes</span>
          </NuxtLink>
          <NuxtLink :to="'/profile/' + user.id + '/bookmarks'"
            class="animated-button bg-primary-10 px-4 py-2 flex flex-col items-center min-w-20">
            <span class="text-2xl font-bold tracking-tight">{{ user.stats?.bookmarksCount ?? 0 }}</span>
            <span class="text-xs text-gray-500 font-medium">Saved</span>
          </NuxtLink>
          <NuxtLink :to="'/profile/' + user.id + '/activity'"
            class="animated-button bg-primary-10 px-4 py-2 flex flex-col items-center min-w-20">
            <span class="text-2xl font-bold tracking-tight">{{ user.stats?.activityCount ?? 0 }}</span>
            <span class="text-xs text-gray-500 font-medium">Activities</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Signature Recipe -->
    <div v-if="signatureRecipe">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-xl font-bold tracking-tight">Signature Recipe</h2>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Original
        </span>
      </div>

      <NuxtLink :to="getRecipeUrl(signatureRecipe.id, signatureRecipe.title)"
        class="group flex flex-col sm:flex-row gap-0 max-w-2xl relative">
        <!-- Accent bar -->
        <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-4xl primary-gradient hidden sm:block" />

        <div class="main-card sm:pl-5 p-5 sm:pr-8 flex flex-col sm:flex-row gap-5 w-full">
          <!-- Recipe image -->
          <div class="flex-shrink-0 self-center" v-if="signatureRecipe.picture">
            <NuxtImg :src="signatureRecipe.picture" :alt="signatureRecipe.title"
              class="w-32 h-32 object-contain rounded-2xl [filter:drop-shadow(0_4px_12px_#00000022)] transition-transform duration-500 group-hover:scale-[1.03]" />
          </div>

          <div class="flex flex-col justify-between flex-1 gap-3">
            <div>
              <h3
                class="text-2xl font-bold tracking-tight leading-tight line-clamp-2 group-hover:underline decoration-primary underline-offset-2">
                {{ signatureRecipe.title }}
              </h3>
              <p class="text-gray-500 text-sm mt-1 line-clamp-2">{{ signatureRecipe.description }}</p>
            </div>

            <!-- Placeholder signature -->
            <div class="flex items-end gap-2">
              <span class="font-[cursive] italic text-2xl text-gray-400 leading-none select-none tracking-wide">
                {{ user?.username }}
              </span>
              <div class="h-px flex-1 max-w-24 bg-gray-200 mb-1" />
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty state for signature recipe -->
    <div v-else-if="!loading && isOwn" class="max-w-2xl">
      <h2 class="text-xl font-bold tracking-tight mb-4">Signature Recipe</h2>
      <div class="main-card p-6 flex flex-col items-center gap-3 text-center border-2 border-dashed border-primary/20">
        <p class="text-gray-500 text-sm">You haven't set a signature recipe yet.</p>
        <NuxtLink to="/profile/recipes" class="animated-button bg-primary-10 px-4 py-2 text-sm font-semibold">
          Choose from your recipes
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Activity Preview -->
    <div v-if="recentActivity.length > 0">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold tracking-tight">Recent Activity</h2>
        <NuxtLink :to="'/profile/' + user?.id + '/activity'" class="text-sm text-primary font-semibold">
          See all ›
        </NuxtLink>
      </div>
      <div class="flex flex-col max-w-xl">
        <div v-for="(item, i) in recentActivity" :key="item.id" class="flex gap-0">
          <div class="flex flex-col items-center w-8 flex-shrink-0">
            <div class="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 z-10" :class="activityDotColor(item.type)" />
            <div v-if="i < recentActivity.length - 1" class="w-px flex-1 bg-gray-200 mt-1" />
          </div>
          <div class="pb-5 pl-3 flex-1">
            <p class="text-sm text-gray-500 leading-snug">
              <span class="font-medium text-gray-800">{{ activityLabel(item) }}</span>
            </p>
            <p class="text-xs text-gray-400 mt-0.5">{{ timeAgo(item.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = inject<Ref<FullUser | null>>('profileUser');
const isOwn = inject<ComputedRef<boolean>>('profileIsOwn');
const loading = inject<Ref<boolean>>('profileLoading');

const signatureRecipe = computed(() => user?.value?.recipes?.[0] ?? null);

const recentActivity = computed(() => (user?.value?.activity ?? []).slice(0, 5));

const joinDate = computed(() => {
  const raw = user?.value?.created_at;
  if (!raw) return '';
  return new Date(raw).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
});

const badge = computed(() => {
  const stats = user?.value?.stats;
  const score = (stats?.recipesCount ?? 0) * 10 + (stats?.activityCount ?? 0);
  if (score >= 200) return { label: 'Master Chef', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  if (score >= 80) return { label: 'Kitchen Pro', color: 'bg-orange-50 text-orange-700 border-orange-200' };
  if (score >= 30) return { label: 'Seasoned Cook', color: 'bg-green-50 text-green-700 border-green-200' };
  if (score >= 8) return { label: 'Home Chef', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { label: 'New Cook', color: 'bg-gray-100 text-gray-500 border-gray-200' };
});

function activityDotColor(type: string) {
  switch (type) {
    case 'RECIPE_CREATION': return 'bg-primary';
    case 'COMMENT_CREATION': return 'bg-blue-400';
    case 'RATING_CREATION': return 'bg-amber-400';
    case 'USER_CREATION': return 'bg-purple-400';
    case 'FOOD_CREATION': return 'bg-teal-400';
    default: return 'bg-gray-300';
  }
}

function activityLabel(item: Activity): string {
  switch (item.type) {
    case 'RECIPE_CREATION':
      if (item.recipe?.source_type === 'PREPARSED' || item.recipe?.source_type === 'TEXT') return `Created "${item.recipe?.title ?? 'a recipe'}"`;
      return `Added ${item.recipe?.title ?? 'a recipe'}`;
    case 'COMMENT_CREATION':
      return `Commented on ${item.comment?.recipe?.title ?? 'a recipe'}`;
    case 'RATING_CREATION':
      return `Rated ${item.rating?.recipe?.title ?? 'a recipe'} ${item.rating?.rating}/5`;
    case 'USER_CREATION':
      return 'Joined the community';
    case 'FOOD_CREATION':
      return `Added ${item.food?.name ?? 'a food'} to the database`;
    default:
      return 'Activity';
  }
}
</script>

<style scoped></style>
