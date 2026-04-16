<template>
  <Teleport to="body">
    <!-- Backdrop (desktop only) -->
    <Transition name="cook-backdrop">
      <div v-if="isOpen" class="fixed inset-0 z-[299] hidden md:block backdrop-blur-sm bg-black/20" @click="close" />
    </Transition>

    <!-- Panel: full-screen on mobile, side panel on md+ -->
    <Transition name="cook-panel">
      <div v-if="isOpen" class="fixed inset-0 z-[300] bg-primary-10 flex flex-col overflow-hidden
               md:inset-auto md:top-0 md:right-0 md:bottom-0 md:w-[500px] md:rounded-l-3xl md:shadow-2xl">

        <!-- Header -->
        <div class="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
          <button @click="close"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/6 transition-colors shrink-0">
            <IconX class="w-5 h-5 text-gray-500" />
          </button>
          <div class="flex-1 text-center min-w-0">
            <p class="text-xs text-gray-400 leading-none mb-0.5 truncate">{{ headerSubtitle }}</p>
            <p class="text-sm font-bold leading-none text-gray-700">{{ headerTitle }}</p>
          </div>
          <div class="w-9 shrink-0" />
        </div>

        <!-- Progress segments (hidden during intro) -->
        <div v-if="steps.length && phase !== 'intro'" class="flex gap-1 px-5 pb-4 shrink-0">
          <div v-for="(_, i) in steps" :key="i" class="flex-1 h-1.5 rounded-full transition-all duration-300"
            :class="progressSegmentClass(i)" />
        </div>
        <!-- Spacer to keep layout when progress bar is hidden on intro -->
        <div v-else class="pb-4 shrink-0" />

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-hide">
          <Transition name="phase-forward" mode="out-in">

            <!-- ===== INTRO SCREEN ===== -->
            <div v-if="phase === 'intro'" key="intro" class="px-5 pb-6 flex flex-col gap-6">
              <!-- Hero -->
              <div class="text-center py-2 space-y-1">
                <h2 class="text-2xl font-bold tracking-tight text-gray-900">{{ title ?? 'Let\'s get ready' }}</h2>
                <div class="flex items-center justify-center gap-2">
                  <span v-if="totalTime"
                    class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    <IconClock class="w-3.5 h-3.5" />
                    ~{{ formatDuration(totalTime) }}
                  </span>
                  <span
                    class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    <IconChefHat class="w-3.5 h-3.5" />
                    {{ steps.length }} step{{ steps.length !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
              <!-- Equipment checklist -->
              <div v-if="equipment && equipment.length">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Equipment</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="eq in equipment" :key="eq" @click="toggleEquipment(eq)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all"
                    :class="checkedEquipment.has(eq)
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'">
                    <IconCheck v-if="checkedEquipment.has(eq)" class="w-3.5 h-3.5 text-green-500" />
                    {{ capitalize(eq) }}
                  </button>
                </div>
              </div>
              <!-- Ingredients checklist -->
              <div v-if="allIngredients.length">
                <div class="flex items-center justify-between mb-3">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingredients</p>
                  <p class="text-xs text-gray-400">
                    {{ checkedIngredients.size }}/{{ allIngredients.length }} ready
                  </p>
                </div>
                <div class="flex flex-col gap-2">
                  <button v-for="ing in allIngredients" :key="ing.id" @click="toggleIngredient(ing.id)"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-left transition-all select-none"
                    :class="checkedIngredients.has(ing.id)
                      ? 'border-green-200 bg-green-100'
                      : 'border-transparent bg-gray-100/70 hover:border-gray-200'">
                    <!-- Checkbox -->
                    <div
                      class="w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all duration-150"
                      :class="checkedIngredients.has(ing.id) ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'">
                      <IconCheck v-if="checkedIngredients.has(ing.id)" class="w-3 h-3 text-white" />
                    </div>
                    <!-- Food image -->
                    <img v-if="ing.visual_category" :src="`/foods/${ing.visual_category}.webp`" :alt="ing.name"
                      class="h-6 w-6 object-contain shrink-0" />
                    <span v-else class="text-base shrink-0 w-6 text-center leading-none">🥄</span>
                    <!-- Name + amount -->
                    <div class="flex items-baseline gap-1.5 min-w-0 flex-1">
                      <span class="text-sm font-semibold truncate"
                        :class="checkedIngredients.has(ing.id) ? 'text-green-800' : 'text-gray-800'">
                        {{ ing.name }}
                      </span>
                      <span class="text-xs shrink-0"
                        :class="checkedIngredients.has(ing.id) ? 'text-green-500' : 'text-gray-400'">
                        {{ ing.amountString }}
                      </span>
                    </div>
                    <!-- Prep note -->
                    <span v-if="ing.preparation_description"
                      class="text-xs italic text-gray-400 shrink-0 hidden sm:block truncate max-w-24">
                      {{ ing.preparation_description }}
                    </span>
                  </button>
                </div>
              </div>



              <div class="h-2" />
            </div>

            <!-- ===== COOKING STEPS ===== -->
            <div v-else-if="phase === 'cooking'" key="cooking" class="h-full">
              <Transition :name="stepTransitionName" mode="out-in">
                <div :key="currentStep" class="px-5 flex flex-col gap-4 justify-between h-full">
                  <div class="flex flex-col gap-2 mt-4">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex flex-col gap-2 items-start">
                        <h2 v-if="currentStepData?.title"
                          class="text-3xl font-bold tracking-tight text-gray-900 leading-none -mb-1">
                          {{ currentStepData.title }}
                        </h2>
                        <div v-if="currentStepData?.step_time"
                          class="bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <IconClock class="w-3.5 h-3.5 shrink-0" />
                          {{ formatDuration(currentStepData.step_time) }}
                        </div>
                      </div>
                      <!-- 
                      <img :key="playKey" :src="animationSrc" class="h-30 object-cover -mt-6 -mb-8" /> -->
                    </div>

                    <!-- Ingredients for this step -->
                    <div v-if="stepIngredients.length" class="">
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider my-2.5">
                        You'll need
                      </p>
                      <div class="flex gap-3 flex-wrap">
                        <div v-for="ing in stepIngredients" :key="ing.id"
                          class="flex items-center gap-1.5 bg-secondary rounded-4xl px-2 py-1 basis-auto">
                          <img v-if="ing.visual_category" :src="`/foods/${ing.visual_category}.webp`" :alt="ing.name"
                            class="h-5 object-contain" />
                          <span v-else class="text-2xl leading-none">🥄</span>
                          <p class="text-sm">
                            <strong>{{ ing.amountString }}</strong> {{ ing.name }}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="h-px bg-gray-200/70 my-4" />
                    <!-- Instruction text -->
                    <div class="">
                      <p class="text-lg leading-relaxed cook-instruction"
                        v-html="renderInstruction(currentStepData?.formatted_text ?? '')" />
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 pb-2">
                    <!-- Tip -->
                    <div v-if="currentStepData?.tip" class="p-4 border bg-primary-50 border-primary-400 rounded-3xl">
                      <p class="text-sm">
                        💡 {{ currentStepData.tip }}
                      </p>
                    </div>

                    <!-- Timer -->
                    <div v-if="timerTotal > 0" class="self-center bg-primary-10 rounded-3xl flex items-center gap-4">
                      <div class="relative w-24 h-24 flex items-center justify-center">
                        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" class="text-gray-200"
                            stroke-width="8" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" class="text-primary-500"
                            stroke-width="8" stroke-linecap="round" :stroke-dasharray="`${timerProgress * 263.9} 263.9`"
                            style="transition: stroke-dasharray 1s linear" />
                        </svg>
                        <div class="z-10 text-center">
                          <p class="text-xl font-mono font-bold tabular-nums text-gray-800 leading-none">
                            {{ timerDisplay }}
                          </p>
                          <p class="text-[10px] text-gray-400 leading-none">{{ timerRunning ? 'remaining' :
                            timerSeconds === 0 ? 'done!' : 'ready' }}</p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button @click="toggleTimer"
                          class="animated-button bg-primary-500 text-gray-900 px-6 py-2.5 font-semibold flex items-center gap-2 text-sm">
                          <IconPlay v-if="!timerRunning" class="w-4 h-4" />
                          <IconPause v-else class="w-4 h-4" />
                          {{ timerRunning ? 'Pause' : timerSeconds === 0 ? "Time's up!" : 'Start timer' }}
                        </button>
                        <button @click="resetTimer"
                          class="animated-button px-3 py-2.5 text-gray-600 bg-white border border-gray-200 flex items-center justify-center">
                          <IconRotateCcw class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- ===== OUTRO SCREEN ===== -->
            <div v-else key="outro" class="px-5 pb-6 flex flex-col gap-6">
              <!-- Celebration -->
              <div class="text-center pt-6 pb-2">
                <div class="text-5xl mb-3">🍽️</div>
                <h2 class="text-2xl font-bold tracking-tight">Enjoy your meal!</h2>
                <p class="text-gray-500 text-sm mt-1.5">
                  {{ title ?? 'Your dish' }} is ready to serve.
                </p>
              </div>

              <!-- Track meal -->
              <div v-if="recipeId" class="rounded-3xl p-4  transition-colors"
                :class="trackingAdded ? 'bg-green-50 border border-green-100' : ''">
                <div class="flex items-center gap-2 mb-1">
                  <IconNotebookPen class="w-4 h-4 shrink-0"
                    :class="trackingAdded ? 'text-green-600' : 'text-gray-500'" />
                  <h3 class="font-semibold text-sm" :class="trackingAdded ? 'text-green-800' : 'text-gray-700'">Log this
                    meal</h3>
                </div>
                <p class="text-sm mb-3" :class="trackingAdded ? 'text-green-600' : 'text-gray-400'"
                  v-if="!trackingAdded">
                  Add it to today's meal log.
                </p>
                <button v-if="!trackingAdded" @click="trackMeal" :disabled="trackingLoading"
                  class="animated-button w-full flex items-center justify-center gap-2 py-3 bg-primary-500 text-gray-900 font-semibold text-sm disabled:opacity-60">
                  <IconLoaderCircle v-if="trackingLoading" class="w-4 h-4 animate-spin" />
                  <IconPlus v-else class="w-4 h-4" />
                  {{ trackingLoading ? 'Saving...' : 'Add to today\'s tracking' }}
                </button>
                <div v-else class="flex items-center gap-2 py-2 text-green-700 text-lg">
                  <IconCheck class="w-4 h-4" />
                  Added to today's log!
                </div>
              </div>

              <!-- Photo upload -->
              <div class="rounded-3xl p-4" v-if="auth.user && props.recipeId">
                <div class="flex items-center gap-2 mb-1">
                  <IconCamera class="w-4 h-4" :class="photoShared ? 'text-green-600' : 'text-gray-500'" />
                  <h3 class="font-semibold text-sm" :class="photoShared ? 'text-green-800' : 'text-gray-700'">Snap a photo</h3>
                </div>
                <Transition name="phase-forward" mode="out-in">
                  <div v-if="photoShared" key="done" class="flex items-center gap-2 py-2 text-green-700 text-sm font-medium">
                    <IconCheck class="w-4 h-4" />
                    Photo shared!
                  </div>
                  <div v-else key="upload" class="flex flex-col gap-3">
                    <p class="text-sm text-gray-400">Show off your dish and save the memory.</p>
                    <div v-if="photoPreview" class="relative">
                      <img :src="photoPreview" class="w-full rounded-2xl object-cover max-h-48" />
                      <button
                        class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                        @click="clearPhoto">
                        <IconX class="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <div v-else class="flex gap-2">
                      <button
                        class="animated-button flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 text-sm"
                        @click="triggerPhotoFile">
                        <IconUpload class="w-4 h-4" />
                        Upload
                      </button>
                      <button
                        class="animated-button flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 text-sm"
                        @click="triggerPhotoCamera">
                        <IconCamera class="w-4 h-4" />
                        Camera
                      </button>
                    </div>
                    <button v-if="photoPreview"
                      class="animated-button w-full flex items-center justify-center gap-2 py-2.5 bg-primary-500 text-gray-900 font-semibold text-sm disabled:opacity-60"
                      @click="sharePhoto"
                      :disabled="photoUploading">
                      <IconLoaderCircle v-if="photoUploading" class="w-4 h-4 animate-spin" />
                      <IconCheck v-else class="w-4 h-4" />
                      {{ photoUploading ? 'Sharing…' : 'Share photo' }}
                    </button>
                  </div>
                </Transition>
              </div>

              <!-- Rating -->
              <div v-if="auth.user" class="rounded-3xl p-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-base leading-none">⭐</span>
                  <h3 class="font-semibold text-sm text-gray-700">Rate this recipe</h3>
                </div>
                <Transition name="phase-forward" mode="out-in">
                  <!-- Submitted state -->
                  <div v-if="reviewSubmitted" key="done"
                    class="flex items-center justify-center gap-2 py-2 text-primary-600 font-semibold text-sm">
                    <IconCheck class="w-4 h-4" />
                    Thanks for the feedback!
                  </div>
                  <!-- Input state -->
                  <div v-else key="input" class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                      <button v-for="star in 5" :key="star" @click="reviewRating = star"
                        class="transition-transform hover:scale-110 active:scale-90">
                        <svg viewBox="0 0 24 24" class="w-9 h-9 transition-all duration-150">
                          <polygon
                            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                            :fill="star <= reviewRating ? '#facc15' : '#e5e7eb'"
                            :stroke="star <= reviewRating ? '#f59e0b' : '#d1d5db'" stroke-width="1"
                            stroke-linejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <Transition name="phase-forward">
                      <div v-if="reviewRating > 0" class="flex flex-col gap-2">
                        <textarea v-model="reviewText" rows="2" placeholder="Any notes about this recipe? (optional)"
                          class="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm resize-none focus:outline-none focus:border-primary-400" />
                        <button @click="submitReview" :disabled="reviewLoading"
                          class="animated-button self-end flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-gray-900 font-semibold text-sm disabled:opacity-60">
                          <IconLoaderCircle v-if="reviewLoading" class="w-3.5 h-3.5 animate-spin" />
                          <IconCheck v-else class="w-3.5 h-3.5" />
                          Submit
                        </button>
                      </div>
                    </Transition>
                  </div>
                </Transition>
              </div>

              <div class="h-2" />
            </div>

          </Transition>
        </div>

        <!-- Navigation footer -->
        <div class="flex gap-3 px-4 py-4 border-t border-gray-100 shrink-0">
          <!-- Intro footer -->
          <template v-if="phase === 'intro'">
            <button @click="startCooking" :disabled="!steps.length"
              class="animated-button flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              <IconChefHat class="w-4 h-4" />
              Let's cook!
            </button>
          </template>

          <!-- Cooking footer -->
          <template v-else-if="phase === 'cooking'">
            <button @click="prevStep"
              class="animated-button flex-1 flex items-center justify-center gap-1.5 py-3.5 border border-gray-200 text-gray-700 font-semibold text-sm">
              <IconChevronLeft class="w-4 h-4" />
              {{ currentStep === 0 ? 'Back' : 'Previous' }}
            </button>
            <button v-if="currentStep < steps.length - 1" @click="nextStep"
              class="animated-button flex-2 flex items-center justify-center gap-1.5 py-3.5 bg-primary-500 text-gray-900 font-semibold text-sm">
              Next step
              <IconChevronRight class="w-4 h-4" />
            </button>
            <button v-else @click="finishCooking"
              class="animated-button flex-2 flex items-center justify-center gap-1.5 py-3.5 bg-green-500 text-white font-semibold text-sm">
              <IconCheck class="w-4 h-4" />
              Done cooking!
            </button>
          </template>

          <!-- Outro footer -->
          <template v-else>
            <button @click="close"
              class="animated-button flex-1 flex items-center justify-center gap-2 py-3.5 border border-gray-200 text-gray-700 font-semibold text-sm">
              <IconArrowLeft class="w-4 h-4" />
              Back to recipe
            </button>
          </template>
        </div>

      </div>
    </Transition>
  </Teleport>

  <input ref="photoFileInput" type="file" accept="image/*" class="hidden" @change="handlePhotoSelected" />
  <input ref="photoCameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="handlePhotoSelected" />
</template>

<script setup lang="ts">
import { getStringFromAmountInfo } from '~/utils/format/getStringFromAmountInfo';

const props = defineProps<{
  modelValue: boolean;
  steps: CookStep[];
  ingredients?: Ingredient[];
  title?: string;
  servingSize?: number;
  recipeId?: number;
  totalTime?: number;
  equipment?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const supabase = useSupabaseClient();
const auth = useAuthStore();
const recipeStore = useRecipeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// --- Phase management ---
const phase = ref<'intro' | 'cooking' | 'outro'>('intro');

function startCooking() {
  phase.value = 'cooking';
}

function finishCooking() {
  phase.value = 'outro';
}

// --- Step navigation ---
const currentStep = ref(0);
const stepDirection = ref(1);

const stepTransitionName = computed(() =>
  stepDirection.value >= 0 ? 'step-forward' : 'step-backward'
);

const currentStepData = computed(() => props.steps[currentStep.value]);

function nextStep() {
  if (currentStep.value < props.steps.length - 1) {
    stepDirection.value = 1;
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    stepDirection.value = -1;
    currentStep.value--;
  } else {
    // Back to intro from first step
    phase.value = 'intro';
  }
}

function close() {
  isOpen.value = false;
}

// --- Intro checklist ---
const checkedIngredients = ref(new Set<number>());
const checkedEquipment = ref(new Set<string>());

function toggleIngredient(id: number) {
  const next = new Set(checkedIngredients.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  checkedIngredients.value = next;
}

function toggleEquipment(name: string) {
  const next = new Set(checkedEquipment.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  checkedEquipment.value = next;
}

// --- Tracking (in-place, no redirect) ---
const { addMealFromRecipe, loadMeals, saveMeals, hasUnsavedChanges, selectedDate } =
  useMealTracking();
const trackingAdded = ref(false);
const trackingLoading = ref(false);

async function trackMeal() {
  if (!props.recipeId) return;
  trackingLoading.value = true;
  try {
    // Load existing meals first so saveMeals doesn't wipe them (it does a full replace)
    const today = new Date();
    selectedDate.value = today;
    await loadMeals(today);
    await addMealFromRecipe(props.recipeId);
    hasUnsavedChanges.value = true;
    await saveMeals();
    trackingAdded.value = true;
  } catch (e) {
    console.error('Failed to track meal:', e);
  } finally {
    trackingLoading.value = false;
  }
}

// --- Rating & review ---
const reviewRating = ref(0);
const reviewText = ref('');
const reviewSubmitted = ref(false);
const reviewLoading = ref(false);

async function submitReview() {
  if (!props.recipeId || !auth.user || reviewRating.value === 0) return;
  reviewLoading.value = true;
  try {
    await upsertRating(supabase, reviewRating.value, auth.user.id, props.recipeId);
    recipeStore.updateRating(reviewRating.value, auth.user.id);
    if (reviewText.value.trim()) {
      await recipeStore.addNewComment({
        user: auth.user as any,
        user_id: auth.user.id,
        content: reviewText.value.trim(),
        recipe_id: props.recipeId,
        replying_to: null,
        rating: reviewRating.value,
      });
    }
    reviewSubmitted.value = true;
  } catch (e) {
    console.error('Failed to submit review:', e);
  } finally {
    reviewLoading.value = false;
  }
}

// --- Snap a photo ---
const photoFileInput = ref<HTMLInputElement | null>(null);
const photoCameraInput = ref<HTMLInputElement | null>(null);
const photoPreview = ref<string | null>(null);
const photoUploading = ref(false);
const photoShared = ref(false);

const triggerPhotoFile = () => photoFileInput.value?.click();
const triggerPhotoCamera = () => photoCameraInput.value?.click();

function clearPhoto() {
  photoPreview.value = null;
  if (photoFileInput.value) photoFileInput.value.value = '';
  if (photoCameraInput.value) photoCameraInput.value.value = '';
}

function handlePhotoSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  photoPreview.value = URL.createObjectURL(file);
}

async function sharePhoto() {
  const file = photoFileInput.value?.files?.[0] ?? photoCameraInput.value?.files?.[0];
  if (!file || !props.recipeId || !auth.user) return;
  photoUploading.value = true;
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('bucket', 'recipe_user_pictures');
    formData.append('id', `${(auth.user as any).id}-${Date.now()}`);
    const result = await $fetch('/api/db/upload-image', { method: 'POST', body: formData });
    await recipeStore.addNewComment({
      user: auth.user as any,
      user_id: (auth.user as any).id,
      content: '',
      recipe_id: props.recipeId,
      replying_to: null,
      rating: null,
      picture: (result as any).publicUrl,
    } as any);
    photoShared.value = true;
  } catch (e) {
    console.error('Failed to share photo:', e);
  } finally {
    photoUploading.value = false;
  }
}

// --- Open/close reset ---
watch(isOpen, (val) => {
  if (val) {
    phase.value = 'intro';
    currentStep.value = 0;
    stepDirection.value = 1;
    playKey.value++;
    animationSrc.value = `/cooking-animations/jug-blender.webp?t=${Date.now()}`;
    checkedIngredients.value = new Set();
    checkedEquipment.value = new Set();
    trackingAdded.value = false;
    trackingLoading.value = false;
    reviewRating.value = 0;
    reviewText.value = '';
    reviewSubmitted.value = false;
    reviewLoading.value = false;
    photoPreview.value = null;
    photoShared.value = false;
    photoUploading.value = false;
  }
});

// --- Header ---
const headerSubtitle = computed(() => {
  return props.title ?? 'Cook Mode';
});

const headerTitle = computed(() => {
  if (phase.value === 'intro') return 'Get ready';
  if (phase.value === 'outro') return 'All done! 🎉';
  return `Step ${currentStep.value + 1} of ${props.steps.length}`;
});

// --- Progress bar ---
function progressSegmentClass(i: number): string {
  if (phase.value === 'outro') return 'bg-green-400';
  return i <= currentStep.value ? 'bg-primary-500' : 'bg-gray-200';
}

// --- All ingredients (for intro screen) ---
const allIngredients = computed(() => {
  if (!props.ingredients) return [];
  return props.ingredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    visual_category: ing.visual_category,
    preparation_description: ing.preparation_description,
    amountString: (() => {
      const info = ing.amountInfo?.[ing.currentUnit];
      return info ? getStringFromAmountInfo(info, props.servingSize ?? 1) : '';
    })(),
  }));
});


// --- Step ingredients ---
function extractIngredientIds(text: string): number[] {
  const ids = [...text.matchAll(/\[[^\]]+\]\((\d+)\)/g)].map((m) =>
    parseInt(m[1]!, 10)
  );
  return [...new Set(ids)];
}

const stepIngredients = computed(() => {
  if (!props.ingredients || !currentStepData.value?.formatted_text) return [];
  const ids = extractIngredientIds(currentStepData.value.formatted_text);
  return ids
    .map((id) => props.ingredients!.find((ing) => ing.id === id))
    .filter((ing): ing is Ingredient => !!ing)
    .map((ing) => ({
      id: ing.id,
      name: ing.name,
      visual_category: ing.visual_category,
      preparation_description: ing.preparation_description,
      amountString: (() => {
        const info = ing.amountInfo?.[ing.currentUnit];
        return info ? getStringFromAmountInfo(info, props.servingSize ?? 1) : '';
      })(),
    }));
});

// --- Instruction rendering ---
function renderInstruction(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  const bolded = escaped.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  return bolded.replace(
    /\[([^\]]+)\]\((\d+)\)/g,
    (_, name) => `<span class="cook-ingredient-chip">${name}</span>`
  );
}

// --- Animation ---
const animationSrc = ref('/cooking-animations/jug-blender.webp');
const playKey = ref(0);

watch(currentStep, () => {
  pauseTimer();
  timerSeconds.value = timerTotal.value;
  playKey.value++;
  animationSrc.value = `/cooking-animations/jug-blender.webp?t=${Date.now()}`;
});

// --- Timer ---
const timerTotal = computed(() => {
  const mins = currentStepData.value?.timers?.[0];
  return mins ? mins * 60 : 0;
});

const timerSeconds = ref(0);
const timerRunning = ref(false);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const timerDisplay = computed(() => {
  const m = Math.floor(timerSeconds.value / 60);
  const s = timerSeconds.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

const timerProgress = computed(() =>
  timerTotal.value > 0 ? timerSeconds.value / timerTotal.value : 0
);

function pauseTimer() {
  timerRunning.value = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  if (timerInterval || timerSeconds.value === 0) return;
  timerRunning.value = true;
  timerInterval = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--;
    } else {
      pauseTimer();
    }
  }, 1000);
}

function toggleTimer() {
  if (timerRunning.value) pauseTimer();
  else startTimer();
}

function resetTimer() {
  pauseTimer();
  timerSeconds.value = timerTotal.value;
}

onMounted(() => {
  timerSeconds.value = timerTotal.value;
});

// --- Wake Lock ---
let wakeLock: any = null;

async function requestWakeLock() {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLock = await (navigator as any).wakeLock.request('screen');
    } catch {
      // Not critical
    }
  }
}

async function releaseWakeLock() {
  if (wakeLock) {
    try { await wakeLock.release(); } catch { /* ignore */ }
    wakeLock = null;
  }
}

watch(isOpen, async (val) => {
  if (val) await requestWakeLock();
  else await releaseWakeLock();
});

onUnmounted(() => {
  pauseTimer();
  releaseWakeLock();
});

// --- Helpers ---
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}
</script>

<style scoped>
/* Panel: slide up on mobile, slide from right on desktop */
.cook-panel-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.cook-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.cook-panel-enter-from,
.cook-panel-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {

  .cook-panel-enter-from,
  .cook-panel-leave-to {
    transform: translateX(100%);
  }
}

/* Backdrop */
.cook-backdrop-enter-active,
.cook-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.cook-backdrop-enter-from,
.cook-backdrop-leave-to {
  opacity: 0;
}

/* Phase transition */
.phase-forward-enter-active,
.phase-forward-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.phase-forward-enter-from {
  transform: translateX(24px);
  opacity: 0;
}

.phase-forward-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

/* Step forward (next) */
.step-forward-enter-active,
.step-forward-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.step-forward-enter-from {
  transform: translateX(32px);
  opacity: 0;
}

.step-forward-leave-to {
  transform: translateX(-32px);
  opacity: 0;
}

/* Step backward (prev) */
.step-backward-enter-active,
.step-backward-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.step-backward-enter-from {
  transform: translateX(-32px);
  opacity: 0;
}

.step-backward-leave-to {
  transform: translateX(32px);
  opacity: 0;
}

/* Ingredient chips inside v-html */
:deep(.cook-ingredient-chip) {
  display: inline;
  background-color: var(--color-secondary);
  padding: 1px 6px;
  border-radius: 16px;
  font-weight: 500;
}
</style>
