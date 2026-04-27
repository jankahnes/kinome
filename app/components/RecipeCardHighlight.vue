<template>
  <NuxtLink v-if="recipe?.id" :to="getRecipeUrl(recipe?.id, recipe?.title)"
    class="transition-all duration-300 group flex items-center main-card main-card-rounded py-4 md:py-0"
    :class="{ 'bg-primary-5/70!': isSignature }">
    <!-- circular -->
    <NuxtImg v-if="recipe?.picture"
      class="recipe-card-highlight-image -ml-2 sm:-ml-6 z-10 h-34 sm:h-50 md:h-60 max-h-70 aspect-square object-contain shadow-[#00000015] group-hover:-translate-x-px group-hover:scale-[1.01] hover-will-change-transform"
      :class="recipeImageLoaded ? 'opacity-100' : 'opacity-0'" :src="recipe?.picture || ''" fetchpriority="high"
      :alt="recipe?.title" sizes="sm:200px md:240px lg:280px" format="webp" preload @load="recipeImageLoaded = true" />
    <NuxtImg v-else-if="recipe?.social_picture"
      class="recipe-card-highlight-social-image -ml-2 sm:-ml-6 z-10 h-34 sm:h-50 md:h-60 max-h-70 aspect-9/16 object-cover rounded-3xl shadow-[#00000015] group-hover:-translate-x-px group-hover:scale-[1.008] hover-will-change-transform"
      :class="recipeSocialImageLoaded ? 'opacity-100' : 'opacity-0'" :src="recipe.social_picture" fetchpriority="high"
      :alt="recipe?.title + ' video thumbnail'" sizes="sm:120px md:160px lg:180px" format="webp" preload
      @load="recipeSocialImageLoaded = true" />

    <div class="flex-1 flex flex-col gap-1 md:gap-1.5 px-3 md:pl-6 md:pr-10 md:py-7">
      <h2
        class="font-semibold sm:font-medium font-headers text-2xl sm:text-3xl md:text-5xl tracking-tight line-clamp-2 items-center gap-4 leading-tight"
        :class="{ 'underline decoration-primary decoration-2  md:decoration-3 underline-offset-2 md:nderline-offset-4': true, 'text-4xl! underline-offset-3!': isSignature }">
        {{ recipe?.title }}
      </h2>
      <p class="hidden sm:block text-xs md:text-sm text-gray-600 line-clamp-4 ml-0.5 max-w-3xl">
        {{ recipe?.description }}
      </p>
      <div class="flex flex-col flex-1 gap-2 justify-end mt-auto">
        <p class="flex items-center gap-2">
          <FormsRatingField :model-value="recipe?.rating" :star-width="24" :star-height="24" :spacing="2"
            :select="false" :uniqueId="`card-highlight-${recipe?.id}-${uniqueId}`" class="hidden md:inline-block"
            v-if="showRating" />
          <IconStar v-if="showRating" class="w-4 h-4 mt-0.5 md:hidden" fill="currentColor" />
          <span class="font-headers leading-none mt-0.5">
            <template v-if="showRating">{{ recipe?.rating.toFixed(1) }}</template>
            <span class="text-[11px] align-middle text-gray-500 tracking-tight font-mono">
              <template v-if="showRating"> · </template>{{ recipe?.kcal }} kcal · {{ totalTimeLabel }}
            </span>
          </span>
        </p>
        <div class="flex gap-4 justify-between">
          <div class="flex gap-1.5 flex-wrap overflow-hidden py-0.5 text-xs text-gray-700">
            <RecipeSocialInfo v-if="showSocialInfo" :recipe="recipe" />
            <template v-else>
              <div class="tag flex items-center justify-center text-nowrap bg-primary/8"
                v-for="(tag, index) in top3Tags" :key="index">
                {{ tag?.name }}
              </div>
            </template>
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
  showSocialInfo?: boolean;
}>();
const top3Tags = ref(getTop3Tags(props.recipe));
const recipeImageLoaded = ref(false);
const recipeSocialImageLoaded = ref(false);
const showRating = computed(() => props.recipe.rating !== 3);

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

const recipeStore = useRecipeStore();

onMounted(async () => {
  if (!props.recipe.picture && props.recipe.source_type === 'MEDIA') {
    props.recipe.social_picture = await recipeStore.getSocialPicture(
      props.recipe.video_metadata?.url ?? props.recipe.source ?? '',
      false
    );
  }
});
</script>

<style scoped>
.recipe-card-highlight-image {
  filter: blur(0) drop-shadow(10px 20px 20px var(--tw-shadow-color));
  transition:
    opacity 0.2s ease-in-out,
    translate 0.3s ease-out,
    scale 0.3s ease-out;
}

.recipe-card-highlight-social-image {
  filter: blur(0) drop-shadow(10px 20px 20px var(--tw-shadow-color));
  transition:
    opacity 0.2s ease-in-out,
    translate 0.3s ease-out,
    scale 0.3s ease-out;
}

.white-fade-overlay {
  background: radial-gradient(circle at center,
      rgba(255, 255, 255, 0) 62%,
      rgba(255, 255, 255, 1) 75%);
}
</style>
