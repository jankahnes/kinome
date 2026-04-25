<template>
  <aside class="h-full main-card overflow-hidden transition-all duration-300">
    <div class="flex flex-col h-full justify-between p-4 gap-4">
      <div class="flex flex-col gap-10 ">
        <Logo class="mt-1 ml-1" />
        <NuxtLink :to="auth.isUser() ? getProfileUrl(auth.user) : '/onboarding'"
          class="shadow-sm bg-white rounded-3xl p-2 flex items-center gap-4 overflow-hidden">
          <Avatar :user="auth.user" class="w-12" :placeholder="!auth.profileFetched" />
          <div class="flex flex-col my-1" v-if="auth.isUser() && auth.profileFetched">
            <span class="text-[13px]">{{ auth.user?.username }}</span>
            <span class="text-[11px] text-gray-500">{{ levelDisplay.title }} · Lv {{ levelDisplay.level }}</span>
          </div>
          <div class="flex flex-col flex-1 -my-2 -mr-3" v-else-if="auth.profileFetched">
            <NuxtLink to="/login"
              class="main-button animated-button rounded-b-none! rounded-t-2xl! bg-primary-100/30! font-headers tracking-tight text-center text-sm py-1.5 pr-2">
              Login</NuxtLink>
            <NuxtLink to="/onboarding"
              class="main-button animated-button rounded-t-none! rounded-b-2xl! bg-primary-100/60! font-headers italic! font-semibold tracking-tight text-sm py-1.5 text-center pr-2">
              Register</NuxtLink>
          </div>
        </NuxtLink>
        <div class="flex flex-col gap-1  transition-all duration-300">
          <NuxtLink v-for="item in navLinks" :key="item.to" :to="item.to"
            class="animated-button text-gray-600 items-center flex gap-2 p-2 rounded-2xl! transition-all"
            :class="isActive(item.to) ? 'px-3 py-2.5 bg-dark text-white' : ''">
            <Icon :name="item.icon" class="w-5" :strokeWidth="2" />
            <span class="text-sm transition-all duration-300">{{ item.label
            }}</span>
          </NuxtLink>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <!-- Logged-in: cook streak -->
        <div v-if="auth.isUser()" class="rounded-3xl bg-primary-50 p-4 space-y-1">
          <p class="text-[11px] font-mono uppercase font-light">COOK STREAK</p>
          <p class="text-2xl font-headers">{{ auth.cookStreak }}
            <span class="text-[11px] italic">{{ auth.cookStreak === 1 ? 'day' : 'days' }}</span>
          </p>
          <div class="flex items-center gap-1">
            <div v-for="i in 7" :key="i" class="flex-1 h-1 rounded-full"
              :class="i <= Math.min(auth.cookStreak, 7) ? 'bg-primary' : 'bg-gray-300'"></div>
          </div>
        </div>

        <!-- Logged-out variant 1: direct value prop -->
        <NuxtLink v-else-if="LOGGED_OUT_VARIANT === 1" to="/onboarding"
          class="block rounded-3xl bg-primary-50 p-4 space-y-1.5 animated-button">
          <p class="text-[11px] font-mono uppercase font-light">YOUR KITCHEN</p>
          <p class="text-[15px] font-headers leading-tight">Save recipes &amp; track what you cook.</p>
          <p class="text-[11px] font-mono uppercase text-primary pt-1">Get started →</p>
        </NuxtLink>

        <!-- Logged-out variant 3: For You preview (ghost / blurred) -->
        <NuxtLink v-else-if="LOGGED_OUT_VARIANT === 2" to="/onboarding"
          class="block rounded-3xl bg-primary-50/70 p-4 space-y-2 animated-button overflow-hidden">
          <p class="text-[11px] font-mono uppercase font-light">FOR YOU</p>
          <div class="space-y-1.5">
            <div v-for="(w, i) in [55, 80]" :key="i" class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-primary-100 blur-[2px] shrink-0"></div>
              <div class="flex-1 space-y-1">
                <div class="h-1.5 rounded-full bg-primary-100/80 blur-[1.5px]" :style="{ width: w + '%' }"></div>
                <div class="h-1.5 rounded-full bg-primary-100/50 blur-[1.5px]" :style="{ width: (w - 25) + '%' }"></div>
              </div>
            </div>
          </div>
          <p class="text-[11px] font-mono uppercase text-primary pt-1">Unlock your picks →</p>
        </NuxtLink>

        <!-- Logged-out variant 4: archetype tease -->
        <NuxtLink v-else-if="LOGGED_OUT_VARIANT === 3" to="/onboarding"
          class="block rounded-3xl bg-primary-50 p-4 space-y-2 animated-button">
          <p class="text-[11px] font-mono uppercase font-light">YOUR ARCHETYPE</p>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <Icon name="chef-hat" :size="20" :strokeWidth="2" class="text-primary" />
            </div>
            <p class="text-[13px] font-headers leading-tight">What kind of cook are you?</p>
          </div>
          <p class="text-[11px] font-mono uppercase text-primary pt-1">Find out →</p>
        </NuxtLink>

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

// 1 = direct value prop, 2 = For You ghost preview, 3 = archetype tease
const LOGGED_OUT_VARIANT = 2;

type NavLinkItem = {
  to: string;
  label: string;
  icon: string;
};

const route = useRoute();

const levelDisplay = computed(() => getLevelInfo(Number(auth.user?.xp ?? 0)));

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === path;
  }
  if (path === '/recipe/new/import') {
    return route.path === path || route.path.startsWith('/recipe/new');
  }
  return route.path.startsWith(path);
};

const navLinks: NavLinkItem[] = [
  { to: '/', label: 'Discover', icon: 'compass' },
  { to: '/kitchen/', label: 'Kitchen', icon: 'chef-hat' },
  { to: '/recipe/new/import', label: 'Create', icon: 'add' },
  { to: '/tracking', label: 'Meal tracking', icon: 'notebook-pen' },
  { to: '/feed', label: 'Feed', icon: 'rss' },
];
</script>
