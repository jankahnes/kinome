<template>
  <div class="w-full max-w-screen-md">
    <h1 class="text-3xl font-headers tracking-tight">
      Import your recipe from a link
    </h1>
    <div class="flex gap-4 flex-col md:flex-row mt-6">
      <div class="flex-1">
        <div class="relative">
          <span
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          >
            <IconLink class="w-5 h-5" />
          </span>
          <input
            v-model="link"
            type="text"
            placeholder="www.yourrecipe.com"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-2xl focus:outline-none transition-colors"
          />
        </div>
      </div>
      <button
        @click="submit"
        :disabled="!link"
        class="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center text-white bg-primary font-headers italic rounded-2xl"
      >
        Import
      </button>
    </div>
    <h3 class="text-lg font-bold text-gray-900 mt-4">Recipe Websites</h3>
    <span
      class="main-card text-sm px-3 py-1.5 rounded-2xl inline-flex gap-2 items-center mt-2"
    >
      <IconGlobe class="w-5 h-5 text-green-800" />
      Most Recipe Websites: Supported
      <IconCheck class="w-5 h-5 text-green-800" />
    </span>
    <h3 class="text-lg font-bold text-gray-900 mt-6 flex items-center gap-2">
      Video Platforms
      <span
        class="ml-1 text-[10px] text-white bg-primary px-1.5 py-0.5 rounded-2xl"
        >NEW</span
      >
    </h3>
    <div class="flex gap-2 flex-wrap mt-2">
      <span
        class="main-card text-sm px-3 py-1 rounded-2xl flex gap-2 items-center"
      >
        <img src="/youtube.webp" class="w-5 h-3.5" alt="YouTube" /> YouTube:
        Supported
        <IconCheck class="w-5 h-5 text-green-800" />
      </span>
      <span
        class="main-card text-sm px-3 py-1 rounded-2xl flex gap-2 items-center"
      >
        <img src="/tiktok.webp" class="w-7 h-7" alt="Tiktok" /> Tiktok:
        Supported
        <IconCheck class="w-5 h-5 text-green-800" />
      </span>
      <span
        class="main-card text-sm px-3 py-1 rounded-2xl flex gap-2 items-center"
      >
        <img src="/instagram.webp" class="w-6 h-6" alt="Instagram" /> Instagram:
        Supported
        <IconCheck class="w-5 h-5 text-green-800" />
      </span>
      <!--<div class="basis-full w-full"></div> -->
      <span
        class="main-card text-sm px-3 py-1.5 rounded-2xl inline-flex gap-2 items-center"
      >
        <IconAudioLines class="w-5 h-5" />
        Audio Analysis of Videos: Supported
        <IconCheck class="w-5 h-5 text-green-800" />
      </span>
      <span
        class="main-card text-sm px-3 py-1.5 rounded-2xl inline-flex gap-2 items-center"
      >
        <IconEye class="w-5 h-5" />
        Visual Analysis of Videos: Supported
        <IconCheck class="w-5 h-5 text-green-800" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const submitFromLink = inject<(link: string) => void>('submitFromLink')!;
const link = ref('');

useHead({
  title: 'Import a Recipe | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Paste a recipe website or social video link and let Kinome extract ingredients, method steps, nutrition, and source attribution.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Import a Recipe | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content: 'Paste a recipe website or social video link and let Kinome extract ingredients, method steps, nutrition, and source attribution.',
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'website',
    },
    {
      key: 'og:url',
      property: 'og:url',
      content: 'https://kinome.app/recipe/new/import',
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: 'https://kinome.app/recipe/new/import',
    },
  ],
});

const submit = () => {
  if (link.value) {
    submitFromLink(link.value);
  }
};
</script>

<style scoped></style>
