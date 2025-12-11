<template>
  <NuxtLink
    v-if="recipe.id"
    :to="getRecipeUrl(recipe?.id, recipe?.title)"
    class="flex flex-row items-center transition-all duration-300 group"
  >
    <!-- circular -->
    <div
      class="relative z-10 text-base sm:text-lg"
      v-if="recipe?.picture || recipe?.social_picture"
    >
      <NuxtImg
        v-if="recipe?.picture"
        class="h-26 xs:h-32 object-cover bg-transparent shadow-gray-200 [filter:drop-shadow(0_0_6px_var(--tw-shadow-color))_drop-shadow(0_0_2px_var(--tw-shadow-color))] will-change-transform transition-transform duration-500 group-hover:translate-y-[-2px] group-hover:scale-[1.01]"
        :src="recipe?.picture || ''"
        fetchpriority="high"
        :alt="recipe?.title"
      />

      <div
        v-else-if="recipe?.social_picture"
        class="relative w-26 xs:w-32 flex-shrink-0 will-change-transform transition-transform duration-500 group-hover:translate-y-[-2px] group-hover:scale-[1.01]"
      >
        <div
          class="bg-white rounded-full overflow-hidden relative z-10 aspect-square shadow-gray-200 [filter:drop-shadow(0_0_6px_var(--tw-shadow-color))_drop-shadow(0_0_2px_var(--tw-shadow-color))]"
        >
          <div
            class="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full aspect-9/16"
          >
            <NuxtImg
              class="w-full h-full object-cover relative z-10 transition-all duration-300 white-fade-mask"
              :src="recipe?.social_picture"
              fetchpriority="high"
              :alt="recipe?.title + ' video thumbnail'"
            />
          </div>
          <div
            class="pointer-events-none absolute inset-0 rounded-full white-fade-overlay z-20"
          ></div>
        </div>
        <div />
      </div>
    </div>
    <div
      class="z-0 flex-1 bg-primary-10 px-4 py-3 rounded-4xl flex flex-col gap-2 justify-center h-29 xs:h-35"
      :class="
        recipe?.picture || recipe?.social_picture
          ? '-ml-22 !pl-25 xs:-ml-28 xs:!pl-31'
          : ''
      "
    >
      <h2
        class="font-bold leading-6 text-xl sm:text-2xl tracking-tight line-clamp-2 text-balance"
      >
        {{ recipe?.title }}
      </h2>
      <div
        class="flex gap-1.5 flex-wrap text-xs max-h-[1.7rem] xs:max-h-[3.4rem] overflow-hidden items-start py-0.5"
      >
        <div
          v-if="recipe?.rating && recipe?.rating >= 4"
          class="tag flex items-center gap-1 bg-slate-50"
        >
          <FormsRatingField
            :model-value="recipe?.rating"
            :star-width="13"
            :star-height="13"
            :select="false"
            :uniqueId="`card-new-horizontal-${recipe?.id}-${uniqueId}`"
          />
          <span>{{ recipe?.rating.toFixed(1) }}</span>
        </div>

        <div
          class="tag flex items-center justify-center text-nowrap bg-slate-50"
          v-for="(tag, index) in top3Tags"
          :key="index"
        >
          {{ tag?.name }}
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: RecipeOverview;
  uniqueId?: string;
}>();
const top3Tags = ref(getTop3Tags(props.recipe));

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
      props.recipe.source ?? '',
      false
    );
  }
});
</script>

<style scoped>
.white-fade-overlay {
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0) 62%,
    rgba(255, 255, 255, 1) 75%
  );
}
</style>
