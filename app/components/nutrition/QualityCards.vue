<template>
  <div>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div v-for="item in sortedCards" :key="item.title"
        class="relative flex flex-col items-center p-4 bg-primary-10 rounded-3xl transition-all gap-1"
        :class="{ 'cursor-pointer hover:bg-primary-2': item.clickable, 'opacity-40': item.orderValue < 0 }"
        @click="item.clickable && handleCardClick(item.title)">
        <IconChevronRight v-if="item.clickable" class="absolute top-3 right-3 w-5 text-slate-400" />
        <img class="h-14 object-contain mt-1" :src="`/nutrition-highlights/${item.img}`" :alt="item.title" />
        <div class="text-lg font-bold tracking-tighter leading-none text-center mt-1">{{ item.title }}</div>
        <div class="text-sm text-slate-600 text-center leading-none">{{ item.subtitle }}</div>
        <div class="px-2.5 py-0.5 rounded-full text-sm font-semibold mt-2" :class="item.pillClass">
          {{ item.rating }}
        </div>
      </div>
    </div>
    <NutritionGutHealthQualityPanel v-model="showGutPanel" :gut-health="gutHealth" />
    <NutritionFatQualityPanel v-model="showFatPanel" :fat-profile="fatProfile"
      :fat-profile-readable="fatProfileReadable" />
    <NutritionMicronutrientsQualityPanel v-model="showMicroPanel" :micronutrients="micronutrients" :kcal-progress="kcalProgress" />
  </div>
</template>

<script setup lang="ts">
import type { DailyQualityCard } from '~/utils/nutrition/getDailyQualityCards';

const props = defineProps<{
  cards: DailyQualityCard[];
  gutHealth: any;
  fatProfile: any;
  fatProfileReadable: any;
  micronutrients: any;
  kcalProgress: number | null;
  mode: 'info' | 'full';
}>();

const showGutPanel = ref(false);
const showFatPanel = ref(false);
const showMicroPanel = ref(false);

const handleCardClick = (title: string) => {
  if (title === 'Gut Health') {
    showGutPanel.value = true;
  } else if (title === 'Fat Quality') {
    showFatPanel.value = true;
  } else if (title === 'Micronutrients') {
    showMicroPanel.value = true;
  }
};

const sortedCards = computed(() =>
  [...props.cards].sort((a, b) => b.orderValue - a.orderValue),
);
</script>
