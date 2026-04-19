<template>
  <div class="inline-flex items-center select-none">
    <span class="text-[10px] uppercase text-gray-400 font-mono tracking-wider px-2">Serves</span>
    <div class="w-px bg-gray-200 self-stretch my-1.5 mx-1"></div>
    <button type="button" class="px-2 py-1 flex items-center justify-center rounded-full hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      :disabled="value <= min" @click="step(-1)" aria-label="Decrease servings">
      <IconMinus class="w-4" />
    </button>
    <div class="w-10 text-center font-mono font-semibold text-lg tabular-nums">{{ value }}</div>
    <button type="button" class="px-2 py-1 flex items-center justify-center rounded-full hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      :disabled="value >= max" @click="step(1)" aria-label="Increase servings">
      <IconPlus class="w-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
const value = defineModel<number>({ required: true });

const props = withDefaults(defineProps<{
  min?: number;
  max?: number;
}>(), {
  min: 1,
  max: 16,
});

function step(delta: number) {
  const next = (value.value ?? 1) + delta;
  if (next < props.min || next > props.max) return;
  value.value = next;
}
</script>
