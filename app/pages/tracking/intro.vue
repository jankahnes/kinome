<template>
  <Transition name="fade-slow" mode="out-in">
    <div class="min-h-svh onboarding-gradient pb-10 flex flex-col px-4">
      <Transition name="loaded-content">
        <div class="pb-10 md:pb-0 flex-1 flex items-center justify-center">
          <HerocardsTracking />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts"></script>

<style scoped></style>
