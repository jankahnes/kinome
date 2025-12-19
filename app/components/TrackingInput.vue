<template>
  <div class="w-full flex flex-col gap-2">
    <!-- Scanner Modal -->
    <Teleport to="body">
      <BarcodeScanner
        v-if="showScanner"
        @detected="handleBarcodeDetected"
        @close="showScanner = false"
      />
    </Teleport>

    <!-- Branded Food Completion Modal -->
    <BlocksResponsiveModal v-model="showCompletionModal" responsive>
      <BrandedFoodCompletionModal
        :barcode="currentBarcode"
        :branded-food="modelValue.brandedFood"
        :state="completionModalState"
        @close="showCompletionModal = false"
        @saved="handleBrandedFoodSaved"
      />
    </BlocksResponsiveModal>

    <!-- Editing mode -->
    <div
      v-show="isEditing"
      class="relative flex items-center gap-2 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-gray-300 transition-colors"
    >
      <input
        ref="inputRef"
        v-model="modelValue.rawText"
        @blur="handleLeave()"
        @input="handleInput"
        @keydown.enter="handleEnter"
        class="flex-1 focus:outline-none text-lg"
        :placeholder="placeholder"
      />
      <button
        @mousedown.prevent
        @click="showScanner = true"
        class="text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
        type="button"
      >
        <IconScanBarcode class="w-5" />
      </button>
    </div>

    <!-- Display mode (not editing) -->
    <div
      v-if="!isEditing"
      class="rounded-2xl px-4 py-2 border border-transparent hover:border-gray-200 transition-colors flex gap-1 justify-between cursor-text"
      :class="{
        'cursor-pointer': !isLocked,
        'border-gray-300!': !modelValue.displayText,
      }"
      @click="isLocked ? null : handlePreviewClick()"
    >
      <span v-if="!modelValue.displayText" class="text-gray-500">{{
        placeholder
      }}</span>
      <div class="space-x-2 text-lg flex items-center">
        <img
          v-if="modelValue.foodData?.visual_category"
          :src="'/foods/' + modelValue.foodData.visual_category + '.webp'"
          class="w-6 h-5 inline-block object-contain"
        />
        <!-- Branded food state indicators inline -->
        <span
          v-if="
            modelValue.brandedFoodState === 'needs_basic_info' ||
            modelValue.brandedFoodState === 'needs_nutrition'
          "
          class="animate-pulse cursor-pointer"
          title="Click to complete product info"
          @click.stop="handleProductPartClick"
          >⚠️</span
        >
        <img
          v-else-if="modelValue.brandedFoodState === 'matching'"
          title="Matching to generic food..."
          src="/loading.png"
          class="w-4 h-4 inline-block"
          alt="Loading icon"
        />
        <span
          v-else-if="modelValue.brandedFoodState === 'error'"
          class="text-red-500"
          title="Error processing product"
          >❌</span
        >
        <span>{{ modelValue.displayText }}</span>
      </div>
      <button
        @click.stop="emit('deleteIngredient')"
        class="text-gray-500 hover:text-gray-700 transition-colors"
        :disabled="modelValue.brandedFoodState === 'matching'"
        :class="{
          'opacity-50 cursor-not-allowed':
            modelValue.brandedFoodState === 'matching',
        }"
      >
        <IconX class="w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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
const currentBarcode = ref('');
const completionModalState = ref<'needs_basic_info' | 'needs_nutrition'>(
  'needs_basic_info'
);

const needsUserAction = computed(() => {
  return (
    props.modelValue.brandedFoodState === 'needs_basic_info' ||
    props.modelValue.brandedFoodState === 'needs_nutrition'
  );
});

async function parse(force: boolean = false) {
  if (!props.modelValue || isLocked.value) return;
  if (!props.modelValue.rawText.trim()) {
    props.modelValue.displayText = '';
    return;
  }

  const result = await parseIngredientString(
    supabase,
    props.modelValue.rawText
  );

  // Update modelValue with parsed result
  Object.assign(props.modelValue, result);
}

async function handleInput(event: InputEvent) {
  await nextTick();
  parse();
}

async function handleLeave() {
  if (props.modelValue.displayText) {
    isEditing.value = false;
  }
  parse(true);
}

async function handleEnter() {
  await handleLeave();
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
      inputRef.value.setSelectionRange(
        productCodeMatch.index,
        productCodeMatch.index
      );
    }
  }
}

function moveCaretAfterSubstring(substring: string) {
  if (inputRef.value) {
    const position = props.modelValue.rawText
      .toLowerCase()
      .indexOf(substring.toLowerCase());
    if (position !== -1) {
      inputRef.value.focus();
      inputRef.value.setSelectionRange(
        position + substring.length,
        position + substring.length
      );
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

  // Check the state and handle accordingly
  const state = props.modelValue.brandedFoodState;

  if (state === 'needs_basic_info' || state === 'needs_nutrition') {
    // Lock input and show completion modal
    isEditing.value = false;
    isLocked.value = true;
    completionModalState.value = state;
    showCompletionModal.value = true;
  } else if (state === 'matching') {
    // Lock input and start background matching
    isEditing.value = false;
    isLocked.value = true;
    startBackgroundMatching(barcode);
  }
}

async function handleBrandedFoodSaved(brandedFood: BrandedFood) {
  // Update the local state
  props.modelValue.brandedFood = brandedFood;

  // Check requirements again
  const requirements = getBrandedFoodRequirements(brandedFood);

  if (!requirements.hasFullNutritionLabel) {
    // Still needs nutrition, keep modal open but change state
    completionModalState.value = 'needs_nutrition';
  } else {
    // Nutrition is complete, close modal and start matching
    showCompletionModal.value = false;
    props.modelValue.brandedFoodState = 'matching';

    // Re-parse to update the display
    await parse(true);

    // Start background matching
    startBackgroundMatching(currentBarcode.value);
  }
}

async function startBackgroundMatching(barcode: string) {
  try {
    props.modelValue.brandedFoodState = 'matching';

    // Call the match endpoint
    const result = await $fetch('/api/db/match-branded-food', {
      method: 'POST',
      body: { barcode },
    });

    if (result.status === 'ok') {
      // Update state to complete
      props.modelValue.brandedFoodState = 'complete';

      // Re-fetch the branded food to get the matched_food_name_id
      const updatedBrandedFood = await getBrandedFood(supabase, barcode);
      if (updatedBrandedFood) {
        props.modelValue.brandedFood = updatedBrandedFood;
      }

      // Re-parse to update
      await parse(true);

      // Unlock the input now that everything is complete
      isLocked.value = false;
    }
  } catch (error) {
    console.error('Error matching branded food:', error);
    props.modelValue.brandedFoodState = 'error';
  }
}

const setIsEditing = () => {
  isEditing.value = !props.modelValue.displayText;
};

onMounted(() => {
  setIsEditing();
});

defineExpose({
  focus: () => inputRef.value?.focus(),
  setIsEditing: () => setIsEditing(),
});
</script>
