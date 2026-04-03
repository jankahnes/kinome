<template>
  <div class="mt-8">
    <div v-if="loading">
      <div class="flex-wrap gap-4 sm:gap-6 hidden md:flex">
        <Skeleton v-for="i in 6" :key="i" class="min-w-65 basis-65 max-w-100 h-92 flex-1 rounded-xl" />
      </div>
      <div class="flex flex-col gap-4 md:hidden">
        <Skeleton v-for="i in 4" :key="i" class="w-full h-28 rounded-xl" />
      </div>
    </div>

    <template v-else>
      <!-- Desktop grid -->
      <div v-if="bookmarks.length > 0" class="flex-wrap gap-4 sm:gap-6 hidden md:flex justify-stretch">
        <RecipeCard
          v-for="recipe in bookmarks"
          :key="recipe.id"
          :recipe="recipe"
          class="basis-65 max-w-80 max-w-3xl:max-w-110 3xl:basis-85 flex-1 text-[30px]"
        />
      </div>

      <!-- Mobile list -->
      <div v-if="bookmarks.length > 0" class="flex flex-col gap-3 md:hidden">
        <RecipeCardHorizontal
          v-for="recipe in bookmarks"
          :key="recipe.id"
          :recipe="recipe"
        />
      </div>

      <!-- Empty state -->
      <div v-if="bookmarks.length === 0" class="flex flex-col items-center gap-4 py-20 text-center">
        <div class="w-16 h-16 rounded-2xl bg-primary-10 flex items-center justify-center">
          <IconBookmark class="w-7 text-primary" />
        </div>
        <div>
          <p class="text-lg font-semibold">No saved recipes yet</p>
          <p class="text-gray-400 text-sm mt-1">
            {{ isOwn ? 'Bookmark recipes you want to cook later.' : 'This user has no saved recipes.' }}
          </p>
        </div>
        <NuxtLink v-if="isOwn" to="/kitchen/recipes" class="animated-button bg-primary-10 px-5 py-2 font-semibold text-sm">
          Browse Recipes
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const user = inject<Ref<FullUser | null>>('profileUser');
const isOwn = inject<ComputedRef<boolean>>('profileIsOwn');
const loading = inject<Ref<boolean>>('profileLoading');

const bookmarks = computed(() => user?.value?.bookmarks ?? []);
</script>

<style scoped></style>
