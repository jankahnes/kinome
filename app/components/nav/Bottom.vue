<template>
  <div
    class="fixed bottom-2 left-1/2 -translate-x-1/2 bg-primary-5 z-99 min-w-80 w-[66%] flex justify-between items-center py-1 px-4 rounded-full shadow-[0_0_10px_0_rgba(0,0,0,0.08)]">
    <NuxtLink v-for="link in sideLinks" :key="link.path" :to="link.path"
      class="flex h-10 aspect-square items-center justify-center" active-class="rounded-2xl bg-primary-100/30">
      <Icon :name="link.icon" :size="26" :strokeWidth="2" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const sideLinks = [
  {
    name: 'Discover',
    icon: 'compass',
    path: '/',
  },
  {
    name: 'Kitchen',
    icon: 'chef-hat',
    path: '/kitchen',
  },
  {
    name: 'New',
    icon: 'add',
    path: '/recipe/new',
  },
  {
    name: 'Tracking',
    icon: 'notebook-pen',
    path: '/tracking',
  },
  {
    name: 'Feed',
    icon: 'rss',
    path: '/feed',
  },
];
</script>
