<template>
  <NuxtLink :to="getRecipeUrl(recipe?.id, recipe?.title)" v-if="recipe?.id"
    class="flex flex-col items-center group main-card main-card-rounded mt-8 md:mt-16" :class="{ 'mb-4': reasonText }">
    <div v-if="recipe?.picture"
      class="recipe-card-image-shell -mt-8 md:-mt-16 w-[75%] sm:w-[85%] aspect-square relative z-10 transition-transform duration-400 group-hover:-translate-y-px group-hover:scale-[1.01] hover-will-change-transform">
      <NuxtImg
        class="recipe-card-image w-full h-full object-contain relative z-10 shadow-gray-100 transition-opacity duration-250"
        :class="recipeImageLoaded ? 'opacity-100' : 'opacity-0'" :src="recipe?.picture" :alt="recipe?.title"
        sizes="sm:40vw md:240px lg:280px xl:320px" format="webp" loading="lazy" @load="recipeImageLoaded = true" />
    </div>
    <div v-else-if="recipe?.source_type === 'MEDIA'"
      class="-mt-8 md:-mt-16 w-[75%] sm:w-[85%] aspect-square relative z-10 transition-transform duration-400 group-hover:translate-y-[-2px] group-hover:scale-[1.01] hover-will-change-transform">
      <div
        class=" bg-white main-card-rounded overflow-hidden relative z-10 aspect-9/16 shadow-gray-100 filter-[drop-shadow(0_0_6px_var(--tw-shadow-color))_drop-shadow(0_0_2px_var(--tw-shadow-color))] w-[55%] mx-auto">
        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full aspect-9/17">
          <NuxtImg v-if="recipe?.social_picture"
            class="recipe-card-social-image w-full h-full object-cover relative z-10 white-fade-mask transition-opacity duration-250"
            :class="recipeSocialImageLoaded ? 'opacity-100' : 'opacity-0'"
            :alt="recipe?.title + ' video thumbnail'" :src="recipe.social_picture"
            sizes="sm:30vw md:180px lg:220px" format="webp" loading="lazy" @load="recipeSocialImageLoaded = true" />
          <Skeleton v-else class="w-full h-full" />
        </div>
        <div class="pointer-events-none absolute inset-0 main-card-rounded white-fade-overlay z-20"></div>
      </div>
      <div />
    </div>
    <div v-else class="-mt-8 md:-mt-16 w-[75%] sm:w-[85%] aspect-square" />

    <div
      class="flex-1 flex flex-col justify-between gap-2 sm:gap-3 items-center p-4 pt-2 transition-transform duration-400 group-hover:translate-y-px hover-will-change-transform ">
      <div class="flex-1 flex flex-col justify-center items-center">
        <h2
          class=" text-xl sm:text-xl tracking-tight font-semibold font-headers line-clamp-2 text-center text-balance leading-5 sm:leading-6.5">
          {{ recipe?.title }}</h2>
        <p v-if="recipe?.variation_name && recipe?.variation_display_name"
          class="text-[10px] sm:text-[11px] uppercase tracking-[2px] text-gray-500 font-mono font-light mt-0.5 text-center">
          {{ recipe?.variation_name }}
        </p>
      </div>
      <div
        class="flex gap-1.5 flex-wrap text-xs h-6.5 sm:h-14 overflow-y-hidden items-center justify-center py-0.5 px-2 text-gray-700">
        <RecipeSocialInfo v-if="showSocialInfo" :recipe="recipe" class="justify-center max-w-full" />
        <div class="tag flex items-center gap-1 bg-primary/8" v-else-if="recipe?.rating && recipe?.rating >= 4">
          <FormsRatingField :model-value="recipe?.rating" :star-width="13" :star-height="13" :select="false"
            :uniqueId="'card-new-' + recipe?.id + id" class="hidden md:inline-block" />
          <IconStar class="w-3 h-3 md:hidden" fill="currentColor" />
          <span>{{ recipe?.rating.toFixed(1) }}</span>
        </div>

        <template v-if="!showSocialInfo">
          <div class="tag flex items-center justify-center text-nowrap bg-primary/8" v-for="(tag, index) in top3Tags"
            :key="index">
            {{ tag?.name }}
          </div>
        </template>
      </div>
    </div>
    <div
      class="px-3 py-1.5 rounded-xl bg-primary-5/70 text-xs text-gray-500 font-medium -mb-4 shadow-[0_0_8px_rgba(0,0,0,0.1)] z-10 text-center truncate max-w-[80%]"
      :title="reasonText" v-if="reasonText">
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
  showSocialInfo?: boolean;
}>();
const top3Tags = ref(getTop3Tags(props.recipe));
const recipeImageLoaded = ref(false);
const recipeSocialImageLoaded = ref(false);

watch(
  () => props.recipe.picture,
  () => {
    recipeImageLoaded.value = false;
  }
);

watch(
  () => props.recipe.social_picture,
  () => {
    recipeSocialImageLoaded.value = false;
  }
);

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
.recipe-card-image {
  filter: blur(0) drop-shadow(0 0 8px var(--tw-shadow-color)) drop-shadow(0 0 4px var(--tw-shadow-color));
}

.recipe-card-social-image {
  filter: blur(0);
}

.white-fade-overlay {
  box-shadow: inset 0 0 10px 10px rgba(255, 255, 255, 0.4);
}
</style>
