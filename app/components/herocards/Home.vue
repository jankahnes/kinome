<template>
  <div
    class="flex action-card py-10 shadow-lg mt-8 md:mt-12 justify-between items-center relative overflow-hidden"
  >
    <div
      class="flex flex-col gap-2 flex-1 2xl:mr-84 min-w-0 mx-4 sm:mx-10 text-center sm:text-left"
    >
      <h2
        class="text-3xl sm:text-5xl font-bold tracking-tight leading-7 sm:leading-12"
      >
        Unlock the full power of Kinome
      </h2>
      <p class="text-base sm:text-lg leading-5 sm:leading-7">
        Sign up to get access to your personal intelligent cookbook.
      </p>
      <div
        class="flex gap-4 mt-2 py-2 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide md:overflow-visible md:pr-10"
      >
        <div
          class="flex flex-col items-center gap-2 p-6 action-card shadow-sm flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card1"
          @click="scrollTo(card1)"
        >
          <img
            src="/blob.webp"
            alt="Blob"
            class="h-50 z-0 rotate-160 opacity-50"
          />
          <img
            src="/universal_cookbook.webp"
            alt="Universal Cookbook"
            class="h-30 -mt-44 z-10"
          />
          <h3 class="text-2xl font-bold tracking-tight mt-12">
            Universal Cookbook
          </h3>
          <p class="text-lg tracking-tight text-center leading-tight -mt-2">
            Save recipes from any website, TikTok or Youtube in seconds.
          </p>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-6 action-card shadow-sm flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card2"
          @click="scrollTo(card2)"
        >
          <img
            src="/blob.webp"
            alt="Blob"
            class="h-50 rotate-340 opacity-50 z-0"
          />
          <img
            src="/tailored_discovery.webp"
            alt="Tailored Discovery"
            class="h-38 -mt-44 z-10"
          />
          <h3 class="text-2xl font-bold tracking-tight mt-4">
            Tailored Discovery
          </h3>
          <p class="text-lg tracking-tight text-center leading-tight -mt-2">
            Get recipe suggestions based on your taste preferences and health
            goals.
          </p>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-6 action-card shadow-sm flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card3"
          @click="scrollTo(card3)"
        >
          <img src="/blob.webp" alt="Blob" class="h-50 opacity-50 z-0" />
          <img
            src="/smart_tracking.webp"
            alt="Smart Tracking"
            class="h-30 -mt-40 z-10"
          />
          <h3 class="text-2xl font-bold tracking-tight mt-8">Smart Tracking</h3>
          <p class="text-lg tracking-tight text-center leading-tight -mt-2">
            Track macros & nutrients automatically using our smart ingredient
            parser.
          </p>
        </div>
      </div>
      <NuxtLink
        to="/onboarding"
        class="animated-button rounded-full! bg-primary text-2xl mt-4 py-3 px-10 min-w-1/4 text-center font-bold"
        >Create your account</NuxtLink
      >
      <p class="text-sm text-gray-500 leading-none m-2 text-center">
        Already have an account?
        <NuxtLink to="/login" class="underline">Sign in</NuxtLink>
      </p>
    </div>
    <img
      src="/feast.png"
      alt="Blob"
      class="hidden 2xl:block absolute -right-20 h-[120%]"
    />
  </div>
</template>

<script setup lang="ts">
const card1 = ref<HTMLElement>();
const card2 = ref<HTMLElement>();
const card3 = ref<HTMLElement>();

const scrollTo = (target: HTMLElement | undefined) => {
  if (!target) return;
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  });
};
</script>
