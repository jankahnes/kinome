<template>
  <div class="lg:ml-20 overflow-y-visible max-w-screen-xl m-4 lg:m-8">
    <div class="flex flex-col gap-10 ">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink v-for="view in views" :key="view.value" :to="view.route"
          class="animated-button bg-primary-10 px-3 py-2"
          exact-active-class="primary-gradient text-gray-800 px-3 py-2">
          {{ view.displayName }}
        </NuxtLink>
      </div>

      <Transition name="view-transition" mode="out-in">
        <div v-if="isLoading" key="loading" class="flex flex-col items-center mt-[20vh] gap-6 flex-1">
          <img src="/loading.png" class="h-8 w-8" alt="Loading icon" />
          <Transition name="fade-up">
            <p class="italic" v-if="loadingMessage">
              {{ loadingMessage }}
            </p>
          </Transition>
        </div>
        <div v-else key="page" class="flex-1">
          <NuxtPage :transition="false" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const supabase = useSupabaseClient<Database>();
const job = ref<{ id: number } | null>(null);
const route = useRoute();
const publish = ref(false);

const views: {
  value: string;
  displayName: string;
  icon?: string;
  route: string;
}[] = [
    {
      value: 'form',
      displayName: 'Create',
      route: '/recipe/new',
    },
    {
      value: 'import',
      displayName: 'Import',
      route: '/recipe/new/import',
    },
    {
      value: 'picture',
      displayName: 'Scan',
      route: '/recipe/new/scan',
    },
  ];

const isLoading = ref(false);
const loadingMessage = ref('');

const submitFromNaturalLanguage = async (recipe: BaseRecipe) => {
  isLoading.value = true;
  job.value = await createJob(
    supabase,
    'natural-language',
    'formalizing_ingredients'
  );
  setTimeout(() => {
    loadingMessage.value = '🔍 Gathering ingredients...';
  }, 5000);
  submitBaseRecipe(recipe);
};

const submitFromPreparsed = async (recipe: ComputableRecipe) => {
  isLoading.value = true;
  recipe.batch_size = recipe.serves > 1 ? recipe.serves : null;
  const response = await $fetch('/api/create-recipe/upload-processed-recipe', {
    method: 'POST',
    body: {
      ...recipe,
      full: false,
    },
  });
  if (response.status !== 'ok') {
    isLoading.value = false;
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create recipe',
    });
  }
  if (getPublishingRequirements(recipe).hasInstructions) {
    job.value = await createJob(
      supabase,
      'preparsed',
      'formalizing_instructions'
    );
    $fetch('/api/create-recipe/postprocess-instructions', {
      method: 'POST',
      body: {
        recipeId: response.id,
        jobId: job.value?.id,
        publish: publish.value,
      },
    });
    navigateTo(
      getRecipeUrl(response.id, recipe.title ?? '') + `?poll=${job.value?.id}`
    );
  } else {
    navigateTo(getRecipeUrl(response.id, recipe.title ?? ''));
  }
};

const generateUrlVariations = (url: string | null | undefined) => {
  if (!url) return [];
  try {
    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`;

    return [url, `https://${baseUrl}`, `http://${baseUrl}`, baseUrl].filter(
      (variation, index, arr) => arr.indexOf(variation) === index
    );
  } catch {
    return [url];
  }
};

const submitFromLink = async (link: string) => {
  isLoading.value = true;
  const urlVariations = [
    ...new Set([
      ...generateUrlVariations(link),
      ...generateUrlVariations(cleanUrl(link)),
    ]),
  ];

  const recipes = await getRecipeOverviews(supabase, {
    in: { source: urlVariations },
  });
  if (recipes.length > 0) {
    const recipe = recipes[0]!;
    isLoading.value = false;
    navigateTo(getRecipeUrl(recipe.id, recipe.title ?? ''));
    return;
  }

  const supportedVideoSites = ['youtube', 'youtu.be', 'tiktok', 'instagram'];
  if (supportedVideoSites.some((site) => link.includes(site))) {
    job.value = await createJob(supabase, 'media', 'formalizing_ingredients');
    setTimeout(() => {
      loadingMessage.value = '🔍 Analyzing your video...';
    }, 5000);
    const baseRecipe = (await $fetch('/api/create-recipe/base-from-video', {
      method: 'POST',
      body: {
        url: link,
        args: {
          source_type: 'MEDIA',
          source: link,
        },
      },
    })) as BaseRecipe;
    submitBaseRecipe(baseRecipe);
  } else {
    job.value = await createJob(supabase, 'link', 'formalizing_ingredients');
    setTimeout(() => {
      loadingMessage.value = '🔍 Analyzing website...';
    }, 5000);
    const baseRecipe = (await $fetch('/api/create-recipe/base-from-link', {
      method: 'POST',
      body: {
        link: link,
        args: {
          source_type: 'WEBSITE',
          source: link,
        },
      },
    })) as BaseRecipe;
    submitBaseRecipe(baseRecipe);
  }
};

const submitFromPicture = async (file: File) => {
  isLoading.value = true;
  job.value = await createJob(supabase, 'picture', 'formalizing_ingredients');
  setTimeout(() => {
    loadingMessage.value = '🔍 Analyzing your picture...';
  }, 5000);
  const formData = new FormData();
  formData.append('image', file);
  formData.append(
    'args',
    JSON.stringify({
      source_type: 'PICTURE',
      source: null,
    })
  );

  const baseRecipe = (await $fetch('/api/create-recipe/base-from-picture', {
    method: 'POST',
    body: formData,
  })) as BaseRecipe;

  submitBaseRecipe(baseRecipe);
};

const submitBaseRecipe = async (baseRecipe: BaseRecipe) => {
  baseRecipe.user_id = auth.user?.id ?? null;
  baseRecipe.batch_size = baseRecipe.serves > 1 ? baseRecipe.serves : null;
  const { id } = await $fetch('/api/create-recipe/upload-base-recipe', {
    method: 'POST',
    body: {
      baseRecipe: baseRecipe,
    },
  });
  if (!id) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload recipe',
    });
  }
  $fetch('/api/create-recipe/postprocess-base-recipe', {
    method: 'POST',
    body: {
      recipeId: id,
      jobId: job.value?.id,
      publish: publish.value,
    },
  });
  navigateTo(
    getRecipeUrl(id, baseRecipe.title ?? '') + `?poll=${job.value?.id}`
  );
};

provide('submitFromPreparsed', submitFromPreparsed);
provide('submitFromNaturalLanguage', submitFromNaturalLanguage);
provide('submitFromLink', submitFromLink);
provide('submitFromPicture', submitFromPicture);

onMounted(async () => {
  if (route.query.link) {
    const validUrl = new URL(route.query.link as string);
    if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
      isLoading.value = true;
      await auth.fetchUser();
      submitFromLink(validUrl.href);
    }
  }
});

useHead({
  title: 'Create a new recipe | Kinome',
});
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease-out;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.view-transition-enter-active,
.view-transition-leave-active {
  transition: all 0.2s ease;
}

.view-transition-enter-from,
.view-transition-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

.view-transition-enter-to,
.view-transition-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
