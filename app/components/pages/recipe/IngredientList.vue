<template>
  <div class="space-y-2" ref="root">
    <h2 class="text-4xl font-bold tracking-tighter ml-2" v-if="!hideHeader">
      Ingredients
    </h2>

    <div class="main-card main-card-padding flex flex-col relative gap-2"
      :class="{ '!bg-primary-20/80 overflow-hidden': formalizationLoading }">
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
        <div class="flex items-center gap-2">
          <button class="animated-button flex items-center gap-2 px-3 py-1 text-xs" @click="copyIngredients">
            <IconCopy class="w-4" />
            Copy
          </button>
          <transition name="fade-slide" mode="out-in">
            <button v-if="notOnDefaultUnits"
              class="animated-button flex items-center gap-2 px-2 py-1 text-xs will-change-transform"
              @click="resetUnits">
              <IconRefreshCcw class="w-4" />
              <span>Reset Units</span>
            </button>
          </transition>
        </div>
      </div>

      <div class="flex-1">
        <div class="max-w-100 space-y-4 select-none" v-if="ingredients && ingredients.length > 0">
          <template v-for="(group, category) in groupedIngredients" :key="category">
            <div v-if="category !== 'uncategorized' && group.length > 0">
              <h3 class="text-lg font-semibold text-gray-800 border-b-2 border-secondary">
                {{ category }}
              </h3>
            </div>

            <ul class="flex flex-col gap-4 items-start" role="list">
              <li v-for="ingredient in group" :key="ingredient.name"
                class="flex items-center rounded-2xl px-2 py-1 transition-colors duration-200 gap-2"
                :class="backgroundClass(ingredient)" @click="toggleIfNotLongPress(ingredient.name)">
                <img class="h-5 min-w-7 object-contain object-center" :src="`/foods/${ingredient.visual_category}.webp`"
                  v-if="ingredient.visual_category" />
                <span class="leading-none">
                  <Transition name="fade-slide" mode="out-in">
                    <span :key="`${servingSize}-${ingredient?.currentUnit}`"
                      class="tabular-nums whitespace-nowrap font-bold cursor-pointer"
                      @pointerdown="startLongPress(() => onClickIngredient(ingredient))" @pointerup="cancelLongPress"
                      @pointerleave="cancelLongPress" @pointercancel="cancelLongPress">
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
                  <span class="cursor-pointer"
                    @pointerdown="startLongPress(() => navigateTo(getFoodUrl(ingredient.id, getIngredientName(ingredient))))"
                    @pointerup="cancelLongPress" @pointerleave="cancelLongPress" @pointercancel="cancelLongPress">
                    <span class="font-medium">{{
                      ' ' + getIngredientName(ingredient)
                    }}</span>
                    <span v-if="ingredient.preparation_description" class="font-light text-gray-600 text-sm mt-1">, {{
                      ingredient.preparation_description }}
                    </span>
                  </span>
                  <span v-if="false" class="font-light text-gray-600 text-sm mt-1">, {{ ingredient?.consumption_factor * 100
                    }}% eaten</span>
                </span>
              </li>
            </ul>
          </template>
          <div class="flex gap-4 items-center flex-wrap pt-2" v-if="
            (addedInfo?.addedFat && getAdded(addedInfo?.addedFat) >= 1) ||
            (addedInfo?.addedSalt && getAdded(addedInfo?.addedSalt) >= 0.75)
          ">
            <div class="flex items-center rounded-xl" v-if="addedInfo?.addedFat && getAdded(addedInfo?.addedFat) >= 1">
              <span class="text-sm">🧈</span>
              <span class="text-xs font-medium">Plus ~{{ getAdded(addedInfo?.addedFat) }}g of
                fat</span>
            </div>
            <div class="flex items-center rounded-xl" v-if="
              addedInfo?.addedSalt && getAdded(addedInfo?.addedSalt) >= 0.75
            ">
              <span class="text-sm">🧂</span>
              <span class="text-xs font-medium">
                Plus ~{{ getAdded(addedInfo?.addedSalt) }}g of
                salt</span>
            </div>
          </div>
          <div v-if="checkedIngredients.size > 0" class="w-full h-px bg-gray-200 my-6"></div>
          <!--
          <div class="flex items-center gap-2">
            <span class="ml-2">= ~<strong>{{ formatMoney(price) }}</strong> per Serving</span>
          </div>-->
          <Transition name="fade-slide" mode="out-in">
            <button v-if="checkedIngredients.size > 0"
              class="animated-button flex items-center gap-2 px-4 py-1 font-medium !bg-primary !text-white will-change-transform"
              @click="addToShoppingList">
              <IconShoppingCart class="w-5 h-5" />
              Add to Shopping List
            </button>
          </Transition>
          <!--

          <div class="flex flex-wrap gap-2 mt-2">
            <div v-for="pill in metaPills" :key="pill.text" :class="pill.class"
              class="flex items-center gap-2 rounded-4xl px-2 py-0.5 text-xs justify-center">
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
        class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent p-4 pointer-events-none"
        v-if="formalizationLoading" />
      <div class="hidden bg-secondary-700/50 bg-secondary-700/70" />
    </div>
  </div>
</template>

<script setup lang="ts">
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
  const isChecked = checkedIngredients.value.has(ingredient.name);
  const isMarked = props.markedIngredients?.includes(ingredient.id);
  if (isChecked && isMarked) {
    return 'bg-secondary-700';
  }
  if (isChecked) {
    return 'bg-secondary-700/70';
  }
  if (isMarked) {
    return 'bg-secondary-700/50';
  }
  return 'bg-secondary/70 hover:bg-secondary';
}

const emit = defineEmits(['update:servingSize']);

const authStore = useAuthStore();

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
const checkedIngredients = ref<Set<string>>(new Set());
const notOnDefaultUnits = computed(() => {
  return props.ingredients?.some(
    (ingredient: any) => ingredient.currentUnit !== 0
  );
});

function getIngredientName(ingredient: any) {
  if (!ingredient?.amountInfo || !ingredient?.amountInfo.length) {
    return ingredient.name;
  }
  const amountInfo = ingredient?.amountInfo?.[ingredient?.currentUnit];
  if (
    isCountable(amountInfo[1]) &&
    amountInfo[0] * (servingSize.value ?? 1) > 1 &&
    !unitIsNoun(amountInfo[1])
  ) {
    return pluralizeWord(ingredient.name);
  }
  return ingredient.name;
}

const longPressActive = ref(false);
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

function startLongPress(callback: () => void, duration = 500) {
  longPressActive.value = false;
  longPressTimer = setTimeout(() => {
    longPressActive.value = true;
    callback();
  }, duration);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function toggleIfNotLongPress(ingredientName: string) {
  if (longPressActive.value) {
    longPressActive.value = false;
    return;
  }
  toggleIngredientChecked(ingredientName);
}

function toggleIngredientChecked(ingredientName: string) {
  if (checkedIngredients.value.has(ingredientName)) {
    checkedIngredients.value.delete(ingredientName);
  } else {
    checkedIngredients.value.add(ingredientName);
  }
}

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

async function addToShoppingList() {
  if (!props.recipeId) return;

  if (checkedIngredients.value.size > 0 && props.ingredients) {
    const ingredients = props.ingredients.filter((ingredient: any) =>
      checkedIngredients.value.has(ingredient.name)
    );
    checkedIngredients.value.clear();
    await authStore.addToShoppingList(
      ingredients,
      props.recipeId,
      props.servingSize ?? 1
    );
    track(props.recipeId, 'shopping_list');
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
