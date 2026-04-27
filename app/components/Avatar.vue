<template>
  <div class="inline-block">
    <Transition name="fade" mode="out-in">
      <Skeleton v-if="placeholder" class="rounded-full aspect-square transition-all duration-300" />

      <img v-else-if="user?.picture"
        class="rounded-full aspect-square w-full h-full object-cover transition-all duration-300" :src="user.picture"
        :alt="user.username + '\'s profile picture'" />
      <div v-else-if="user?.username"
        class="@container rounded-full bg-slate-200/80 flex items-center justify-center aspect-square w-full p-2 h-full transition-all duration-300">
        <span class="font-semibold leading-none text-[42cqi]">
          {{ user.username.slice(0, 2).toUpperCase() }}
        </span>
      </div>
      <div v-else
        class="rounded-full bg-primary-5 flex items-center justify-center aspect-square overflow-hidden transition-all duration-300">
        <img src="/guest.webp" class="w-full h-full object-cover" alt="Default guest profile picture" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  user: User | FullUser | null;
  placeholder?: boolean;
}>();
</script>
