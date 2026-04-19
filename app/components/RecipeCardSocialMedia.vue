<template>
  <div v-if="recipe?.id" class="flex transition-all duration-300 main-card main-card-rounded flex-1 group p-2 md:p-4 gap-4">
    <a :href="recipe.video_metadata?.url ?? recipe.source ?? undefined" target="_blank"
      class="min-w-28 w-1/5 aspect-9/10 shrink-0 xs:my-0 group-hover:scale-[1.01] transition-transform duration-300 will-change-transform">
      <NuxtImg v-if="recipe.social_picture" class="w-full h-full object-cover rounded-3xl" :src="recipe.social_picture"
        :alt="recipe?.title" />
      <Skeleton v-else class="w-full xs:w-auto aspect-9/10 xs:h-full object-cover" />
    </a>
    <NuxtLink :to="getRecipeUrl(recipe.id, recipe.title)" class="z-0 flex-1 flex flex-col gap-3 justify-between my-2">
      <div class="flex flex-col gap-2 flex-1">
        <h2 class="font-headers leading-tight text-xl xs:text-2xl tracking-tight line-clamp-2 text-gray-900 text-balance max-w-xl">
          {{
            recipe.title
          }}
        </h2>
        <p class="text-xs text-gray-500 line-clamp-3 sm:mt-2">
          {{ recipe.description }}
        </p>
        <div class="gap-1.5 flex-wrap text-xs items-start py-0.5 flex [&>*:nth-child(n+3)]:hidden text-gray-700">
          <div v-if="recipe.rating && recipe.rating >= 4" class="tag flex items-center gap-1 bg-primary/8">
            <FormsRatingField :model-value="recipe.rating" :star-width="13" :star-height="13" :select="false"
              :uniqueId="'card-new-horizontal-' + recipe.id" />
            <span>{{ recipe.rating.toFixed(1) }}</span>
          </div>

          <div class="tag flex items-center justify-center text-nowrap bg-primary/8" v-for="(tag, index) in top5Tags"
            :key="index">
            {{ tag?.name }}
          </div>
        </div>
      </div>
      <div class="h-px bg-gray-200"></div>
      <div class="flex gap-3 gap-y-1 flex-wrap font-mono tracking-normal sm:flex-nowrap">
        <span class="flex items-center rounded-3xl text-xs font-main gap-1.5 max-w-50"
          v-if="recipe.video_metadata?.channel">
          <img :src="`/${getWebsiteName(recipe.source)}.webp`" :alt="getWebsiteName(recipe.source)"
            class="w-4 object-contain" />
          <span class="truncate">{{
            recipe.video_metadata?.channel
          }}</span>
        </span>
        <div class="flex gap-3">
          <span class="text-xs rounded-3xl flex items-center gap-1" v-if="
            recipe.video_metadata?.view_count
          ">
            <IconEye class="w-4 h-4" />
            {{
              getSocialProof(
                recipe.video_metadata?.view_count,
              )
            }}
          </span>
          <span class="text-xs rounded-3xl flex items-center gap-1" v-if="
            recipe.video_metadata?.like_count
          ">
            <IconHeart class="w-4 h-4" />
            {{
              getSocialProof(
                recipe.video_metadata?.like_count,
              )
            }}
          </span>
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
    props.recipe.video_metadata?.url ?? props.recipe.source ?? ''
  );
});

const top5Tags = ref();

watchEffect(() => {
  top5Tags.value = getTop5Tags(props.recipe);
});
</script>

<style scoped></style>
