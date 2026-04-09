<template>
  <NuxtLink v-if="recipe.id" :to="getRecipeUrl(recipe?.id, recipe?.title)" class="flex flex-col">
    <div class="flex flex-row items-center transition-all duration-300 group z-0">
      <!-- circular -->
      <NuxtImg v-if="recipe?.picture"
        class="z-10 h-26 xs:h-32 object-cover bg-transparent shadow-gray-200 [filter:drop-shadow(0_0_6px_var(--tw-shadow-color))_drop-shadow(0_0_2px_var(--tw-shadow-color))] will-change-transform transition-transform duration-500 group-hover:translate-y-[-2px] group-hover:scale-[1.01]"
        :src="recipe?.picture || ''" fetchpriority="high" :alt="recipe?.title" />

      <div v-else-if="recipe?.social_picture"
        class="w-26 xs:w-32 flex justify-center relative z-10 will-change-transform transition-transform duration-500 group-hover:translate-y-[-2px] group-hover:scale-[1.01] shadow-gray-200 [filter:drop-shadow(0_0_6px_var(--tw-shadow-color))_drop-shadow(0_0_2px_var(--tw-shadow-color))]">
        <NuxtImg class="w-16 xs:w-22 aspect-9/16 rounded-3xl object-cover z-10"
          :alt="recipe?.title + ' video thumbnail'" :src="recipe?.social_picture!" />
        <div class="w-16 xs:w-22 aspect-9/16 pointer-events-none absolute left-1/2 -translate-x-1/2 inset-0 rounded-3xl white-fade-overlay z-20">
        </div>

      </div>
      <div class="z-0 flex-1 main-card px-4 py-3 rounded-4xl flex flex-col gap-2 justify-center h-29 xs:h-35" :class="recipe?.picture || recipe?.social_picture
        ? '-ml-22 !pl-25 xs:-ml-28 xs:!pl-31'
        : ''
        ">
        <p v-if="variationLabel"
          class="text-[10px] uppercase tracking-widest text-gray-400 leading-none -mb-1">
          {{ variationLabel }}
        </p>
        <h2 class="font-bold leading-6 text-xl sm:text-2xl tracking-tight line-clamp-2 text-balance">
          {{ recipe?.title }}
        </h2>
        <div class="flex gap-1.5 flex-wrap text-xs max-h-[1.7rem] xs:max-h-[3.4rem] overflow-hidden items-start py-0.5">
          <div v-if="recipe?.rating && recipe?.rating >= 4" class="tag flex items-center gap-1 bg-secondary">
            <FormsRatingField :model-value="recipe?.rating" :star-width="13" :star-height="13" :select="false"
              :uniqueId="`card-new-horizontal-${recipe?.id}-${uniqueId}`" />
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
      class="px-3 py-1.5 rounded-xl bg-primary-10/70 text-xs text-gray-500 font-medium -mt-4 shadow-[0_0_8px_rgba(0,0,0,0.1)] z-10 text-center truncate max-w-[70%] mx-4 self-end"
      v-if="reasonText">
      {{ reasonText }}
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: RecipeOverview;
  uniqueId?: string;
  reasonText?: string;
}>();
const top3Tags = ref(getTop3Tags(props.recipe));

const variationLabel = computed(
  () => (props.recipe as any)?.variation_name ?? null
);

function getTop3Tags(recipe: RecipeOverview) {
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