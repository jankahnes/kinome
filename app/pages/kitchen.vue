<template>
  <div class="mb-20 sm:mt-10 m-4 sm:mx-16">
    <div class="flex gap-2 flex-wrap">
      <NuxtLink v-for="view in views" :key="view.path" :to="`/kitchen${view.path}`"
        class="subnav-pill"
        active-class="active">
        {{ view.displayName }}
      </NuxtLink>
    </div>
    <NuxtPage :transition="false" />
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

const views = computed(() => [
  {
    path: '/home',
    displayName: 'Home',
  },
  ...(auth.isUser()
    ? [
      {
        path: '/recommendations',
        displayName: 'Recommendations',
      },
    ]
    : []),
  {
    path: '/recipes',
    displayName: 'All Recipes',
  },
  {
    path: '/social',
    displayName: 'Trending',
  },
]);

useHead({
  title: 'Kitchen | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Find healthy recipes, personalized picks, nutrition tools, and trending cooking ideas in your Kinome kitchen.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Kitchen | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content: 'Find healthy recipes, personalized picks, nutrition tools, and trending cooking ideas in your Kinome kitchen.',
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'website',
    },
    {
      key: 'og:url',
      property: 'og:url',
      content: 'https://kinome.app/kitchen',
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: 'https://kinome.app/kitchen',
    },
  ],
});
</script>

<style scoped></style>
