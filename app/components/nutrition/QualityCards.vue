<template>
  <div class="flex flex-col bg-primary-10/40 rounded-4xl p-4">
    <div class="flex justify-between items-center mb-3 mx-2">
      <h3 class="text-4xl font-bold tracking-tighter">Nutrition Quality</h3>
      <button @click="emit('viewOverallReport')" class="flex items-center gap-0.5 animated-button text-sm p-2"
        :class="mode === 'info' ? 'bg-primary-10' : 'text-slate-400'">
        <span v-if="mode === 'info'" class="hidden sm:inline">View Full</span>
        <IconChevronRight class="w-6" />
      </button>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div v-for="item in sortedCards" :key="item.title"
        class="relative flex flex-col items-center p-4 bg-primary-10 rounded-3xl transition-all gap-1"
        :class="{ 'cursor-pointer hover:bg-secondary-700/30': item.clickable, 'opacity-40': item.orderValue < 0 }"
        @click="item.clickable && emit('cardClick', item.title)">
        <IconChevronRight v-if="item.clickable" class="absolute top-3 right-3 w-5 text-slate-400" />
        <img class="h-14 object-contain mt-1" :src="`/nutrition-highlights/${item.img}`" :alt="item.title" />
        <div class="text-lg font-bold tracking-tighter leading-none text-center mt-1">{{ item.title }}</div>
        <div class="text-sm text-slate-600 text-center leading-none">{{ item.subtitle }}</div>
        <div class="px-2.5 py-0.5 rounded-full text-sm font-semibold mt-2" :class="item.pillClass">
          {{ item.rating }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DailyQualityCard } from '~/utils/nutrition/getDailyQualityCards';

const props = defineProps<{
  cards: DailyQualityCard[];
  mode: 'info' | 'full';
}>();

const emit = defineEmits<{
  viewOverallReport: [];
  cardClick: [title: string];
}>();

const sortedCards = computed(() =>
  [...props.cards].sort((a, b) => b.orderValue - a.orderValue),
);
</script>
