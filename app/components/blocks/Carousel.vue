<template>
  <div class="relative ignore-swipe">
    <div class="relative">
      <div v-if="canScrollLeft"
        class="absolute top-0 -left-px h-full w-8 bg-linear-to-r from-[#fffefb] md:from-main to-transparent pointer-events-none z-20">
      </div>
      <div v-if="canScrollRight"
        class="absolute top-0 -right-px h-full w-8 bg-linear-to-l from-[#fffefb] md:from-main to-transparent pointer-events-none z-20">
      </div>

      <button v-if="showArrows && canScrollLeft" type="button" @click="scrollByPage(-1)" aria-label="Scroll left"
        class="flex absolute left-1 top-1/2 -translate-y-1/2 z-30 w-6 h-6 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-[0_1px_4px_rgba(0,0,0,0.12)] hover:bg-white hover:scale-105 active:scale-95 transition-all">
        <IconChevronLeft class="w-4 h-4" />
      </button>
      <button v-if="showArrows && canScrollRight" type="button" @click="scrollByPage(1)" aria-label="Scroll right"
        class="flex absolute right-1 top-1/2 -translate-y-1/2 z-30 w-6 h-6 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-[0_1px_4px_rgba(0,0,0,0.12)] hover:bg-white hover:scale-105 active:scale-95 transition-all">
        <IconChevronRight class="w-4 h-4" />
      </button>

      <div ref="desktopContainer" class="overflow-x-hidden">
        <div ref="desktopSlider" class="flex select-none cursor-grab active:cursor-grabbing w-max" :class="[
          {
            'transition-transform duration-300 ease-in-out':
              !isDragging && !isDecelerating,
          },
          flexClass,
        ]" :style="{ transform: `translateX(${-currentOffset}px)` }" @mousedown="startDrag" @touchstart="startDrag"
          @mousemove="onDrag" @touchmove="onDrag" @mouseup="endDrag" @mouseleave="endDrag" @touchend="endDrag"
          @touchcancel="endDrag">
          <slot />
        </div>
      </div>
    </div>

    <div v-if="showProgress && needsScrolling"
      class="mx-1 h-[2px] transition-opacity duration-300 ease-out pointer-events-none"
      :class="scrollbarVisible ? 'opacity-100' : 'opacity-0'">
      <div class="relative w-full h-full">
        <div class="absolute top-0 h-full bg-gray-400/40 rounded-full"
          :style="{ width: `${thumbWidth}%`, left: `${thumbLeft}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';

const props = defineProps({
  showProgress: {
    type: Boolean,
    default: false,
  },
  showArrows: {
    type: Boolean,
    default: false,
  },
  flexClass: {
    type: String,
    default: '',
  },
  activeClass: {
    type: String,
    default: 'carousel-active',
  },
});

const desktopContainer = ref(null);
const desktopSlider = ref(null);
const currentOffset = ref(0);
const itemWidth = ref(0);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const containerWidth = ref(0);
const sliderWidth = ref(0);
const scrollbarVisible = ref(false);
let scrollbarHideTimer = null;

const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartOffset = ref(0);
const hasDragged = ref(false);
const isHorizontalGesture = ref(false);
const dragThreshold = 5;

const velocity = ref(0);
const isDecelerating = ref(false);
const lastTouchTime = ref(0);
const lastTouchX = ref(0);
const animationFrame = ref(null);

const FRICTION = 0.95;
const MIN_VELOCITY = 0.1;
const VELOCITY_MULTIPLIER = 1.2;

const needsScrolling = computed(() => sliderWidth.value > containerWidth.value);

const thumbWidth = computed(() => {
  if (sliderWidth.value === 0) return 0;
  return Math.min(100, (containerWidth.value / sliderWidth.value) * 100);
});

const thumbLeft = computed(() => {
  if (sliderWidth.value === 0) return 0;
  const maxLeft = 100 - thumbWidth.value;
  return Math.max(0, Math.min(maxLeft, (currentOffset.value / sliderWidth.value) * 100));
});

const showScrollbar = () => {
  if (!props.showProgress) return;
  scrollbarVisible.value = true;
  if (scrollbarHideTimer) clearTimeout(scrollbarHideTimer);
  scrollbarHideTimer = setTimeout(() => {
    scrollbarVisible.value = false;
  }, 600);
};

watch(currentOffset, () => {
  showScrollbar();
});

const getMaxOffset = () => {
  if (!desktopContainer.value || !desktopSlider.value) return 0;

  return Math.max(
    0,
    desktopSlider.value.scrollWidth - desktopContainer.value.clientWidth
  );
};

const updateDesktopState = () => {
  if (!desktopContainer.value || !desktopSlider.value) return;

  const container = desktopContainer.value;
  const slider = desktopSlider.value;
  containerWidth.value = container.clientWidth;
  sliderWidth.value = slider.scrollWidth;

  const firstChild = slider.firstElementChild;
  if (firstChild) {
    const rect = firstChild.getBoundingClientRect();
    const gap = 8;
    itemWidth.value = rect.width + gap;
  }

  // Only allow scrolling if content is wider than container
  const scrollable = sliderWidth.value > containerWidth.value;
  canScrollLeft.value = scrollable && currentOffset.value > 0;
  canScrollRight.value =
    scrollable && currentOffset.value < sliderWidth.value - containerWidth.value;
};

const scrollByPage = (direction) => {
  if (!desktopContainer.value) return;
  stopAnimation();
  const amount = desktopContainer.value.clientWidth * 0.8 * direction;
  const target = Math.max(0, Math.min(getMaxOffset(), currentOffset.value + amount));
  currentOffset.value = target;
  updateDesktopState();
};

const handleResize = () => {
  // Reset offset if content now fits in container
  if (desktopContainer.value && desktopSlider.value) {
    const container = desktopContainer.value;
    const slider = desktopSlider.value;
    const needsScrolling = slider.scrollWidth > container.clientWidth;
    if (!needsScrolling) {
      currentOffset.value = 0;
    }
  }
  updateDesktopState();
};

const centerActiveItem = () => {
  if (!desktopContainer.value || !desktopSlider.value || isDragging.value) return;

  const container = desktopContainer.value;
  const slider = desktopSlider.value;
  const activeItem = slider.querySelector(`.${props.activeClass}`);

  if (!activeItem) return;

  const targetOffset =
    activeItem.offsetLeft + activeItem.offsetWidth / 2 - container.clientWidth / 2;

  currentOffset.value = Math.max(0, Math.min(getMaxOffset(), targetOffset));
  updateDesktopState();
};

const animate = () => {
  if (!isDecelerating.value || Math.abs(velocity.value) < MIN_VELOCITY) {
    isDecelerating.value = false;
    velocity.value = 0;
    if (animationFrame.value) {
      cancelAnimationFrame(animationFrame.value);
      animationFrame.value = null;
    }
    return;
  }

  currentOffset.value += velocity.value;

  if (!desktopContainer.value || !desktopSlider.value) return;

  const container = desktopContainer.value;
  const slider = desktopSlider.value;
  const maxOffset = slider.scrollWidth - container.clientWidth;

  if (currentOffset.value < 0) {
    currentOffset.value = 0;
    velocity.value = 0;
  } else if (currentOffset.value > maxOffset) {
    currentOffset.value = maxOffset;
    velocity.value = 0;
  }

  velocity.value *= FRICTION;

  updateDesktopState();
  animationFrame.value = requestAnimationFrame(animate);
};

const stopAnimation = () => {
  isDecelerating.value = false;
  velocity.value = 0;
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
    animationFrame.value = null;
  }
};

const getEventX = (event) => {
  return event.type.includes('touch')
    ? event.touches[0]?.clientX || event.changedTouches[0]?.clientX
    : event.clientX;
};

const getEventY = (event) => {
  return event.type.includes('touch')
    ? event.touches[0]?.clientY || event.changedTouches[0]?.clientY
    : event.clientY;
};

const startDrag = (event) => {
  if (
    event.target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""]'
    )
  ) {
    return;
  }

  // Check if scrolling is needed - if content fits in container, don't allow dragging
  if (desktopContainer.value && desktopSlider.value) {
    const container = desktopContainer.value;
    const slider = desktopSlider.value;
    const needsScrolling = slider.scrollWidth > container.clientWidth;
    if (!needsScrolling) return;
  }

  const x = getEventX(event);
  const y = getEventY(event);
  if (x === undefined || y === undefined) return;

  const isTouchEvent = event.type.includes('touch');

  stopAnimation();

  isDragging.value = true;
  dragStartX.value = x;
  dragStartY.value = y;
  dragStartOffset.value = currentOffset.value;
  lastTouchX.value = x;
  lastTouchTime.value = performance.now();
  hasDragged.value = false;
  isHorizontalGesture.value = !isTouchEvent;
  velocity.value = 0;

  if (!isTouchEvent) {
    event.preventDefault();
  }
};

const onDrag = (event) => {
  if (!isDragging.value) return;

  const x = getEventX(event);
  const y = getEventY(event);
  if (x === undefined || y === undefined) return;

  const deltaX = dragStartX.value - x;
  const deltaY = dragStartY.value - y;

  const isTouchEvent = event.type.includes('touch');

  if (
    isTouchEvent &&
    !isHorizontalGesture.value &&
    (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)
  ) {
    isHorizontalGesture.value = Math.abs(deltaX) > Math.abs(deltaY);

    if (!isHorizontalGesture.value) {
      isDragging.value = false;
      return;
    }
  }

  if (!isHorizontalGesture.value) return;

  const newOffset = dragStartOffset.value + deltaX;

  if (Math.abs(deltaX) > dragThreshold) {
    hasDragged.value = true;
  }

  const now = performance.now();
  const timeDelta = now - lastTouchTime.value;

  if (timeDelta > 0) {
    const distanceDelta = lastTouchX.value - x;
    velocity.value = (distanceDelta / timeDelta) * 16;
  }

  lastTouchX.value = x;
  lastTouchTime.value = now;

  if (!desktopContainer.value || !desktopSlider.value) return;

  const container = desktopContainer.value;
  const slider = desktopSlider.value;
  const maxOffset = slider.scrollWidth - container.clientWidth;

  let constrainedOffset = newOffset;
  if (newOffset < 0) {
    constrainedOffset = newOffset * 0.3;
  } else if (newOffset > maxOffset) {
    constrainedOffset = maxOffset + (newOffset - maxOffset) * 0.3;
  }

  currentOffset.value = constrainedOffset;
  updateDesktopState();

  event.preventDefault();
};

const endDrag = (event) => {
  if (!isDragging.value) return;

  const wasHorizontalGesture = isHorizontalGesture.value;

  isDragging.value = false;
  isHorizontalGesture.value = false;

  if (!wasHorizontalGesture) return;

  if (!desktopContainer.value || !desktopSlider.value) return;

  const container = desktopContainer.value;
  const slider = desktopSlider.value;
  const maxOffset = slider.scrollWidth - container.clientWidth;

  if (currentOffset.value < 0) {
    currentOffset.value = 0;
    velocity.value = 0;
  } else if (currentOffset.value > maxOffset) {
    currentOffset.value = maxOffset;
    velocity.value = 0;
  }

  if (Math.abs(velocity.value) > MIN_VELOCITY) {
    velocity.value *= VELOCITY_MULTIPLIER;
    isDecelerating.value = true;
    animationFrame.value = requestAnimationFrame(animate);
  }

  setTimeout(() => {
    hasDragged.value = false;
  }, 50);

  if (!event.type.includes('touch') || wasHorizontalGesture) {
    event.preventDefault();
  }
};

const globalClickHandler = (event) => {
  if (hasDragged.value && desktopSlider.value?.contains(event.target)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
};

onMounted(() => {
  nextTick(() => {
    // Reset offset to 0 when component mounts to ensure proper initial state
    currentOffset.value = 0;
    updateDesktopState();
    centerActiveItem();
  });

  window.addEventListener('resize', handleResize);
  document.addEventListener('click', globalClickHandler, true);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('click', globalClickHandler, true);
  stopAnimation();
  if (scrollbarHideTimer) clearTimeout(scrollbarHideTimer);
});

defineExpose({
  updateState: () => {
    updateDesktopState();
  },
  centerActiveItem,
});
</script>
