<template>
  <div class="mt-8 mb-20 lg:pb-0 m-4 lg:mx-12">
    <div class="flex items-center gap-2 flex-wrap" v-if="!isOverviewPage">
      <NuxtLink v-for="view in views" :key="view.path" :to="view.path"
        class="main-button animated-button flex items-center gap-1 bg-primary-5 px-3 py-2.5 shrink-0 text-xs text-gray-600"
        exact-active-class="bg-white shadow-xs">
        <IconChevronLeft v-if="view.path === profilePath" class="w-4 h-4" />
        {{ view.displayName }}
      </NuxtLink>
    </div>
    <NuxtPage :transition="false" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const profileKey = computed(() => route.params.username as string);
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const user = ref<FullUser | null>(null);
const loading = ref(true);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isOwn = computed(() =>
  Boolean(
    auth.user?.id &&
    (auth.user.username === profileKey.value || auth.user.id === profileKey.value),
  ),
);
const isAdmin = computed(() => auth.user?.id === '4771c2f9-d8e8-44e7-967b-74d1f4468e23');

const profilePath = computed(() => getProfileUrl(user.value ?? { username: profileKey.value }));
const isOverviewPage = computed(() => route.path === profilePath.value);

provide('profileUser', user);
provide('profileIsOwn', isOwn);
provide('profileIsAdmin', isAdmin);
provide('profileLoading', loading);

const views = computed(() => [
  { path: profilePath.value, displayName: 'Back to Overview' },
  { path: profilePath.value + '/recipes', displayName: 'Recipes' },
  { path: profilePath.value + '/bookmarks', displayName: 'Saved' },
  { path: profilePath.value + '/activity', displayName: 'Activity' },
]);

watchEffect(async () => {
  if (!auth.profileFetched) return;
  loading.value = true;

  if (auth.user?.username === profileKey.value || auth.user?.id === profileKey.value) {
    user.value = auth.user;
  } else {
    user.value = await getUserByUsername(supabase, profileKey.value);

    if (!user.value && UUID_PATTERN.test(profileKey.value)) {
      const legacyUser = await getUser(supabase, profileKey.value);
      if (legacyUser?.username) {
        await navigateTo(getProfileUrl(legacyUser), { replace: true });
        user.value = legacyUser;
      }
    }
  }

  if (user.value?.username && route.path.startsWith(`/profile/${user.value.id}`)) {
    await navigateTo(getProfileUrl(user.value), { replace: true });
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
