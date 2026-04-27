<template>
  <div class="space-y-8 lg:space-y-14 max-w-7xl">
    <!-- Hero -->
    <div class="space-y-3 max-w-2xl">
      <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
        SCAN / FROM A PHOTO
      </span>
      <h1 class="text-4xl md:text-5xl font-headers tracking-tight leading-none">
        Skip the typing<span class="text-primary">.</span>
      </h1>
      <p class="text-base text-gray-600 max-w-xl leading-relaxed">
        Take a photo of a written recipe or a finished plate. We'll identify the ingredients, estimate portions, and calculate full nutrition automatically.
      </p>
    </div>

    <!-- Primary CTA -->
    <div class="space-y-2 max-w-3xl">
      <div class="flex flex-col sm:flex-row gap-2">
        <button @click="cameraInput?.click()"
          class="main-button animated-button bg-primary! text-white font-medium px-6 py-3.5 rounded-[25px]! flex items-center justify-center gap-3 sm:flex-2">
          <IconCamera class="w-5 h-5" />
          <span>{{ isOnSafari ? 'Take or choose photo' : 'Take a photo' }}</span>
        </button>
        <button v-if="!isOnSafari" @click="fileInput?.click()"
          class="main-button animated-button main-card font-medium px-6 py-3.5 rounded-[25px]! flex items-center justify-center gap-3 sm:flex-1">
          <IconUpload class="w-5 h-5" />
          <span>Upload a photo</span>
        </button>
      </div>

      <input ref="cameraInput" type="file" accept="image/*" capture="environment" @change="handleFileChange"
        class="hidden" />
      <input ref="fileInput" type="file" accept="image/*" @change="handleFileChange" class="hidden" />

      <p class="font-mono text-[10px] uppercase tracking-wider text-gray-400 px-2 pt-1">
        Tip &mdash; works best with natural light and a steady hand
      </p>
    </div>

    <!-- What to scan -->
    <section class="space-y-5 py-4">
      <div>
        <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">WHAT TO SCAN</span>
        <h2 class="text-2xl md:text-3xl font-headers tracking-tight">Two ways to capture.</h2>
      </div>

      <div class="grid sm:grid-cols-2 gap-3">
        <article class="main-card main-card-rounded p-5 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">OPTION 01</span>
            <IconBookOpen class="w-4 h-4 text-gray-500" />
          </div>
          <h3 class="font-headers text-xl tracking-tight leading-tight">A written recipe</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Cookbook page, handwritten note, recipe card, magazine clipping. We read the ingredients and method, then build a clean recipe with full nutrition attached.
          </p>
        </article>

        <article class="main-card main-card-rounded p-5 space-y-2.5 bg-linear-to-br from-primary-50 to-primary-5">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">OPTION 02</span>
            <IconUtensilsCrossed class="w-4 h-4 text-primary" />
          </div>
          <h3 class="font-headers text-xl tracking-tight leading-tight">A finished plate</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            A top-down photo of your dish. We identify what's on the plate, estimate portions, and calculate nutrition for the whole meal.
          </p>
        </article>
      </div>
    </section>

    <!-- Tips -->
    <section class="space-y-5">
      <div>
        <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">TIPS</span>
        <h2 class="text-2xl md:text-3xl font-headers tracking-tight">For best results.</h2>
      </div>

      <div class="grid sm:grid-cols-3 gap-3">
        <div class="main-card main-card-rounded px-4 py-3 flex gap-3 items-start">
          <IconSun class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="text-sm font-medium leading-tight">Good lighting</p>
            <p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mt-1 leading-snug">
              Natural light, no harsh shadows
            </p>
          </div>
        </div>

        <div class="main-card main-card-rounded px-4 py-3 flex gap-3 items-start">
          <IconCrop class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="text-sm font-medium leading-tight">Frame the whole thing</p>
            <p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mt-1 leading-snug">
              Recipe edge to edge &middot; plate from above
            </p>
          </div>
        </div>

        <div class="main-card main-card-rounded px-4 py-3 flex gap-3 items-start">
          <IconFocus class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="text-sm font-medium leading-tight">Hold steady</p>
            <p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mt-1 leading-snug">
              Sharp focus matters most for written text
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const submitFromPicture = inject<(file: File) => void>('submitFromPicture')!;

useHead({
  title: 'Scan a Recipe | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content:
        'Create a recipe from a photo of a cookbook page, handwritten note, or finished dish with AI-assisted ingredient parsing.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Scan a Recipe | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content:
        'Create a recipe from a photo of a cookbook page, handwritten note, or finished dish with AI-assisted ingredient parsing.',
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'website',
    },
    {
      key: 'og:url',
      property: 'og:url',
      content: 'https://kinome.app/recipe/new/scan',
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: 'https://kinome.app/recipe/new/scan',
    },
  ],
});

const cameraInput = ref<HTMLInputElement>();
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);
const processing = ref(false);
const isOnSafari = computed(
  () =>
    /iP(ad|hone|od)/.test(navigator?.userAgent) &&
    /Safari/.test(navigator?.userAgent) &&
    !/CriOS|FxiOS/.test(navigator?.userAgent),
);

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    await processImage();
  }
};

const processImage = async () => {
  if (!selectedFile.value) return;

  processing.value = true;
  try {
    submitFromPicture(selectedFile.value);
  } finally {
    processing.value = false;
  }
};
</script>

<style scoped></style>
