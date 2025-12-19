<template>
  <div>
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 backdrop-blur-sm bg-black/30"
        @click="close"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="isOpen"
        ref="sheetRef"
        class="fixed left-0 right-0 bottom-0 bg-white rounded-t-3xl z-100 flex flex-col will-change-transform sheet-content"
        :style="sheetStyle"
        @touchstart.passive="onDragStart"
        @touchmove.prevent="onDragMove"
        @touchend.passive="onDragEnd"
        @mousedown="onDragStart"
      >
        <div class="flex justify-center pt-4 pb-3 select-none">
          <div class="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div ref="contentRef" class="px-4 overflow-hidden pb-6">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';

const sheetRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startY = ref(0);
const currentY = ref(0);

const maxHeightVh = ref(0); // 80% of viewport height
const contentHeight = ref(0); // Actual content height
const currentSheetHeight = ref(0); // Current height of sheet (used during dragging)
const baseSheetHeight = ref(0); // The "80%" height baseline
const dragStartHeight = ref(0); // Height when drag started

const dragOffsetY = ref(0); // For close gesture - translates sheet down

// Velocity tracking for momentum
const lastTouchTime = ref(0);
const lastTouchY = ref(0);
const velocityY = ref(0);
const momentumRAF = ref<number | null>(null);

const CLOSE_THRESHOLD = 50;
const MAX_HEIGHT_PERCENTAGE = 0.8;
const FRICTION = 0.98; // Deceleration factor (higher = less friction, more momentum)
const MIN_VELOCITY = 0.1;

const historyStatePushed = ref(false); //avoid double-popping

const calculateHeights = () => {
  maxHeightVh.value = window.innerHeight * MAX_HEIGHT_PERCENTAGE;

  if (contentRef.value) {
    // Get the actual scrollHeight of content
    const handleHeight = 44; // pt-3 + pb-2 + handle
    contentHeight.value = contentRef.value.scrollHeight + handleHeight;

    // Base height is minimum of content or 80%
    baseSheetHeight.value = Math.min(contentHeight.value, maxHeightVh.value);
    currentSheetHeight.value = baseSheetHeight.value;
  }
};

const sheetStyle = computed(() => {
  const styles: any = {
    maxHeight: `${currentSheetHeight.value}px`,
  };

  // Apply drag offset for close gesture (dragging down)
  if (isDragging.value && dragOffsetY.value > 0) {
    styles.transform = `translateY(${dragOffsetY.value}px)`;
    styles.transition = 'none';
  }

  return styles;
});

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

defineExpose({ open, close });

const stopMomentum = () => {
  if (momentumRAF.value !== null) {
    cancelAnimationFrame(momentumRAF.value);
    momentumRAF.value = null;
  }
};

const applyMomentum = () => {
  // Apply velocity to height (negative velocity = dragging up = increase height)
  const deltaHeight = -velocityY.value * 16; // Approximate frame time
  const newHeight = currentSheetHeight.value + deltaHeight;

  // Clamp to boundaries
  const clampedHeight = Math.max(
    baseSheetHeight.value,
    Math.min(newHeight, contentHeight.value)
  );

  currentSheetHeight.value = clampedHeight;

  // Apply friction
  velocityY.value *= FRICTION;

  // Check if we hit boundaries - apply stronger friction/bounce
  if (
    clampedHeight === baseSheetHeight.value ||
    clampedHeight === contentHeight.value
  ) {
    velocityY.value *= 0.5; // Extra friction at boundaries
  }

  // Continue animation
  momentumRAF.value = requestAnimationFrame(applyMomentum);
};

const onDragStart = (e: TouchEvent | MouseEvent) => {
  stopMomentum(); // Stop any ongoing momentum
  isDragging.value = true;
  dragStartHeight.value = currentSheetHeight.value; // Remember current height

  const now = Date.now();
  if (e instanceof TouchEvent) {
    startY.value = e.touches[0]?.clientY ?? 0;
    lastTouchY.value = startY.value;
  } else {
    startY.value = e.clientY;
    lastTouchY.value = startY.value;
    document.addEventListener('mousemove', onDragMove as any);
    document.addEventListener('mouseup', onDragEnd as any);
  }
  lastTouchTime.value = now;
  velocityY.value = 0;
};

const onDragMove = (e: TouchEvent | MouseEvent) => {
  if (!isDragging.value) return;

  if (e instanceof TouchEvent) {
    e.preventDefault();
    currentY.value = e.touches[0]?.clientY ?? 0;
  } else {
    e.preventDefault();
    currentY.value = e.clientY;
  }

  const now = Date.now();
  const deltaTime = now - lastTouchTime.value;

  if (deltaTime > 0) {
    const deltaYMove = currentY.value - lastTouchY.value;
    velocityY.value = deltaYMove / deltaTime; // px per ms
  }

  lastTouchY.value = currentY.value;
  lastTouchTime.value = now;

  const deltaY = currentY.value - startY.value;

  if (deltaY < 0) {
    // Dragging up - expand sheet if there's more content
    const newHeight = dragStartHeight.value - deltaY;
    // Cap at content height
    currentSheetHeight.value = Math.min(newHeight, contentHeight.value);
    dragOffsetY.value = 0;
  } else {
    // Dragging down
    // Only allow down drag if we're at baseSheetHeight (80%)
    if (dragStartHeight.value <= baseSheetHeight.value) {
      // We're at or below 80%, allow close gesture
      dragOffsetY.value = deltaY;
    } else {
      // We're expanded beyond 80%, shrink the sheet back toward 80%
      const newHeight = dragStartHeight.value - deltaY;
      currentSheetHeight.value = Math.max(newHeight, baseSheetHeight.value);
      dragOffsetY.value = 0;
    }
  }
};

const onDragEnd = () => {
  if (!isDragging.value) return;

  isDragging.value = false;

  document.removeEventListener('mousemove', onDragMove as any);
  document.removeEventListener('mouseup', onDragEnd as any);

  // Check if we should close (dragged down from 80% position)
  if (dragOffsetY.value > CLOSE_THRESHOLD) {
    close();
    dragOffsetY.value = 0;
    return;
  }

  // Reset drag offset
  dragOffsetY.value = 0;

  // Start momentum scrolling if velocity is significant
  if (Math.abs(velocityY.value) > MIN_VELOCITY) {
    momentumRAF.value = requestAnimationFrame(applyMomentum);
  }
};

const resizeHandler = () => {
  calculateHeights();
};

const onPopState = () => {
  if (isOpen.value && historyStatePushed.value) {
    historyStatePushed.value = false;
    isOpen.value = false;
  }
};

watch(isOpen, async (open) => {
  if (!open) {
    stopMomentum();
    isDragging.value = false;
    dragOffsetY.value = 0;
    currentSheetHeight.value = 0;

    if (historyStatePushed.value) {
      historyStatePushed.value = false;
      history.back();
    }
  } else {
    history.pushState({ bottomSheet: true }, '');
    historyStatePushed.value = true;

    await nextTick();
    await nextTick();
    calculateHeights();
  }
});

onMounted(() => {
  window.addEventListener('resize', resizeHandler);
  window.addEventListener('popstate', onPopState);
});

onUnmounted(() => {
  stopMomentum();
  window.removeEventListener('resize', resizeHandler);
  window.removeEventListener('popstate', onPopState);
  document.removeEventListener('mousemove', onDragMove as any);
  document.removeEventListener('mouseup', onDragEnd as any);

  if (historyStatePushed.value) {
    history.back();
  }
});
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease-out;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1) !important;
}

.sheet-enter-from {
  transform: translateY(100%) !important;
}

.sheet-leave-to {
  transform: translateY(100%) !important;
}

.touch-none {
  touch-action: none;
  -webkit-user-drag: none;
}
</style>
