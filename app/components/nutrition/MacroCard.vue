<template>
  <div class="flex gap-2 justify-between">
    <div class="flex flex-col flex-1 gap-1">
      <div class="flex justify-between">
        <span class="text-8xl font-bold leading-14">
          <RollingNumber :number="kcal" />
          <span class="text-xl text-gray-500">kcal</span>
        </span>
        <Ring
          class="block lg:hidden w-14 h-14"
          :segments="ringSegments"
          :strokeWidth="16"
        />
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-carbs px-2 py-1 rounded-4xl">
          <RollingNumber :number="carbohydrates" />
          <span>g Carbs</span>
        </div>
        <div class="bg-protein px-2 py-1 rounded-4xl">
          <RollingNumber :number="protein" />
          <span>g Protein</span>
        </div>
        <div class="bg-fat px-2 py-1 rounded-4xl">
          <RollingNumber :number="fat" />
          <span>g Fat</span>
        </div>
      </div>
    </div>
    <span>
      <Ring
        class="hidden lg:block w-24 h-24"
        :segments="ringSegments"
        :strokeWidth="16"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  kcal: number;
  carbohydrates: number;
  protein: number;
  fat: number;
}>();

const macroRingPercentages = computed(() => {
  if (!props.kcal) return null;
  const usedKcal =
    4 * (props.carbohydrates ?? 0) +
    4 * (props.protein ?? 0) +
    9 * (props.fat ?? 0);
  const percentages = {
    carbsPercent: ((props.carbohydrates ?? 0) * 4) / usedKcal,
    proteinPercent: ((props.protein ?? 0) * 4) / usedKcal,
    fatPercent: ((props.fat ?? 0) * 9) / usedKcal,
  };
  for (const [key, value] of Object.entries(percentages)) {
    if (value > 0) {
      percentages[key as keyof typeof percentages] = value;
    }
  }
  return percentages;
});

const ringSegments = computed(() => [
  {
    value: macroRingPercentages.value?.carbsPercent ?? 0,
    color: 'stroke-carbs',
  },
  {
    value: macroRingPercentages.value?.proteinPercent ?? 0,
    color: 'stroke-protein',
  },
  {
    value: macroRingPercentages.value?.fatPercent ?? 0,
    color: 'stroke-fat',
  },
]);
</script>
