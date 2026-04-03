<template>
  <div class="pb-20 lg:pb-0 m-4 lg:m-8 lg:ml-20">
    <div class="flex items-center gap-2 flex-wrap justify-between">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink
          v-for="view in views"
          :key="view.path"
          :to="view.path"
          class="animated-button bg-primary-10 px-3 py-2"
          exact-active-class="primary-gradient text-gray-800 px-3 py-2"
        >
          {{ view.displayName }}
        </NuxtLink>
      </div>
    </div>
    <NuxtPage :transition="false" />
  </div>
</template>

<script setup lang="ts">
const userID = useRoute().params.id as string;
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const user = ref<FullUser | null>(null);
const loading = ref(true);

const isOwn = computed(() => auth.user?.id === userID);

provide('profileUser', user);
provide('profileIsOwn', isOwn);
provide('profileLoading', loading);

const views = computed(() => [
  { path: '/profile/' + userID, displayName: 'Overview' },
  { path: '/profile/' + userID + '/recipes', displayName: 'Recipes' },
  { path: '/profile/' + userID + '/bookmarks', displayName: 'Saved' },
  { path: '/profile/' + userID + '/activity', displayName: 'Activity' },
  ...(isOwn.value
    ? [{ path: '/profile/' + userID + '/settings', displayName: 'Settings' }]
    : []),
  ...(isOwn.value
    ? [{ path: '/logout', displayName: 'Log Out' }]
    : []),
]);

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
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>

<style scoped></style>
