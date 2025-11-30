<template>
  <NuxtLink to="/" class="">
    <div class="flex items-center">
      <NuxtImg src="/leaves.png" class="w-10 h-10 object-contain" />
      <h1
        class="text-5xl font-bold text-primary-500 tracking-tighter z-10 -ml-1"
      >
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
