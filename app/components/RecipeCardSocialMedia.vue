<template>
  <div v-if="recipe?.id"
    class="flex flex-row items-stretch transition-all duration-300 main-card rounded-4xl overflow-hidden flex-1">
    <a :href="(recipe.video_metadata as any)?.url ?? recipe.source ?? undefined" target="_blank"
      class="w-1/3 xs:w-auto flex-shrink-0 my-auto xs:my-0">
      <NuxtImg v-if="recipe.social_picture" class="w-full xs:w-auto aspect-9/16 xs:h-full object-cover rounded-4xl"
        :src="recipe.social_picture" :alt="recipe?.title" />
      <Skeleton v-else class="w-full xs:w-auto aspect-9/16 xs:h-full object-cover" />
    </a>
    <NuxtLink :to="getRecipeUrl(recipe.id, recipe.title)" class="z-0 flex-1 h-full flex flex-col px-6 py-3">
      <div class="flex flex-col gap-3 justify-center flex-1">
        <h2 class="font-semibold leading-6 text-xl xs:text-2xl tracking-tight line-clamp-2">
          {{
            recipe.title
          }}
        </h2>
        <p class="text-xs text-gray-500 line-clamp-3">
          {{ recipe.description }}
        </p>
        <div class="gap-1.5 flex-wrap text-xs sm:text-[14px] items-start py-0.5 flex [&>*:nth-child(n+3)]:hidden">
          <div v-if="recipe.rating && recipe.rating >= 4" class="tag flex items-center gap-1 bg-secondary">
            <FormsRatingField :model-value="recipe.rating" :star-width="13" :star-height="13" :select="false"
              :uniqueId="'card-new-horizontal-' + recipe.id" />
            <span>{{ recipe.rating.toFixed(1) }}</span>
          </div>

          <div class="tag flex items-center justify-center text-nowrap bg-secondary" v-for="(tag, index) in top5Tags"
            :key="index">
            {{ tag?.name }}
          </div>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap sm:flex-nowrap my-2">
        <span class="text-xs uppercase bg-slate-100 px-2 py-1 rounded-3xl flex items-center gap-1" v-if="
          (recipe.video_metadata as any).view_count
        ">
          <IconEye class="w-4 h-4" />
          {{
            getSocialProof(
              (recipe.video_metadata as any).view_count,
            )
          }}
        </span>
        <span class="text-xs uppercase bg-slate-100 px-2 py-1 rounded-3xl flex items-center gap-1" v-if="
          (recipe.video_metadata as any).like_count
        ">
          <IconHeart class="w-4 h-4" />
          {{
            getSocialProof(
              (recipe.video_metadata as any).like_count,
            )
          }}
        </span>
        <div
          class="flex items-center px-2 py-1 rounded-3xl text-xs font-medium bg-slate-100 gap-1.5 max-w-50 sm:max-w-70"
          v-if="(recipe.video_metadata as any)?.channel">
          <img :src="`/${getWebsiteName(recipe.source)}.webp`" :alt="getWebsiteName(recipe.source)" class="h-4" />
          <span class="flex-shrink-0">Creator:</span>
          <span class="truncate">{{
            (recipe.video_metadata as any)?.channel
          }}</span>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: RecipeOverview;
}>();

const recipeStore = useRecipeStore();

const getTop5Tags = (recipe: RecipeOverview) => {
  if (!recipe.tags) return [];
  const tags = recipe.tags.map((tag) => getTagByID(tag));
  tags.sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));
  const cropped = tags.slice(0, 5);
  return cropped;
};

const getWebsiteName = (source: string | null | undefined) => {
  if (!source) return '';
  const url = new URL(source);
  const parts = url.hostname.split('.');
  const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  return domain;
};

const getSocialProof = (number: number) => {
  if (number >= 1000000) return `${Math.floor(number / 1000000)}M`;
  else if (number >= 1000) return `${Math.floor(number / 1000)}K`;
  else return number.toString();
};

onMounted(async () => {
  props.recipe.social_picture = await recipeStore.getSocialPicture(
    (props.recipe.video_metadata as any)?.url ?? props.recipe.source ?? ''
  );
});

const top5Tags = ref();

watchEffect(() => {
  top5Tags.value = getTop5Tags(props.recipe);
});
</script>

<style scoped></style>
