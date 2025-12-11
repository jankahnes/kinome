<template>
  <div class="h-full z-99">
    <button
      ref="buttonRef"
      @click.stop="toggle"
      :aria-expanded="isOpen"
      :class="style"
      class="animated-button flex items-center justify-between z-10 relative w-full h-full gap-1 p-2"
    >
      <span class="font-bold">{{ modelValue.displayName }}</span>
      <IconChevronDown
        class="transition-transform duration-300 w-4"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition @before-enter="beforeEnter" @enter="enter" @leave="leave">
      <div
        v-if="isOpen"
        ref="panelRef"
        :class="style"
        class="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-full z-99 overflow-hidden animated-button shadow-md"
      >
        <ul class="">
          <li v-for="choice in choices" class="cursor-pointer">
            <button
              class="flex w-full h-full items-center justify-between p-2"
              @click="
                emit('update:modelValue', choice);
                isOpen = false;
              "
            >
              <span class="">{{ choice.displayName }}</span>
              <IconCheck
                class="w-4"
                v-if="modelValue.displayName == choice.displayName"
              />
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false);
const buttonRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const props = defineProps({
  choices: { type: Array<{ value: any; displayName: string }> },
  modelValue: {
    type: Object as PropType<{ value: any; displayName: string }>,
    required: true,
  },
  style: String,
});
const emit = defineEmits(['update:modelValue']);

const handleClickOutside = (e: MouseEvent) => {
  if (
    !buttonRef.value?.contains(e.target as Node) &&
    !panelRef.value?.contains(e.target as Node)
  ) {
    isOpen.value = false;
  }
};

function beforeEnter(el: Element) {
  (el as HTMLElement).style.height = '0px';
}
function enter(el: Element) {
  const height = el.scrollHeight;
  (el as HTMLElement).style.transition = 'height 150ms ease';
  requestAnimationFrame(() => {
    (el as HTMLElement).style.height = height + 'px';
  });
}
function leave(el: Element) {
  (el as HTMLElement).style.transition = 'height 150ms ease';
  (el as HTMLElement).style.height = '0px';
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped></style>
