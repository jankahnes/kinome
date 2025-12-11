<template>
  <div
    class="flex md:bg-primary-10 rounded-4xl xl:mr-20 pb-4 pt-8 md:py-10 md:shadow-xl xl:max-w-6xl justify-between items-center relative overflow-hidden"
  >
    <div
      class="flex flex-col gap-2 flex-1 min-w-0 mx-4 md:mx-10 text-center md:items-center"
    >
      <h2
        class="text-4xl sm:text-5xl font-bold tracking-tight leading-9 sm:leading-12"
      >
        Nutrition tracking, finally simplified.
      </h2>
      <p class="tracking-normal sm:text-xl leading-5 sm:leading-7 max-w-4xl">
        Ditch the tedious spreadsheets. Kinome combines AI parsing, barcode
        scanning, and deep nutritional data to help you hit your goals in
        seconds.
      </p>
      <div
        class="flex gap-4 mt-2 py-2 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide md:overflow-visible md:pr-10 min-w-0 -mr-4 md:mr-0"
      >
        <div
          class="flex flex-col items-center gap-2 p-6 main-card shadow-sm flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card1"
          @click="scrollTo(card1)"
        >
          <img
            src="/blob.webp"
            alt="Blob"
            class="h-50 z-0 rotate-160 opacity-50"
          />
          <img
            src="/tracking-define-your-path.webp"
            alt="Universal Cookbook"
            class="h-30 -mt-44 z-10"
          />
          <h3 class="text-xl md:text-2xl font-bold tracking-tight mt-12">
            1. Define Your Path
          </h3>
          <p
            class="text-base md:text-lg tracking-tight text-center leading-6 -mt-2"
          >
            Set personalized diet preferences, weight goals, and activity
            levels. We calculate your ideal macro and caloric needs
            automatically.
          </p>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-6 main-card shadow-sm flex-1 min-w-76 snap-start md:min-w-0 shrink-0"
          ref="card2"
          @click="scrollTo(card2)"
        >
          <img
            src="/blob.webp"
            alt="Blob"
            class="h-50 rotate-340 opacity-50 z-0"
          />
          <img
            src="/tracking-log-instantly.webp"
            alt="Tailored Discovery"
            class="h-38 -mt-44 z-10"
          />
          <h3 class="text-xl md:text-2xl font-bold tracking-tight mt-4">
            2. Log Instantly
          </h3>
          <p
            class="text-base md:text-lg tracking-tight text-center leading-6 -mt-2"
          >
            Scan barcodes, search 35k+ branded foods, or simply type what you
            ate. Our smart parser extracts ingredients and portions instantly.
          </p>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-6 main-card shadow-sm flex-1 min-w-70 snap-start md:min-w-0 shrink-0"
          ref="card3"
          @click="scrollTo(card3)"
        >
          <img src="/blob.webp" alt="Blob" class="h-50 opacity-50" />
          <img
            src="/tracking-see-the-impact.webp"
            alt="Smart Tracking"
            class="h-30 -mt-40 z-10"
          />
          <h3 class="text-xl md:text-2xl font-bold tracking-tight mt-8">
            3. See the Impact
          </h3>
          <p
            class="text-base md:text-lg tracking-tight text-center leading-6 -mt-2"
          >
            Go beyond calories. Track micronutrients, get Health Scores for
            every meal, and visualize your progress over time.
          </p>
        </div>
      </div>
      <NuxtLink
        to="/tracking/form"
        class="animated-button rounded-2xl! bg-primary text-xl md:text-2xl mt-4 py-2 px-6 sm:px-20 text-center font-bold"
        >Set up my diet goals</NuxtLink
      >
      <p class="text-sm text-gray-500 leading-none m-2 self-center underline">
        Disable tracking features
      </p>
    </div>
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
