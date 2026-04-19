<template>
  <div class="space-y-2" ref="root" @click="closeTooltip">
    <h2 class="text-4xl font-headers tracking-tight ml-2" v-if="!hideHeader">
      Method
    </h2>
    <div class="main-card main-card-rounded flex flex-col relative overflow-hidden"
      :class="{ 'bg-primary-20/80!': formalizationLoading }">
      <div class="flex-1" v-if="fullInstructions && fullInstructions.length">
        <div v-for="(step, index) in fullInstructions" :key="index"
          class="flex gap-5 items px-4 md:px-6 first:pt-4 last:pb-3 md:first:pt-6 md:last:pb-5 hover:bg-primary/8 group"
          @mouseenter="onStepHover(step)" @mouseleave="onStepLeave()">
          <div class="flex flex-col items-center">
            <div class="h-4 w-px bg-gray-200/40 group-first:hidden" :class="{ 'h-5!': !step.title }"></div>
            <div
              class="min-w-8 h-8 p-1 rounded-full flex items-center font-semibold justify-center bg-primary/10  font-headers shrink-0 leading-none ">
              {{ index + 1 }}
            </div>
            <div class="flex-1 w-px bg-gray-200/40 group-last:hidden"></div>
          </div>

          <div class="flex-1 flex flex-col gap-1  group-not-first:my-4 group-first:mb-4 group-last:mt-4 ">
            <h3 class="text-lg font-headers font-semibold">{{ step.title }}</h3>

            <p class="text-gray-800 text-sm leading-relaxed" v-html="renderInstructionWithLinks(step.formatted_text)">
            </p>
          </div>
        </div>
      </div>

      <div v-else class="flex-1 flex items-center justify-center px-6 py-20">
        <div class="text-center max-w-sm">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <IconBookOpen class="w-6 h-6 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">
            No Instructions Available
          </h3>
          <p class="text-sm text-gray-500">
            Step-by-step instructions for this recipe haven't been added yet.
          </p>
        </div>
      </div>

      <!-- Dynamic Tooltip -->
      <transition name="fade" mode="out-in">
        <Teleport to="body" v-if="activeTooltip">
          <div class="fixed z-50 pointer-events-none transition-all duration-200" :style="{
            left: activeTooltip.x + 'px',
            top: activeTooltip.y + 'px',
            transform: 'translate(-50%, -100%)',
          }">
            <div
              class="bg-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium text-center">
              {{ activeTooltip.amount }}
              <div
                class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white">
              </div>
            </div>
          </div>
        </Teleport>
      </transition>
      <div
        class="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/70 to-transparent p-4 pointer-events-none"
        v-if="formalizationLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  fullInstructions: CookStep[];
  ingredients?: any[];
  servingSize?: number;
  formalizationLoading: Boolean;
  markedIngredients: number[];
  hideHeader?: boolean;
}

const currentAnimation = ref<CookStep | null>(null);

const props = defineProps<Props>();

const playKey = ref(0);
const animationSrc = ref('/cooking-animations/prep.webp');

const root = ref(null);

defineExpose({
  root,
});

const emit = defineEmits(['update:markedIngredients']);

/** IDs from `[label](id)` links in formatted_text — same convention as CookMode. */
function ingredientIdsInStep(step: CookStep): number[] {
  const text = step.formatted_text ?? '';
  const ids = [...text.matchAll(/\[[^\]]+\]\((\d+)\)/g)].map((m) =>
    parseInt(m[1]!, 10)
  );
  return [...new Set(ids)];
}

function onStepHover(step: CookStep) {
  playKey.value++;
  animationSrc.value = `/cooking-animations/prep.webp?t=${Date.now()}`;
  currentAnimation.value = step;
  emit('update:markedIngredients', ingredientIdsInStep(step));
}

function onStepLeave() {
  currentAnimation.value = null;
  emit('update:markedIngredients', []);
}

// Tooltip state
const activeTooltip = ref<{
  amount: string;
  x: number;
  y: number;
  timeoutId?: NodeJS.Timeout;
} | null>(null);

// Function to render instructions with clickable ingredient links
function renderInstructionWithLinks(instruction: string): string {
  if (!instruction) return '';

  // Escape HTML to prevent XSS
  const escaped = instruction
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Replace [ingredient](id) with clickable spans
  return escaped.replace(
    /\[([^\]]+)\]\((\d+)\)/g,
    (match, ingredient, ingredientId) => {
      return `<span 
      class="cursor-pointer relative ingredient-link px-1 bg-primary/8 rounded-md hover:bg-primary/20 transition-colors duration-400" 
      data-ingredient="${ingredient}"
      data-ingredient-id="${ingredientId}"
      role="button"
      tabindex="0"
    >${ingredient}</span>`;
    }
  ).replace(/\*([^*]+)\*/g, '<strong>$1</strong>');;
}

// Handle ingredient click
function handleIngredientClick(event: Event) {
  const target = event.target as HTMLElement;
  if (!target.classList.contains('ingredient-link')) return;

  const ingredient = target.dataset.ingredient;
  const ingredientIdStr = target.dataset.ingredientId;
  if (
    !ingredient ||
    !ingredientIdStr ||
    !props.ingredients ||
    !props.servingSize
  )
    return;

  // Find the ingredient and calculate amount
  const ingredientId = parseInt(ingredientIdStr, 10);
  const ingredientData = props.ingredients.find(
    (ing) => ing.id === ingredientId
  );
  if (!ingredientData) return;

  const calculatedAmount = getStringFromAmountInfo(
    ingredientData?.amountInfo?.[ingredientData?.currentUnit],
    props.servingSize
  );
  // Get click position
  const rect = target.getBoundingClientRect();

  if (activeTooltip.value?.timeoutId) {
    clearTimeout(activeTooltip.value.timeoutId);
  }
  // Show tooltip with just the calculated amount
  activeTooltip.value = {
    amount: calculatedAmount,
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
  };

  // Auto-hide after 2 seconds
  activeTooltip.value.timeoutId = setTimeout(() => {
    activeTooltip.value = null;
  }, 2000);
}

// Add click listener when component mounts
onMounted(() => {
  document.addEventListener('click', handleIngredientClick);
  document.addEventListener('scroll', closeTooltip, { passive: true });
});

// Cleanup listener on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleIngredientClick);
});

// Close tooltip when clicking outside
function closeTooltip() {
  activeTooltip.value = null;
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
