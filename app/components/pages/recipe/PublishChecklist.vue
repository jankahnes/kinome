<template>
  <div class="main-card main-card-padding main-card-rounded flex flex-col gap-4 items-start">

    <!-- Public state -->
    <div v-if="recipe.visibility === 'PUBLIC'" class="w-full flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <IconCheck class="w-5 text-green-600" />
        </div>
        <div>
          <p class="font-semibold text-base leading-tight">This recipe is public</p>
          <p class="text-xs text-gray-500">Discoverable in search and recommendations</p>
        </div>
      </div>
      <div class="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
        <IconChartLine class="w-4 text-gray-400 shrink-0" />
        <span class="text-sm text-gray-600 flex-1">Relevancy score</span>
        <div class="flex items-center gap-2">
          <div class="progress-ring" :style="{ '--progress': recipe.relevancy + '%' }">
            <div class="inner text-[10px] font-medium">{{ recipe.relevancy }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enrichment grid: PUBLISH_PENDING stuck (> 5 min) or UNLISTED non-user-created -->
    <div v-else-if="showEnrichmentGrid" class="w-full flex flex-col gap-3">
      <div>
        <p class="text-lg leading-none font-medium">This recipe is unlisted.</p>
        <p class="text-xs text-gray-500 mt-1">Full processing needed to set public</p>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="step in enrichmentSteps" :key="step.key"
          class="rounded-xl border p-3 flex flex-col gap-1.5 transition-all"
          :class="step.done ? 'border-green-200 bg-green-50/40' : 'border-dashed border-gray-200'">
          <div class="flex items-center gap-1.5">
            <IconCheck class="w-3.5 text-green-500 shrink-0" v-if="step.done" />
            <IconClock class="w-3.5 text-gray-300 shrink-0" v-else />
            <span class="text-xs font-medium truncate">{{ step.label }}</span>
          </div>
          <p class="text-[10px] text-gray-400 leading-snug">{{ step.description }}</p>
        </div>
      </div>
      <button
        class="button px-2 py-1 flex gap-1.5 items-center text-gray-500 outline-1 outline-gray-200 text-xs self-start"
        @click="rerunEnrichment" :disabled="rerunLoading">
        <IconLoader class="w-3 animate-spin" v-if="rerunLoading" />
        <IconRefreshCcw class="w-3" v-else />
        <span>{{ rerunLoading ? 'Queuing…' : 'Process & set public' }}</span>
      </button>
    </div>

    <!-- Generic loading: PUBLISH_PENDING not yet stuck -->
    <div v-else-if="(recipe as any).visibility === 'PUBLISH_PENDING'" class="w-full space-y-1.5">
      <div class="flex gap-2 items-center">
        <span class="text-lg font-medium">{{ pendingLoadingTitle }}</span>
      </div>
      <p class="text-sm text-gray-500">{{ pendingLoadingSubtext }}</p>
    </div>

    <!-- Unlisted / checklist state: user-created only -->
    <div v-else class="flex flex-col gap-3 w-full">
      <div>
        <p class="text-lg leading-none">Your recipe is unlisted.</p>
        <p class="text-xs text-gray-500 mt-1">Visible on your profile, but not in search or recommendations.</p>
      </div>

      <!-- Two-col requirement cards -->
      <div class="grid grid-cols-2 gap-2">

        <!-- Instructions card -->
        <div class="rounded-xl border p-4 flex flex-col gap-2 transition-all select-none"
          :class="publishingRequirements.hasInstructions
            ? 'border-green-200 bg-green-50/40'
            : 'border-dashed border-gray-300 bg-gray-50/50 cursor-pointer hover:bg-primary-5/60 hover:border-primary/40 active:scale-[0.98]'"
          @click="!publishingRequirements.hasInstructions && goToEditInstructions()">
          <div class="flex items-center gap-2">
            <IconCheck class="w-4 text-green-500 shrink-0" v-if="publishingRequirements.hasInstructions" />
            <IconList class="w-4 text-gray-400 shrink-0" v-else />
            <span class="font-medium text-sm">Instructions</span>
          </div>
          <p class="text-xs text-gray-400 leading-snug" v-if="!publishingRequirements.hasInstructions">
            How to cook this recipe
          </p>
          <p class="text-xs text-green-600" v-else>Ready</p>
          <div class="mt-0.5" v-if="!publishingRequirements.hasInstructions">
            <button class="button px-2 py-1 flex gap-1.5 items-center text-primary outline-1 outline-primary text-xs"
              @click.stop="generateInstructions" :disabled="generateInstructionsLoading">
              <IconLoader class="w-3 animate-spin" v-if="generateInstructionsLoading" />
              <IconSparkles class="w-3" v-else />
              <span>{{ generateInstructionsLoading ? 'Generating…' : 'Generate' }}</span>
            </button>
          </div>
        </div>

        <!-- Picture card -->
        <div class="rounded-xl border p-4 flex flex-col gap-2 transition-all select-none" :class="publishingRequirements.hasPicture
          ? 'border-green-200 bg-green-50/40'
          : 'border-dashed border-gray-300 bg-gray-50/50'">
          <div class="flex items-center gap-2">
            <IconCheck class="w-4 text-green-500 shrink-0" v-if="publishingRequirements.hasPicture" />
            <IconCamera class="w-4 text-gray-400 shrink-0" v-else />
            <span class="font-medium text-sm">Photo</span>
          </div>
          <p class="text-xs text-gray-400 leading-snug" v-if="!publishingRequirements.hasPicture">
            A photo of your finished dish
          </p>
          <p class="text-xs text-green-600" v-else>Ready</p>
          <div class="flex gap-1.5 mt-0.5 flex-wrap" v-if="!publishingRequirements.hasPicture">
            <button class="button px-2 py-1 flex gap-1.5 items-center text-primary outline-1 outline-primary text-xs"
              @click="triggerFileUpload" :disabled="generatePictureLoading">
              <IconLoader class="w-3 animate-spin" v-if="generatePictureLoading" />
              <IconUpload class="w-3" v-else />
              <span>Upload</span>
            </button>
            <button class="button px-2 py-1 flex gap-1.5 items-center text-primary outline-1 outline-primary text-xs"
              @click="triggerCamera" :disabled="generatePictureLoading">
              <IconCamera class="w-3" />
              <span>Camera</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Publish button -->
      <button v-if="canPublish"
        class="w-full button py-3 flex gap-2 items-center justify-center !text-white !bg-primary text-base font-semibold rounded-xl"
        @click="publishRecipe" :disabled="publishLoading">
        <IconLoader class="w-5 animate-spin" v-if="publishLoading" />
        <IconChevronsUp class="w-5" v-else />
        <span>{{ publishLoading ? 'Publishing…' : 'Publish Recipe' }}</span>
      </button>
      <div v-else class="w-full rounded-xl border border-dashed border-gray-200 py-3 flex items-center justify-center">
        <span class="text-xs text-gray-400">Add instructions and a photo to publish</span>
      </div>
    </div>

    <!-- Admin section -->
    <div v-if="auth.isAdmin()" class="flex flex-wrap gap-2 items-center self-start w-full mt-1">
      <button class="button px-2 py-[3px] inline-flex gap-2 items-center text-primary outline-1 outline-primary"
        type="button" @click="regeneratePicture"
        :disabled="generatePictureLoading || deleteLoading || deleteImageLoading">
        <IconLoader class="w-4 animate-spin" v-if="generatePictureLoading" />
        <IconRefreshCcw class="w-4" v-else />
        <span>{{ generatePictureLoading ? 'Regenerating…' : 'Regenerate picture' }}</span>
      </button>
      <button v-if="recipe.picture"
        class="button px-2 py-[3px] inline-flex gap-2 items-center outline-1 outline-red-500/70 text-red-700 hover:bg-red-50"
        type="button" @click="deleteRecipeImage"
        :disabled="deleteImageLoading || generatePictureLoading || deleteLoading">
        <IconLoader class="w-4 animate-spin" v-if="deleteImageLoading" />
        <IconImageOff class="w-4" v-else />
        <span>{{ deleteImageLoading ? 'Removing…' : 'Delete image' }}</span>
      </button>
      <button class="button px-2 py-[3px] inline-flex gap-2 items-center !text-white !bg-red-600 hover:!bg-red-700"
        type="button" @click="deleteRecipeAdmin"
        :disabled="deleteLoading || generatePictureLoading || deleteImageLoading">
        <IconLoader class="w-4 animate-spin" v-if="deleteLoading" />
        <IconTrash class="w-4" v-else />
        <span>{{ deleteLoading ? 'Deleting…' : 'Delete recipe' }}</span>
      </button>
      <button class="button px-2 py-[3px] inline-flex gap-2 items-center !text-gray-800 !bg-primary-5/70" type="button"
        @click="deboost">
        <IconChevronsDown class="w-5" />
        <span>Deboost</span>
      </button>
    </div>
  </div>

  <!-- Hidden file inputs -->
  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelected" />
  <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden"
    @change="handleFileSelected" />
</template>

<script setup lang="ts">
const props = defineProps<{
  recipe: Recipe;
  refresh: (recipeId: number, force: boolean) => Promise<void>;
}>();

const supabase = useSupabaseClient<Database>();
const router = useRouter();
const recipeStore = useRecipeStore();
const auth = useAuthStore();
const loadingStore = useLoadingStore();

const generatePictureLoading = ref(false);
const generateInstructionsLoading = ref(false);
const publishLoading = ref(false);
const deleteLoading = ref(false);
const deleteImageLoading = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

const publishingRequirements = computed(() => getPublishingRequirements(props.recipe));
const canPublish = computed(() =>
  publishingRequirements.value.hasInstructions && publishingRequirements.value.hasPicture
);

const isUserCreated = computed(() =>
  ['PREPARSED', 'TEXT', 'PICTURE', 'TITLE'].includes(props.recipe.source_type ?? '')
);

const enrichmentSteps = computed(() => {
  const r = props.recipe as any;
  return [
    {
      key: 'steps',
      label: 'Rich steps',
      description: 'Step-by-step cook instructions',
      done: Array.isArray(r.full_instructions) && r.full_instructions.length > 0,
    },
    {
      key: 'nutrition',
      label: 'Deep nutrition',
      description: 'Full ingredient analysis',
      done: r.full_nutritional_processing === true,
    },
    {
      key: 'embedding',
      label: 'Search index',
      description: 'Similarity embedding',
      done: r.embedding != null,
    },
  ];
});

const showEnrichmentGrid = computed(() => {
  const r = props.recipe as any;
  if (r.visibility === 'UNLISTED' && !isUserCreated.value) return true;
  if (r.visibility !== 'PUBLISH_PENDING') return false;
  if (!r.publish_start) return false;
  return Date.now() - new Date(r.publish_start).getTime() > 5 * 60 * 1000;
});

const pendingLoadingTitle = computed(() => {
  if (isUserCreated.value) return 'Fully processing your recipe';
  const r = props.recipe as any;
  return r.publish_start ? 'Finalizing recipe' : 'Importing recipe';
});

const pendingLoadingSubtext = computed(() => {
  if (isUserCreated.value) return 'It will be public in a few minutes.';
  const r = props.recipe as any;
  return r.publish_start ? 'This may take a few minutes' : 'Analyzing recipe data';
});

const rerunLoading = ref(false);
let enrichmentPollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling() {
  if (enrichmentPollTimer !== null) {
    clearInterval(enrichmentPollTimer);
    enrichmentPollTimer = null;
  }
}

function startPolling() {
  stopPolling();
  let attempts = 0;
  const MAX = 24; // 24 × 5 s = 2 min ceiling
  enrichmentPollTimer = setInterval(async () => {
    attempts++;
    await props.refresh(props.recipe.id, true);
    if (props.recipe.visibility === 'PUBLIC' || attempts >= MAX) stopPolling();
  }, 5000);
}

onUnmounted(stopPolling);

const rerunEnrichment = async () => {
  rerunLoading.value = true;
  // Optimistic: hide the stuck grid immediately and show the spinner
  if (recipeStore.recipe) {
    (recipeStore.recipe as any).visibility = 'PUBLISH_PENDING';
    (recipeStore.recipe as any).publish_start = null; // server just reset it; don't show grid again
  }
  try {
    await $fetch('/api/create-recipe/rerun-enrichment', {
      method: 'POST',
      body: { recipeId: props.recipe.id },
    });
    startPolling();
  } catch (e) {
    console.error('Failed to queue enrichment:', e);
  } finally {
    rerunLoading.value = false;
  }
};

const goToEditInstructions = () => {
  recipeStore.setRecipe(props.recipe);
  router.push('/recipe/new?editCurrent=true');
};

const generateInstructions = async () => {
  generateInstructionsLoading.value = true;
  loadingStore.displayToast('Generating instructions ✨');
  const payload = {
    title: props.recipe.title,
    instructions: props.recipe.instructions,
    ingredients: props.recipe.ingredients,
  };
  const response = (await $fetch('/api/create-recipe/get-instructions', {
    method: 'POST',
    body: payload,
  })) as { description?: string; instructions: string[] };
  Object.assign(props.recipe, response);
  await supabase.from('recipes').update(response).eq('id', props.recipe.id);
  generateInstructionsLoading.value = false;
  loadingStore.displayTransientToast('Instructions generated! ✨');
};

const triggerFileUpload = () => fileInput.value?.click();
const triggerCamera = () => cameraInput.value?.click();

const handleFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  generatePictureLoading.value = true;
  loadingStore.displayToast('Processing your photo ✨');

  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await $fetch('/api/create-recipe/get-processed-image', {
      method: 'POST',
      body: {
        original_image_base64: base64,
        title: props.recipe.title,
        instructions: props.recipe.instructions,
        collection: (props.recipe as any).collection || 'user-generated',
      },
    });

    if (!(response as any).image_base64) {
      loadingStore.displayTransientToast('Failed to process photo ❌');
      return;
    }

    const imageData = await $fetch('/api/db/upload-image', {
      method: 'POST',
      body: {
        image: (response as any).image_base64,
        bucket: 'recipe',
        id: props.recipe.id,
        shouldUpsert: Boolean(props.recipe.picture),
      },
    });

    props.recipe.picture = imageData.publicUrl;
    await supabase.from('recipes').update({ picture: imageData.publicUrl }).eq('id', props.recipe.id);
    loadingStore.displayTransientToast('Photo added! ✨');
  } catch (error) {
    console.error('Failed to process photo:', error);
    loadingStore.displayTransientToast('Failed to process photo ❌');
  } finally {
    generatePictureLoading.value = false;
    if (target) target.value = '';
  }
};

const publishRecipe = async () => {
  if (!canPublish.value) return;
  publishLoading.value = true;
  loadingStore.displayToast('Publishing recipe ✨');

  try {
    if (isUserCreated.value) {
      await $fetch('/api/create-recipe/publish-user-recipe', {
        method: 'POST',
        body: { recipeId: props.recipe.id },
      });
      props.recipe.visibility = 'PUBLISH_PENDING' as any;
      loadingStore.displayTransientToast('Recipe submitted - will be public in a few minutes ✨');
    } else {
      await supabase.from('recipes').update({ visibility: 'PUBLIC' }).eq('id', props.recipe.id);
      loadingStore.displayTransientToast('Recipe published! ✨');
      await props.refresh(props.recipe.id, true);
    }
  } finally {
    publishLoading.value = false;
  }
};

const regeneratePicture = async () => {
  generatePictureLoading.value = true;
  loadingStore.displayToast('Regenerating picture ✨');
  const payload = {
    title: props.recipe.title,
    instructions: props.recipe.instructions,
    source_type: props.recipe.source_type,
    source: props.recipe.source,
  };
  const response = await $fetch('/api/create-recipe/get-processed-image', {
    method: 'POST',
    body: payload,
  });
  if (!response.image_base64) {
    generatePictureLoading.value = false;
    loadingStore.displayTransientToast('Failed to regenerate picture ❌');
    return;
  }
  const imageData = await $fetch('/api/db/upload-image', {
    method: 'POST',
    body: {
      image: response.image_base64,
      bucket: 'recipe',
      id: props.recipe.id,
      shouldUpsert: Boolean(props.recipe.picture),
    },
  });
  props.recipe.picture = imageData.publicUrl;
  await supabase.from('recipes').update({ picture: imageData.publicUrl }).eq('id', props.recipe.id);
  generatePictureLoading.value = false;
  await props.refresh(props.recipe.id, true);
  loadingStore.displayTransientToast('Picture regenerated! ✨');
};

const deboost = async () => {
  await supabase
    .from('recipes')
    .update({
      relevancy: Math.round(props.recipe.relevancy * 0.6),
      daily_engagement_score: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    })
    .eq('id', props.recipe.id);
};

const deleteRecipeImage = async () => {
  if (!props.recipe.picture) return;
  if (!confirm('Remove the image file from storage and clear the picture on this recipe?')) return;
  deleteImageLoading.value = true;
  try {
    await $fetch('/api/db/delete-recipe-image', {
      method: 'POST',
      body: { recipeId: props.recipe.id },
    });
    props.recipe.picture = null;
    await props.refresh(props.recipe.id, true);
    loadingStore.displayTransientToast('Image removed ✨');
  } catch (error) {
    console.error('Failed to delete recipe image:', error);
    loadingStore.displayTransientToast('Failed to remove image ❌');
  } finally {
    deleteImageLoading.value = false;
  }
};

const deleteRecipeAdmin = async () => {
  if (!confirm('Delete this recipe permanently? This cannot be undone.')) return;
  deleteLoading.value = true;
  try {
    await $fetch('/api/db/delete-recipe', {
      method: 'POST',
      body: { recipeId: props.recipe.id },
    });
    recipeStore.deleteRecipe(props.recipe.id);
    recipeStore.setRecipe({} as Recipe);
    await router.push('/');
  } catch (error) {
    console.error('Failed to delete recipe:', error);
    loadingStore.displayTransientToast('Failed to delete recipe ❌');
  } finally {
    deleteLoading.value = false;
  }
};
</script>

<style scoped>
.progress-ring {
  --progress: 0%;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: conic-gradient(var(--color-primary) var(--progress), #ffffff var(--progress));
  display: flex;
  align-items: center;
  justify-content: center;
}

.inner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
