<template>
  <div>
    <Analytics />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue';

useHead({
  title: 'Kinome',
  meta: [
    {
      name: 'description',
      content: 'Kinome is a recipe sharing platform.',
    },
  ],
  bodyAttrs: {
    class: 'font-main',
  },
});
</script>
