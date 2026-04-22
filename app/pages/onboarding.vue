<template>
  <div>
    <Transition name="fade-slow" mode="out-in">
      <div v-if="show" key="onboarding-container"
        class="min-h-svh onboarding-gradient flex items-center justify-center pb-30 lg:pb-20 overflow-x-hidden">
        <div class="p-8 max-w-2xl w-full">
          <NuxtLink to="/" class="text-gray-800 opacity-70 ml-2">
            <IconChevronLeft class="" />
          </NuxtLink>
          <!-- Progress Bar -->
          <div class="mb-8 mt-8">
            <div class="w-full bg-white/20 rounded-full h-2">
              <div
                class="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                :style="{
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                }"></div>
            </div>
          </div>

          <div class="min-h-[410px] md:min-h-[350px]">
            <!-- Diet Step -->
            <div v-if="currentStep === 'diet'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Let's get you started!</h2>
                <p class="text-gray-800/80 text-lg">What diet do you currently follow?</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center sm:mx-10">
                <div v-for="diet in dietOptions" :key="diet.id" @click="toggleTag(diet.id)" class="cell"
                  :class="{ selected: selectedTagIds.has(diet.id) }">{{ diet.label }}</div>
              </div>
            </div>

            <!-- Sorting Step -->
            <div v-if="currentStep === 'sorting'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">What matters most?</h2>
                <p class="text-gray-800/80 text-lg">What is most important to you for recipes?</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center overflow-y-auto">
                <div v-for="sorting in sortingOptions" :key="sorting.label" @click="selectSorting(sorting)" class="cell"
                  :class="{ selected: selectedSortingLabel === sorting.label }">{{ sorting.label }}</div>
              </div>
            </div>

            <!-- Cuisines Step -->
            <div v-if="currentStep === 'cuisines'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Explore cuisines</h2>
                <p class="text-gray-800/80 text-lg">Which cuisines interest you?</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center md:mx-10">
                <div v-for="cuisine in cuisineOptions" :key="cuisine.id" @click="toggleTag(cuisine.id)" class="cell"
                  :class="{ selected: selectedTagIds.has(cuisine.id) }">{{ cuisine.label }}</div>
              </div>
            </div>

            <!-- Equipment Step -->
            <div v-if="currentStep === 'equipment'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Your kitchen equipment</h2>
                <p class="text-gray-800/80 text-lg">Which specialty appliances do you own?</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center md:mx-6">
                <div v-for="item in equipmentOptions" :key="item.id" @click="toggleTag(item.id)" class="cell"
                  :class="{ selected: selectedTagIds.has(item.id) }">{{ item.label }}</div>
              </div>
            </div>

            <!-- Foods Step -->
            <div v-if="currentStep === 'foods'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Favorite foods</h2>
                <p class="text-gray-800/80 text-lg">Select some foods that you like</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center">
                <div v-for="food in foodOptions" :key="food.label" @click="toggleFood(food)" class="cell"
                  :class="{ selected: selectedFoods.has(food.label) }">{{ food.label }}</div>
              </div>
            </div>

            <!-- Register Form Step -->
            <form v-if="currentStep === 'registerForm'" class="space-y-6 animate-slide-in" @submit.prevent="nextStep">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">
                  Create your account
                </h2>
                <p class="text-gray-800/80 text-lg">
                  Just a few more details to get started
                </p>
              </div>
              <div class="mx-2 flex flex-col gap-4 items-center">
                <div class="w-full">
                  <input v-model="username" type="text" placeholder="Username" autocomplete="username"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50" />
                  <p class="text-xs text-gray-800/60 mt-1 px-2">3-32 letters, numbers, or underscores.</p>
                </div>
                <div class="w-full">
                  <input v-model="email" type="email" placeholder="Email address" autocomplete="email"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50" />
                </div>
                <div class="w-full">
                  <input v-model="password" type="password" placeholder="Password" autocomplete="new-password"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50" />
                </div>
                <div class="w-full">
                  <input v-model="confirm_password" type="password" placeholder="Confirm password" autocomplete="new-password"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50" />
                </div>
                <p v-if="error" class="w-full rounded-2xl bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {{ error }}
                </p>
                <button type="submit" class="hidden" :disabled="!canProceed || registrationLoading">
                  Create account
                </button>
                <span class="text-gray-800/80 text-sm">OR</span>
                <button
                  type="button"
                  @click="signUpWithGoogle"
                  :disabled="registrationLoading"
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/40 hover:bg-white/90 border border-gray-800/30 rounded-2xl text-gray-700 transition-all duration-200">
                  <img :src="'/google.webp'" class="w-5 h-5" alt="Google" />
                  <span class="font-medium">Sign up with Google</span>
                </button>
              </div>
            </form>

            <!-- Optional Step -->
            <div v-if="currentStep === 'optional'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">
                  Complete your profile
                </h2>
                <p class="text-gray-800/80 text-lg">
                  Choose an avatar
                </p>
              </div>
              <div v-if="ACCOUNT_AVATARS.length" class="grid grid-cols-3 sm:grid-cols-5 gap-3">
                <button v-for="avatar in ACCOUNT_AVATARS" :key="avatar.path" type="button"
                  class="group rounded-3xl p-2 bg-white/40 main-button animated-button transition-all border-2"
                  :class="selectedAvatar === avatar.path ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'"
                  @click="selectedAvatar = avatar.path">
                  <img :src="avatar.path" :alt="avatar.name" class="w-full aspect-square object-cover rounded-[20px]" />
                </button>
              </div>
              <div v-else class="text-center text-sm text-gray-700">
                No avatars found.
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between items-center mt-8">
            <button v-if="!accountCreated" @click="previousStep" :disabled="currentStepIndex === 0"
              class="main-button animated-button px-6 py-3 bg-primary-30/50 hover:bg-primary-20/30 disabled:opacity-50 rounded-full! border border-gray-800/30"
              :class="{ 'cursor-not-allowed': currentStepIndex === 0 }">
              Previous
            </button>
            <span v-else></span>
            <button v-if="showSkipAhead" @click="skipToRegister"
              class="px-4 py-2 text-gray-800 transition-all duration-200 underline">
              Skip ahead
            </button>
            <span v-else></span>
            <button @click="nextStep" :disabled="!canProceed || registrationLoading"
              class="main-button animated-button px-8 py-3 bg-primary-50/50 hover:bg-primary-20/50 disabled:opacity-50 rounded-full! border border-gray-800/30"
              :class="{ 'cursor-not-allowed': !canProceed || registrationLoading }">
              {{ getButtonText() }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
useHead({
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
});

const auth = useAuthStore();

// Unified tag selection for diet, cuisines, and equipment
const selectedTagIds = ref(new Set<number>());
// Sorting maps one choice to multiple tag IDs
const selectedSortingTags = ref<number[]>([]);
const selectedSortingLabel = ref<string | null>(null);
// Foods are label-based until hidden recipes are wired
const selectedFoods = ref(new Set<string>());

const supabase = useSupabaseClient<Database>();

const username = ref('');
const email = ref('');
const password = ref('');
const confirm_password = ref('');
const error = ref<string | null>(null);
const registrationLoading = ref(false);
const accountCreated = ref(false);
const oauthProfileCompletionStarted = ref(false);
const selectedAvatar = ref<string | null>(ACCOUNT_AVATARS[0]?.path ?? null);

const show = ref(false);

onMounted(() => {
  show.value = true;
  completePendingOAuthProfile();
});

watch(
  () => [auth.user?.id, auth.user?.is_anonymous, auth.profileFetched],
  () => {
    completePendingOAuthProfile();
  },
);

// Hard dietary constraints applied in recommendations (recipe must have this tag)
const FILTER_TAG_IDS = new Set([102, 103, 107]); // vegan, vegetarian, gluten free

const dietOptions = [
  { label: '🌱 Vegan', id: 102 },
  { label: '🥦 Vegetarian', id: 103 },
  { label: '🥩 Keto', id: 113 },
  { label: '💪 High Protein', id: 104 },
  { label: '🦴 Carnivore', id: 119 },
  { label: '🌾 Gluten Free', id: 107 },
];

const sortingOptions = [
  { label: '😋 I want recipes that are delicious!', tags: [] as number[] },
  { label: '🥗 I want recipes that are healthy!', tags: [100] },
  { label: '💰 I want recipes that are cheap!', tags: [4] },
  { label: '🍳 I want recipes that are quick and easy!', tags: [2, 3] },
  { label: '🌍 I want recipes that expand my culinary horizons!', tags: [] as number[] },
];

const cuisineOptions = [
  { id: 302, label: '🍝 Italian' },
  { id: 303, label: '🥨 German' },
  { id: 304, label: '🍔 American' },
  { id: 305, label: '🍜 Vietnamese' },
  { id: 306, label: '🥟 Chinese' },
  { id: 307, label: '🍱 Japanese' },
  { id: 308, label: '🥐 French' },
  { id: 309, label: '🫖 British' },
  { id: 326, label: '🌮 Mexican' },
  { id: 310, label: '🍛 Indian' },
  { id: 311, label: '🥘 Spanish' },
  { id: 312, label: '🧆 Middle Eastern' },
  { id: 313, label: '🌶️ Thai' },
  { id: 321, label: '🍲 Korean' },
];

const foodOptions = [
  { label: '🍕 Pizza', recipeId: 1446 },
  { label: '🍣 Sushi', recipeId: 1447 },
  { label: '🍫 Chocolate', recipeId: 1448 },
  { label: '🍔 Burger', recipeId: 1449 },
  { label: '🥩 Steak', recipeId: 1450 },
  { label: '🍛 Curry', recipeId: 1451 },
  { label: '🍜 Ramen', recipeId: 1452 },
  { label: '🌮 Tacos', recipeId: 1453 },
  { label: '🍤 Shrimp', recipeId: 1454 },
  { label: '🥗 Salad', recipeId: 1455 },
  { label: '🍝 Pasta', recipeId: 1456 },
  { label: '🐟 Salmon', recipeId: 1457 },
];

const equipmentOptions = [
  { id: 400, label: '🌪️ Air Fryer' },
  { id: 401, label: '⚡ Instant Pot' },
  { id: 402, label: '🍲 Slow Cooker' },
  { id: 403, label: '🤖 Thermomix' },
  { id: 404, label: '🍰 Stand Mixer' },
  { id: 405, label: '🍦 Ice Cream Machine' },
  { id: 406, label: '🌡️ Sous Vide' },
  { id: 407, label: '🧇 Waffle Iron' },
  { id: 408, label: '☀️ Dehydrator' },
  { id: 409, label: '🔵 Cast Iron' },
  { id: 410, label: '🫕 Dutch Oven' },
  { id: 411, label: '🥢 Wok' },
  { id: 412, label: '🍞 Bread Machine' },
  { id: 413, label: '🔥 Smoker' },
  { id: 414, label: '🍚 Rice Cooker' },
];

const steps = [
  'diet',
  'sorting',
  'cuisines',
  'equipment',
  'foods',
  'registerForm',
  'optional',
];

const getButtonText = () => {
  switch (currentStep.value) {
    case 'registerForm':
      return registrationLoading.value ? 'Creating...' : 'Create account';
    case 'optional':
      return 'Finish';
    default:
      return 'Next';
  }
};

const currentStepIndex = ref(0);
const currentStep = computed(() => steps[currentStepIndex.value]);
const usernamePattern = /^[a-zA-Z0-9_]{3,32}$/;
const isUsernameValid = computed(() =>
  usernamePattern.test(username.value.trim()),
);
const showSkipAhead = computed(() => {
  const foodsIndex = steps.findIndex((step) => step === 'foods');
  return currentStepIndex.value <= foodsIndex;
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'registerForm':
      return (
        isUsernameValid.value &&
        email.value.trim().length > 0 &&
        password.value.length > 0 &&
        confirm_password.value === password.value
      );
    default:
      return true;
  }
});

function getProfilePayload(userId: string) {
  const liked_tags = [
    ...[...selectedTagIds.value].filter((id) => !FILTER_TAG_IDS.has(id)),
    ...selectedSortingTags.value,
  ];
  const filter_tags = [...selectedTagIds.value].filter((id) =>
    FILTER_TAG_IDS.has(id)
  );

  return {
    id: userId,
    username: username.value.trim(),
    normalized_username: normalizeUsername(username.value),
    picture: selectedAvatar.value ?? ACCOUNT_AVATARS[0]?.path ?? null,
    liked_tags,
    filter_tags,
  };
}

function getFoodBookmarks(userId: string) {
  const foodBookmarks = foodOptions
    .filter((f) => selectedFoods.value.has(f.label))
    .flatMap((f) => [
      { user_id: userId, recipe_id: f.recipeId },
      { user_id: userId, recipe_id: f.recipeId },
      { user_id: userId, recipe_id: f.recipeId },
    ]);

  return foodBookmarks;
}

function formatAuthError(err: any) {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  if (err.code && err.message) return `${err.code}: ${err.message}`;
  return err.message ?? JSON.stringify(err);
}

async function assertAccountAvailable() {
  const lookup = await $fetch<{
    usernameTaken: boolean;
    emailTaken: boolean;
  }>('/api/auth/lookup', {
    method: 'POST',
    body: {
      username: username.value.trim(),
      email: email.value.trim(),
    },
  });

  if (lookup.usernameTaken) {
    throw new Error('Username is already taken.');
  }

  if (lookup.emailTaken) {
    throw new Error('Email is already in use.');
  }
}

async function saveOnboardingProfile(userId: string) {
  const foodBookmarks = getFoodBookmarks(userId);

  await Promise.all([
    addProfile(supabase, getProfilePayload(userId)),
    foodBookmarks.length > 0
      ? supabase.from('bookmarks').insert(foodBookmarks)
      : Promise.resolve(),
  ]);
}

function usernameFromEmail(email?: string | null) {
  const localPart = email?.split('@')[0] ?? 'user';
  const candidate = localPart
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);

  return usernamePattern.test(candidate) ? candidate : 'user';
}

async function isUsernameTaken(candidate: string) {
  const lookup = await $fetch<{ usernameTaken: boolean }>('/api/auth/lookup', {
    method: 'POST',
    body: { username: candidate },
  });

  return lookup.usernameTaken;
}

async function generateAvailableUsername(email?: string | null) {
  const base = usernameFromEmail(email);
  if (!(await isUsernameTaken(base))) return base;

  for (let i = 0; i < 8; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const candidate = `${base.slice(0, 32 - suffix.length)}${suffix}`;
    if (!(await isUsernameTaken(candidate))) return candidate;
  }

  const fallbackSuffix = Date.now().toString().slice(-6);
  return `${base.slice(0, 32 - fallbackSuffix.length)}${fallbackSuffix}`;
}

async function register() {
  registrationLoading.value = true;
  error.value = null;

  try {
    await assertAccountAvailable();

    const { data, error: signUpError } = await auth.signUp(
      email.value.trim(),
      password.value,
    );

    if (signUpError) throw signUpError;
    if (!data.user?.id) throw new Error('Sign-up did not return a user.');

    await saveOnboardingProfile(data.user.id);
    await auth.fetchProfile();
    accountCreated.value = true;
  } catch (err: any) {
    error.value = formatAuthError(err);
    throw err;
  } finally {
    registrationLoading.value = false;
  }
}

function storePendingOAuthProfile() {
  localStorage.setItem(
    'kinome:onboarding:pendingProfile',
    JSON.stringify({
      username: username.value.trim(),
      normalizedUsername: normalizeUsername(username.value),
      selectedAvatar: selectedAvatar.value,
      selectedTagIds: [...selectedTagIds.value],
      selectedSortingTags: selectedSortingTags.value,
      selectedFoods: [...selectedFoods.value],
    }),
  );
}

function restorePendingOAuthProfile() {
  const raw = localStorage.getItem('kinome:onboarding:pendingProfile');
  if (!raw) return false;

  try {
    const pending = JSON.parse(raw);
    username.value = pending.username ?? '';
    selectedAvatar.value = pending.selectedAvatar ?? ACCOUNT_AVATARS[0]?.path ?? null;
    selectedTagIds.value = new Set<number>(pending.selectedTagIds ?? []);
    selectedSortingTags.value = pending.selectedSortingTags ?? [];
    selectedFoods.value = new Set<string>(pending.selectedFoods ?? []);
    return true;
  } catch {
    localStorage.removeItem('kinome:onboarding:pendingProfile');
    return false;
  }
}

async function signUpWithGoogle() {
  if (registrationLoading.value) return;

  registrationLoading.value = true;
  error.value = null;

  try {
    const typedUsername = username.value.trim();

    if (typedUsername) {
      if (!isUsernameValid.value) {
        error.value = 'Username must be 3-32 letters, numbers, or underscores.';
        return;
      }

      if (await isUsernameTaken(typedUsername)) {
        error.value = 'Username is already taken.';
        return;
      }
    }

    storePendingOAuthProfile();
    await auth.signInWithGoogle('/onboarding?oauth=google');
  } catch (err: any) {
    error.value = formatAuthError(err);
  } finally {
    registrationLoading.value = false;
  }
}

async function completePendingOAuthProfile() {
  if (!import.meta.client) return;
  if (!auth.user?.id || auth.user.is_anonymous) return;
  if (oauthProfileCompletionStarted.value) return;
  const restored = restorePendingOAuthProfile();
  if (!restored || accountCreated.value) return;

  oauthProfileCompletionStarted.value = true;
  registrationLoading.value = true;
  error.value = null;

  try {
    if (!username.value.trim()) {
      username.value = await generateAvailableUsername(auth.user.email);
    }

    await saveOnboardingProfile(auth.user.id);
    localStorage.removeItem('kinome:onboarding:pendingProfile');
    await auth.fetchProfile();
    accountCreated.value = true;
    currentStepIndex.value = steps.findIndex((step) => step === 'optional');
  } catch (err: any) {
    error.value = formatAuthError(err);
  } finally {
    registrationLoading.value = false;
    oauthProfileCompletionStarted.value = false;
  }
}

const toggleTag = (id: number) => {
  if (selectedTagIds.value.has(id)) {
    selectedTagIds.value.delete(id);
  } else {
    selectedTagIds.value.add(id);
  }
};

const selectSorting = (sorting: { label: string; tags: number[] }) => {
  selectedSortingTags.value = sorting.tags;
  selectedSortingLabel.value = sorting.label;
  nextStepDelay();
};

const toggleFood = (food: { label: string }) => {
  if (selectedFoods.value.has(food.label)) {
    selectedFoods.value.delete(food.label);
  } else {
    selectedFoods.value.add(food.label);
  }
};

const nextStep = async () => {
  if (currentStep.value === 'registerForm') {
    try {
      await register();
    } catch (err) {
      return;
    }
  } else if (currentStep.value === 'optional') {
    if (auth.user?.id && selectedAvatar.value) {
      await updateProfile(supabase, {
        id: auth.user.id,
        picture: selectedAvatar.value,
      });
      await auth.fetchProfile();
    }
    await navigateTo('/kitchen');
    return;
  }
  currentStepIndex.value++;
};

const nextStepDelay = () => {
  setTimeout(() => {
    nextStep();
  }, 200);
};

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
};

const skipToRegister = () => {
  const registerIndex = steps.findIndex((step) => step === 'registerForm');
  if (registerIndex > -1) {
    currentStepIndex.value = registerIndex;
  }
};
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(30%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
