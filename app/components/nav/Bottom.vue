<template>
  <nav
    class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary-5 z-99 min-w-80 w-[66%] rounded-full shadow-[0_0_10px_0_rgba(0,0,0,0.08)] overflow-hidden">
    <div class="grid items-center gap-1 transition-[grid-template-columns] duration-300 ease-out"
      :style="{ gridTemplateColumns }">
      <NuxtLink v-for="link in sideLinks" :key="link.path" :to="link.path"
        class="relative flex items-center justify-center h-10 rounded-full text-gray-700 overflow-hidden"
        :class="isActive(link.path) ? 'bg-primary text-white' : ''">
        <div class="flex items-center justify-center gap-1.5 px-3 whitespace-nowrap">
          <Icon :name="link.icon" :size="22" :strokeWidth="2" class="shrink-0" />
          <span class="text-sm font-headers overflow-hidden transition-opacity duration-150 ease-out"
            :class="isActive(link.path) ? 'opacity-100 max-w-30' : 'opacity-0 max-w-0'">
            {{ link.name }}
          </span>
        </div>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();

const sideLinks = [
  { name: 'Discover', icon: 'compass', path: '/' },
  { name: 'Kitchen', icon: 'chef-hat', path: '/kitchen' },
  { name: 'New', icon: 'add', path: '/recipe/new/import' },
  { name: 'Tracking', icon: 'notebook-pen', path: '/tracking' },
  { name: 'Feed', icon: 'rss', path: '/feed' },
];

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === path;
  }
  if (path === '/recipe/new/import') {
    return route.path.startsWith('/recipe/new');
  }
  return route.path.startsWith(path);
};

const gridTemplateColumns = computed(() =>
  sideLinks.map((l) => (isActive(l.path) ? '2.2fr' : '1fr')).join(' ')
);
</script>
