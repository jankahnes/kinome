<template>
  <NuxtLink to="/" class="">
    <div class="flex items-center">
      <h1 class="text-5xl font-bold primary-gradient gradient-clip tracking-tighter z-10 gradient-text">
        kinome
      </h1>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts"></script>

<style scoped>
.gradient-text {
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  background-clip: text;
  color: transparent;
}
</style>
