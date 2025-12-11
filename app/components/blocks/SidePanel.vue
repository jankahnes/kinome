<template>
  <div>
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isOpen"
          class="blurred-backdrop"
          @click="close"
          :class="{ 'hidden! md:block!': responsive }"
        />
      </Transition>

      <Transition name="panel">
        <div
          v-if="isOpen"
          class="fixed top-0 right-0 bottom-0 bg-white shadow-2xl rounded-l-3xl z-200 flex flex-col p-4 pt-10"
          :class="[{ 'hidden! md:flex!': responsive }, sidePanelClass]"
        >
          <div class="flex-1 overflow-y-auto p-2 min-h-0 custom-scrollbar">
            <slot />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  sidePanelClass?: string;
  responsive: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const close = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.panel-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.panel-leave-active {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%) !important;
}

/* Custom scrollbar styles */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
</style>
