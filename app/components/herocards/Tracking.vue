<template>
  <div>
    <div
      class="hidden lg:flex main-card main-card-rounded main-card-padding shadow-lg! xl:max-w-6xl justify-between items-center relative overflow-hidden">
      <div class="flex flex-col gap-2 flex-1 min-w-0 mx-10 text-center items-center">
        <h1 class="text-4xl sm:text-5xl font-headers tracking-tight leading-9 sm:leading-12">
          Nutrition tracking, <span class="text-primary">finally simplified</span>.
        </h1>
        <p class="tracking-normal sm:text-xl leading-5 sm:leading-7 max-w-4xl">
          Ditch the tedious spreadsheets. Kinome combines AI parsing, barcode
          scanning, and deep nutritional data to help you hit your goals in
          seconds.
        </p>
        <div class="flex gap-4 mt-2 py-2 overflow-visible pr-10 min-w-0">
          <div v-for="card in trackingCards" :key="card.title"
            class="flex flex-col items-center text-center gap-2 p-6 main-card main-card-rounded shadow-sm! flex-1 min-w-0 shrink-0">
            <img :src="card.blob.src" :alt="card.blob.alt" :class="card.blob.desktopClass" />
            <img :src="card.image.src" :alt="card.image.alt" :class="card.image.desktopClass" />
            <h2 :class="card.titleDesktopClass">
              {{ card.title }}
            </h2>
            <p class="text-[15px] tracking-tight text-center -mt-2 text-gray-700">
              {{ card.description }}
            </p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 mt-4 justify-center">
          <NuxtLink to="/tracking/form"
            class="main-button animated-button rounded-2xl! bg-primary! text-2xl py-2 px-16 text-center font-headers italic! text-white">
            Set up my diet goals</NuxtLink>
          <button type="button"
            class="main-button animated-button rounded-2xl! bg-primary-50! text-primary text-lg py-2 px-4 text-center font-headers italic! disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isSavingDefaultGoals" @click="showDefaultGoalsModal = true">
            Start without goals
          </button>
        </div>
        <p class="text-sm text-gray-500 leading-none m-2 self-center underline">
          Disable tracking features
        </p>
      </div>
    </div>

    <div class="flex lg:hidden flex-col gap-4 main-card main-card-rounded px-4 py-6 shadow-lg!">
      <div class="flex flex-col gap-2 text-center">
        <h1 class="text-4xl sm:text-5xl font-headers tracking-tight leading-9 sm:leading-12">
          Nutrition tracking, <span class="text-primary">finally simplified</span>.
        </h1>
        <p class="tracking-normal sm:text-xl leading-5 sm:leading-7">
          Ditch the tedious spreadsheets. Kinome combines AI parsing, barcode
          scanning, and deep nutritional data to help you hit your goals in
          seconds.
        </p>
      </div>
      <div v-for="card in trackingCards" :key="card.title"
        class="flex items-center gap-4 p-4 main-card main-card-rounded shadow-sm!">
        <div class="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden">
          <img :src="card.blob.src" :alt="card.blob.alt" :class="card.blob.mobileClass" />
          <img :src="card.image.src" :alt="card.image.alt" :class="card.image.mobileClass" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <h2 class="text-xl sm:text-2xl font-headers tracking-tight leading-tight">
            {{ card.title }}
          </h2>
          <p class="text-[13px] tracking-tight leading-tight text-gray-700">
            {{ card.description }}
          </p>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 mt-2 justify-center">
        <NuxtLink to="/tracking/form"
          class="main-button animated-button rounded-2xl! bg-primary! text-xl py-2 px-10 text-center font-headers italic! text-white">
          Set up my diet goals</NuxtLink>
        <button type="button"
          class="main-button animated-button rounded-2xl! bg-primary-50! text-primary text-lg py-2 px-4 text-center font-headers italic! disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isSavingDefaultGoals" @click="showDefaultGoalsModal = true">
          Start without goals
        </button>
      </div>
      <p class="text-sm text-gray-500 leading-none m-2 self-center underline">
        Disable tracking features
      </p>
    </div>

    <BlocksModal v-model="showDefaultGoalsModal">
      <div class="p-6 md:p-8 max-w-[480px]">
        <span class="font-mono text-[10px] text-primary/70 uppercase tracking-[0.22em]">Quick start</span>
        <h3 class="text-2xl md:text-3xl font-headers tracking-tight leading-none mt-2">
          Start tracking with standard goals<span class="text-primary">.</span>
        </h3>
        <p class="text-sm text-slate-600 leading-relaxed mt-4">
          We'll assign placeholder daily targets so you can start logging right away: 2000 kcal, 100g protein,
          250g carbohydrates, 67g fat, 50g sugar, 30g fiber, and 5g salt.
        </p>
        <p class="text-sm text-slate-600 leading-relaxed mt-3">
          These are generic starter values. You can adjust your metrics and goals at any time later from tracking
          settings.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 mt-6">
          <button type="button" class="main-button animated-button bg-gray-100! px-4 py-2 text-sm font-semibold flex-1"
            @click="showDefaultGoalsModal = false">
            Cancel
          </button>
          <button type="button"
            class="main-button animated-button bg-primary! text-white px-4 py-2 text-sm font-semibold flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isSavingDefaultGoals" @click="startWithDefaultGoals">
            {{ isSavingDefaultGoals ? 'Saving...' : 'Use standard goals' }}
          </button>
        </div>
      </div>
    </BlocksModal>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();
const loadingStore = useLoadingStore();

const showDefaultGoalsModal = ref(false);
const isSavingDefaultGoals = ref(false);

const trackingCards = [
  {
    title: '1. Define Your Path',
    description: 'Set personalized diet preferences, weight goals, and activity levels. We calculate your ideal macro and caloric needs automatically.',
    blob: {
      src: '/blob.webp',
      alt: 'Blob',
      desktopClass: 'opacity-10 h-50 z-0 rotate-160',
      mobileClass: 'absolute opacity-10 h-28 z-0 rotate-160',
    },
    image: {
      src: '/tracking-define-your-path.webp',
      alt: 'Define Your Path',
      desktopClass: 'h-30 -mt-44 z-10',
      mobileClass: 'relative h-20 z-10',
    },
    titleDesktopClass: 'text-2xl font-headers tracking-tight mt-12',
  },
  {
    title: '2. Log Instantly',
    description: 'Scan barcodes, search 35k+ branded foods, or simply type what you ate. Our smart parser extracts ingredients and portions instantly.',
    blob: {
      src: '/blob.webp',
      alt: 'Blob',
      desktopClass: 'opacity-10 h-50 rotate-340 z-0',
      mobileClass: 'absolute opacity-10 h-28 rotate-340 z-0',
    },
    image: {
      src: '/tracking-log-instantly.webp',
      alt: 'Log Instantly',
      desktopClass: 'h-38 -mt-44 z-10',
      mobileClass: 'relative h-24 z-10',
    },
    titleDesktopClass: 'text-2xl font-headers tracking-tight mt-4',
  },
  {
    title: '3. See the Impact',
    description: 'Go beyond calories. Track micronutrients, get Health Scores for every meal, and visualize your progress over time.',
    blob: {
      src: '/blob.webp',
      alt: 'Blob',
      desktopClass: 'opacity-10 h-50',
      mobileClass: 'absolute opacity-10 h-28',
    },
    image: {
      src: '/tracking-see-the-impact.webp',
      alt: 'See the Impact',
      desktopClass: 'h-30 -mt-40 z-10',
      mobileClass: 'relative h-20 z-10',
    },
    titleDesktopClass: 'text-2xl font-headers tracking-tight mt-8',
  },
];

const standardTrackingGoals = {
  biometrics: {
    weight: 70,
    height: 175,
    age: 30,
    gender: 'Male',
    activityFactor: 1.375,
  },
  goal: {
    targetWeightChange: 0,
  },
  targets: {
    kcal: 2000,
    protein: 100,
    carbohydrates: 250,
    fat: 67,
    sugar: 50,
    fiber: 30,
    salt: 5,
  },
};

async function startWithDefaultGoals() {
  if (isSavingDefaultGoals.value || !auth.user) return;

  isSavingDefaultGoals.value = true;

  const currentUser = auth.user as any;
  const existingUserData = currentUser.user_data as Record<string, any> | undefined;
  const userData: Record<string, any> = existingUserData
    ? Object.assign({}, existingUserData)
    : {};

  userData.tracking = {
    ...standardTrackingGoals,
    goal: {
      ...standardTrackingGoals.goal,
      startDate: existingUserData?.tracking?.goal?.startDate ?? new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from('profiles')
    .update({ user_data: userData })
    .eq('id', auth.user.id);

  if (error) {
    console.error('Failed to save standard tracking goals:', error);
    loadingStore.displayTransientToast('Failed to start tracking');
    isSavingDefaultGoals.value = false;
    return;
  }

  await auth.fetchProfile();
  isSavingDefaultGoals.value = false;
  showDefaultGoalsModal.value = false;
  await navigateTo('/tracking/daily');
}
</script>
