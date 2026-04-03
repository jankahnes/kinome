<template>
  <!-- Loading -->
  <div v-if="isLoading">
    <div class="flex-wrap gap-4 sm:gap-6 hidden md:flex justify-stretch">
      <Skeleton v-for="i in 8" :key="i"
        class="min-w-65 basis-65 max-w-100 3xl:max-w-110 3xl:basis-85 h-92 flex-1 rounded-xl" />
    </div>
    <div class="flex flex-col gap-4 md:hidden">
      <Skeleton v-for="i in 5" :key="i" class="w-full h-28 xs:h-34 rounded-xl" />
    </div>
  </div>

  <!-- Results -->
  <div v-else-if="results.length" class="mt-4 md:-mt-12">
    <!-- Desktop grid -->
    <div class="flex-wrap gap-4 sm:gap-6 hidden md:flex justify-stretch">

      <RecipeCardHighlight v-if="orderedResults.highlight" :recipe="orderedResults.highlight"
        class="flex-3 basis-217 mb-3.5 mt-18 md:-ml-10!" />

      <RecipeCard v-for="recipe in orderedResults.results" :recipe="recipe" :reason-text="getReasonText(recipe)"
        class="text-[30px] min-w-65 basis-65 max-w-80 3xl:max-w-110 3xl:basis-85 flex-1 flex flex-col items-center" />
    </div>

    <!-- Mobile list -->
    <div class="flex flex-col gap-4 md:hidden">
      <div v-for="item in results" :key="item.id" class="flex flex-col gap-1.5">
        <RecipeCardHorizontal :recipe="item" :reason-text="getReasonText(item)" class="text-[24px]" />
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div v-else class="text-gray-400 text-lg">
    No recommendations yet — save some recipes to get started.
  </div>
</template>

<script setup lang="ts">
type RecommendationRow = RecipeOverview & {
  nearest_recipe: { id: number; title: string; set: 'own' | 'bookmarks' | 'ratings' } | null;
  matched_tags: number[];
  dominant_signal: 'taste' | 'tags' | 'trending';
};

const props = defineProps<{
  results: RecommendationRow[];
  isLoading: boolean;
}>();

const orderedResults = computed(() => {
  const resultWithPicture = props.results.find((r) => r.picture);
  const index = resultWithPicture ? props.results.indexOf(resultWithPicture) : -1;
  if (index === -1) return { highlight: null, results: props.results };
  return {
    highlight: resultWithPicture,
    results: [...props.results.slice(0, index), ...props.results.slice(index + 1)],
  }
});

function tagReasonText(tagId: number): string {
  const tag = getTagByID(tagId);
  if (!tag) return 'Matches your preferences';
  const name = capitalize(tag.name);
  if (tagId >= 400) {
    const article = /^[aeiou]/i.test(tag.name) ? 'an' : 'a';
    return `Because you own ${article} ${name}`;
  }
  if (tagId >= 300) return `Because you love ${name} food`;
  if (tagId >= 100) return `Because you prefer ${name} recipes`;
  return `Because you like ${name} recipes`;
}

function getReasonText(item: RecommendationRow): string {
  if (item.dominant_signal === 'taste' && item.nearest_recipe) {
    const nr = item.nearest_recipe;
    if (nr.set === 'own') return `Because you created ${nr.title}`;
    if (nr.set === 'ratings') return `Because you loved ${nr.title}`;
    if (nr.title.startsWith('hidden:')) {
      const foodTitle = nr.title.split(':')[1];
      return `Because you like ${capitalize(foodTitle)}`;
    }
    return `Because you saved ${nr.title}`;
  }
  if (item.dominant_signal === 'tags' && item.matched_tags?.length) {
    const sorted = [...item.matched_tags]
      .map((id) => getTagByID(id))
      .filter(Boolean)
      .sort((a, b) => (b!.value ?? 0) - (a!.value ?? 0));
    const topTag = sorted[0];
    return topTag ? tagReasonText(topTag.id) : 'Matches your preferences';
  }
  return 'Trending';
}
</script>
