<template>
  <div class="space-y-2" ref="root">
    <h2 class="text-4xl font-headers tracking-tighter ml-2" v-if="!hideHeader">
      Ingredients
    </h2>

    <div class="main-card main-card-padding main-card-rounded flex flex-col relative gap-2"
      :class="{ 'bg-primary-20/80! overflow-hidden': formalizationLoading }">
      <div class="flex justify-between items-center w-full mb-4">
        <div v-if="ingredients && ingredients.length > 0">
          <div class="" v-if="batchSize && !servingMode">
            <p class="text-gray-600 ml-1 font-light">
              For {{ batchSize }} {{ batchSize === 1 ? 'serving' : 'servings' }}
            </p>
            <p @click="servingMode = !servingMode"
              class="text-xs text-gray-400 ml-1 font-extralight cursor-pointer italic">
              Adjust servings
            </p>
          </div>
          <div v-else>
            <p class="text-sm text-gray-600 ml-1 font-light">Servings:</p>
            <FormsSlidingSelector v-if="servingSize" v-model="servingSize"
              :choices="[0.5, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20]" :expanded="false"
              class="max-w-[180px]" />
            <p v-if="batchSize" @click="
              servingMode = !servingMode;
            servingSize = batchSize;
            " class="text-xs text-gray-400 ml-1 font-extralight cursor-pointer mb-4 italic">
              Show ingredients for one batch
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 relative">
          <button class="flex items-center gap-2 px-2 py-1 text-xs" @click="copyIngredients" v-if="!quickEditMode">
            <IconCopy class="w-4" />
            Copy
          </button>
          <transition name="fade-slide" mode="out-in">
            <button v-if="notOnDefaultUnits && !quickEditMode"
              class="flex items-center gap-2 px-2 py-1 text-xs will-change-transform" @click="resetUnits">
              <IconRefreshCcw class="w-4" />
              <span>Reset Units</span>
            </button>
          </transition>
          <button v-if="ingredients && ingredients.length > 0" class="flex items-center gap-2 px-2 py-1 text-xs"
            @click="toggleQuickEdit">
            <IconSlidersHorizontal v-if="!quickEditMode" class="w-4" />
            <IconCheck v-if="quickEditMode" class="w-4" />
            {{ quickEditMode ? 'Done' : 'Tweak' }}
          </button>
        </div>
      </div>
      <p v-if="quickEditMode" class="text-xs text-gray-500 ml-1 -mt-3 mb-1 italic">
        Drag ingredients left or right to change amounts
      </p>

      <div class="flex-1">
        <div class="max-w-100 space-y-4 select-none" v-if="ingredients && ingredients.length > 0">
          <template v-for="(group, category) in groupedIngredients" :key="category">
            <div v-if="category !== 'uncategorized' && group.length > 0">
              <h3 class="text-lg font-semibold text-gray-800 border-b-2 border-secondary">
                {{ category }}
              </h3>
            </div>

            <ul class="flex flex-col gap-3.5 items-start -mx-1.5" role="list">
              <li v-for="ingredient in group" :key="ingredient.name"
                class="relative overflow-hidden flex items-center rounded-2xl px-2 py-1 transition-colors duration-200 gap-2"
                :class="[backgroundClass(ingredient), { 'select-none touch-pan-y cursor-ew-resize': quickEditMode && !isFreeUnit(ingredient) }]"
                @pointerdown="quickEditMode && !isFreeUnit(ingredient) ? onTweakPointerDown($event, ingredient) : undefined"
                @pointermove="quickEditMode && !isFreeUnit(ingredient) ? onTweakPointerMove($event, ingredient) : undefined"
                @pointerup="quickEditMode && !isFreeUnit(ingredient) ? onTweakPointerUp($event, ingredient) : undefined"
                @pointercancel="quickEditMode && !isFreeUnit(ingredient) ? onTweakPointerUp($event, ingredient) : undefined">
                <div v-if="quickEditMode && !isFreeUnit(ingredient)"
                  class="absolute inset-y-0 left-0 bg-primary/5 pointer-events-none transition-all duration-200 ease-out"
                  :style="{ width: fillPct(ingredient) + '%', opacity: draggingIngredientId === ingredient.id ? 1 : 0 }" />
                <img class="relative h-5 min-w-7 object-contain object-center"
                  :src="`/foods/${ingredient.visual_category}.webp`" v-if="ingredient.visual_category" />
                <span class="relative leading-none">
                  <Transition :name="quickEditMode ? '' : 'fade-slide'" mode="out-in">
                    <span :key="`${servingSize}-${ingredient?.currentUnit}${quickEditMode ? '-edit' : ''}`"
                      class="tabular-nums whitespace-nowrap font-semibold" :class="{ 'cursor-pointer': !quickEditMode }"
                      @click="quickEditMode ? undefined : onClickIngredient(ingredient)">
                      {{
                        getStringFromAmountInfo(
                          ingredient?.amountInfo?.[ingredient?.currentUnit],
                          servingSize ?? 1
                        )
                      }}
                    </span>
                  </Transition>
                  <span class="font-light text-sm text-gray-600" v-if="
                    isCountable(
                      ingredient?.amountInfo?.[ingredient?.currentUnit][1]
                    ) &&
                    unitIsNoun(
                      ingredient?.amountInfo?.[ingredient?.currentUnit][1]
                    )
                  ">
                    of</span>

                  <span>
                    <span>{{ ' ' }}</span>
                    <span class="" v-if="quickEditMode">{{
                      getIngredientDisplayName(ingredient, servingSize ?? 1)
                    }}</span>
                    <NuxtLink v-else
                      :to="getFoodUrl(ingredient.id, getIngredientDisplayName(ingredient, servingSize ?? 1))"
                      class="hover:underline">
                      <span class="">{{
                        getIngredientDisplayName(ingredient, servingSize ?? 1)
                      }}</span>
                    </NuxtLink>
                    <span v-if="ingredient.preparation_description"
                      class="font-main font-light text-gray-600 text-sm mt-1">, {{
                        ingredient.preparation_description }}
                    </span>
                  </span>
                  <span v-if="false" class="font-light text-gray-600 text-sm mt-1">, {{ ingredient?.consumption_factor *
                    100
                  }}% eaten</span>
                </span>
              </li>
            </ul>
          </template>
          <div class="flex gap-4 items-center flex-wrap pt-2 -mb-1 ml-1" v-if="
            (addedInfo?.addedFat && getAdded(addedInfo?.addedFat) >= 1) ||
            (addedInfo?.addedSalt && getAdded(addedInfo?.addedSalt) >= 0.75)
          ">
            <div class="flex items-center rounded-xl" v-if="addedInfo?.addedFat && getAdded(addedInfo?.addedFat) >= 1">
              <span class="text-[10px] uppercase font-mono text-gray-400 tracking-wider">
                🧈 Plus ~{{ getAdded(addedInfo?.addedFat) }}g of
                fat</span>
            </div>
            <div class="flex items-center rounded-xl" v-if="
              addedInfo?.addedSalt && getAdded(addedInfo?.addedSalt) >= 0.75
            ">
              <span class="text-[10px] uppercase font-mono text-gray-400 tracking-wider">
                🧂 Plus ~{{ getAdded(addedInfo?.addedSalt) }}g of
                salt</span>
            </div>
          </div>
          <!--
          <div class="flex items-center gap-2">
            <span class="ml-2">= ~<strong>{{ formatMoney(price) }}</strong> per Serving</span>
          </div>-->
          <!--

          <div class="flex flex-wrap gap-2 mt-2">
            <div v-for="pill in metaPills" :key="pill.text" :class="pill.class"
              class="flex items-center gap-2 main-card-rounded px-2 py-0.5 text-xs justify-center">
              <Icon :name="pill.icon" :size="14" />
              <span>{{ pill.text }}</span>
            </div>
          </div>
          -->
        </div>
        <!-- No formal ingredients, display base ingredients-->
        <div v-else class="flex flex-col">
          <div v-for="baseIngredient in baseIngredients" :key="baseIngredient">
            <p class="ml-1 font-light leading-relaxed text-base tracking-wider">
              {{ baseIngredient }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/70 to-transparent p-4 pointer-events-none"
        v-if="formalizationLoading" />
      <div class="hidden bg-primary/8-700/50 bg-primary/8-700/70" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIngredientDisplayName } from '~/utils/format/getStringFromIngredient';
import { computeDraggedAmount } from '~/utils/format/quickEditSnap';

type AddedInfo = {
  addedFat: number;
  addedSalt: number;
  batchSize: number;
};
const props = defineProps({
  ingredients: Array<any>,
  baseIngredients: Array<string>,
  hideHeader: Boolean,
  batchSize: Number,
  servingSize: Number,
  recipeId: Number,
  formalizationLoading: Boolean,
  addedInfo: Object as PropType<AddedInfo>,
  price: Number,
  metaPills: Array<any>,
  markedIngredients: Array<number>,
});
const root = ref(null);

defineExpose({
  root,
});

const getAdded = (added: number) => {
  return Math.round(
    ((servingSize.value ?? 1) * added) / (props.batchSize ?? 1)
  );
};

const backgroundClass = (ingredient: any) => {
  const isMarked = props.markedIngredients?.includes(ingredient.id);
  if (quickEditMode.value) {
    return 'bg-primary/5';
  }
  if (isMarked) {
    return 'bg-primary/10';
  }
  return '';
}

const emit = defineEmits([
  'update:servingSize',
  'quick-edit-change',
  'amounts-changed',
  'tweak-drag-end',
]);

const { track } = useEngagement();

// Use computed for two-way binding with parent component
const servingSize = computed({
  get: () => props.servingSize,
  set: (value) => emit('update:servingSize', value),
});

const groupedIngredients = computed(() => {
  const categorized: Record<string, any[]> = {};
  for (const ingredient of props.ingredients || []) {
    const category = ingredient.category;

    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(ingredient);
  }

  return categorized;
});

const servingMode = ref(!props.batchSize);
const notOnDefaultUnits = computed(() => {
  return props.ingredients?.some(
    (ingredient: any) => ingredient.currentUnit !== 0
  );
});

function onClickIngredient(ingredient: any) {
  if (ingredient.currentUnit == ingredient.amountInfo.length - 1) {
    ingredient.currentUnit = 0;
  } else {
    ingredient.currentUnit += 1;
  }
}

function copyIngredients() {
  track(props.recipeId, 'copy');
  navigator.clipboard.writeText(
    getStringFromIngredients(props.ingredients, servingSize.value ?? 1)
  );
}

function resetUnits() {
  for (const ingredient of props.ingredients || []) {
    ingredient.currentUnit = 0;
  }
}

// Quick-edit (drag amounts) state
const quickEditMode = ref(false);
const draggingIngredientId = ref<number | null>(null);
// Per-ingredient baseline (displayed per-serving amount captured on first tweak entry).
// Fill bar renders 50% at baseline and clamps at 2x baseline (so 2x = 100% fill, 0 = empty).
const baselinesById = ref<Map<number, number>>(new Map());
type DragState = {
  startX: number;
  startY: number;
  startAmount: number;
  unit: string;
  captured: boolean;
  horizontal: boolean;
};
const dragState = ref<DragState | null>(null);

function captureBaselines() {
  if (baselinesById.value.size > 0) return;
  const next = new Map<number, number>();
  for (const ing of props.ingredients ?? []) {
    const info = ing?.amountInfo?.[ing?.currentUnit];
    if (info) next.set(ing.id, Number(info[0]) || 0);
  }
  baselinesById.value = next;
}

function toggleQuickEdit() {
  quickEditMode.value = !quickEditMode.value;
  if (quickEditMode.value) captureBaselines();
  emit('quick-edit-change', quickEditMode.value);
}

function isFreeUnit(ingredient: any): boolean {
  const info = ingredient?.amountInfo?.[ingredient?.currentUnit];
  return info?.[1] === 'FREE';
}

function fillPct(ingredient: any): number {
  const baseline = baselinesById.value.get(ingredient.id);
  if (baseline == null || baseline <= 0) return 50;
  const info = ingredient?.amountInfo?.[ingredient?.currentUnit];
  if (!info) return 50;
  const current = Number(info[0]) || 0;
  return Math.min(100, Math.max(0, (current / (2 * baseline)) * 100));
}

function onTweakPointerDown(ev: PointerEvent, ingredient: any) {
  const info = ingredient?.amountInfo?.[ingredient?.currentUnit];
  if (!info) return;
  const perServing = info[0];
  const unit = info[1];
  if (unit === 'FREE') return;
  // We display amount * servingSize, so dragging should act on the displayed amount
  const displayedAmount = perServing * (servingSize.value ?? 1);
  dragState.value = {
    startX: ev.clientX,
    startY: ev.clientY,
    startAmount: displayedAmount,
    unit,
    captured: false,
    horizontal: false,
  };
  draggingIngredientId.value = ingredient.id;
}

function onTweakPointerMove(ev: PointerEvent, ingredient: any) {
  const s = dragState.value;
  if (!s) return;
  const dx = ev.clientX - s.startX;
  const dy = ev.clientY - s.startY;

  if (!s.captured) {
    // Wait until the user has moved enough to classify intent
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 4 && absY < 4) return;
    if (absX <= absY) {
      // Vertical scroll - abandon drag
      dragState.value = null;
      draggingIngredientId.value = null;
      return;
    }
    s.captured = true;
    s.horizontal = true;
    try {
      (ev.target as Element)?.setPointerCapture?.(ev.pointerId);
    } catch { }
  }

  ev.preventDefault();
  const newDisplayed = computeDraggedAmount(s.startAmount, s.unit, dx);
  const perServing = newDisplayed / (servingSize.value ?? 1);
  const info = ingredient.amountInfo[ingredient.currentUnit];
  if (info[0] !== perServing) {
    ingredient.amountInfo[ingredient.currentUnit] = [perServing, s.unit];
    emit('amounts-changed');
  }
}

function onTweakPointerUp(ev: PointerEvent, ingredient: any) {
  const s = dragState.value;
  if (!s) {
    draggingIngredientId.value = null;
    return;
  }
  try {
    (ev.target as Element)?.releasePointerCapture?.(ev.pointerId);
  } catch { }
  const didDrag = s.captured;
  dragState.value = null;
  draggingIngredientId.value = null;
  if (didDrag) {
    emit('tweak-drag-end');
  }
}

</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.12s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-5px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(5px);
}

.checkbox-no-border {
  -webkit-appearance: checkbox;
  appearance: auto;
  background-color: white !important;
  border: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  accent-color: var(--color-primary) !important;
  /* optional */
}

.checkbox-no-border::-moz-focus-inner {
  border: 0 !important;
}
</style>
