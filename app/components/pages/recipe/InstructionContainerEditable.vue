<template>
  <div class="flex gap-4 items-start">
    <ol class="flex-1 flex flex-col gap-2">
      <li v-for="i in modelValue.length" :key="i"
        class="flex gap-4 rounded-2xl md:px-3 py-2 min-h-12 md:bg-primary-5/70 flex-1">
        <div v-if="i <= modelValue.length"
          class="min-w-9 h-9 p-1 rounded-full flex items-center text-xl font-semibold justify-center bg-primary/10  font-headers shrink-0 leading-none">
          {{ i }}
        </div>

        <textarea v-model="modelValue[i - 1]" v-auto-resize :placeholder="`Step ${i}`"
          class="bg-transparent border-none outline-none resize-none overflow-hidden wrap-break-word scrollbar-hide flex-1" />
      </li>
      <li class="flex gap-2 mt-2">
        <button class="main-button animated-button flex items-center gap-2 px-4 py-1 main-card"
          @click="modelValue.push('')">
          <IconPlus class="w-4" />
          Add step
        </button>
      </li>
    </ol>
    <!--
    <button class="main-button animated-button bg-primary/8 flex items-center gap-1 px-2 py-1 text-xs leading-none"
      @click="pasteInstructions">
      <IconCopy class="w-4" />
      <span>Paste</span>
    </button>-->
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const pasteInstructions = async () => {
  const text = await navigator.clipboard.readText();
  emit(
    'update:modelValue',
    text.split('\n').filter((line) => line.trim() !== '')
  );
};
</script>

<style scoped></style>
