<template>
  <div class="pb-20 lg:pb-0 m-4 lg:m-8 lg:ml-20">
    <div class="flex items-center gap-2 flex-wrap" v-if="!isOverviewPage">
      <NuxtLink v-for="view in views" :key="view.path" :to="view.path"
        class="animated-button bg-primary-10/60 px-3 py-2 flex gap-1 items-center"
        exact-active-class="bg-primary/80">
        <IconChevronLeft v-if="view.path === '/profile/' + userID" class="w-4 h-4" />
        {{ view.displayName }}
      </NuxtLink>
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
const isAdmin = computed(() => auth.user?.id === '4771c2f9-d8e8-44e7-967b-74d1f4468e23');

const route = useRoute();

const isOverviewPage = computed(() => route.path === '/profile/' + userID);

provide('profileUser', user);
provide('profileIsOwn', isOwn);
provide('profileIsAdmin', isAdmin);
provide('profileLoading', loading);

const views = computed(() => [
  { path: '/profile/' + userID, displayName: 'Back to Overview' },
  { path: '/profile/' + userID + '/recipes', displayName: 'Recipes' },
  { path: '/profile/' + userID + '/bookmarks', displayName: 'Saved' },
  { path: '/profile/' + userID + '/activity', displayName: 'Activity' },
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
