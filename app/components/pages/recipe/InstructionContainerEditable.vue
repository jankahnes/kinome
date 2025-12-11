<template>
  <div class="main-card main-card-padding flex items-start">
    <ol class="w-full flex-1 mt-2">
      <li v-for="i in modelValue.length + 1" :key="i">
        <div class="flex gap-2 w-full">
          <div class="flex-1 flex flex-col rounded-lg w-full">
            <div
              class="relative min-h-20 flex items-center justify-start w-full h-full"
            >
              <div
                class="flex gap-4 rounded-lg px-3 w-full h-full justify-start"
              >
                <div
                  v-if="i <= modelValue.length"
                  class="min-w-9 h-9 p-1 rounded-xl flex items-center text-xl font-bold justify-center bg-primary-500 text-white flex-shrink-0 leading-none"
                >
                  {{ i }}
                </div>

                <div class="w-full h-full">
                  <textarea
                    v-if="i <= modelValue.length"
                    v-model="modelValue[i - 1]"
                    v-auto-resize
                    :placeholder="`Step ${i}...`"
                    class="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden break-words scrollbar-hide flex-1 text-gray-800 leading-relaxed"
                  />
                  <button
                    v-else
                    @click="modelValue.push('')"
                    class="rounded-lg w-full h-full cursor-pointer"
                  >
                    <IconPlus :size="30" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ol>
    <button
      class="animated-button bg-slate-50 flex items-center gap-1 px-2 py-1 text-xs leading-none"
      @click="pasteInstructions"
    >
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
