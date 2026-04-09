<template>
  <div class="mb-20 sm:mt-10 m-4 sm:mx-10 lg:ml-22 lg:mr-18">
    <div class="flex gap-2 flex-wrap">
      <NuxtLink v-for="view in views" :key="view.path" :to="`/kitchen${view.path}`"
        class="animated-button bg-primary-10/60 px-3 py-2" active-class="bg-primary/80">
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
