<template>
  <div></div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

watchEffect(() => {
  if (auth.profileFetched) {
    if (auth.isUser()) {
      navigateTo('/tracking/today');
    } else {
      navigateTo('/tracking/intro');
    }
  }
});
</script>

<style scoped></style>
