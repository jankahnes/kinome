<template>
  <div class="inline-block">
    {{ displayedNumber }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  number: number;
  refDist?: number;
}>();

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const displayedNumber = ref(props.number.toFixed(0));
const duration = ref(0);

function animate(oldValue: number, targetValue: number) {
  const start = performance.now();
  const from = oldValue;
  const to = targetValue;

  function frame(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration.value, 1);

    const eased = easeOutCubic(progress);
    displayedNumber.value = (from + (to - from) * eased).toFixed(0);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

watch(
  () => props.number,
  (newValue, oldValue) => {
    if (props.refDist) {
      duration.value = Math.max(
        Math.min(Math.abs(newValue - oldValue) * props.refDist, 800),
        100
      );
    } else {
      duration.value = 450;
    }
    animate(oldValue, newValue);
  }
);
</script>

<style scoped></style>
