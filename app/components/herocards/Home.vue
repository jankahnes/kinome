<template>
  <div>
    <div
      class="main-card main-card-rounded py-10 mt-8 lg:mt-12 shadow-lg! justify-between items-center overflow-hidden hidden lg:flex">
      <div class="flex flex-col gap-2 min-w-0 mx-4 sm:mx-10 text-center sm:text-left">
        <h1 class="text-3xl sm:text-5xl font-headers tracking-tight leading-7 sm:leading-12">
          Unlock the full power of <span class="text-primary">Kinome</span>.
        </h1>
        <p class="leading-5 sm:leading-7">
          Sign up to get access to your personal intelligent cookbook.
        </p>
        <div
          class="flex gap-4 mt-2 py-2 overflow-visible pr-10">
          <div
            v-for="card in homeCards"
            :key="card.title"
            class="flex flex-col items-center text-center gap-2 p-6 main-card main-card-rounded shadow-sm! flex-1 min-w-0 shrink-0">
            <img :src="card.blob.src" :alt="card.blob.alt" :class="card.blob.desktopClass" />
            <img :src="card.image.src" :alt="card.image.alt" :class="card.image.desktopClass" />
            <h2 :class="card.titleDesktopClass">
              {{ card.title }}
            </h2>
            <p class="tracking-tight text-center leading-tight -mt-2 text-gray-700">
              {{ card.description }}
            </p>
          </div>
        </div>
        <NuxtLink to="/onboarding"
          class="main-button animated-button rounded-2xl! bg-primary! text-2xl mt-4 py-2 px-10 lg:px-30 self-center min-w-1/4 text-center font-headers italic! text-white">
          Create your account</NuxtLink>
        <p class="text-sm text-gray-500 leading-none m-2 text-center">
          Already have an account?
          <NuxtLink to="/login" class="underline">Sign in</NuxtLink>
        </p>
      </div>
    </div>
    <div class="flex lg:hidden flex-col gap-4 main-card main-card-rounded px-4 py-6 shadow-lg! mt-8">
      <div class="flex flex-col gap-2 text-center">
        <h1 class="text-3xl sm:text-5xl font-headers tracking-tight leading-7 sm:leading-12">
          Unlock the full power of <span class="text-primary">Kinome</span>.
        </h1>
        <p class="leading-5 sm:leading-7">
          Sign up to get access to your personal intelligent cookbook.
        </p>
      </div>
      <div
        v-for="card in homeCards"
        :key="card.title"
        class="flex items-center gap-4 p-4 main-card main-card-rounded shadow-sm!">
        <div class="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden">
          <img :src="card.blob.src" :alt="card.blob.alt" :class="card.blob.mobileClass" />
          <img :src="card.image.src" :alt="card.image.alt" :class="card.image.mobileClass" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <h2 class="text-xl sm:text-2xl font-headers tracking-tight leading-tight">
            {{ card.title }}
          </h2>
          <p class="tracking-tight leading-tight text-gray-700">
            {{ card.description }}
          </p>
        </div>
      </div>
      <NuxtLink to="/onboarding"
        class="main-button animated-button rounded-2xl! bg-primary! text-2xl mt-2 py-2 px-10 self-center text-center font-headers italic! text-white">
        Create your account</NuxtLink>
      <p class="text-sm text-gray-500 leading-none text-center">
        Already have an account?
        <NuxtLink to="/login" class="underline">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const homeCards = [
  {
    title: 'Universal Cookbook',
    description: 'Save recipes from any website, TikTok or Youtube in seconds.',
    blob: {
      src: '/blob.webp',
      alt: 'Blob',
      desktopClass: 'h-50 z-0 rotate-160 opacity-10',
      mobileClass: 'absolute h-28 z-0 rotate-160 opacity-10',
    },
    image: {
      src: '/universal_cookbook.webp',
      alt: 'Universal Cookbook',
      desktopClass: 'h-30 -mt-44 z-10',
      mobileClass: 'relative h-20 z-10',
    },
    titleDesktopClass: 'text-2xl font-headers tracking-tight mt-12',
  },
  {
    title: 'Tailored Discovery',
    description: 'Get recipe suggestions based on your taste preferences and health goals.',
    blob: {
      src: '/blob.webp',
      alt: 'Blob',
      desktopClass: 'h-50 rotate-340 z-0 opacity-10',
      mobileClass: 'absolute h-28 rotate-340 z-0 opacity-10',
    },
    image: {
      src: '/tailored_discovery.webp',
      alt: 'Tailored Discovery',
      desktopClass: 'h-38 -mt-44 z-10',
      mobileClass: 'relative h-24 z-10',
    },
    titleDesktopClass: 'text-2xl font-headers tracking-tight mt-4',
  },
  {
    title: 'Smart Tracking',
    description: 'Track macros & nutrients automatically using our smart ingredient parser.',
    blob: {
      src: '/blob.webp',
      alt: 'Blob',
      desktopClass: 'h-50 z-0 opacity-10',
      mobileClass: 'absolute h-28 z-0 opacity-10',
    },
    image: {
      src: '/smart_tracking.webp',
      alt: 'Smart Tracking',
      desktopClass: 'h-30 -mt-40 z-10',
      mobileClass: 'relative h-20 z-10',
    },
    titleDesktopClass: 'text-2xl font-headers tracking-tight mt-8',
  },
];
</script>
