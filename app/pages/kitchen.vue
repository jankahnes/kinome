<template>
  <div class="mb-20 sm:mt-10 m-4 sm:mx-16">
    <div class="flex gap-2 flex-wrap">
      <NuxtLink v-for="view in views" :key="view.path" :to="`/kitchen${view.path}`"
        class="main-button animated-button main-card px-3 py-2.5 shrink-0 text-xs text-gray-600"
        active-class="bg-white! shadow-xs">
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
  title: 'Your Collection | Kinome',
});
</script>

<style scoped></style>
