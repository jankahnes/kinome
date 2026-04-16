<template>
  <NuxtLink :to="getRecipeUrl(recipe?.id, recipe?.title)" v-if="recipe?.id"
    class="flex flex-col items-center group main-card mt-16" :class="{ 'mb-4': reasonText }">
    <NuxtImg
      class="-mt-16 w-[85%] aspect-square will-change-transform object-contain relative z-10 shadow-gray-200 [filter:drop-shadow(0_0_8px_var(--tw-shadow-color))_drop-shadow(0_0_4px_var(--tw-shadow-color))] transition-transform duration-500 group-hover:translate-y-[-1px] group-hover:scale-[1.01]"
      v-if="recipe?.picture" :src="recipe?.picture" :alt="recipe?.title" />
    <div v-else
      class="-mt-16 w-[85%] aspect-square relative z-10 will-change-transform transition-transform duration-500 group-hover:translate-y-[-2px] group-hover:scale-[1.01]">
      <div
        class=" bg-white rounded-4xl overflow-hidden relative z-10 aspect-[9/16] shadow-gray-200 [filter:drop-shadow(0_0_6px_var(--tw-shadow-color))_drop-shadow(0_0_2px_var(--tw-shadow-color))] w-[55%] mx-auto">
        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full aspect-9/17">
          <NuxtImg class="w-full h-full object-cover relative z-10 white-fade-mask"
            :alt="recipe?.title + ' video thumbnail'" :src="recipe?.social_picture!" />
        </div>
        <div class="pointer-events-none absolute inset-0 rounded-4xl white-fade-overlay z-20"></div>
      </div>
      <div />
    </div>

    <div
      class="flex-1 flex flex-col justify-between gap-2 sm:gap-3 items-center p-4 pt-3 will-change-transform transition-transform duration-300 group-hover:translate-y-[1px] ">
      <div class="flex-1 flex flex-col justify-center items-center">
        <h2
          class=" text-xl sm:text-2xl tracking-tight font-semibold line-clamp-2 text-center text-balance leading-5 sm:leading-6.5">
          {{ recipe?.title }}</h2>
        <p v-if="recipe?.variation_name && recipe?.variation_display_name"
          class="text-[11px] sm:text-[12px] uppercase tracking-[2px] text-gray-400 font-light mt-0.5">
          {{ recipe?.variation_name }}
        </p>
      </div>
      <div
        class="flex gap-1.5 flex-wrap text-xs sm:text-[14px] h-7 sm:h-14 overflow-y-hidden items-center justify-center py-0.5 px-2">
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
    <div
      class="px-3 py-1.5 rounded-xl bg-primary-10/70 text-xs text-gray-500 font-medium -mb-4 shadow-[0_0_8px_rgba(0,0,0,0.1)] z-10 text-center truncate max-w-[80%]"
      v-if="reasonText">
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
