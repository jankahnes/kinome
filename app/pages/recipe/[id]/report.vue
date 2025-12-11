<template>
  <div class="my-6 mx-auto sm:ml-20 sm:mr-10">
    <PagesReport :id="id" :isFood="false" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const paramValue = route.params.id as string;
const id = paramValue.split('-')[0];
</script>

<style scoped></style>
