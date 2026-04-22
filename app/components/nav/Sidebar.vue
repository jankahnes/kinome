<template>
  <aside class="h-full main-card overflow-hidden transition-all duration-300">
    <div class="flex flex-col h-full justify-between p-4 gap-4">
      <div class="flex flex-col gap-10 ">
        <Logo class="mt-1 ml-1" />
        <NuxtLink :to="auth.isUser() ? getProfileUrl(auth.user) : '/onboarding'"
          class="shadow-sm bg-white rounded-3xl p-2 flex items-center gap-4">
          <Avatar :user="auth.user" class="w-12" :placeholder="!auth.profileFetched" />
          <div class="flex flex-col my-1" v-if="auth.isUser() && auth.profileFetched">
            <span class="text-[13px]">{{ auth.user?.username }}</span>
            <span class="text-[11px] text-gray-500">Sous Chef · Lv 13</span>
          </div>
          <div class="flex flex-col flex-1 -my-2 -mr-2" v-else-if="auth.profileFetched">
            <NuxtLink to="/login"
              class="main-button animated-button rounded-b-none! rounded-t-2xl! bg-primary-100/30! font-headers tracking-tight text-center text-sm py-1.5">
              Login</NuxtLink>
            <NuxtLink to="/onboarding"
              class="main-button animated-button rounded-t-none! rounded-b-2xl! bg-primary-100/60! font-headers italic! font-semibold tracking-tight text-sm py-1.5 text-center">
              Register</NuxtLink>
          </div>
        </NuxtLink>
        <div class="flex flex-col gap-1  transition-all duration-300">
          <NuxtLink v-for="item in navLinks" :key="item.to" :to="item.to"
            class="animated-button text-gray-600 items-center flex gap-2 p-2 rounded-2xl! transition-all"
            :active-class="'px-3 py-2.5 bg-[#201914] text-white'">
            <Icon :name="item.icon" class="w-5" :strokeWidth="2" />
            <span class="text-sm transition-all duration-300">{{ item.label
            }}</span>
          </NuxtLink>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="rounded-3xl bg-primary-50 p-4 space-y-1">
          <p class="text-[11px] font-mono uppercase font-light">COOK STREAK</p>
          <p class="text-2xl font-headers">{{ auth.cookStreak }}
            <span class="text-[11px] italic">{{ auth.cookStreak === 1 ? 'day' : 'days' }}</span>
          </p>
          <div class="flex items-center gap-1">
            <div v-for="i in 7" :key="i" class="flex-1 h-1 rounded-full"
              :class="i <= Math.min(auth.cookStreak, 7) ? 'bg-primary' : 'bg-gray-300'"></div>
          </div>
        </div>
        <span class="text-[10px] text-gray-600 font-mono ml-3 mb-2">kinome / v0.8</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const auth = useAuthStore();
defineProps<{
  toggleSidebar: () => void;
}>();

type NavLinkItem = {
  to: string;
  label: string;
  icon: string;
};

const navLinks: NavLinkItem[] = [
  { to: '/', label: 'Discover', icon: 'compass' },
  { to: '/kitchen/', label: 'Kitchen', icon: 'chef-hat' },
  { to: '/recipe/new', label: 'Create', icon: 'add' },
  { to: '/tracking', label: 'Meal tracking', icon: 'notebook-pen' },
  { to: '/feed', label: 'Feed', icon: 'rss' },
];
</script>
