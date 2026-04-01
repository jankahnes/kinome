<template>
  <div class="pb-20 lg:pb-0 m-4 lg:m-8 lg:ml-20">
    <div class="flex items-center gap-2 flex-wrap justify-between">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink v-for="view in views" :key="view.path" :to="view.path" class="animated-button bg-primary-10 px-3 py-2"
          active-class="primary-gradient text-gray-800 px-3 py-2">
          {{ view.displayName }}
        </NuxtLink>
      </div>
    </div>
    <NuxtPage :transition="false" />
  </div>
</template>

<script setup lang="ts">
const userID = useRoute().params.id as string;

const views = computed(() => [
  { path: '/profile/' + userID + '/recipes', displayName: '🛎️ Recipes' },
  { path: '/profile/' + userID + '/activity', displayName: '🎯 Activity' },
  { path: '/profile/' + userID + '/settings', displayName: '⚙️ Settings' },
  ...(auth.user?.id === userID
    ? [{ path: '/logout', displayName: '🚪 Log Out' }]
    : []),
]);
const selectedView = ref('recipes');
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const user = ref<FullUser | null>(null);
const loading = ref(true);

watchEffect(() => {
  if (selectedView.value === 'logout') {
    auth.signOut();
    navigateTo('/');
    return;
  }
});

watchEffect(async () => {
  if (!auth.profileFetched) return;
  if (auth.user?.id === userID) {
    user.value = auth.user;
  } else {
    user.value = await getUser(supabase, userID);
  }
  loading.value = false;
});

useHead({
  title: computed(() =>
    user.value?.username ? `${user.value.username} | Kinome` : 'User | Kinome',
  ),
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
});
</script>

<style scoped></style>
