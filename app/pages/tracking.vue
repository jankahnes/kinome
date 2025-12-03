<template>
  <div :class="{ 'pb-16 m-4 sm:m-10 sm:ml-20': auth.isUser() }">
    <div class="flex gap-4 flex-wrap" v-if="auth.isUser()">
      <NuxtLink
        v-for="view in views"
        :key="view.path"
        :to="`/tracking${view.path}`"
        class="animated-button bg-primary-10/40 border-1 border-primary px-3 py-2"
        active-class="primary-gradient text-gray-800 px-3 py-2"
      >
        {{ view.displayName }}
      </NuxtLink>
    </div>
    <NuxtPage :transition="false" />
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const route = useRoute();

const views = computed(() => [
  {
    path: '/today',
    displayName: 'Today',
  },
  {
    path: '/goals',
    displayName: 'Goals',
  },
  {
    path: '/form',
    displayName: 'Form',
  },
  {
    path: '/review',
    displayName: 'Review',
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
