<template>
  <NuxtLink
    :to="getRecipeUrl(recipe?.id, recipe?.title)"
    v-if="recipe?.id"
    class="flex flex-col items-center group relative justify-end"
  >
    <div class="relative w-[60%] text-lg">
      <NuxtImg
        class="w-full aspect-square will-change-transform object-contain relative z-10 transition-transform duration-500 group-hover:translate-y-[-1px] group-hover:scale-[1.01]"
        v-if="recipe?.picture"
        :src="recipe?.picture"
        :alt="recipe?.title"
      />
    </div>

    <!-- was originally pt-[60%] -->
    <div
      class="w-full relative pt-[45%] px-2 sm:px-6 pb-[5%] z-0 will-change-transform transition-transform duration-300 group-hover:translate-y-[1px] rounded-4xl bg-primary"
      :class="{ '-mt-[45%] ': recipe.picture || recipe.source }"
    >
      <div
        class="pt-4 flex flex-col gap-2 justify-between h-full items-center"
      >
        <span
          class=" flex text-sm font-bold px-2 py-0.5 rounded-full items-center justify-center tracking-tight gap-1 bg-primary-10"
        >
          <IconFlame class="w-4" strokeWidth="3" />
          <span class="leading-none mt-0.5">TRENDING</span>
        </span>
        <h2
          class="font-bold leading-10 text-5xl tracking-tight line-clamp-2 text-center text-balance mt-2"
        >
          {{ recipe?.title }}
        </h2>
        <p class="text-[17px] leading-tight line-clamp-3 text-center text-balance mx-6 xs:mx-10">
          {{ recipe?.description }}
        </p>
        <div
          class="flex gap-1.5 items-center justify-center "
        >
          <div class="tag flex items-center gap-1">
            <FormsRatingField
              :model-value="recipe?.rating"
              :star-width="20"
              :star-height="20"
              :spacing="2"
              :uniqueId="'card-highlight-mobile-' + recipe?.id + id"
              class=""
            />
            <span class="text-lg leading-none">{{ recipe?.rating.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: RecipeOverview;
  truncate?: boolean;
  id?: string;
}>();
</script>
