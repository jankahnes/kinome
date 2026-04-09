<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-2xl font-bold mt-4">Your Goal</h3>
    <div class="flex gap-4 flex-wrap">
      <div
        class="p-4 bg-primary-10 rounded-4xl! border-2 border-gray-200 flex flex-col gap-2 items-center text-nowrap shrink-0 flex-1 animated-button"
        v-for="(objective, index) in form.objectiveCards"
        :key="objective.title"
        :class="{ 'border-green-300 bg-green-100/40!': form.selectedObjectiveCard.value === index }"
        @click="form.selectedObjectiveCard.value = index"
      >
        <img :src="objective.illustration" :alt="objective.title" class="h-34" />
        <h4 class="text-xl font-bold">{{ objective.title }}</h4>
        <p class="text-center -mt-2 leading-none">{{ objective.description }}</p>
      </div>
    </div>

    <BlocksCollapsible
      :modelValue="form.selectedObjectiveCard.value != null && form.selectedObjectiveCard.value !== 1"
    >
      <h3 class="text-2xl font-bold">Your Pace</h3>
      <div class="py-14 px-4">
        <div class="relative w-full h-6">
          <div
            class="absolute top-1/2 -translate-y-1/2 w-full h-6 bg-[#e7e5e2] rounded-xl z-1"
          ></div>
          <div
            class="slider-gradient-fill primary-gradient"
            :style="{
              width: `${
                form.selectedPaceIndex.value === 0
                  ? 5
                  : form.selectedPaceIndex.value === 1
                  ? 35
                  : form.selectedPaceIndex.value === 2
                  ? 65
                  : 95
              }%`,
            }"
          ></div>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            v-model.number="form.selectedPaceIndex.value"
            class="slider-input"
          />
          <div
            v-for="(pace, index) in form.sliderValues"
            :key="pace.title"
            class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 z-20"
            :class="{ active: form.selectedPaceIndex.value === index }"
            :style="{ left: `${index === 0 ? 5 : index === 1 ? 35 : index === 2 ? 65 : 95}%` }"
          >
            <Transition name="fade-up">
              <img
                v-if="form.selectedPaceIndex.value === index"
                :src="pace.illustration"
                :alt="pace.title"
                class="absolute bottom-[calc(100%+10px)] h-[40px] w-[60px] object-contain max-w-none pointer-events-none"
              />
            </Transition>
            <div
              class="w-9 h-9 bg-white border-3 border-[#e7e5e2] rounded-full shadow-md transition-all duration-300 opacity-60 [.active_&]:opacity-0"
            ></div>
            <div
              class="absolute top-[calc(100%+10px)] flex flex-col items-center whitespace-nowrap transition-all duration-300"
            >
              <span class="text-lg text-gray-500 transition-all duration-300 leading-none font-bold">
                {{ pace.title }}
              </span>
              <span class="text-sm text-gray-400 transition-all duration-300 leading-none">
                {{ pace.description }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BlocksCollapsible>

    <h3 class="text-2xl font-bold mt-6">Your Preference</h3>
    <div class="flex gap-4 flex-wrap">
      <div
        class="px-4 py-2 bg-primary-10 rounded-4xl! flex flex-col gap-2 items-center text-nowrap shrink-0 flex-1 animated-button"
        v-for="(item, index) in form.dietPills"
        :key="item.title"
        :class="{ 'bg-primary!': form.selectedPreference.value === index }"
        @click="form.selectedPreference.value = index"
      >
        <h4 class="text-xl font-bold">{{ item.title }}</h4>
        <p class="text-center -mt-2 leading-none">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingSectionForm } from '~/composables/useTrackingGoalsForm';

defineProps<{
  form: TrackingSectionForm;
}>();
</script>

<style scoped>
.slider-gradient-fill {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 24px;
  border-radius: 12px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  pointer-events: none;
}

.slider-input {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: calc(90% + 42px);
  left: calc(5% - 21px);
  height: 24px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  z-index: 30;
}

.slider-input::-webkit-slider-track {
  width: 100%;
  height: 24px;
  background: transparent;
  border-radius: 12px;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 42px;
  height: 42px;
  background: white;
  border: 4px solid #ff6b6b;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
  transition: all 0.2s ease;
  margin-top: -9px;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.slider-input::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.slider-input::-moz-range-track {
  width: 100%;
  height: 24px;
  background: transparent;
  border-radius: 12px;
}

.slider-input::-moz-range-thumb {
  width: 42px;
  height: 42px;
  background: white;
  border: 4px solid #ff6b6b;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
  transition: all 0.2s ease;
  border: none;
}

.slider-input::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.slider-input::-moz-range-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-enter-to,
.fade-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
