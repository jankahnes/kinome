<template>
  <div class="overflow-y-visible mb-20 m-4 md:my-10 md:mx-16">
    <div class="flex flex-col gap-10 ">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink v-for="view in views" :key="view.value" :to="view.route" class="subnav-pill"
          exact-active-class="active">
          {{ view.displayName }}
        </NuxtLink>
        <NuxtLink to="/recipe-analyzer"
          class="main-button animated-button px-3 py-2 shrink-0 text-xs text-gray-600 flex items-center gap-1">
          Analyzer
          <IconChevronRight class="h-4 w-4" :stroke-width="1.5" />
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

const views: {
  value: string;
  displayName: string;
  icon?: string;
  route: string;
}[] = [
    {
      value: 'import',
      displayName: 'Import',
      route: '/recipe/new/import',
    },
    {
      value: 'form',
      displayName: 'Create',
      route: '/recipe/new',
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
      },
    });
    navigateTo(
      getRecipeUrl(response.id, recipe.title ?? '') + `?poll=${job.value?.id}`
    );
  } else {
    navigateTo(getRecipeUrl(response.id, recipe.title ?? ''));
  }
};

const submitFromLink = async (link: string) => {
  isLoading.value = true;
  const supportedVideoSites = ['youtube', 'youtu.be', 'tiktok', 'instagram'];
  const isVideoLink = supportedVideoSites.some((site) => link.includes(site));

  // Two-pass duplicate check: direct match against recipes.source +
  // recipe_sources, then for short video links a resolve + recheck (and a
  // best-effort alt-source cache write on hit). Same logic powers the
  // agent-side handleCheckUrlExists.
  const existing = await findExistingRecipeByUrl(supabase, link, {
    resolveShortUrls: true,
  });
  if (existing) {
    isLoading.value = false;
    navigateTo(getRecipeUrl(existing.id, existing.title ?? ''));
    return;
  }

  if (isVideoLink) {
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
  title: 'Create Recipes | Kinome',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Create, import, or scan recipes with AI-assisted ingredient parsing, nutrition analysis, and health scoring from Kinome.',
    },
    {
      key: 'og:title',
      property: 'og:title',
      content: 'Create Recipes | Kinome',
    },
    {
      key: 'og:description',
      property: 'og:description',
      content: 'Create, import, or scan recipes with AI-assisted ingredient parsing, nutrition analysis, and health scoring from Kinome.',
    },
    {
      key: 'og:type',
      property: 'og:type',
      content: 'website',
    },
    {
      key: 'og:url',
      property: 'og:url',
      content: 'https://kinome.app/recipe/new',
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: 'https://kinome.app/recipe/new',
    },
  ],
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
