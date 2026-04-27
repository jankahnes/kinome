<template>
  <div v-if="hasSocialInfo" class="flex gap-2 gap-y-1 flex-wrap text-gray-700 min-w-0">
    <span v-if="channel" class="tag flex items-center gap-1 bg-primary/8 min-w-0">
      <img v-if="websiteName" :src="`/${websiteName}.webp`" :alt="websiteName" class="w-3.5 h-3.5 object-contain shrink-0" />
      <span class="truncate">{{ channel }}</span>
    </span>
    <span v-if="viewCount" class="tag flex items-center gap-1 bg-primary/8">
      <IconEye class="w-3.5 h-3.5" />
      <span>{{ getSocialProof(viewCount) }}</span>
    </span>
    <span v-if="likeCount" class="tag flex items-center gap-1 bg-primary/8">
      <IconHeart class="w-3.5 h-3.5" />
      <span>{{ getSocialProof(likeCount) }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: RecipeOverview;
}>();

const channel = computed(() => props.recipe.video_metadata?.channel);
const viewCount = computed(() => props.recipe.video_metadata?.view_count);
const likeCount = computed(() => props.recipe.video_metadata?.like_count);

const websiteName = computed(() => {
  const source = props.recipe.video_metadata?.url ?? props.recipe.source;
  if (!source) return '';

  try {
    const url = new URL(source);
    const parts = url.hostname.split('.');
    return parts.length > 2 ? parts[parts.length - 2] : parts[0];
  } catch {
    return '';
  }
});

const hasSocialInfo = computed(
  () => Boolean(channel.value) || Boolean(viewCount.value) || Boolean(likeCount.value)
);

const getSocialProof = (number: number) => {
  if (number >= 1000000) return `${Math.floor(number / 1000000)}M`;
  if (number >= 1000) return `${Math.floor(number / 1000)}K`;
  return number.toString();
};
</script>
