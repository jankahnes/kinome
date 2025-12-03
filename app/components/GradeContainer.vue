<template>
  <div
    class="font-bold w-[2em] aspect-square text-center flex items-center justify-center rounded-[0.5em]!"
    :class="gradeStickerColors[getGrade(props.score, props.type)[0] as keyof typeof gradeStickerColors]"
  >
    {{ getGrade(props.score, props.type) }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  score: number;
  type: 'single' | 'ovr';
}>();
</script>

<style scoped></style>
