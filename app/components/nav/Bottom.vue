<template>
  <div
    class="fixed bottom-0 left-0 right-0 bg-main text-slate-700 z-99 w-full flex justify-between items-center py-3 px-2 xs:px-6 rounded-t-4xl border-t-2 border-slate-200"
  >
    <NuxtLink
      v-for="link in sideLinks.slice(0, 2)"
      :key="link.path"
      :to="link.path"
      class="flex-1 flex justify-center"
      v-slot="{ isActive }"
    >
      <Icon
        :name="link.icon"
        :size="isActive ? 30 : 26"
        :strokeWidth="isActive ? 2.2 : 2"
      />
    </NuxtLink>
    <div class="flex-1 flex justify-center text-white">
      <div class="relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <NuxtLink to="/recipe/new?view=form" v-slot="{ isActive }">
            <button
              @click.prevent.stop="router.replace({ query: { view: 'form' } })"
              class="flex items-center justify-center sublink-circle sublink-circle-1 bg-primary-400 transition-colors duration-300"
              :class="[
                {
                  'sublink-active': isActive,
                  'bg-primary!': route.query.view === 'form',
                },
              ]"
            >
              <IconPencil class="w-5 h-5" strokeWidth="2.5" />
            </button>
            <button
              @click.prevent.stop="
                router.replace({ query: { view: 'import' } })
              "
              class="flex items-center justify-center sublink-circle sublink-circle-2 bg-primary-400 transition-colors duration-300"
              :class="[
                {
                  'sublink-active': isActive,
                  'bg-primary!': route.query.view === 'import',
                },
              ]"
            >
              <IconImport class="w-5 h-5" strokeWidth="2.5" />
            </button>
            <button
              @click.prevent.stop="
                router.replace({ query: { view: 'picture' } })
              "
              class="flex items-center justify-center sublink-circle sublink-circle-3 bg-primary-400 transition-colors duration-300"
              :class="[
                {
                  'sublink-active': isActive,
                  'bg-primary!': route.query.view === 'picture',
                },
              ]"
            >
              <IconEye class="w-5 h-5" strokeWidth="2.5" />
            </button>
          </NuxtLink>
        </div>
        <NuxtLink
          to="/recipe/new"
          class="rounded-full bg-primary h-15 w-15 flex items-center justify-center -mt-7 button-shadow shadow-primary-600 transition-all duration-300 will-change-transform relative z-2"
          active-class="scale-110"
          v-slot="{ isActive }"
        >
          <Icon name="add" :size="isActive ? 30 : 26" strokeWidth="2.2" />
        </NuxtLink>
      </div>
    </div>
    <NuxtLink
      v-for="link in sideLinks.slice(2)"
      :key="link.path"
      :to="link.path"
      class="flex-1 flex justify-center"
      v-slot="{ isActive }"
      active-class="icon-fill font-bold!"
    >
      <Icon
        :name="link.icon"
        :size="isActive ? 30 : 26"
        :strokeWidth="isActive ? 2.2 : 2"
      />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const sideLinks = [
  {
    name: 'Discover',
    icon: 'compass',
    path: '/',
  },
  {
    name: 'Kitchen',
    icon: 'chef-hat',
    path: '/kitchen/home',
  },

  {
    name: 'Tracking',
    icon: 'chart-line',
    path: '/tracking',
  },
  {
    name: 'Community',
    icon: 'users-round',
    path: '/community',
  },
];

const route = useRoute();
</script>

<style scoped>
.button-shadow {
  box-shadow: 0 0 14px var(--tw-shadow-color);
}

.sublink-circle {
  position: absolute;
  width: 42px;
  aspect-ratio: 1/1;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translate(0, 0);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
  pointer-events: none;
}

.sublink-circle.sublink-active {
  transform: translate(-50%, -50%) translate(var(--orbit-x), var(--orbit-y));
  opacity: 1;
  pointer-events: auto;
}

.sublink-circle-1 {
  --orbit-x: -48px;
  --orbit-y: -50px;
  transition-delay: 0s;
}

.sublink-circle-2 {
  --orbit-x: 0px;
  --orbit-y: -74px;
  transition-delay: 0.05s;
}

.sublink-circle-3 {
  --orbit-x: 48px;
  --orbit-y: -50px;
  transition-delay: 0.1s;
}
</style>
