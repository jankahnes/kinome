<template>
  <div
    class="flex main-card main-card-rounded py-10 mt-8 md:mt-12 shadow-lg! justify-between items-center relative overflow-hidden">
    <div class="flex flex-col gap-2 flex-1 2xl:mr-84 min-w-0 mx-4 sm:mx-10 text-center sm:text-left">
      <h1 class="text-3xl sm:text-5xl font-headers tracking-tight leading-7 sm:leading-12">
        Unlock the full power of <span class="text-primary">Kinome</span>.
      </h1>
      <p class="leading-5 sm:leading-7">
        Sign up to get access to your personal intelligent cookbook.
      </p>
      <div
        class="flex gap-4 mt-2 py-2 overflow-x-auto snap-x snap-mandatory scroll-smooth md:snap-none! scrollbar-hide md:overflow-visible md:pr-10">
        <div
          class="flex flex-col items-center text-center gap-2 p-6 main-card main-card-rounded shadow-sm! flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card1" @click="scrollTo(card1)">
          <img src="/blob.webp" alt="Blob" class="h-50 z-0 rotate-160 opacity-10" />
          <img src="/universal_cookbook.webp" alt="Universal Cookbook" class="h-30 -mt-44 z-10" />
          <h2 class="text-2xl font-headers tracking-tight mt-12">
            Universal Cookbook
          </h2>
          <p class="tracking-tight text-center leading-tight -mt-2 text-gray-700">
            Save recipes from any website, TikTok or Youtube in seconds.
          </p>
        </div>
        <div
          class="flex flex-col items-center text-center gap-2 p-6 main-card main-card-rounded shadow-sm! flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card2" @click="scrollTo(card2)">
          <img src="/blob.webp" alt="Blob" class="h-50 rotate-340 z-0 opacity-10" />
          <img src="/tailored_discovery.webp" alt="Tailored Discovery" class="h-38 -mt-44 z-10" />
          <h2 class="text-2xl font-headers tracking-tight mt-4">
            Tailored Discovery
          </h2>
          <p class="tracking-tight text-center leading-tight -mt-2 text-gray-700">
            Get recipe suggestions based on your taste preferences and health
            goals.
          </p>
        </div>
        <div
          class="flex flex-col items-center text-center gap-2 p-6 main-card main-card-rounded shadow-sm! flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card3" @click="scrollTo(card3)">
          <img src="/blob.webp" alt="Blob" class="h-50 z-0 opacity-10" />
          <img src="/smart_tracking.webp" alt="Smart Tracking" class="h-30 -mt-40 z-10" />
          <h2 class="text-2xl font-headers tracking-tight mt-8">Smart Tracking</h2>
          <p class="tracking-tight text-center leading-tight -mt-2 text-gray-700">
            Track macros & nutrients automatically using our smart ingredient
            parser.
          </p>
        </div>
      </div>
      <NuxtLink to="/onboarding"
        class="main-button animated-button rounded-2xl! bg-primary! text-2xl mt-4 py-2 px-10 md:px-30 self-center min-w-1/4 text-center font-headers italic! text-white">
        Create your account</NuxtLink>
      <p class="text-sm text-gray-500 leading-none m-2 text-center">
        Already have an account?
        <NuxtLink to="/login" class="underline">Sign in</NuxtLink>
      </p>
    </div>
    <img src="/feast.png" alt="Blob" class="hidden 2xl:block absolute -right-20 h-[120%]" />
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';

const card1 = ref<HTMLElement>();
const card2 = ref<HTMLElement>();
const card3 = ref<HTMLElement>();

const width = useWindowSize().width;

const scrollTo = (target: HTMLElement | undefined) => {
  if (!target || width.value > 768) return;
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  });
};
</script>
