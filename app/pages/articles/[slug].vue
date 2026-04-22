<template>
  <div class="mt-10 mb-20 m-4 sm:mx-10 lg:ml-22 lg:mr-18">
    <div class="max-w-3xl mx-auto">
      <!-- Back link -->
      <NuxtLink to="/feed"
        class="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
        <IconChevronLeft class="w-4 h-4" />
        Back to Feed
      </NuxtLink>

      <template v-if="article">
        <!-- Hero -->
        <div class="main-card-rounded overflow-hidden mb-8">
          <div class="h-48 sm:h-64 bg-gradient-to-br flex items-center justify-center text-7xl sm:text-8xl"
            :class="article.gradient">
            {{ article.emoji }}
          </div>
        </div>

        <!-- Meta -->
        <div class="flex items-center gap-3 text-sm text-gray-400 mb-4">
          <span class="uppercase tracking-wider font-medium">{{ article.category }}</span>
          <span>&middot;</span>
          <span>{{ article.readTime }}</span>
          <span>&middot;</span>
          <span>{{ formatDate(article.date) }}</span>
        </div>

        <!-- Title -->
        <h1 class="text-3xl sm:text-5xl font-bold tracking-tight mb-8 leading-tight">
          {{ article.title }}
        </h1>

        <!-- Content -->
        <div class="article-prose">
          <ContentRenderer :value="article" />
        </div>
      </template>

      <div v-else class="space-y-4">
        <Skeleton class="h-64 main-card-rounded" />
        <Skeleton class="h-8 w-2/3 rounded-xl" />
        <Skeleton class="h-6 w-1/3 rounded-xl" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = String(route.params.slug);

const { data: article } = await useAsyncData(
  `article-${route.params.slug}`,
  () => queryCollection('articles').path(`/articles/${slug}`).first(),
);

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' });
}

useHead({
  title: `${article.value?.title} - Kinome`,
  meta: [
    {
      key: 'description',
      name: 'description',
      content: article.value?.excerpt,
    },
  ],
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: `https://kinome.app/articles/${slug}`,
    },
  ],
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<style scoped>
.article-prose :deep(h1) {
  display: none;
}

.article-prose :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.article-prose :deep(h3) {
  font-size: 1.2rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.article-prose :deep(p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
  color: #374151;
}

.article-prose :deep(strong) {
  font-weight: 700;
}

.article-prose :deep(ul),
.article-prose :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.article-prose :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
  color: #374151;
}

.article-prose :deep(ul li) {
  list-style-type: disc;
}

.article-prose :deep(ol li) {
  list-style-type: decimal;
}

.article-prose :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: 1rem;
  margin: 1.5rem 0;
  color: #6b7280;
  font-style: italic;
}

.article-prose :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0;
}
</style>
