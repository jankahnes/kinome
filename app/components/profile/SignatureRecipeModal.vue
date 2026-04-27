<template>
  <BlocksModal v-model="isOpen">
    <div class="p-4 lg:w-[70vw] max-w-4xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-[11px] font-mono uppercase text-gray-400">Signature recipe</p>
          <h2 class="mt-1 text-2xl font-headers tracking-tighter sm:text-3xl">Sign:</h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ recipe?.title ?? 'Choose a recipe first.' }}
          </p>
        </div>
        <button type="button" class="main-button animated-button rounded-full bg-white/80 p-2 text-gray-500"
          :disabled="saving" @click="close" aria-label="Close signature modal">
          <IconX class="h-5 w-5" />
        </button>
      </div>

      <div class="mt-5 rounded-[30px] bg-white p-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] sm:p-4">
        <div class="aspect-5/2 w-full overflow-hidden rounded-[26px] bg-white sm:aspect-11/4">
          <ProfileSignaturePad ref="padRef" />
        </div>
      </div>

      <div class="mt-3 flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Use your finger or mouse to draw.</p>
        <button type="button"
          class="main-button animated-button self-start rounded-full bg-white px-4 py-2 font-semibold text-gray-700"
          :disabled="saving" @click="clearPad">
          Clear
        </button>
      </div>

      <p v-if="errorMessage" class="mt-4 text-sm font-medium text-red-600">
        {{ errorMessage }}
      </p>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button"
          class="main-button animated-button rounded-full bg-black/5 px-5 py-2 font-semibold text-gray-700"
          :disabled="saving" @click="close">
          Cancel
        </button>
        <button type="button"
          class="main-button animated-button rounded-full bg-primary! px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saving || !recipe" @click="saveSignature">
          {{ saving ? 'Saving...' : 'Save signature' }}
        </button>
      </div>
    </div>
  </BlocksModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  recipe: RecipeOverview | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved', payload: { recipeId: number; publicUrl: string }): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});


const auth = useAuthStore();
const padRef = ref<any>(null);
const saving = ref(false);
const errorMessage = ref('');

function close() {
  if (saving.value) return;
  isOpen.value = false;
}

function clearPad() {
  padRef.value?.clear();
  errorMessage.value = '';
}

async function saveSignature() {
  if (!props.recipe?.id) return;
  if (!auth.user?.id) {
    errorMessage.value = 'You need to be signed in to save a signature recipe.';
    return;
  }

  const dataUrl = padRef.value?.exportDataUrl();
  if (!dataUrl) {
    errorMessage.value = 'Add a signature before saving.';
    return;
  }

  saving.value = true;
  errorMessage.value = '';

  try {
    const imageData = await $fetch<{ publicUrl: string }>('/api/db/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        image: dataUrl,
        bucket: 'signature',
        id: auth.user.id,
        shouldUpsert: true,
      },
    });

    await $fetch('/api/db/signature-recipe', {
      method: 'POST',
      body: {
        recipeId: props.recipe.id,
      },
    });

    emit('saved', {
      recipeId: props.recipe.id,
      publicUrl: `${imageData.publicUrl}?t=${Date.now()}`,
    });
    isOpen.value = false;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? error?.message ?? 'Failed to save signature.';
  } finally {
    saving.value = false;
  }
}

watch(
  () => isOpen.value,
  async (open) => {
    if (!import.meta.client) return;

    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      errorMessage.value = '';
      await nextTick();
      padRef.value?.clear();
    }
  },
);

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.signature-modal-enter-active,
.signature-modal-leave-active {
  transition: opacity 0.2s ease;
}

.signature-modal-enter-active>div,
.signature-modal-leave-active>div {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.signature-modal-enter-from,
.signature-modal-leave-to {
  opacity: 0;
}

.signature-modal-enter-from>div,
.signature-modal-leave-to>div {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
