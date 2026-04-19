<template>
  <div class="mt-8">
    <div v-if="loading">
      <div class="flex-wrap gap-4 sm:gap-6 hidden md:flex">
        <Skeleton v-for="i in 6" :key="i" class="min-w-65 basis-65 max-w-100 h-92 flex-1 rounded-xl" />
      </div>
      <div class="flex flex-col gap-4 md:hidden">
        <Skeleton v-for="i in 4" :key="i" class="w-full h-28 rounded-xl" />
      </div>
    </div>

    <template v-else>
      <div v-if="isSignatureSelectionMode && signatureEligibleRecipes.length !== 0"
        class="main-card main-card-rounded mb-6 flex flex-col gap-4 px-5 py-5 sm:px-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase  text-gray-400">Signature recipe</p>
            <h2 class="text-3xl font-bold tracking-tighter">Choose a recipe to sign</h2>
            <p class="mt-1 text-sm text-gray-500">
              Pick one of your original recipes and add your signature for display on your profile.
            </p>
          </div>
          <NuxtLink :to="'/profile/' + user?.id"
            class="main-button animated-button self-start rounded-full bg-primary-5 px-4 py-2 text-sm font-semibold text-gray-700">
            Back to profile
          </NuxtLink>
        </div>
      </div>

      <div v-if="isSignatureSelectionMode && signatureEligibleRecipes.length === 0"
        class="main-card main-card-rounded flex flex-col items-start gap-4 px-5 py-6 sm:px-6">
        <div>
          <h3 class="text-2xl font-bold tracking-tighter">No qualifying recipes yet</h3>
          <p class="mt-1 text-sm text-gray-500">
            Create an original recipe directly in Kinome first, then come back here to sign it.
          </p>
        </div>
        <NuxtLink to="/recipe/new"
          class="main-button animated-button rounded-full bg-primary px-5 py-3 font-semibold text-white">
          Create a recipe
        </NuxtLink>
      </div>

      <!-- Desktop grid -->
      <div v-else class="flex-wrap gap-4 sm:gap-6 hidden md:flex justify-stretch items-end">
        <!-- Add recipe CTA (own profile only) -->
        <NuxtLink v-if="isOwn && !isSignatureSelectionMode" to="/recipe/new"
          class="main-button animated-button basis-65 max-w-80 max-w-3xl:max-w-110 3xl:basis-85 flex-1 text-[30px] flex flex-col gap-3 justify-center items-center border-2 border-primary main-card-rounded! bg-primary-5/50 h-85">
          <div class="rounded-full primary-gradient p-3 text-white flex items-center justify-center">
            <IconPlus class="w-6" strokeWidth="3" />
          </div>
          <p class="font-semibold text-lg">New Recipe</p>
        </NuxtLink>
        <template v-if="isSignatureSelectionMode">
          <div v-for="recipe in signatureEligibleRecipes" :key="recipe.id"
            class="basis-65 max-w-80 max-w-3xl:max-w-110 3xl:basis-85 flex flex-1 flex-col gap-3">
            <div class="relative">
              <RecipeCard :recipe="recipe"
                class="basis-65 max-w-80 max-w-3xl:max-w-110 3xl:basis-85 flex-1 text-[30px]" />
              <div v-if="currentSignatureRecipeId === recipe.id"
                class="pointer-events-none absolute left-4 top-4 rounded-full bg-primary-5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 shadow z-40">
                Current signature
              </div>
            </div>
            <button type="button"
              class="main-button animated-button self-end rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              @click="openSignatureModal(recipe)">
              {{ currentSignatureRecipeId === recipe.id ? 'Re-sign' : 'Choose' }}
            </button>
          </div>
        </template>
        <template v-else>
          <RecipeCard v-for="recipe in recipes" :key="recipe.id" :recipe="recipe"
            class="basis-65 max-w-80 max-w-3xl:max-w-110 3xl:basis-85 flex-1 text-[30px]" />
        </template>
      </div>

      <!-- Mobile list -->
      <div v-if="!(isSignatureSelectionMode && signatureEligibleRecipes.length === 0)"
        class="flex flex-col gap-3 md:hidden">
        <NuxtLink v-if="isOwn && !isSignatureSelectionMode" to="/recipe/new"
          class="main-button animated-button flex items-center gap-3 p-4 outline-2 outline-primary rounded-2xl! bg-primary-5/50">
          <div class="rounded-full primary-gradient p-2 text-white flex items-center justify-center">
            <IconPlus class="w-4" strokeWidth="3" />
          </div>
          <p class="font-semibold">New Recipe</p>
        </NuxtLink>
        <template v-if="isSignatureSelectionMode">
          <div v-for="recipe in signatureEligibleRecipes" :key="recipe.id" class="flex flex-col gap-2">
            <div class="relative">
              <RecipeCardHorizontal :recipe="recipe" />
              <div v-if="currentSignatureRecipeId === recipe.id"
                class="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 shadow">
                Current
              </div>
            </div>
            <button type="button"
              class="main-button animated-button self-end rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              @click="openSignatureModal(recipe)">
              {{ currentSignatureRecipeId === recipe.id ? 'Re-sign' : 'Choose' }}
            </button>
          </div>
        </template>
        <template v-else>
          <RecipeCardHorizontal v-for="recipe in recipes" :key="recipe.id" :recipe="recipe" />
        </template>
      </div>

    </template>
  </div>

  <ProfileSignatureRecipeModal v-model="signatureModalOpen" :recipe="selectedRecipe" @saved="handleSignatureSaved" />
</template>

<script setup lang="ts">
const user = inject<Ref<FullUser | null>>('profileUser');
const isOwn = inject<ComputedRef<boolean>>('profileIsOwn');
const loading = inject<Ref<boolean>>('profileLoading');
const auth = useAuthStore();
const route = useRoute();

const signatureModalOpen = ref(false);
const selectedRecipe = ref<RecipeOverview | null>(null);

const recipes = computed(() =>
  [...(user?.value?.recipes ?? [])].sort((a, b) => (b.relevancy ?? 0) - (a.relevancy ?? 0))
);

const isSignatureSelectionMode = computed(() =>
  isOwn?.value && route.query.mode === 'signature'
);

const signatureEligibleRecipes = computed(() =>
  recipes.value.filter((recipe) =>
    recipe.user_id === user?.value?.id &&
    recipe.source_type !== 'MEDIA' &&
    recipe.source_type !== 'WEBSITE'
  )
);

const currentSignatureRecipeId = computed(() => user?.value?.signature_recipe ?? null);

function openSignatureModal(recipe: RecipeOverview) {
  selectedRecipe.value = recipe;
  signatureModalOpen.value = true;
}

async function handleSignatureSaved(payload: { recipeId: number }) {
  if (user?.value) {
    user.value.signature_recipe = payload.recipeId;
  }

  if (auth.user?.id === user?.value?.id && auth.user) {
    auth.user.signature_recipe = payload.recipeId;
  }

  await navigateTo('/profile/' + user?.value?.id);
}
</script>

<style scoped></style>
