<template>
  <div class="mt-8 max-w-2xl">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col gap-0">
      <div v-for="i in 5" :key="i" class="flex gap-0">
        <div class="flex flex-col items-center w-8 flex-shrink-0">
          <Skeleton class="w-3 h-3 rounded-full mt-1.5" />
          <div v-if="i < 5" class="w-px flex-1 bg-gray-200 mt-1" />
        </div>
        <div class="pb-7 pl-4 flex-1 flex gap-3 items-start">
          <Skeleton class="w-8 h-8 rounded-xl flex-shrink-0" />
          <div class="flex flex-col gap-1.5 flex-1">
            <Skeleton class="h-4 w-48 rounded" />
            <Skeleton class="h-3 w-28 rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div v-else-if="groupedActivity.length > 0" class="flex flex-col">
      <div v-for="(group, gi) in groupedActivity" :key="group.label">
        <!-- Date label -->
        <div class="flex gap-0 items-center mb-1">
          <div class="w-8 flex-shrink-0 flex justify-center">
            <div class="w-px h-3 bg-gray-200" :class="{ 'opacity-0': gi === 0 }" />
          </div>
          <span class="pl-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {{ group.label }}
          </span>
        </div>

        <!-- Items in this group -->
        <div v-for="(item, i) in group.items" :key="item.id" class="flex gap-0">
          <!-- Dot + line -->
          <div class="flex flex-col items-center w-8 flex-shrink-0">
            <div class="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10 ring-2 ring-white"
              :class="dotColor(item.type)" />
            <div v-if="i < group.items.length - 1 || gi < groupedActivity.length - 1"
              class="w-px flex-1 bg-gray-200 mt-1" />
          </div>

          <!-- Content -->
          <component :is="linkTarget(item) ? NuxtLink : 'div'" v-bind="linkTarget(item) ? { to: linkTarget(item) } : {}"
            class="pb-6 pl-4 flex-1 flex gap-3 items-start group" :class="{ 'cursor-pointer': !!linkTarget(item) }">
            <!-- Icon bubble -->
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              :class="iconBg(item.type)">
              <component :is="activityIcon(item.type)" class="w-4" :class="iconColor(item.type)" />
            </div>

            <!-- Text -->
            <div class="flex flex-col gap-0.5 flex-1">
              <p class="text-sm leading-snug">
                <span class="text-gray-500">{{ actionText(item) }}</span>
                <span v-if="targetTitle(item)" class="font-semibold text-gray-800"
                  :class="{ 'group-hover:underline decoration-primary underline-offset-1': !!linkTarget(item) }">
                  {{ ' ' + targetTitle(item) }}
                </span>
              </p>

              <!-- Comment quote -->
              <p v-if="item.type === 'COMMENT_CREATION' && item.comment?.content"
                class="text-sm italic text-gray-500 line-clamp-1 mt-0.5">
                "{{ item.comment.content }}"
              </p>

              <!-- Star rating -->
              <div v-if="item.type === 'RATING_CREATION' && item.rating?.rating" class="mt-0.5">
                <FormsRatingField :model-value="item.rating.rating" :star-width="14" :star-height="14" :spacing="1"
                  :select="false" :uniqueId="'activity-' + item.id" />
              </div>

              <time class="text-xs text-gray-400 mt-0.5" :datetime="item.created_at">
                {{ timeAgo(item.created_at) }}
              </time>
            </div>
          </component>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center gap-4 py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-primary-5 flex items-center justify-center">
        <IconActivity class="w-7 text-primary" />
      </div>
      <div>
        <p class="text-lg font-semibold">No activity yet</p>
        <p class="text-gray-400 text-sm mt-1">
          Activity will appear here when recipes are created, rated, or commented on.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';

const user = inject<Ref<FullUser | null>>('profileUser');
const loading = inject<Ref<boolean>>('profileLoading');

type ActivityType = 'COMMENT_CREATION' | 'RECIPE_CREATION' | 'RATING_CREATION' | 'USER_CREATION' | 'FOOD_CREATION';

function dotColor(type: string) {
  switch (type as ActivityType) {
    case 'RECIPE_CREATION': return 'bg-primary';
    case 'COMMENT_CREATION': return 'bg-blue-400';
    case 'RATING_CREATION': return 'bg-amber-400';
    case 'USER_CREATION': return 'bg-purple-400';
    case 'FOOD_CREATION': return 'bg-teal-400';
    default: return 'bg-gray-300';
  }
}

function iconBg(type: string) {
  switch (type as ActivityType) {
    case 'RECIPE_CREATION': return 'bg-primary-5';
    case 'COMMENT_CREATION': return 'bg-blue-50';
    case 'RATING_CREATION': return 'bg-amber-50';
    case 'USER_CREATION': return 'bg-purple-50';
    case 'FOOD_CREATION': return 'bg-teal-50';
    default: return 'bg-gray-100';
  }
}

function iconColor(type: string) {
  switch (type as ActivityType) {
    case 'RECIPE_CREATION': return 'text-primary';
    case 'COMMENT_CREATION': return 'text-blue-500';
    case 'RATING_CREATION': return 'text-amber-500';
    case 'USER_CREATION': return 'text-purple-500';
    case 'FOOD_CREATION': return 'text-teal-500';
    default: return 'text-gray-400';
  }
}

function activityIcon(type: string) {
  switch (type as ActivityType) {
    case 'RECIPE_CREATION': return resolveComponent('IconChefHat');
    case 'COMMENT_CREATION': return resolveComponent('IconMessageCircle');
    case 'RATING_CREATION': return resolveComponent('IconStar');
    case 'USER_CREATION': return resolveComponent('IconSparkles');
    case 'FOOD_CREATION': return resolveComponent('IconLeaf');
    default: return resolveComponent('IconActivity');
  }
}

function actionText(item: Activity): string {
  switch (item.type as ActivityType) {
    case 'RECIPE_CREATION':
      if (item.recipe?.source_type === 'PREPARSED' || item.recipe?.source_type === 'TEXT') return 'Created ';
      return 'Added ';
    case 'COMMENT_CREATION': return 'Commented on ';
    case 'RATING_CREATION': return 'Rated ';
    case 'USER_CREATION': return 'Joined the community';
    case 'FOOD_CREATION': return 'Added ';
    default: return 'Activity';
  }
}

function targetTitle(item: Activity): string {
  switch (item.type as ActivityType) {
    case 'RECIPE_CREATION': return item.recipe?.title ?? '';
    case 'COMMENT_CREATION': return item.comment?.recipe?.title ?? '';
    case 'RATING_CREATION': return item.rating?.recipe?.title ?? '';
    case 'FOOD_CREATION': return item.food?.name ?? '';
    default: return '';
  }
}

function linkTarget(item: Activity): string | null {
  switch (item.type as ActivityType) {
    case 'RECIPE_CREATION':
      return item.recipe?.id ? getRecipeUrl(item.recipe.id, item.recipe.title) : null;
    case 'COMMENT_CREATION':
      return item.comment?.recipe?.id ? getRecipeUrl(item.comment.recipe.id, item.comment.recipe.title) : null;
    case 'RATING_CREATION':
      return item.rating?.recipe?.id ? getRecipeUrl(item.rating.recipe.id, item.rating.recipe.title) : null;
    case 'FOOD_CREATION':
      return item.food_name_id ? getFoodUrl(item.food_name_id, item.food?.name ?? '') : null;
    default:
      return null;
  }
}

function groupDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const groupedActivity = computed(() => {
  const items = user?.value?.activity ?? [];
  const groups: { label: string; items: Activity[] }[] = [];
  let currentLabel = '';

  for (const item of items) {
    const label = groupDateLabel(item.created_at);
    if (label !== currentLabel) {
      groups.push({ label, items: [item] });
      currentLabel = label;
    } else {
      groups.at(-1)!.items.push(item);
    }
  }

  return groups;
});
</script>

<style scoped></style>
