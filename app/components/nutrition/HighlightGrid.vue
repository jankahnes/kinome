<template>
  <div class="flex flex-wrap gap-4">
    <div
      class="flex-1 basis-full main-card main-card-padding"
      v-if="type === 'full'"
    >
      <NutritionMacroCard
        :kcal="nutritionData?.kcal ?? 0"
        :carbohydrates="nutritionData?.carbohydrates ?? 0"
        :protein="nutritionData?.protein ?? 0"
        :fat="nutritionData?.fat ?? 0"
      />
      <div class="flex gap-2 flex-wrap mt-4 self-start">
        <button
          class="animated-button bg-slate-100 rounded-4xl px-2 md:px-4 py-1 flex items-center gap-2"
          @click="$emit('viewFullNutrition')"
        >
          <IconTag class="w-5" />
          <span>View Full Nutrition</span>
        </button>
        <button
          class="animated-button bg-slate-100 rounded-4xl px-2 md:px-4 py-1 flex items-center gap-2"
          @click="$emit('viewFullAnalysis')"
        >
          <IconApple class="w-5" />
          <span>View Full Analysis</span>
        </button>
      </div>
    </div>
    <div
      v-if="nutritionData?.hidx && type === 'full' && nutritionData.hidx >= 55"
      class="bg-primary-10 flex flex-col gap-1 p-2 md:p-4 rounded-4xl items-center justify-center flex-1 basis-auto sm:basis-1/4"
    >
      <div
        class="flex justify-center items-center text-4xl font-bold h-18 min-w-18 rounded-2xl"
        :class="gradeColors[getGrade(nutritionData.hidx, 'ovr')]"
      >
        {{ getGrade(nutritionData.hidx, 'ovr') }}
      </div>
      <span class="text-lg font-bold tracking-tighter text-center"
        >Health Grade</span
      >
    </div>
    <div
      v-for="highlight in highlights"
      :key="highlight.title"
      class="bg-primary-10 flex flex-col p-2 md:p-4 rounded-4xl items-center flex-1 basis-auto sm:basis-1/4 max-w-100"
    >
      <NuxtImg
        :src="`/nutrition-highlights/${highlight.illustration}`"
        :alt="highlight.title"
        class="w-14 h-14 object-contain"
      />
      <span class="text-lg font-bold tracking-tighter leading-none mt-1">{{
        highlight.title
      }}</span>
      <span
        class="text-sm text-gray-600 text-center px-2"
        v-if="highlight.subtitle && subtitles"
      >
        {{ highlight.subtitle }}
      </span>
      <div
        class="px-3 py-0.5 rounded-full text-sm font-semibold mt-2"
        :class="highlight.background"
      >
        {{ highlight.rating }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recipe, FullFoodRow } from '~/types/types';

const props = withDefaults(
  defineProps<{
    nutritionData: Recipe | FullFoodRow | null | undefined;
    type?: 'full' | 'highlights';
    subtitles?: boolean;
  }>(),
  {
    type: 'highlights',
    subtitles: true,
  }
);

defineEmits<{
  (e: 'viewFullNutrition'): void;
  (e: 'viewFullAnalysis'): void;
}>();

const highlights = computed(() => {
  //@ts-ignore
  return getNutritionHighlightCards(props.nutritionData);
});
</script>
