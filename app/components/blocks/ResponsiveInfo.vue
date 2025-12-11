<template>
  <BlocksSidePanel v-model="isOpen" :sidePanelClass="sidePanelClass" responsive>
    <slot name="default" />
  </BlocksSidePanel>
  <BlocksBottomSheet v-model="isOpen" class="md:hidden">
    <slot name="default" :is-mobile="true" />
  </BlocksBottomSheet>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  sidePanelClass?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});
</script>
