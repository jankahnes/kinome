<template>
  <div class="w-full flex flex-col">
    <!-- Scanner Modal -->
    <Teleport to="body">
      <BarcodeScanner v-if="showScanner" @detected="handleBarcodeDetected" @close="showScanner = false" />
    </Teleport>

    <!-- Branded Food Completion Modal -->
    <BlocksResponsiveModal v-model="showCompletionModal">
      <BrandedFoodCompletionModal :barcode="currentBarcode" :branded-food="modelValue.brandedFood"
        :state="completionModalState" @close="showCompletionModal = false" @saved="handleBrandedFoodSaved" />
    </BlocksResponsiveModal>

    <!-- Food Info Panel -->
    <BlocksResponsiveInfo v-model="showFoodInfo">
      <div v-if="modelValue.foodData" class="p-6 flex flex-col gap-4 w-full md:w-80">
        <div class="flex gap-4 justify-between items-center">
          <div class="flex items-center gap-3">
            <img v-if="modelValue.foodData.visual_category"
              :src="'/foods/' + modelValue.foodData.visual_category + '.webp'"
              class="w-12 h-12 object-contain shrink-0" />
            <div>
              <div class="text-lg font-bold leading-tight">{{ modelValue.ingredientName }}</div>
              <div class="text-sm text-slate-400 mt-0.5">per 100g</div>
            </div>
          </div>
          <NuxtLink :to="`/foods/${modelValue.foodNameId}`" class="text-sm text-gray-300 hover:text-gray-400 transition-colors">
            <IconExternalLink class="w-6" />
          </NuxtLink>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="macro in foodInfoMacros" :key="macro.label" class="bg-secondary rounded-2xl p-3 text-center">
            <div class="text-xl font-bold leading-none">{{ macro.value }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ macro.label }}</div>
          </div>
        </div>
        <div v-if="modelValue.foodData.description" class="text-sm text-slate-400 mt-1">{{
          formatDescription(modelValue.foodData.description, modelValue.foodData, modelValue.ingredientName ?? '') }}
        </div>
        <div v-if="modelValue.foodData.nova" class="flex items-center gap-2 text-sm">
          <span class="font-semibold px-2 py-0.5 bg-secondary rounded-lg">NOVA {{ modelValue.foodData.nova }}</span>
          <span class="text-slate-500">{{ novaLabel }}</span>
        </div>
      </div>
    </BlocksResponsiveInfo>

    <!-- Variants Picker Modal -->
    <BlocksResponsiveModal v-model="showVariants">
      <div class="p-4 flex flex-col gap-1 min-w-[280px]">
        <div class="font-bold text-lg px-2 pb-2">Swap Ingredient</div>
        <button v-for="(variant, idx) in modelValue.foodVariants ?? []" :key="variant.id" type="button"
          class="flex items-center gap-3 p-3 rounded-2xl w-full text-left transition-colors"
          :class="idx === currentVariantIndex ? 'bg-secondary' : 'hover:bg-secondary/50'" @click="selectVariant(idx)">
          <img v-if="variant.food.visual_category" :src="'/foods/' + variant.food.visual_category + '.webp'"
            class="w-8 h-8 object-contain shrink-0" />
          <div v-else class="w-8 h-8 shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">{{ variant.name }}</div>
            <div class="text-sm text-slate-500">{{ Math.round(variant.food.kcal) }} kcal / 100g</div>
          </div>
          <IconCheck v-if="idx === currentVariantIndex" class="w-4 text-slate-400 shrink-0" />
        </button>
      </div>
    </BlocksResponsiveModal>

    <!-- Editing mode -->
    <div v-show="isEditing"
      class="relative flex items-center gap-2 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-gray-300 transition-colors">
      <!-- Input + ghost text wrapper -->
      <div class="relative flex-1 min-w-0">
        <!-- Ghost text layer (sits behind input) -->
        <div aria-hidden="true" class="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
          <span class="invisible whitespace-pre text-lg">{{ modelValue.rawText }}</span>
          <span v-if="ghostSuffix"
            class="text-gray-400 whitespace-pre text-lg pointer-events-auto cursor-text select-none"
            @mousedown.prevent="acceptGhost">{{ ghostSuffix }}</span>
        </div>
        <input ref="inputRef" v-model="modelValue.rawText" @blur="handleLeave()" @keydown.enter="handleEnter"
          @keydown.tab.prevent="acceptGhost"
          class="w-full focus:outline-none text-lg bg-transparent relative z-10 py-px" :placeholder="placeholder" />
      </div>
      <button @mousedown.prevent @click="showScanner = true"
        class="text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center shrink-0"
        type="button">
        <IconScanBarcode class="w-5" />
      </button>
    </div>
    <!-- Display mode -->
    <div v-if="!isEditing"
      class="rounded-2xl pl-4 pr-2 py-2 border border-transparent hover:border-gray-200 transition-colors" :class="{
        'cursor-pointer': !isLocked,
        'border-gray-300!': !modelValue.displayText,
      }" @click="isLocked ? null : handlePreviewClick()">
      <div v-if="!modelValue.displayText" class="text-lg py-px">{{ modelValue.rawText }}</div>
      <div class="flex gap-2 justify-between items-center" v-else>
        <div class="flex items-center gap-1.5 flex-1 min-w-0 text-lg flex-wrap">
          <!-- Branded food state indicators -->
          <span v-if="
            modelValue.brandedFoodState === 'needs_basic_info' ||
            modelValue.brandedFoodState === 'needs_nutrition'
          " class="animate-pulse cursor-pointer" title="Click to complete product info"
            @click.stop="handleProductPartClick">⚠️</span>
          <img v-else-if="modelValue.brandedFoodState === 'matching'" title="Matching to generic food..."
            src="/loading.png" class="w-4 h-4 inline-block" alt="Loading icon" />
          <span v-else-if="modelValue.brandedFoodState === 'error'" class="text-red-500"
            title="Error processing product">❌</span>

          <!-- Context (amount + unit) -->
          <span v-if="displayContext">{{ displayContext }}</span>

          <Transition name="input" appear>
            <!-- Food chip: tap to open food info -->
            <span v-if="modelValue.foodData && !isEditing"
              class="font-bold pl-2 bg-secondary rounded-xl inline-flex gap-1 items-center cursor-pointer hover:bg-secondary/50 transition-colors"
              :class="{ 'px-2': (modelValue.foodVariants?.length ?? 0) <= 1 }" @click.stop="showFoodInfo = true">
              <img v-if="modelValue.foodData.visual_category"
                :src="'/foods/' + modelValue.foodData.visual_category + '.webp'"
                class="w-5 h-5 object-contain shrink-0" />

              <!-- Swish-animated ingredient name -->
              <Transition name="swish" mode="out-in">
                <span :key="displayIngredientKey" class="leading-tight py-1">{{ displayIngredientName }}</span>
              </Transition>

              <!-- Swap button: tap = cycle, hold = open full list -->
              <button v-if="(modelValue.foodVariants?.length ?? 0) > 1" type="button"
                class="relative overflow-hidden rounded-md pl-2 pr-3 py-0.5 select-none self-stretch" @click.stop
                @pointerdown.stop.prevent="startHold" @pointerup.stop="endHold" @pointerleave.stop="cancelHoldNoAction"
                @pointercancel.stop="cancelHoldNoAction" @contextmenu.prevent
                title="Tap to swap · Hold for all options">
                <!-- Hold fill animation -->
                <div class="absolute inset-0 bg-slate-500 origin-left rounded-md" :style="holdFillStyle" />
                <IconArrowUpDown class="w-3 relative z-10" />
                <!-- Hold hint tooltip, anchored to the swap button -->
                <Transition name="tooltip-fade">
                  <span v-if="showHoldHint"
                    class="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg pointer-events-none z-20 shadow-md">
                    Hold for all options
                    <span
                      class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
                  </span>
                </Transition>
              </button>
            </span>
          </Transition>

          <!-- Extra text (preparation notes) -->
          <span v-if="modelValue.displayTextExtra" class="text-gray-500 text-base">, {{
            modelValue.displayTextExtra
          }}</span>
        </div>

        <!-- Right: measurement context + delete -->
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-gray-500 text-sm hidden sm:block" v-if="modelValue.foodData">{{ measurementContext
          }}</span>
          <button @click.stop="emit('deleteIngredient')" class="text-gray-500 hover:text-gray-700 transition-colors"
            :disabled="modelValue.brandedFoodState === 'matching'"
            :class="{ 'opacity-50 cursor-not-allowed': modelValue.brandedFoodState === 'matching' }">
            <IconX class="w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { extractIngredientQuery } from '~/utils/format/extractIngredientQuery';
import { formatDescription } from '~/utils/db/getters/getFoods';

const placeholders = [
  '100g of flour',
  '2 tbsp of olive oil',
  '1 cup of milk',
  '1 egg',
  '200g of sugar',
  '1 tsp of salt',
  '3 cloves of garlic',
  '250ml of water',
  '50g of butter',
  '1 tbsp of honey',
  '2 cups of rice',
  '150g of shredded cheese',
  '1 tsp of black pepper',
  '4 slices of bread',
  '1 tbsp of soy sauce',
  '300g of chicken breast',
  '1 cup of chopped onions',
  '2 tbsp of lemon juice',
  '1 handful of basil leaves',
];

const placeholder = computed(() => {
  return placeholders[Math.floor(Math.random() * placeholders.length)];
});

const props = defineProps<{
  modelValue: EditableTrackingItem;
}>();

const emit = defineEmits<{
  focusNext: [];
  deleteIngredient: [];
}>();

const supabase = useSupabaseClient<Database>();

const isEditing = ref(false);
const isLocked = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const showScanner = ref(false);
const showCompletionModal = ref(false);
const showFoodInfo = ref(false);
const showVariants = ref(false);
const currentBarcode = ref('');
const completionModalState = ref<'needs_basic_info' | 'needs_nutrition'>('needs_basic_info');

// Variant cycling state
const currentVariantIndex = ref(0);
const displayIngredientKey = ref(0);
const isHolding = ref(false);
const holdTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showHoldHint = ref(false);
const hasSeenHint = ref(false);

// Computed fallbacks for items loaded from DB without parsing
const displayContext = computed(() => {
  if (props.modelValue.displayTextContext !== undefined) return props.modelValue.displayTextContext;
  if (!props.modelValue.amount) return '';
  const unit = (props.modelValue.unit ?? '').toLowerCase();
  return `${props.modelValue.amount}${unit}`;
});

const displayIngredientName = computed(() =>
  props.modelValue.displayTextIngredient || props.modelValue.ingredientName || ''
);

const measurementContext = computed(() => {
  const grams = convertToGrams(
    props.modelValue.amount,
    props.modelValue.unit ?? '',
    props.modelValue.foodData?.density ?? 1,
    props.modelValue.foodData?.countable_units?.[props.modelValue.unit ?? ''] ?? 0,
  );
  const kcal = (props.modelValue.foodData?.kcal ?? 0) / 100 * grams;
  if (props.modelValue.unit === 'G') {
    return `${kcal.toFixed(0)} kcal`;
  }
  return `${grams.toFixed(0)}g · ${kcal.toFixed(0)} kcal`;
});

const holdFillStyle = computed(() =>
  isHolding.value
    ? { transform: 'scaleX(1)', transition: 'transform 400ms linear', opacity: '0.15' }
    : { transform: 'scaleX(0)', transition: 'none', opacity: '0' }
);

const roundValue = (value: number) => {
  if (value < 10) {
    return value.toFixed(1);
  }
  return Math.round(value);
}

const foodInfoMacros = computed(() => {
  const f = props.modelValue.foodData;
  if (!f) return [];
  return [
    { label: 'kcal', value: `${roundValue(f.kcal)}` },
    { label: 'protein', value: `${roundValue(f.protein)}g` },
    { label: 'fat', value: `${roundValue(f.fat)}g` },
    { label: 'carbs', value: `${roundValue((f as any).carbohydrates ?? 0)}g` },
    { label: 'fiber', value: `${roundValue(f.fiber)}g` },
    { label: 'salt', value: `${roundValue(f.salt)}g` },
  ];
});

const novaLabel = computed(() => {
  switch (props.modelValue.foodData?.nova) {
    case 1: return 'Unprocessed';
    case 2: return 'Culinary ingredient';
    case 3: return 'Processed food';
    case 4: return 'Ultra-processed';
    default: return '';
  }
});

// Hold interaction for swap button
function startHold() {
  isHolding.value = true;
  holdTimeout.value = setTimeout(() => {
    isHolding.value = false;
    if ((props.modelValue.foodVariants?.length ?? 0) > 1) {
      showVariants.value = true;
    }
  }, 400);
}

function endHold() {
  if (!isHolding.value) return;
  clearTimeout(holdTimeout.value!);
  isHolding.value = false;
  cycleVariant();
}

function cancelHoldNoAction() {
  if (!isHolding.value) return;
  clearTimeout(holdTimeout.value!);
  isHolding.value = false;
}

function cycleVariant() {
  const variants = props.modelValue.foodVariants;
  if (!variants || variants.length <= 1) return;

  const nextIndex = (currentVariantIndex.value + 1) % variants.length;
  applyVariant(nextIndex);

  // Show one-time hint about hold action
  if (!hasSeenHint.value) {
    showHoldHint.value = true;
    setTimeout(() => {
      showHoldHint.value = false;
      localStorage.setItem('seenVariantHint', '1');
      hasSeenHint.value = true;
    }, 3000);
  }
}

function selectVariant(idx: number) {
  applyVariant(idx);
  showVariants.value = false;
}

function applyVariant(idx: number) {
  const variants = props.modelValue.foodVariants;
  if (!variants?.[idx]) return;

  currentVariantIndex.value = idx;
  const variant = variants[idx];
  props.modelValue.foodNameId = variant.id;
  props.modelValue.ingredientName = variant.name;
  props.modelValue.foodData = variant.food;
  props.modelValue.displayTextIngredient = variant.name;
  displayIngredientKey.value++;
}

async function parse(force: boolean = false) {
  if (!props.modelValue) return;
  if (!props.modelValue.rawText.trim()) {
    props.modelValue.displayText = '';
    return;
  }

  const result = await parseIngredientString(supabase, props.modelValue.rawText);
  Object.assign(props.modelValue, result);
  currentVariantIndex.value = 0;
}

async function handleLeave() {
  if (props.modelValue.rawText.trim() === '') {
    return;
  }
  parse(true)
  isEditing.value = false;
}

async function handleEnter() {
  handleLeave();
  emit('focusNext');
}

async function handlePreviewClick(substring?: string) {
  if (isLocked.value) return;
  isEditing.value = true;
  await nextTick();
  inputRef.value?.focus();
  if (substring) {
    moveCaretAfterSubstring(substring);
  }
}

async function handleProductPartClick() {
  if (
    props.modelValue.brandedFoodState === 'needs_basic_info' ||
    props.modelValue.brandedFoodState === 'needs_nutrition'
  ) {
    completionModalState.value = props.modelValue.brandedFoodState;
    showCompletionModal.value = true;
  } else {
    if (isLocked.value) return;
    isEditing.value = true;
    await nextTick();
    inputRef.value?.focus();
    moveCaretToBeforeProductCode();
  }
}

function moveCaretToBeforeProductCode() {
  if (inputRef.value) {
    const productCodeMatch = props.modelValue.rawText.match(/\[(\d+)\]/);
    if (productCodeMatch && productCodeMatch.index !== undefined) {
      inputRef.value.setSelectionRange(productCodeMatch.index, productCodeMatch.index);
    }
  }
}

function moveCaretAfterSubstring(substring: string) {
  if (inputRef.value) {
    const position = props.modelValue.rawText.toLowerCase().indexOf(substring.toLowerCase());
    if (position !== -1) {
      inputRef.value.focus();
      inputRef.value.setSelectionRange(position + substring.length, position + substring.length);
    }
  }
}

async function handleBarcodeDetected(barcode: string) {
  showScanner.value = false;
  currentBarcode.value = barcode;

  const currentText = props.modelValue.rawText.trim();
  const prefix = currentText ? currentText + ' ' : '';
  props.modelValue.rawText = `${prefix}[${barcode}]`;

  await parse(true);

  if (!props.modelValue.amount) {
    moveCaretToBeforeProductCode();
  }

  const state = props.modelValue.brandedFoodState;
  if (state === 'needs_basic_info' || state === 'needs_nutrition') {
    isEditing.value = false;
    isLocked.value = true;
    completionModalState.value = state;
    showCompletionModal.value = true;
  } else if (state === 'matching') {
    isEditing.value = false;
    isLocked.value = true;
    startBackgroundMatching(barcode);
  }
}

async function handleBrandedFoodSaved(brandedFood: BrandedFood) {
  props.modelValue.brandedFood = brandedFood;

  const requirements = getBrandedFoodRequirements(brandedFood);
  if (!requirements.hasFullNutritionLabel) {
    completionModalState.value = 'needs_nutrition';
  } else {
    showCompletionModal.value = false;
    props.modelValue.brandedFoodState = 'matching';
    await parse(true);
    startBackgroundMatching(currentBarcode.value);
  }
}

async function startBackgroundMatching(barcode: string) {
  try {
    props.modelValue.brandedFoodState = 'matching';
    const result = await $fetch('/api/db/match-branded-food', {
      method: 'POST',
      body: { barcode },
    });

    if (result.status === 'ok') {
      props.modelValue.brandedFoodState = 'complete';
      const updatedBrandedFood = await getBrandedFood(supabase, barcode);
      if (updatedBrandedFood) {
        props.modelValue.brandedFood = updatedBrandedFood;
      }
      await parse(true);
      isLocked.value = false;
    }
  } catch (error) {
    console.error('Error matching branded food:', error);
    props.modelValue.brandedFoodState = 'error';
    isLocked.value = false;
  }
}

// Autocomplete ghost text
const ghostSuffix = ref('');
let autocompleteGen = 0;

function acceptGhost() {
  if (!ghostSuffix.value) return;
  props.modelValue.rawText += ghostSuffix.value;
  ghostSuffix.value = '';
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      const len = props.modelValue.rawText.length;
      inputRef.value.setSelectionRange(len, len);
    }
    parse();
  });
}

watch(
  () => props.modelValue.rawText,
  async (rawText) => {
    if (!isEditing.value) return;

    const { ingredientQuery } = extractIngredientQuery(rawText);

    if (ingredientQuery.length < 2) {
      ghostSuffix.value = '';
      return;
    }

    // Clear stale ghost immediately so it doesn't linger during the search
    ghostSuffix.value = '';
    const gen = ++autocompleteGen;

    const { data, error } = await supabase.rpc('search_foods', {
      query: ingredientQuery,
      max: 5,
    });

    if (gen !== autocompleteGen || error || !data?.length) return;

    // Only suggestions that prefix-extend what the user typed are useful as ghost text
    const lowerQuery = ingredientQuery.toLowerCase();
    const best = (data as { name: string; best_similarity: number }[])
      .filter((r) => r.name.toLowerCase().startsWith(lowerQuery))
      .sort((a, b) => b.best_similarity - a.best_similarity)[0];

    if (!best) return;

    ghostSuffix.value = best.name.slice(ingredientQuery.length);
  },
);

const setIsEditing = () => {
  isEditing.value = !props.modelValue.displayText;
};

onMounted(() => {
  setIsEditing();
  hasSeenHint.value = !!localStorage.getItem('seenVariantHint');
});

watch(() => props.modelValue.displayText, setIsEditing);

defineExpose({
  focus: () => inputRef.value?.focus(),
  setIsEditing: () => setIsEditing(),
});
</script>

<style scoped>
/* Current name exits upward, new name enters from below */
.swish-leave-to {
  transform: translateY(-6px);
  opacity: 0;
}

.swish-leave-active {
  transition: transform 100ms ease-in, opacity 100ms ease-in;
}

.swish-enter-from {
  transform: translateY(6px);
  opacity: 0;
}

.swish-enter-active {
  transition: transform 150ms ease-out, opacity 150ms ease-out;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

.input-enter-active,
.input-leave-active {
  transition: opacity 0.15s ease;
}

.input-enter-from,
.input-leave-to {
  opacity: 0;
}
</style>
