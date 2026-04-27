<template>
  <div class="space-y-8 lg:space-y-14 max-w-7xl">
    <!-- Hero -->
    <div class="space-y-3 max-w-2xl">
      <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
        IMPORT / FROM ANY LINK
      </span>
      <h1 class="text-4xl md:text-5xl font-headers tracking-tight leading-none">
        Save any recipe<span class="text-primary">.</span>
      </h1>
      <p class="text-base text-gray-600 max-w-xl leading-relaxed">
        Paste a link from any recipe site or social video. We'll watch or read the source, summarize the ingredients and
        method, and calculate nutrition from real food data - not estimates.
      </p>
    </div>

    <!-- Hero input -->
    <div class="space-y-2 max-w-3xl">
      <div class="ai-ring main-card-rounded p-px">
        <div class="flex items-center gap-2 bg-primary-5 rounded-[31px] pl-4 pr-1.5 py-1.5">
          <IconLink class="w-5 h-5 text-gray-500 shrink-0" />
          <input v-model="link" type="url" inputmode="url" autocomplete="off" spellcheck="false"
            placeholder="youtube.com/watch?v=… or yourrecipe.com" @keyup.enter="submit"
            class="flex-1 min-w-0 bg-transparent text-base focus:outline-none py-2" />
          <button @click="submit" :disabled="!link"
            class="main-button animated-button bg-primary! font-medium text-white px-5 py-2 shrink-0 rounded-[25px]! disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
            <span class="">Import</span>
            <IconArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <section class="space-y-5 py-4">
      <div>
        <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">HOW IT WORKS</span>
        <h2 class="text-2xl md:text-3xl font-headers tracking-tight">From scroll to analyzed.</h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <article v-for="(step, i) in steps" :key="step.title"
          class="main-card main-card-rounded p-5 space-y-2.5 relative overflow-hidden"
          :class="step.accent ? 'bg-linear-to-br from-primary-50 to-primary-5' : ''">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] uppercase tracking-[0.22em]"
              :class="step.accent ? 'text-primary' : 'text-gray-400'">
              STEP {{ String(i + 1).padStart(2, '0') }}
            </span>
            <component :is="step.icon" class="w-4 h-4" :class="step.accent ? 'text-primary' : 'text-gray-500'" />
          </div>
          <h3 class="font-headers text-xl tracking-tight leading-tight">{{ step.title }}</h3>
          <p class="text-sm text-gray-600 leading-relaxed">{{ step.body }}</p>
        </article>
      </div>
    </section>

    <!-- Supported -->
    <section class="space-y-5">
      <div>
        <span class="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">SUPPORTED</span>
        <h2 class="text-2xl md:text-3xl font-headers tracking-tight">Where you can import from.</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="group in supportedGroups" :key="group.title" class="space-y-2.5">
          <h3 class="font-mono text-[11px] uppercase tracking-[0.22em] text-gray-500 ml-1">
            {{ group.title }}
          </h3>
          <div v-for="item in group.items" :key="item.label"
            class="main-card main-card-rounded px-4 py-2.5 flex gap-3 items-center">
            <component v-if="item.icon" :is="item.icon" class="w-5 h-5 text-green-700 shrink-0" />
            <img v-else-if="item.image" :src="item.image" class="w-5 h-5 object-contain shrink-0" :alt="item.label" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium leading-tight">{{ item.label }}</p>
              <p class="text-[10px] font-mono uppercase tracking-wider text-gray-400 mt-0.5">
                {{ item.note }}
              </p>
            </div>
            <IconCheck class="w-4 h-4 text-green-700 shrink-0" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Compass as IconCompass,
  ClipboardPaste as IconClipboardPaste,
  Sparkles as IconSparkles,
  ChartLine as IconChartLine,
  Globe as IconGlobe,
  AudioLines as IconAudioLines,
  Eye as IconEye,
} from '@lucide/vue';

const submitFromLink = inject<(link: string) => void>('submitFromLink')!;
const link = ref('');

useHead({
  title: 'Import a Recipe | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content:
        'Paste a recipe website or social video link and let Kinome extract ingredients, method steps, nutrition, and source attribution.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Import a Recipe | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content:
        'Paste a recipe website or social video link and let Kinome extract ingredients, method steps, nutrition, and source attribution.',
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

const steps = [
  {
    title: 'See a recipe',
    body: 'You spot something tasty mid-scroll - YouTube, TikTok, Instagram, a cooking blog.',
    icon: IconCompass,
    accent: false,
  },
  {
    title: 'Paste the link',
    body: "Drop the URL up top. No ingredients written? No nutrition shown? Doesn't matter.",
    icon: IconClipboardPaste,
    accent: false,
  },
  {
    title: 'AI does the work',
    body: 'We watch the video or read the page, identify every ingredient, and summarize the method.',
    icon: IconSparkles,
    accent: true,
  },
  {
    title: 'Get full analysis',
    body: 'Real nutrition numbers from our verified food database, plus a Kinome health grade.',
    icon: IconChartLine,
    accent: false,
  },
];

const supportedGroups = [
  {
    title: 'Recipe websites',
    items: [
      {
        label: 'Most cooking blogs',
        note: 'NYT Cooking, Serious Eats, Bon Appétit, etc.',
        icon: IconGlobe,
      },
    ],
  },
  {
    title: 'Video platforms',
    items: [
      { label: 'YouTube', note: 'Long-form & Shorts', image: '/youtube.webp' },
      { label: 'TikTok', note: 'Including share links', image: '/tiktok.webp' },
      { label: 'Instagram', note: 'Reels & posts', image: '/instagram.webp' },
    ],
  },
  {
    title: 'Analysis depth',
    items: [
      { label: 'Audio transcription', note: 'Catches narrated quantities', icon: IconAudioLines },
      { label: 'Visual analysis', note: 'Reads on-screen ingredients', icon: IconEye },
    ],
  },
];

const submit = () => {
  if (link.value) {
    submitFromLink(link.value);
  }
};
</script>

<style scoped></style>
