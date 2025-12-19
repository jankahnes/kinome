<template>
  <div class="pb-16 m-4 sm:m-10 sm:ml-20">
    <div class="flex gap-2 flex-wrap">
      <NuxtLink
        v-for="view in views"
        :key="view.path"
        :to="`/kitchen${view.path}`"
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
    path: '/home',
    displayName: 'Home',
  },
  ...(auth.isUser()
    ? [
        {
          path: '/recommendations',
          displayName: 'Recommendations',
        },
        {
          path: '/cookbook',
          displayName: 'Your Cookbook',
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
