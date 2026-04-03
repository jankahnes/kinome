<template>
  <NuxtLink :to="getRecipeUrl(recipe?.id, recipe?.title)" v-if="recipe?.id"
    class="flex flex-col items-center group relative justify-end">
    <div class="relative w-[85%] text-lg" v-if="recipe?.picture || recipe?.social_picture">
      <NuxtImg
        class="w-full aspect-square will-change-transform object-contain relative z-10 shadow-gray-200 [filter:drop-shadow(0_0_8px_var(--tw-shadow-color))_drop-shadow(0_0_4px_var(--tw-shadow-color))] transition-transform duration-500 group-hover:translate-y-[-1px] group-hover:scale-[1.01]"
        v-if="recipe?.picture" :src="recipe?.picture" :alt="recipe?.title" />
      <div v-else
        class="relative z-10 will-change-transform transition-transform duration-500 group-hover:translate-y-[-2px] group-hover:scale-[1.01]">
        <div
          class="bg-white rounded-4xl overflow-hidden relative z-10 aspect-[9/16] shadow-gray-200 [filter:drop-shadow(0_0_6px_var(--tw-shadow-color))_drop-shadow(0_0_2px_var(--tw-shadow-color))] w-[55%] mx-auto">
          <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full aspect-9/16">
            <NuxtImg class="w-full h-full object-cover relative z-10 white-fade-mask"
              :alt="recipe?.title + ' video thumbnail'" :src="recipe?.social_picture!" />
          </div>
          <div class="pointer-events-none absolute inset-0 rounded-4xl white-fade-overlay z-20"></div>
        </div>
        <div />
      </div>
    </div>

    <!-- was originally pt-[60%] -->
    <div
      class="w-full relative pt-[60%] px-2 sm:px-6 pb-[5%] z-0 will-change-transform transition-transform duration-300 group-hover:translate-y-[1px] main-card rounded-4xl min-h-40 max-h-100"
      :class="{ '-mt-[60%] ': recipe.picture || recipe.source, 'pb-[calc(5%+12px)]! min-h-44!': reasonText }">
      <div class="pt-4 flex flex-col gap-2 sm:gap-4 justify-between h-full items-center">
        <h2
          class="font-bold leading-5 sm:leading-6 text-xl sm:text-2xl tracking-tight line-clamp-2 text-center text-balance h-10 sm:h-12 grid place-items-center">
          {{ recipe?.title }}
        </h2>
        <div
          class="flex gap-1.5 flex-wrap text-xs sm:text-[14px] h-7 sm:h-14 overflow-y-hidden items-center justify-center py-0.5">
          <div class="tag flex items-center gap-1 bg-secondary" v-if="recipe?.rating && recipe?.rating >= 4">
            <FormsRatingField :model-value="recipe?.rating" :star-width="13" :star-height="13" :select="false"
              :uniqueId="'card-new-' + recipe?.id + id" />
            <span>{{ recipe?.rating.toFixed(1) }}</span>
          </div>

          <div class="tag flex items-center justify-center text-nowrap bg-secondary" v-for="(tag, index) in top3Tags"
            :key="index">
            {{ tag?.name }}
          </div>
        </div>
      </div>
    </div>
    <div
      class="px-3 py-1.5 rounded-xl bg-primary-10/70 text-xs text-gray-500 font-medium -mt-4 shadow-[0_0_8px_rgba(0,0,0,0.1)] z-10 text-center truncate max-w-[80%]" v-if="reasonText">
      {{ reasonText }}
    </div>
  </NuxtLink>

</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: RecipeOverview;
  truncate?: boolean;
  id?: string;
  reasonText?: string;
}>();
const top3Tags = ref(getTop3Tags(props.recipe));

function getTop3Tags(recipe: RecipeOverview) {
  if (!recipe?.tags) return [];
  const tags = recipe.tags.map((tag) => getTagByID(tag));
  tags.sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));
  const cropped = tags.slice(0, 3);
  return cropped;
}

const recipeStore = useRecipeStore();

onMounted(async () => {
  if (!props.recipe.picture && props.recipe.source_type === 'MEDIA') {
    props.recipe.social_picture = await recipeStore.getSocialPicture(
      (props.recipe.video_metadata as any)?.url ?? props.recipe.source ?? '',
      false
    );
  }
});
</script>

<style scoped>
.white-fade-overlay {
  box-shadow: inset 0 0 10px 10px rgba(255, 255, 255, 0.4);
}
</style>
