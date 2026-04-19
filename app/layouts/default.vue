<template>
  <div class="min-h-svh canvas text-[#201914] tracking-normal" ref="swipeContainer">
    <div class="relative">
      <Transition name="sidebar">
        <div v-if="sidebarOpen" ref="sidebarRef" class="fixed top-0 left-0 z-99 h-full" @click.stop>
          <NavSidebar class="w-62" :toggleSidebar="toggleSidebar" />
        </div>
      </Transition>

      <Transition name="fade-up">
        <NavBottom v-if="!isWideScreen && width" />
      </Transition>

      <div class="flex-1 flex flex-col min-h-svh">
        <div class="transition-all duration-300 flex-1 flex flex-col" :class="pageMarginLeft">
          <div class="flex-1 text-gray-900">
            <slot />
            <GlobalLoadingIndicator :left="pageMarginLeft" />
          </div>
          <GlobalToastArea />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

//init sidebar state using header heuristic
const headers = useRequestHeaders();
const userAgent = headers['user-agent'] || navigator.userAgent;
const isMobile = /iphone|android.+mobile|ipad|ipod/i.test(userAgent || '');

const sidebarOpen = ref(!isMobile);

const sidebarRef = ref<HTMLElement | null>(null);
const swipeContainer = ref<HTMLElement | null>(null);
const width = ref(0);
const isWideScreen = computed(() => width.value >= 1024);
const route = useRoute();



const pageMarginLeft = computed(() => {
  // if width is measured and not wide screen or not measured and mobile, return ml-0
  if ((width.value && !isWideScreen.value) || (!width.value && isMobile)) {
    return 'ml-0';
  }
  if (!sidebarOpen.value) {
    return 'ml-0';
  } else {
    return 'ml-60';
  }
});

const buttonMarginLeft = computed(() => {
  if (!sidebarOpen.value) return 'left-2';
  else {
    return 'left-[230px]';
  }
});

//logic: sidebar default closed, open >lg
const checkScreenSize = () => {
  width.value = document?.documentElement?.clientWidth;
  sidebarOpen.value = width.value >= 1024;
};

onMounted(async () => {
  checkScreenSize();
  auth.listenToAuthChanges();
  auth.fetchUser();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', checkScreenSize);
  }
});

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

</script>

<style>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-up-enter-to,
.fade-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.15s ease-in-out,
    transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
  transform: translateX(-60px);
}

.sidebar-enter-to,
.sidebar-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
