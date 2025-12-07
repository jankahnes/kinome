<template>
  <div class="my-6 mx-auto sm:ml-20 sm:mr-10">
    <PagesReport :id="route.params.id as string" :isFood="false" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
</script>

<style scoped></style>
