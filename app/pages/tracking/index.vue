<template>
  <div></div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
//@ts-ignore
const hasTracking = computed(() => auth.user?.user_data?.tracking);

watchEffect(() => {
  if (auth.profileFetched) {
    if (hasTracking.value) {
      navigateTo('/tracking/today');
    } else {
      navigateTo('/tracking/intro');
    }
  }
});
</script>

<style scoped></style>
