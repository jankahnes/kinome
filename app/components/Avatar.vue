<template>
  <NuxtLink :to="link" active-class="[&>*]:shadow-none!">
    <Transition name="fade" mode="out-in">
      <Skeleton
        v-if="placeholder"
        class="rounded-full aspect-square transition-all duration-300"
      />

      <NuxtImg
        v-else-if="user?.picture"
        class="rounded-full aspect-square transition-all duration-300"
        :class="ring ? 'ring-2 ring-primary-500 ring-offset-2' : ''"
        :src="user.picture"
        :alt="user.username + '\'s profile picture'"
      />
      <div
        v-else-if="user?.username"
        class="rounded-full bg-primary-10 flex items-center justify-center aspect-square p-2 h-full transition-all duration-300"
        :class="ring ? 'ring-2 ring-primary-500 ring-offset-2' : ''"
      >
        <span class="font-semibold text-primary text-[100%]">
          {{ user.username.slice(0, 2).toUpperCase() }}
        </span>
      </div>
      <div
        v-else
        class="rounded-full bg-primary-10 flex items-center justify-center aspect-square overflow-hidden transition-all duration-300"
        :class="ring ? 'ring-2 ring-primary-500 ring-offset-2' : ''"
      >
        <img
          src="/guest.webp"
          class="w-full h-full object-cover"
          alt="Default guest profile picture"
        />
      </div>
    </Transition>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  user: User | FullUser | null;
  placeholder?: boolean;
  ring?: boolean;
}>();

const link = computed(() => {
  if (!props.user?.username) return '/onboarding';
  else {
    return '/profile/' + props.user?.id;
  }
});
</script>
