<template>
  <div :class="{ 'pb-20 lg:pb-0 m-4 lg:m-8 lg:mx-16': !isLandingPage }">
    <div class="flex gap-4 flex-wrap justify-between" v-if="hasTracking">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink v-for="view in views" :key="view.path" :to="`/tracking${view.path}`"
          class="subnav-pill"
          active-class="active">
          {{ view.displayName }}
        </NuxtLink>
      </div>
      <!-- Date navigator - only on /tracking/daily -->
      <div v-if="isDaily" class="flex items-center  main-card-rounded bg-primary-5/40">
        <button class="main-button animated-button py-1 px-3" @click="navigateDate(-1)">
          <IconChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-xs font-mono min-w-28 text-center py-1.5 main-card main-card-rounded">{{ dateLabel }}</span>
        <button class="main-button animated-button py-1 px-3" @click="navigateDate(1)" :disabled="isToday"
          :class="{ 'opacity-30 cursor-not-allowed': isToday }">
          <IconChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
    <NuxtPage :transition="false" />
  </div>
</template>

<script setup lang="ts">
import { formatLogicalDate, isSameLogicalDate, parseLogicalDate } from '~/utils/format/logicalDate';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const isLandingPage = computed(() => route.path === '/tracking/intro');
//@ts-ignore
const hasTracking = computed(() => auth.user?.user_data?.tracking);
const isDaily = computed(() => route.path === '/tracking/daily');

const currentDate = computed(() => {
  const q = route.query.date;
  if (typeof q === 'string') return parseLogicalDate(q) ?? new Date();
  return new Date();
});

const isToday = computed(() => isSameLogicalDate(currentDate.value, new Date()));

const dateLabel = computed(() => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameLogicalDate(currentDate.value, today)) return 'Today';
  if (isSameLogicalDate(currentDate.value, yesterday)) return 'Yesterday';
  return currentDate.value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
});

function navigateDate(offset: number) {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + offset);
  const dateStr = formatLogicalDate(d);
  const todayStr = formatLogicalDate(new Date());
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
    'Smart Nutrition Tracking with AI Ingredient Parser | Kinome',
  meta: [
    {
      name: 'description',
      content:
        'Track your diet effortlessly with easy ingredient parsing, barcode scanning, and comprehensive analysis. Monitor calories and nutrients to reach your goals.',
    },
    {
      property: 'og:title',
      content: 'Smart Nutrition Tracking | Kinome',
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
