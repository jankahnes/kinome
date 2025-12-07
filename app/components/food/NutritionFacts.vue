<template>
  <div class="flex-1">
    <div class="flex gap-4 justify-between items-center">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold leading-none">Nutrition Facts</h2>
        <p class="text-sm text-gray-500 flex items-center gap-1 leading-none">
          Per {{ portionSize }}g / {{ scaledFood.kcal.toFixed(0) }}kcal
        </p>
      </div>
    </div>
    <div class="w-full bg-gray-200 h-0.5 rounded-full my-4"></div>

    <!-- Nutrients with sub-nutrients (carbs+sugar, fat+saturated) -->
    <template
      v-for="(nutrient, index) in nutrientsWithSub"
      :key="nutrient.main"
    >
      <div
        class="flex justify-between items-center gap-4"
        :class="{ 'mt-6': index > 0 }"
      >
        <div class="flex items-center gap-1">
          <div
            class="h-4 w-4 rounded-full"
            :class="`bg-${nutrient.mainColor}`"
          ></div>
          <p class="text-2xl font-bold leading-none">{{ nutrient.label }}</p>
        </div>
        <p class="text-xl font-bold leading-none">
          {{ scaledFood[nutrient.main].toFixed(1) }}g
        </p>
      </div>
      <div
        v-if="nutrient.sub"
        class="flex justify-between items-center gap-4 mt-2 ml-2"
      >
        <div class="flex items-center gap-1">
          <div
            class="h-3 w-3 rounded-full"
            :class="`bg-${nutrient.subColor}`"
          ></div>
          <p class="text-xl leading-none">{{ nutrient.subLabel }}</p>
        </div>
        <p class="text-lg leading-none">
          {{ scaledFood[nutrient.sub].toFixed(1) }}g
        </p>
      </div>
      <!-- Progress bar -->
      <div class="flex w-full h-2 rounded-full my-2 overflow-hidden">
        <div
          v-if="
            nutrient.sub &&
            getPercentage(scaledFood[nutrient.sub], nutrient.ref) > 0.005
          "
          class="h-full rounded-full z-2"
          :class="`bg-${nutrient.subColor}`"
          :style="{
            width: `${
              getPercentage(scaledFood[nutrient.sub], nutrient.ref) * 100
            }%`,
          }"
        ></div>
        <div
          class="h-full rounded-r-full z-1"
          :class="[
            `bg-${nutrient.mainColor}`,
            {
              '-ml-2':
                nutrient.sub &&
                getPercentage(scaledFood[nutrient.sub], nutrient.ref) > 0.005,
            },
          ]"
          :style="{
            width: `${
              getPercentage(
                nutrient.sub
                  ? scaledFood[nutrient.main] - scaledFood[nutrient.sub]
                  : scaledFood[nutrient.main],
                nutrient.ref
              ) * 100
            }%`,
          }"
        ></div>
        <div class="h-full bg-gray-100 rounded-r-full -ml-2 flex-1 z-0"></div>
      </div>
    </template>

    <!-- Simple nutrients (protein, fiber, salt) -->
    <template v-for="nutrient in simpleNutrients" :key="nutrient.key">
      <div class="flex justify-between items-center gap-4 mt-6">
        <div class="flex items-center gap-1">
          <div
            class="h-4 w-4 rounded-full"
            :class="`bg-${nutrient.color}`"
          ></div>
          <p class="text-2xl font-bold leading-none">{{ nutrient.label }}</p>
        </div>
        <p class="text-xl font-bold leading-none">
          {{ scaledFood[nutrient.key].toFixed(1) }}g
        </p>
      </div>
      <div class="flex w-full h-2 rounded-full my-2 overflow-hidden">
        <div
          class="h-full rounded-full z-2"
          :class="`bg-${nutrient.color}`"
          :style="{
            width: `${
              getPercentage(scaledFood[nutrient.key], nutrient.ref) * 100
            }%`,
          }"
        ></div>
        <div class="h-full bg-gray-100 rounded-r-full -ml-2 flex-1 z-0"></div>
      </div>
    </template>

    <p
      class="text-sm text-gray-500 flex items-center gap-1 mt-4"
      v-if="referencingName"
    >
      <IconInfo class="w-5" />
      <span>Nutritional Data from {{ referencingName }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { FullFoodRow } from '~/types/types';

const props = defineProps<{
  food: FullFoodRow;
  portionSize: number;
  foodName: string;
  referencingName: string | null;
}>();

const portionMultiplier = computed(() => props.portionSize / 100);

const scaledFood = computed(() => {
  return {
    kcal: props.food.kcal * portionMultiplier.value,
    carbohydrates: props.food.carbohydrates * portionMultiplier.value,
    protein: props.food.protein * portionMultiplier.value,
    fat: props.food.fat * portionMultiplier.value,
    sugar: props.food.sugar * portionMultiplier.value,
    saturated_fat: props.food.saturated_fat * portionMultiplier.value,
    fiber: props.food.fiber * portionMultiplier.value,
    salt: props.food.salt * portionMultiplier.value,
  };
});

const nutrientsWithSub = [
  {
    main: 'carbohydrates',
    sub: 'sugar',
    label: 'Carbs',
    subLabel: 'Sugar',
    mainColor: 'carbs',
    subColor: 'sugar',
    ref: 260,
  },
  {
    main: 'fat',
    sub: 'saturated_fat',
    label: 'Fat',
    subLabel: 'Saturated Fat',
    mainColor: 'fat',
    subColor: 'saturated-fat',
    ref: 70,
  },
] as const;

const simpleNutrients = [
  { key: 'protein', label: 'Protein', color: 'protein', ref: 50 },
  { key: 'fiber', label: 'Fiber', color: 'fiber', ref: 25 },
  { key: 'salt', label: 'Salt', color: 'salt', ref: 5 },
] as const;

function getPercentage(value: number, reference: number): number {
  return value / reference;
}
</script>
