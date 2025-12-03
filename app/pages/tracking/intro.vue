<template>
  <Transition name="fade-slow" mode="out-in">
    <div class="min-h-svh onboarding-gradient flex items-center justify-center pb-10">
      <Transition name="loaded-content">
        <div class="flex-1 flex items-center justify-center pb-10 md:pb-0">
          <HerocardsTracking />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts"></script>

<style scoped></style>
