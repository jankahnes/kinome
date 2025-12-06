<template>
  <transition
    @enter="enter"
    @after-enter="afterEnter"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <div
      v-show="open"
      ref="body"
      class="transition-[height] duration-300 ease-in-out"
      :class="{ 'overflow-hidden': !open }"
    >
      <slot />
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const open = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => (open.value = v)
);

const body = ref(null);

function enter(el) {
  el.style.height = '0px';
  void el.offsetHeight;

  const height = el.scrollHeight + 'px';
  el.style.height = height;
}

function afterEnter(el) {
  el.style.height = 'auto';
}

function leave(el) {
  el.style.height = el.scrollHeight + 'px';
  void el.offsetHeight;

  el.style.height = '0px';
}

function afterLeave(el) {
  el.style.height = 'auto';
}
</script>
