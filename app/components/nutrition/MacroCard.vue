<template>
  <div class="flex gap-2 justify-between items-center">
    <div class="flex flex-col flex-1 gap-1">
      <div class="flex justify-between">
        <span class="text-[74px] leading-14">
          <RollingNumber :number="kcal" class="" />
          <span class="text-xl font-headers text-gray-500">kcal</span>
        </span>
        <Ring class="block sm:hidden w-16 h-16" :segments="ringSegments" :strokeWidth="18" />
      </div>
      <div class="flex items-center gap-2 text-center leading-tight text-xs">
        <div class="bg-carbs px-2 py-1 main-card-rounded ">
          <RollingNumber :number="carbohydrates" />
          <span>g Carbs</span>
        </div>
        <div class="bg-protein px-2 py-1 main-card-rounded ">
          <RollingNumber :number="protein" />
          <span>g Protein</span>
        </div>
        <div class="bg-fat px-2 py-1 main-card-rounded ">
          <RollingNumber :number="fat" />
          <span>g Fat</span>
        </div>
      </div>
    </div>
    <span>
      <Ring class="hidden sm:block w-24 h-24" :segments="ringSegments" :strokeWidth="16" />
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
