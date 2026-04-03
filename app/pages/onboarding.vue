<template>
  <div>
    <Transition name="fade-slow" mode="out-in">
      <div
        v-if="show"
        key="onboarding-container"
        class="min-h-svh onboarding-gradient flex items-center justify-center pb-30 lg:pb-20 overflow-x-hidden"
      >
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
                }"
              ></div>
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
                <div
                  v-for="diet in dietOptions" :key="diet.id"
                  @click="toggleTag(diet.id)"
                  class="cell" :class="{ selected: selectedTagIds.has(diet.id) }"
                >{{ diet.label }}</div>
              </div>
            </div>

            <!-- Sorting Step -->
            <div v-if="currentStep === 'sorting'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">What matters most?</h2>
                <p class="text-gray-800/80 text-lg">What is most important to you for recipes?</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center overflow-y-auto">
                <div
                  v-for="sorting in sortingOptions" :key="sorting.label"
                  @click="selectSorting(sorting)"
                  class="cell" :class="{ selected: selectedSortingLabel === sorting.label }"
                >{{ sorting.label }}</div>
              </div>
            </div>

            <!-- Cuisines Step -->
            <div v-if="currentStep === 'cuisines'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Explore cuisines</h2>
                <p class="text-gray-800/80 text-lg">Which cuisines interest you?</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center md:mx-10">
                <div
                  v-for="cuisine in cuisineOptions" :key="cuisine.id"
                  @click="toggleTag(cuisine.id)"
                  class="cell" :class="{ selected: selectedTagIds.has(cuisine.id) }"
                >{{ cuisine.label }}</div>
              </div>
            </div>

            <!-- Equipment Step -->
            <div v-if="currentStep === 'equipment'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Your kitchen equipment</h2>
                <p class="text-gray-800/80 text-lg">Which specialty appliances do you own?</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center md:mx-6">
                <div
                  v-for="item in equipmentOptions" :key="item.id"
                  @click="toggleTag(item.id)"
                  class="cell" :class="{ selected: selectedTagIds.has(item.id) }"
                >{{ item.label }}</div>
              </div>
            </div>

            <!-- Foods Step -->
            <div v-if="currentStep === 'foods'" class="space-y-6 animate-slide-in">
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Favorite foods</h2>
                <p class="text-gray-800/80 text-lg">Select some foods that you like</p>
              </div>
              <div class="flex flex-wrap gap-3 justify-center">
                <div
                  v-for="food in foodOptions" :key="food.label"
                  @click="toggleFood(food)"
                  class="cell" :class="{ selected: selectedFoods.has(food.label) }"
                >{{ food.label }}</div>
              </div>
            </div>

            <!-- Username Step -->
            <div
              v-if="currentStep === 'username'"
              class="space-y-6 animate-slide-in"
            >
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">
                  Choose your username
                </h2>
                <p class="text-gray-800/80 text-lg">What should we call you?</p>
              </div>
              <div class="space-y-4 mx-2">
                <div>
                  <input
                    v-model="username"
                    type="text"
                    placeholder="Enter your username"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50 text-lg"
                  />
                </div>
              </div>
            </div>

            <!-- Register Form Step -->
            <div
              v-if="currentStep === 'registerForm'"
              class="space-y-6 animate-slide-in"
            >
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">
                  Create your account
                </h2>
                <p class="text-gray-800/80 text-lg">
                  Just a few more details to get started
                </p>
              </div>
              <div v-if="!error" class="mx-2 flex flex-col gap-4 items-center">
                <div class="w-full">
                  <input
                    v-model="email"
                    type="email"
                    placeholder="Email address"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50"
                  />
                </div>
                <div class="w-full">
                  <input
                    v-model="password"
                    type="password"
                    placeholder="Password"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50"
                  />
                </div>
                <div class="w-full">
                  <input
                    v-model="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    class="w-full px-6 py-4 bg-white/10 border border-gray-800/30 rounded-2xl text-gray-800 placeholder-gray-800/60 focus:outline-none focus:ring-2 focus:ring-gray-800/50"
                  />
                </div>
                <span class="text-gray-800/80 text-sm">OR</span>
                <button
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/40 hover:bg-white/90 border border-gray-800/30 rounded-2xl text-gray-700 transition-all duration-200"
                >
                  <img :src="'/google.webp'" class="w-5 h-5" alt="Google" />
                  <span class="font-medium">Sign up with Google</span>
                </button>
              </div>
              <div v-else class="mx-2 flex flex-col gap-4 items-center">
                <p class="text-red-500 text-lg">
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- Optional Step -->
            <div
              v-if="currentStep === 'optional'"
              class="space-y-6 animate-slide-in"
            >
              <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">
                  Complete your profile
                </h2>
                <p class="text-gray-800/80 text-lg">
                  Add a profile picture (Optional)
                </p>
              </div>
              <div
                @click="triggerFileInput"
                class="relative cursor-pointer w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-100 group hover:border-gray-600"
              >
                <IconCamera
                  class="w-12 text-gray-800 select-none pointer-events-none"
                />
                <input
                  ref="imgUpload"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="uploadProfilePicture"
                />
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between items-center mt-8">
            <button
              @click="previousStep"
              :disabled="currentStepIndex === 0"
              class="animated-button px-6 py-3 bg-primary-30/50 hover:bg-primary-20/30 disabled:opacity-50 rounded-full! border border-gray-800/30"
              :class="{ 'cursor-not-allowed': currentStepIndex === 0 }"
            >
              Previous
            </button>
            <button
              @click="skipToRegister"
              class="px-4 py-2 text-gray-800 transition-all duration-200 underline"
            >
              Skip ahead
            </button>
            <button
              @click="nextStep"
              :disabled="!canProceed"
              class="animated-button px-8 py-3 bg-primary-50/50 hover:bg-primary-20/50 disabled:opacity-50 rounded-full! border border-gray-800/30"
              :class="{ 'cursor-not-allowed': !canProceed }"
            >
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
const imgUpload = ref(null as any);

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

const show = ref(false);

onMounted(() => {
  show.value = true;
});

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
  'username',
  'registerForm',
  'optional',
];

const getButtonText = () => {
  switch (currentStep.value) {
    case 'registerForm':
      return 'Confirm';
    case 'optional':
      return 'Skip';
    default:
      return 'Next';
  }
};

const currentStepIndex = ref(0);
const currentStep = computed(() => steps[currentStepIndex.value]);

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'username':
      return username.value.trim().length > 0;
    case 'registerForm':
      return (
        email.value.trim().length > 0 &&
        password.value.length > 0 &&
        confirm_password.value === password.value
      );
    default:
      return true;
  }
});

const triggerFileInput = () => {
  imgUpload.value.click();
};

async function register() {
  const { data, error } = await supabase.auth.updateUser({
    email: email.value,
    password: password.value,
  });
  if (error || !data.user?.id) return;

  if (!username.value) username.value = email.value.split('@')[0] || '';

  const liked_tags = [
    ...[...selectedTagIds.value].filter((id) => !FILTER_TAG_IDS.has(id)),
    ...selectedSortingTags.value,
  ];
  const filter_tags = [...selectedTagIds.value].filter((id) =>
    FILTER_TAG_IDS.has(id)
  );

  const foodBookmarks = foodOptions
    .filter((f) => selectedFoods.value.has(f.label))
    .flatMap((f) => [
      { user_id: data.user.id, recipe_id: f.recipeId },
      { user_id: data.user.id, recipe_id: f.recipeId },
      { user_id: data.user.id, recipe_id: f.recipeId },
    ]);

  await Promise.all([
    addProfile(supabase, {
      id: data.user.id,
      username: username.value,
      liked_tags,
      filter_tags,
    }),
    foodBookmarks.length > 0
      ? supabase.from('bookmarks').insert(foodBookmarks)
      : Promise.resolve(),
  ]);
}

async function uploadProfilePicture(e: any) {
  const file = e.target.files[0];
  const id = auth.user?.id;
  if (!id || !file) navigateTo('/');
  const { data: imageData } = await useImageUpload(file, 'profile', id!, false);
  const url = imageData.value?.publicUrl;
  if (!url) return;
  await updateProfile(supabase, { picture: url, id });
  navigateTo('/');
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
      error.value = err as string;
      setTimeout(() => {
        navigateTo('/');
      }, 3000);
      return;
    }
  } else if (currentStep.value === 'optional') {
    navigateTo('/');
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
