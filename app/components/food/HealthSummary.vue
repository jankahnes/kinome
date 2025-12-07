<template>
  <div class="flex-1">
    <div class="flex gap-4 justify-between items-center">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold leading-none">Health Summary</h2>
        <p class="text-sm text-gray-500 flex items-center gap-1 leading-none">
          Based on science
        </p>
      </div>
    </div>
    <div class="w-full bg-gray-200 h-0.5 rounded-full my-4"></div>

    <!-- Green section: Top 3 scores -->
    <div
      v-if="greenScores.length > 0"
      class="bg-green-100 p-4 rounded-4xl flex justify-between items-center gap-4 px-10"
    >
      <div
        v-for="score in greenScores"
        :key="score.key"
        class="flex flex-col items-center gap-1"
      >
        <Ring
          class="w-20 h-20"
          :segments="[{ color: 'stroke-green-600', value: score.value / 100 }]"
          :strokeWidth="14"
          ringBackground="stroke-green-700/20"
        >
          <span class="text-2xl font-bold leading-none">{{
            Math.round(score.value)
          }}</span>
        </Ring>
        <p class="font-bold text-lg leading-none mt-2">{{ score.label }}</p>
        <p class="text-sm text-green-700 leading-none">
          {{ score.descriptor }}
        </p>
      </div>
    </div>

    <!-- Yellow and Red sections -->
    <div class="flex gap-4 mt-4">
      <!-- Yellow section: First score between 30-50 -->
      <div
        v-if="yellowScore"
        class="flex bg-yellow-50 p-4 rounded-4xl justify-center items-center flex-1"
      >
        <div class="flex flex-col items-center gap-1">
          <Ring
            class="w-20 h-20"
            :segments="[
              { color: 'stroke-yellow-400', value: yellowScore.value / 100 },
            ]"
            :strokeWidth="14"
            ringBackground="stroke-yellow-700/20"
          >
            <span class="text-2xl font-bold leading-none">{{
              Math.round(yellowScore.value)
            }}</span>
          </Ring>
          <p class="font-bold text-lg leading-none mt-2">
            {{ yellowScore.label }}
          </p>
          <p class="text-sm text-yellow-700 leading-none">
            {{ yellowScore.descriptor }}
          </p>
        </div>
      </div>
      <!-- Red section: First score below 30 -->
      <div
        v-if="redScore"
        class="flex bg-red-50 p-4 rounded-4xl justify-center items-center flex-1"
      >
        <div class="flex flex-col items-center gap-1">
          <Ring
            class="w-20 h-20"
            :segments="[
              { color: 'stroke-red-400', value: redScore.value / 100 },
            ]"
            :strokeWidth="14"
            ringBackground="stroke-red-700/20"
          >
            <span class="text-2xl font-bold leading-none">{{
              Math.round(redScore.value)
            }}</span>
          </Ring>
          <p class="font-bold text-lg leading-none mt-2">
            {{ redScore.label }}
          </p>
          <p class="text-sm text-red-700 leading-none">
            {{ redScore.descriptor }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getGrade } from '~/utils/constants/grades';
import type { FullFoodRow } from '~/types/types';

const props = defineProps<{
  food: FullFoodRow;
}>();

// Score category mappings
const scoreCategories = [
  { key: 'mnidx', label: 'Micronutrients' },
  { key: 'satiety', label: 'Satiety' },
  { key: 'fiber_score', label: 'Fiber' },
  { key: 'protein_score', label: 'Protein' },
  { key: 'sugar_score', label: 'Sugar' },
  { key: 'salt_score', label: 'Salt' },
  { key: 'fat_profile_score', label: 'Fat Profile' },
  { key: 'protective_score', label: 'Protective' },
  { key: 'processing_level_score', label: 'Processing' },
] as const;

// Grade descriptors
const gradeDescriptors: Record<string, string> = {
  S: 'Excellent',
  'S+': 'Excellent',
  'S-': 'Excellent',
  A: 'Excellent',
  'A+': 'Excellent',
  'A-': 'Excellent',
  B: 'Great',
  'B+': 'Great',
  'B-': 'Good',
  C: 'Okay',
  'C+': 'Okay',
  'C-': 'Okay',
  D: 'Avg',
  'D+': 'Avg',
  'D-': 'Below Avg',
  E: 'Poor',
  'E+': 'Poor',
  'E-': 'Poor',
  F: 'Poor',
};

// Get all scores with labels and descriptors
const allScores = computed(() => {
  return scoreCategories
    .map((category) => {
      const value = props.food[category.key] ?? 0;
      const grade = getGrade(value, 'single');
      const descriptor = gradeDescriptors[grade] || 'N/A';
      return {
        key: category.key,
        label: category.label,
        value,
        descriptor,
      };
    })
    .sort((a, b) => b.value - a.value);
});

// Top 3 scores (green section)
const greenScores = computed(() => {
  return allScores.value.slice(0, 3);
});

// First score between 30-50 (yellow section)
const yellowScore = computed(() => {
  return allScores.value.find((score) => score.value >= 30 && score.value < 50);
});

// First score below 30 (red section)
const redScore = computed(() => {
  return allScores.value.find((score) => score.value < 30);
});
</script>
