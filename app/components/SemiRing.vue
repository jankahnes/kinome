<template>
  <div class="relative">
    <svg class="w-full h-full block" :viewBox="viewBox">
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :class="ringBackground"
        :stroke-dasharray="backgroundDashArray"
        stroke-dashoffset="0"
        transform="rotate(180 50 50)"
      />

      <circle
        v-for="(segment, index) in segments"
        :key="index"
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        :stroke-dasharray="segment.dashArray"
        :stroke-dashoffset="segment.dashOffset"
        stroke-linecap="round"
        class="transition-all duration-300"
        :class="segment.color"
        :transform="segment.transform"
      />
    </svg>

    <div
      class="absolute inset-0 flex items-end justify-center"
      :style="{ paddingBottom: `${strokeWidth / 2}px` }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  segments: { value: number; color: string }[];
  strokeWidth?: number;
  ringBackground?: string;
}

const props = withDefaults(defineProps<Props>(), {
  strokeWidth: 8,
  ringBackground: 'stroke-gray-200',
});

const radius = computed(() => {
  return (100 - props.strokeWidth) / 2;
});

// FIX:
// 1. We keep X at 100.
// 2. We set Y to 50 (the centerline) PLUS half the stroke width.
//    This allows the rounded caps (which extend below the centerline) to be visible.
const viewBox = computed(() => {
  const height = 50 + props.strokeWidth / 2;
  return `0 0 100 ${height}`;
});

const circumference = computed(() => {
  return 2 * Math.PI * radius.value;
});

const backgroundDashArray = computed(() => {
  const halfCirc = circumference.value / 2;
  // Draw half, skip half
  return `${halfCirc} ${circumference.value}`;
});

const segments = computed(() => {
  const firstHalves: any[] = [];
  const secondHalves: any[] = [];
  // Start rotation at 180 (9 o'clock)
  let currentRotation = 180;

  props.segments.forEach((segment) => {
    const clampedValue = Math.max(0, Math.min(1, segment.value));

    // Total available length is half the circumference
    const segmentLength = (circumference.value / 2) * clampedValue;

    const halfLength = segmentLength / 2;
    const fullCircle = circumference.value;

    firstHalves.push({
      color: segment.color,
      dashArray: `${halfLength} ${fullCircle - halfLength}`,
      dashOffset: 0,
      transform: `rotate(${currentRotation} 50 50)`,
    });

    secondHalves.push({
      color: segment.color,
      dashArray: `${halfLength} ${fullCircle - halfLength}`,
      dashOffset: -halfLength,
      transform: `rotate(${currentRotation} 50 50)`,
    });

    // Increment rotation: A value of 1.0 equals 180 degrees
    currentRotation += clampedValue * 180;
  });

  return [...firstHalves, ...secondHalves];
});
</script>
