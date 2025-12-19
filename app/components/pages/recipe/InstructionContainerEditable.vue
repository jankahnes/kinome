<template>
  <div class="main-card bg-primary-20/50! main-card-padding flex gap-4 items-start">
    <ol class="flex-1 flex flex-col gap-4">
      <li v-for="i in modelValue.length" :key="i"
        class="flex gap-4 rounded-2xl px-3 py-2 min-h-14 bg-primary-10 flex-1">
        <div v-if="i <= modelValue.length"
          class="min-w-9 h-9 p-1 rounded-xl flex items-center text-xl font-bold justify-center bg-primary-500 text-white flex-shrink-0 leading-none">
          {{ i }}
        </div>

        <textarea v-model="modelValue[i - 1]" v-auto-resize :placeholder="`Step ${i}`"
          class="bg-transparent border-none outline-none resize-none overflow-hidden break-words scrollbar-hide flex-1 text-gray-800 leading-relaxed" />
      </li>
      <li @click="modelValue.push('')" class="rounded-2xl cursor-pointer bg-primary-10 self-center px-10 py-2 ">
        <IconPlus :size="30" />
      </li>
    </ol>
    <button class="animated-button bg-secondary flex items-center gap-1 px-2 py-1 text-xs leading-none"
      @click="pasteInstructions">
      <IconCopy class="w-4" />
      <span>Paste</span>
    </button>
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
