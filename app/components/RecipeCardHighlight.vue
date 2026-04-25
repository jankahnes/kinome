<template>
  <NuxtLink v-if="recipe?.id" :to="getRecipeUrl(recipe?.id, recipe?.title)"
    class="transition-all duration-300 group flex items-center main-card main-card-rounded py-4 md:py-0"
    :class="{ 'bg-primary-5/70!': isSignature }">
    <!-- circular -->
    <NuxtImg v-if="recipe?.picture"
      class="-ml-2 sm:-ml-6 z-10 h-34 sm:h-50 md:h-60 max-h-70 aspect-square object-contain shadow-[#00000015] filter-[drop-shadow(10px_20px_20px_var(--tw-shadow-color))] will-change-transform transition-transform duration-500 group-hover:translate-y-[-2px] group-hover:scale-[1.008]"
      :src="recipe?.picture || ''" fetchpriority="high" :alt="recipe?.title" />

    <div class="flex-1 flex flex-col gap-1 md:gap-1.5 px-3 md:pl-6 md:pr-10 md:py-7">
      <h2 class="font-semibold sm:font-medium font-headers text-2xl sm:text-3xl md:text-5xl tracking-tight line-clamp-2 items-center gap-4 leading-tight"
        :class="{ 'underline decoration-primary decoration-2  md:decoration-3 underline-offset-2 md:nderline-offset-4': true, 'text-4xl! underline-offset-3!': isSignature }">
        {{ recipe?.title }}
      </h2>
      <p class="hidden sm:block text-xs md:text-sm text-gray-600 line-clamp-4 ml-0.5 max-w-3xl">
        {{ recipe?.description }}
      </p>

      <div class="flex flex-col flex-1 gap-2 justify-end mt-auto">
        <p class="flex items-center gap-2">
          <FormsRatingField :model-value="recipe?.rating" :star-width="24" :star-height="24" :spacing="2"
            :select="false" :uniqueId="`card-highlight-${recipe?.id}-${uniqueId}`" class="hidden md:inline-block" />
            <IconStar class="w-4 h-4 mt-0.5 md:hidden" fill="currentColor" />
          <span class="font-headers leading-none mt-0.5">{{
            recipe?.rating.toFixed(1)
          }}<span class="text-[11px] align-middle text-gray-500 tracking-tight font-mono"> · {{ recipe?.kcal }} kcal ·
              {{
                totalTimeLabel }}</span></span>
        </p>
        <div class="flex gap-4 justify-between">
          <div class="flex gap-1.5 flex-wrap overflow-hidden py-0.5 text-xs text-gray-700">
            <div class="tag flex items-center justify-center text-nowrap bg-primary/8" v-for="(tag, index) in top3Tags"
              :key="index">
              {{ tag?.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: RecipeOverview;
  uniqueId?: string;
  isSignature?: boolean;
}>();
const top3Tags = ref(getTop3Tags(props.recipe));

const totalTimeLabel = computed(() => {
  return getTotalTime(props.recipe.total_time_mins, props.recipe.effort)?.map((item) => `${item.value} ${item.label}`).join(' ');
});

function getTop3Tags(recipe: RecipeOverview) {
  if (!recipe?.tags) return [];
  const tags = recipe.tags.map((tag) => getTagByID(tag));
  tags.sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));
  const cropped = tags.slice(0, 3);
  return cropped;
}
</script>

<style scoped>
.white-fade-overlay {
  background: radial-gradient(circle at center,
      rgba(255, 255, 255, 0) 62%,
      rgba(255, 255, 255, 1) 75%);
}
</style>
