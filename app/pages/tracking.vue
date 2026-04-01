<template>
  <div :class="{ 'pb-20 lg:pb-0 m-4 lg:m-8 lg:ml-20': !isLandingPage }">
    <div class="flex items-center gap-2 flex-wrap justify-between" v-if="hasTracking">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink v-for="view in views" :key="view.path" :to="`/tracking${view.path}`"
          class="animated-button bg-primary-10 px-3 py-2"
          active-class="primary-gradient text-gray-800 px-3 py-2">
          {{ view.displayName }}
        </NuxtLink>
      </div>
      <!-- Date navigator — only on /tracking/daily -->
      <div v-if="isDaily" class="flex items-center  rounded-4xl bg-primary-10/40">
        <button class="animated-button py-1 px-3" @click="navigateDate(-1)">
          <IconChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-sm font-semibold min-w-28 text-center p-1 bg-primary-10/80 rounded-full">{{ dateLabel }}</span>
        <button class="animated-button py-1 px-3" @click="navigateDate(1)" :disabled="isToday"
          :class="{ 'opacity-30 cursor-not-allowed': isToday }">
          <IconChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
    <NuxtPage :transition="false" />
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const isLandingPage = computed(() => route.path === '/tracking/intro');
//@ts-ignore
const hasTracking = computed(() => auth.user?.user_data?.tracking);
const isDaily = computed(() => route.path === '/tracking/daily');

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

const currentDate = computed(() => {
  const q = route.query.date;
  if (typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
    return new Date(q + 'T12:00:00');
  }
  return new Date();
});

const isToday = computed(() => toDateStr(currentDate.value) === toDateStr(new Date()));

const dateLabel = computed(() => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (toDateStr(currentDate.value) === toDateStr(today)) return 'Today';
  if (toDateStr(currentDate.value) === toDateStr(yesterday)) return 'Yesterday';
  return currentDate.value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
});

function navigateDate(offset: number) {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + offset);
  const dateStr = toDateStr(d);
  const todayStr = toDateStr(new Date());
  router.push({
    path: '/tracking/daily',
    query: dateStr === todayStr ? {} : { date: dateStr },
  });
}

const views = computed(() => [
  {
    path: '/daily',
    displayName: 'Daily',
  },
  {
    path: '/trends',
    displayName: 'Trends',
  },
  {
    path: '/saved',
    displayName: 'Saved Meals',
  },
  {
    path: '/settings',
    displayName: 'Settings',
  },
]);

useHead({
  title:
    'Diet Tracking - Smart Nutrition Tracking with AI Ingredient Parser | Kinome',
  meta: [
    {
      name: 'description',
      content:
        'Track your diet effortlessly with AI-powered ingredient parsing, barcode scanning, and comprehensive nutrition analysis. Monitor calories, macros, and micronutrients to reach your health goals.',
    },
    {
      property: 'og:title',
      content: 'Diet Tracking | Kinome',
    },
    {
      property: 'og:description',
      content:
        'Track your diet effortlessly with AI-powered ingredient parsing, barcode scanning, and comprehensive nutrition analysis.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://kinome.app/tracking',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: 'https://kinome.app/tracking',
    },
  ],
});
</script>

<style scoped></style>
