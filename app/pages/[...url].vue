<template></template>

<script setup>
const route = useRoute();
const router = useRouter();

const rawUrl = Array.isArray(route.params.url)
  ? route.params.url.join('/')
  : route.params.url;

try {
  new URL(rawUrl);
  navigateTo(`/recipe/new?link=${encodeURIComponent(rawUrl)}`);
} catch {
  navigateTo('/');
}

useHead({
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
});
</script>
