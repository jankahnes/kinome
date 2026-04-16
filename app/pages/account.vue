<template>
  <div class="mx-4 sm:mx-10 mb-10 ">
    <div class="max-w-220 mt-8 mx-auto" v-if="!auth.profileFetched"></div>

    <div class="max-w-220 mt-8 mx-auto" v-else-if="auth.isUser()">
      <div class="flex flex-col gap-8">
        <div>
          <h1 class="text-5xl font-bold tracking-tight mt-1">Account Settings</h1>
          <p class="text-lg text-gray-500 ">
            Manage your avatar, username, and account access.
          </p>
        </div>

        <section class="bg-primary-10/40 rounded-4xl p-5 sm:p-8 flex flex-col gap-6">
          <div>
            <h2 class="text-3xl font-bold tracking-tight">Profile</h2>
          </div>

          <div class="flex flex-col lg:flex-row gap-8 lg:items-start">
            <div class="flex flex-col items-start gap-4 lg:w-64 shrink-0">
              <Avatar :user="previewUser" class="w-28 h-28" />
              <div>
                <div class="text-sm text-gray-400 uppercase tracking-wide">Current email</div>
                <div class="text-base font-medium break-all">{{ auth.user?.email }}</div>
              </div>
            </div>

            <div class="flex-1 flex flex-col gap-6">
              <div>
                <label for="username"
                  class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Username</label>
                <input id="username" v-model="username" type="text" maxlength="32"
                  class="mt-2 w-full rounded-3xl bg-white/80 px-5 py-4 text-2xl font-bold tracking-tight focus:outline-none"
                  placeholder="Choose a username" />
                <p class="text-sm text-gray-400 mt-2">Shown on your public profile and recipe activity.</p>
              </div>

              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Avatar</h3>
                  </div>
                  <p class="text-sm text-gray-400" v-if="ACCOUNT_AVATARS.length">{{ ACCOUNT_AVATARS.length }} available</p>
                </div>

                <div v-if="ACCOUNT_AVATARS.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <button v-for="avatar in ACCOUNT_AVATARS" :key="avatar.path" type="button"
                    class="group rounded-3xl p-2 bg-white/60 animated-button transition-all border-2"
                    :class="selectedAvatar === avatar.path ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'"
                    @click="selectedAvatar = avatar.path">
                    <img :src="avatar.path" :alt="avatar.name"
                      class="w-full aspect-square object-cover rounded-[20px]" />
                  </button>
                </div>
                <p v-else class="text-sm text-gray-400">No avatars found in `/public/avatars` yet.</p>
              </div>

              <div class="flex justify-end">
                <button type="button"
                  class="bg-primary text-white px-4 py-1 font-bold text-lg animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!hasProfileChanges || !isUsernameValid || savingProfile" @click="saveProfile">
                  {{ savingProfile ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </div>
        </section>
        <section>
          <div class="flex items-center justify-end gap-3 flex-wrap border-t border-black/8 pt-5">
            <NuxtLink to="/logout"
              class="bg-primary text-white px-4 py-1 font-bold text-lg animated-button rounded-full!">
              Log Out
            </NuxtLink>
            <button type="button"
              class="bg-red-100 text-red-700 px-4 py-1 font-bold text-lg animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="deletingAccount" @click="deleteModalOpen = true">
              {{ deletingAccount ? 'Deleting...' : 'Delete Account' }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <div class="max-w-160 mt-10 mx-auto text-center" v-else>
      <p class="text-red-500">You must be logged in to view this page.</p>
    </div>

    <BlocksModal v-model="deleteModalOpen">
      <div class="p-6 sm:p-8 w-[min(92vw,34rem)] flex flex-col gap-5">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-red-900">Delete Account</h2>
          <p class="text-gray-600 mt-2">
            This permanently removes your account. Type <span class="font-bold">DELETE</span> to confirm.
          </p>
        </div>

        <input v-model="deleteConfirmation" type="text"
          class="rounded-3xl bg-white px-5 py-4 text-xl font-bold tracking-tight focus:outline-none border border-red-200"
          placeholder="Type DELETE" />

        <div class="flex justify-end gap-3 flex-wrap">
          <button type="button" class="bg-primary-10 px-5 py-3 font-bold text-base animated-button rounded-full!"
            @click="closeDeleteModal">
            Cancel
          </button>
          <button type="button"
            class="bg-red-600 text-white px-6 py-3 font-bold text-base animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="deleteConfirmation.trim().toUpperCase() !== 'DELETE' || deletingAccount" @click="deleteAccount">
            {{ deletingAccount ? 'Deleting...' : 'Delete Account' }}
          </button>
        </div>
      </div>
    </BlocksModal>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const loadingStore = useLoadingStore();

const username = ref('');
const selectedAvatar = ref<string | null>(null);
const savingProfile = ref(false);
const deleteConfirmation = ref('');
const deletingAccount = ref(false);
const deleteModalOpen = ref(false);
const lastLoadedProfile = ref<string | null>(null);

const previewUser = computed(() => ({
  ...(auth.user as any),
  username: username.value || auth.user?.username || 'User',
  picture: selectedAvatar.value || auth.user?.picture || '',
}));

const isUsernameValid = computed(() => username.value.trim().length > 0);

const hasProfileChanges = computed(() => {
  return (
    username.value.trim() !== (auth.user?.username ?? '') ||
    (selectedAvatar.value ?? '') !== (auth.user?.picture ?? '')
  );
});

async function saveProfile() {
  if (!auth.user?.id || !hasProfileChanges.value || !isUsernameValid.value || savingProfile.value) return;

  savingProfile.value = true;
  const trimmedUsername = username.value.trim();

  const { error } = await supabase
    .from('profiles')
    .update({
      username: trimmedUsername,
      picture: selectedAvatar.value,
    })
    .eq('id', auth.user.id);

  savingProfile.value = false;

  if (error) {
    loadingStore.displayTransientToast('Failed to save account settings');
    console.error('Failed to update account settings:', error);
    return;
  }

  await auth.fetchProfile();
  loadingStore.displayTransientToast('Account settings saved');
}

async function deleteAccount() {
  if (deletingAccount.value) return;
  deletingAccount.value = true;

  try {
    await $fetch('/api/account/delete', {
      method: 'POST',
      body: {
        confirmation: deleteConfirmation.value,
      },
    });

    deleteConfirmation.value = '';
    deleteModalOpen.value = false;
    await auth.signOut();
    navigateTo('/');
  } catch (error) {
    console.error('Failed to delete account:', error);
    loadingStore.displayTransientToast('Failed to delete account');
  } finally {
    deletingAccount.value = false;
  }
}

function closeDeleteModal() {
  deleteModalOpen.value = false;
  deleteConfirmation.value = '';
}

watch(
  () => [auth.profileFetched, auth.user?.username, auth.user?.picture],
  ([profileFetched]) => {
    if (!profileFetched || !auth.user) return;
    const serialized = JSON.stringify({
      username: auth.user.username ?? '',
      picture: auth.user.picture ?? null,
    });
    if (serialized === lastLoadedProfile.value) return;

    username.value = auth.user.username ?? '';
    selectedAvatar.value = auth.user.picture ?? null;
    lastLoadedProfile.value = serialized;
  },
  { immediate: true },
);

useHead({
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
});
</script>
