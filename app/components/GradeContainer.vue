<template>
  <div
    class="font-headers font-semibold w-[2em] aspect-square text-center flex items-center justify-center rounded-[0.5em]!"
    :class="props.score != null
      ? gradeColors[getGrade(props.score, props.type)[0] as keyof typeof gradeColors]
      : 'bg-gray-100 text-gray-300'"
  >
    {{ props.score != null ? getGrade(props.score, props.type) : '-' }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  score: number | null | undefined;
  type: 'single' | 'ovr';
}>();
</script>

<style scoped></style>
