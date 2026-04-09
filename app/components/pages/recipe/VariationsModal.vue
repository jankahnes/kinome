<template>
  <BlocksResponsiveInfo v-model="isOpen" sidePanelClass="w-120">
    <div class="m-4 flex flex-col gap-3">
      <h2 class="text-2xl font-bold tracking-tight">Variations</h2>
      <div v-if="variations.length === 0" class="text-sm text-gray-400">
        No other variations found.
      </div>
      <div v-else class="flex flex-col gap-3">
        <div v-for="v in variations" :key="v.id">
          <RecipeCardHorizontal :recipe="v" :uniqueId="`variation-${v.id}`" />
        </div>
      </div>
    </div>
  </BlocksResponsiveInfo>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  variations: RecipeOverview[];
  currentId: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});
</script>
