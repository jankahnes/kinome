<template>
  <aside
    class="sidebar h-full bg-primary-10 rounded-r-2xl overflow-hidden transition-all duration-300 notch"
    id="sidebar"
  >
    <svg width="0" height="0" style="position: absolute">
      <defs>
        <clipPath id="sidebar-blob-cutout" clipPathUnits="objectBoundingBox">
          <path
            d="M 0,0 L 1,0 L 1,0.065 C 0.993,0.08 0.97,0.09 0.952,0.105 S 0.993,0.13 1,0.145 L 1,1 L 0,1 Z"
          />
        </clipPath>
      </defs>
    </svg>
    <div class="flex flex-col h-full justify-between">
      <div class="flex flex-col gap-16 pb-20">
        <div class="my-8 mx-auto pr-4">
          <Logo />
        </div>

        <div class="px-4">
          <div
            class="flex rounded-4xl gap-4 p-2 pr-6 items-center"
            v-if="auth.isUser()"
          >
            <Avatar
              :user="auth.user"
              class="rounded-full w-14"
              :placeholder="!auth.profileFetched"
              :ring="focusedIndex === 0 && sidebarNavigationActive"
              @click="onClickLink(accountLink)"
            />
            <div class="flex flex-col">
              <span
                class="text-lg text-wrap tracking-normal leading-none transition-all duration-300"
                >{{ auth.user?.username }}</span
              >
              <NuxtLink
                :to="`/profile/${auth.user?.id}`"
                class="flex items-center gap-1 text-gray-600"
              >
                <IconSettings class="w-4" />
                <span class="text-sm">Settings</span>
              </NuxtLink>
            </div>
          </div>
          <div
            class="flex gap-4 items-center transition-all duration-300"
            v-else
          >
            <Avatar
              :user="auth.user"
              class="rounded-full w-20 h-20"
              :placeholder="!auth.profileFetched"
              :ring="focusedIndex === 0 && sidebarNavigationActive"
              @click="onClickLink(accountLink)"
            />
            <Transition name="fade" mode="out-in">
              <Skeleton
                v-if="!auth.profileFetched"
                class="rounded-4xl w-2/3 h-8"
              />
              <span
                class="text-xl font-bold text-wrap tracking-normal leading-none transition-all duration-300"
                :class="{ 'text-3xl!': expanded }"
                v-else-if="auth.isUser()"
                >{{ auth.user!.username }}</span
              >
              <div class="flex flex-col gap-2" v-else>
                <NuxtLink
                  to="/login"
                  @click="onClickLink('/login')"
                  class="animated-button bg-primary-50 text-gray-800 px-4 py-2 font-bold tracking-tight leading-none flex items-center justify-center gap-2"
                  >Login</NuxtLink
                >
                <NuxtLink
                  to="/onboarding"
                  @click="onClickLink('/onboarding')"
                  class="animated-button bg-primary-200 text-gray-800 px-4 py-2 font-bold tracking-tight leading-none flex items-center justify-center gap-2"
                  >Register</NuxtLink
                >
              </div>
            </Transition>
          </div>
        </div>
        <div
          class="flex flex-col gap-4 p-6 transition-all duration-300"
          :class="{ 'mt-4': expanded }"
        >
          <NuxtLink
            to="/"
            class="animated-button text-gray-600 items-center flex gap-2 py-1 rounded transition-all"
            :class="{
              'ring-2 ring-primary-500 ring-offset-2':
                focusedIndex === 1 && sidebarNavigationActive,
            }"
            active-class="primary-gradient text-gray-800 px-3 py-2"
            @click="onClickLink('/')"
          >
            <IconCompass class="w-6 h-6" />
            <span
              class="text-lg font-bold! tracking-tight leading-none transition-all duration-300"
              >Discover</span
            >
          </NuxtLink>
          <NuxtLink
            to="/kitchen/home"
            class="animated-button text-gray-600 items-center flex gap-2 py-1 rounded transition-all"
            :class="{
              'ring-2 ring-primary-500 ring-offset-2':
                focusedIndex === 2 && sidebarNavigationActive,
              'primary-gradient text-gray-800 px-3 py-2':
                route.path.startsWith('/kitchen'),
            }"
            @click="onClickLink('/kitchen/home')"
          >
            <IconChefHat class="w-6 h-6" />
            <span
              class="text-lg font-bold! tracking-tight leading-none transition-all duration-300"
              >Kitchen</span
            >
          </NuxtLink>
          <NuxtLink
            to="/recipe/new"
            class="animated-button text-gray-600 items-center flex gap-2 py-1 rounded transition-all"
            :class="{
              'ring-2 ring-primary-500 ring-offset-2':
                focusedIndex === 3 && sidebarNavigationActive,
            }"
            active-class="primary-gradient text-gray-800 px-3 py-2"
            @click="onClickLink('/recipe/new')"
          >
            <IconPlus class="w-6 h-6" />
            <span
              class="text-lg font-bold! tracking-tight leading-none transition-all duration-300"
              >Create</span
            >
          </NuxtLink>

          <NuxtLink
            to="/tracking"
            class="animated-button text-gray-600 items-center flex gap-2 py-1 rounded transition-all"
            :class="{
              'ring-2 ring-primary-500 ring-offset-2':
                focusedIndex === 4 && sidebarNavigationActive,
            }"
            active-class="primary-gradient text-gray-800 px-3 py-2"
            @click="onClickLink('/tracking')"
          >
            <IconChartLine class="w-6 h-6" />
            <span
              class="text-lg font-bold! tracking-tight leading-none transition-all duration-300"
              >Meal tracking</span
            >
          </NuxtLink>

          <NuxtLink
            to="/community"
            class="animated-button text-gray-600 items-center flex gap-2 py-1 rounded transition-all"
            :class="{
              'ring-2 ring-primary-500 ring-offset-2':
                focusedIndex === 5 && sidebarNavigationActive,
            }"
            active-class="primary-gradient text-gray-800 px-3 py-2"
            @click="onClickLink('/community')"
          >
            <IconUsersRound class="w-6 h-6" />
            <span
              class="text-lg font-bold! tracking-tight leading-none transition-all duration-300"
              >Community</span
            >
          </NuxtLink>
        </div>
      </div>

      <!-- Illustration -->
      <div
        class="flex-shrink-0 flex items-end justify-center w-full max-w-62 self-center"
      >
        <NuxtImg
          src="/ill.webp"
          class="w-full"
          alt="Illustration of a home chef"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const route = useRoute();
defineProps<{
  toggleSidebar: () => void;
  onClickLink: (link: string) => void;
  expanded: boolean;
  sidebarNavigationActive: boolean;
}>();

const accountLink = computed(() => {
  if (!auth.user?.username) return '/onboarding';
  else {
    return '/profile/' + auth.user?.id;
  }
});

const linkPaths = computed(() => [
  {
    linkPath: auth.isUser() ? accountLink.value : '/onboarding',
    focusPath: auth.isUser() ? accountLink.value : '/onboarding',
  },
  {
    linkPath: '/',
  },
  {
    linkPath: '/kitchen/home',
    focusPath: '/kitchen',
  },
  {
    linkPath: '/recipe/new',
    focusPath: '/recipe/new',
  },
  {
    linkPath: '/tracking',
    focusPath: '/tracking',
  },
  {
    linkPath: '/community',
    focusPath: '/community',
  },
]);

const focusedIndex = ref(-1);

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    focusedIndex.value = Math.min(
      focusedIndex.value + 1,
      linkPaths.value.length - 1
    );
    e.preventDefault();
    const linkPath = linkPaths.value[focusedIndex.value];
    navigateTo(linkPath.linkPath);
  } else if (e.key === 'ArrowUp') {
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
    e.preventDefault();
    const linkPath = linkPaths.value[focusedIndex.value];
    navigateTo(linkPath.linkPath);
  }
};

const focusActiveLink = () => {
  const index = linkPaths.value.findIndex(
    (path) =>
      path.linkPath === route.path || route.path.startsWith(path.focusPath)
  );
  if (index == -1) {
    focusedIndex.value = 1;
  } else {
    focusedIndex.value = index;
  }
};

watch(() => route.path, focusActiveLink, { immediate: true });

defineExpose({
  handleKeydown,
});
</script>

<style scoped>
@media (min-width: 1024px) {
  .notch {
    clip-path: url(#sidebar-blob-cutout);
  }
}
</style>
