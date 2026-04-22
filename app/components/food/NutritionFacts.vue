<template>
  <div class="flex-1">
    <NutritionMicroGroup title="Macros" :subtitle="subtitle ?? 'per serving'" accent-class="bg-slate-500"
      bar-class="bg-slate-200" kind="macro" :items="macroRows" />

    <p class="text-sm text-gray-500 flex items-center gap-1 mt-4" v-if="referencingName">
      <IconInfo class="w-5" />
      <span>Nutritional Data from {{ referencingName }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { FullFoodRow } from '~/types/types';

const props = defineProps<{
  computable: Recipe | FullFoodRow;
  portionMultiplier?: number;
  referencingName?: string | null;
  subtitle?: string;
}>();

const scaledFood = computed(() => {
  const m = props.portionMultiplier ?? 1;
  const c = props.computable as any;
  return {
    kcal: (c.kcal ?? 0) * m,
    carbohydrates: (c.carbohydrates ?? 0) * m,
    protein: (c.protein ?? 0) * m,
    fat: (c.fat ?? 0) * m,
    sugar: (c.sugar ?? 0) * m,
    saturated_fat: (c.saturated_fat ?? 0) * m,
    fiber: (c.fiber ?? 0) * m,
    salt: (c.salt ?? 0) * m,
  };
});

const macroRows = computed(() => {
  const s = scaledFood.value;
  return [
    {
      key: 'kcal',
      label: 'Calories',
      unit: 'kcal',
      value: s.kcal,
      ref: 2000,
      barClass: 'bg-primary-200',
    },
    {
      key: 'carbohydrates',
      label: 'Carbs',
      unit: 'g',
      value: s.carbohydrates,
      ref: 260,
      barClass: 'bg-carbs',
      subLabel: 'Sugar',
      subValue: s.sugar,
      subBarClass: 'bg-sugar',
    },
    {
      key: 'fat',
      label: 'Fat',
      unit: 'g',
      value: s.fat,
      ref: 70,
      barClass: 'bg-fat',
      subLabel: 'Saturated Fat',
      subValue: s.saturated_fat,
      subBarClass: 'bg-saturated-fat',
    },
    { key: 'protein', label: 'Protein', unit: 'g', value: s.protein, ref: 50, barClass: 'bg-protein' },
    { key: 'fiber', label: 'Fiber', unit: 'g', value: s.fiber, ref: 25, barClass: 'bg-fiber' },
    { key: 'salt', label: 'Salt', unit: 'g', value: s.salt, ref: 5, barClass: 'bg-salt' },
  ];
});
</script>
