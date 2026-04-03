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
      <div class="flex-wrap gap-4 sm:gap-6 hidden md:flex justify-stretch items-end">
        <!-- Add recipe CTA (own profile only) -->
        <NuxtLink
          v-if="isOwn"
          to="/recipe/new"
          class="animated-button basis-65 max-w-80 max-w-3xl:max-w-110 3xl:basis-85 flex-1 text-[30px] flex flex-col gap-3 justify-center items-center border-2 border-primary rounded-4xl! bg-primary-10/50 h-85"
        >
          <div class="rounded-full primary-gradient p-3 text-white flex items-center justify-center">
            <IconPlus class="w-6" strokeWidth="3" />
          </div>
          <p class="font-semibold text-lg">New Recipe</p>
        </NuxtLink>
        <RecipeCard
          v-for="recipe in recipes"
          :key="recipe.id"
          :recipe="recipe"
          class="basis-65 max-w-80 max-w-3xl:max-w-110 3xl:basis-85 flex-1 text-[30px]"
        />
      </div>

      <!-- Mobile list -->
      <div class="flex flex-col gap-3 md:hidden">
        <NuxtLink
          v-if="isOwn"
          to="/recipe/new"
          class="animated-button flex items-center gap-3 p-4 outline-2 outline-primary rounded-2xl! bg-primary-10/50"
        >
          <div class="rounded-full primary-gradient p-2 text-white flex items-center justify-center">
            <IconPlus class="w-4" strokeWidth="3" />
          </div>
          <p class="font-semibold">New Recipe</p>
        </NuxtLink>
        <RecipeCardHorizontal
          v-for="recipe in recipes"
          :key="recipe.id"
          :recipe="recipe"
        />
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
const user = inject<Ref<FullUser | null>>('profileUser');
const isOwn = inject<ComputedRef<boolean>>('profileIsOwn');
const loading = inject<Ref<boolean>>('profileLoading');

const recipes = computed(() =>
  [...(user?.value?.recipes ?? [])].sort((a, b) => (b.relevancy ?? 0) - (a.relevancy ?? 0))
);
</script>

<style scoped></style>
