<template>
  <div class="mt-8 mb-20 lg:pb-0 m-4 lg:mx-12">
    <div class="flex items-center gap-2 flex-wrap" v-if="!profileNotFound && !isOverviewPage">
      <NuxtLink v-for="view in views" :key="view.path" :to="view.path"
        class="subnav-pill"
        exact-active-class="active">
        <IconChevronLeft v-if="view.path === profilePath" class="w-4 h-4" />
        {{ view.displayName }}
      </NuxtLink>
    </div>
    <NuxtPage v-if="!profileNotFound" :transition="false" />
    <div v-else class="flex min-h-[70vh] items-center justify-center">
      <div class="flex flex-col items-center justify-center gap-2 text-center">
        <IconAlertCircle class="w-10 h-10 text-red-500" />
        <h2 class="text-3xl font-bold tracking-tighter">Profile not found</h2>
        <p class="text-lg text-gray-600">The profile you are looking for does not exist.</p>
        <NuxtLink to="/" class="bg-primary-5/80 flex items-center gap-0.5 main-button animated-button text-sm p-2">
          <span>Go to homepage</span>
          <IconChevronRight class="w-5" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const profileKey = computed(() => route.params.username as string);
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const user = ref<FullUser | null>(null);
const loading = ref(true);
const profileNotFound = ref(false);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let profileLoadId = 0;

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
  const loadId = ++profileLoadId;
  loading.value = true;
  user.value = null;
  profileNotFound.value = false;

  let resolvedUser: FullUser | null = null;

  if (auth.user?.username === profileKey.value || auth.user?.id === profileKey.value) {
    resolvedUser = auth.user;
  } else {
    resolvedUser = await getUserByUsername(supabase, profileKey.value);

    if (!resolvedUser && UUID_PATTERN.test(profileKey.value)) {
      const legacyUser = await getUser(supabase, profileKey.value);
      if (legacyUser?.username) {
        await navigateTo(getProfileUrl(legacyUser), { replace: true });
        resolvedUser = legacyUser;
      }
    }
  }

  if (loadId !== profileLoadId) return;

  user.value = resolvedUser;
  profileNotFound.value = !resolvedUser;

  if (resolvedUser?.username && route.path.startsWith(`/profile/${resolvedUser.id}`)) {
    await navigateTo(getProfileUrl(resolvedUser), { replace: true });
  }

  loading.value = false;
});

useHead({
  title: computed(() =>
    user.value?.username
      ? `${user.value.username} | Kinome`
      : profileNotFound.value
        ? 'Profile Not Found | Kinome'
        : 'User | Kinome',
  ),
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>

<style scoped></style>
