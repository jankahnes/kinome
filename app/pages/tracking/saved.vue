<template>
  <div class="space-y-6 pt-8 pb-24 max-w-3xl">
    <div class="flex flex-col gap-2">
      <h1 class="text-4xl font-bold tracking-tighter">Saved Meals</h1>
      <p class="text-sm text-gray-500 ">
        Reusable meal templates for your breakfasts, shakes, and meal-prep staples. Edit them here, then add them from
        daily
        tracking whenever you need them.
      </p>
    </div>

    <div v-if="isLoading" class="grid gap-4">
      <Skeleton v-for="i in 3" :key="i" class="h-44 rounded-4xl" />
    </div>

    <div v-else-if="templates.length === 0" class="main-card main-card-padding text-center py-16">
      <p class="text-2xl font-bold tracking-tight">No saved meals yet</p>
      <p class="mt-2 text-sm text-gray-500">Save a meal from the daily tracker and it will show up here.</p>
    </div>

    <EditableGroupList v-else v-model="templates" :show-collapse="true" :show-group-header="true" :show-kcal="true"
      :show-remove-button="false" group-name-placeholder="Saved meal name">
      <template #group-header="{ group, groupIndex }">
        <header class="flex flex-wrap items-start justify-between gap-3 pr-1 pb-2"
          :class="{ 'animated-button cursor-pointer': true }" @click="group.collapsed = !group.collapsed">
          <div class="min-w-0 flex-1 flex flex-wrap items-center  gap-2">
            <div class="relative mx-1 min-w-0">
              <span class="text-xl font-bold invisible whitespace-pre px-4 py-0.5" aria-hidden="true">
                {{ group.name || 'Saved meal name' }}
              </span>
              <input v-model="group.name"
                class="text-xl font-bold focus:outline-none absolute inset-0 px-4 py-0.5 bg-main/30 rounded-xl cursor-text! min-w-0"
                placeholder="Saved meal name" @click.stop />
            </div>
            <span class="text-sm text-slate-400 mt-0.5">{{ `${Math.round(group.summary?.kcal ?? 0)}kcal` }}</span>
          </div>
          <div class="flex items-center gap-2 text-gray-600" @click.stop>
            <button type="button" class="animated-button rounded-xl px-3 py-1.5 text-xs font-semibold"
              :class="group.dailySchedule?.active ? 'bg-emerald-50 text-emerald-800 ' : 'bg-slate-50 text-slate-700'"
              @click="toggleDailySchedule(group)">
              {{ getScheduleButtonLabel(group) }}
            </button>
            <button v-if="group.dailySchedule?.active && !group.dailySchedule?.schedule_until" type="button"
              class="animated-button rounded-xl px-3 py-1.5 text-xs font-semibold bg-slate-50/70"
              @click="openScheduleStopModal(group)">
              Set Stop
            </button>
            <button type="button"
              class="animated-button rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-100"
              @click="deleteTemplate(group.id, groupIndex)">
              Delete
            </button>
            <IconChevronDown class="w-5" v-if="group.collapsed" />
            <IconChevronUp class="w-5" v-else />
          </div>
        </header>
      </template>
    </EditableGroupList>

    <BlocksResponsiveModal v-model="scheduleModalOpen">
      <template #default>
        <div class="p-6 flex flex-col gap-4 sm:min-w-96">
          <div>
            <div class="text-xs uppercase tracking-wide text-gray-400">Set Schedule Stop</div>
            <h2 class="text-2xl font-bold tracking-tight">{{ scheduleTarget?.name ?? 'Saved meal' }}</h2>
          </div>
          <p class="text-sm text-gray-500">This meal will keep auto-adding daily until the selected range ends.</p>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium">Number of days</span>
            <input v-model.number="scheduleDays" type="number" min="1" max="60"
              class="rounded-2xl bg-primary-10 px-3 py-2 focus:outline-none" />
          </label>
          <div class="flex justify-end gap-2">
            <button type="button"
              class="animated-button rounded-2xl bg-slate-100 px-4 py-2 font-semibold text-slate-700"
              @click="closeScheduleStopModal">
              Cancel
            </button>
            <button type="button" class="animated-button rounded-2xl bg-primary px-4 py-2 text-white font-semibold"
              @click="scheduleForNextDays(scheduleTarget)">
              Save Stop
            </button>
          </div>
        </div>
      </template>
    </BlocksResponsiveModal>

    <div v-if="templates.length > 0" class="fixed bottom-16 lg:bottom-4 right-2 lg:right-10 z-50">
      <button @click="saveTemplateEdits" :disabled="isSaving || !hasUnsavedChanges"
        class="animated-button flex items-center gap-2 px-4 py-2 shadow-lg transition-all" :class="{
          'bg-primary-10': hasUnsavedChanges,
          'bg-primary-10/20': !hasUnsavedChanges,
          'opacity-50 cursor-not-allowed': isSaving,
        }">
        <IconLoader class="w-4 animate-spin" v-if="isSaving" />
        <IconSave class="w-4" v-else-if="hasUnsavedChanges" />
        <IconCheck class="w-4" v-else />
        <span class="text-sm font-medium">
          {{ isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackedMeal } from '~/types/types';
import { todayLogicalDate } from '~/utils/format/logicalDate';

const loadingStore = useLoadingStore();

const templates = ref<TrackedMeal[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const hasUnsavedChanges = ref(false);
const scheduleModalOpen = ref(false);
const scheduleTarget = ref<TrackedMeal | null>(null);
const scheduleDays = ref(5);

function formatScheduleUntil(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getScheduleButtonLabel(template: TrackedMeal) {
  if (!template.dailySchedule?.active) return 'Schedule';
  if (template.dailySchedule.schedule_until) {
    return `Scheduled until ${formatScheduleUntil(template.dailySchedule.schedule_until)}`;
  }
  return 'Scheduled Daily';
}

async function loadTemplates() {
  isLoading.value = true;
  try {
    templates.value = await $fetch<TrackedMeal[]>('/api/tracking/templates');
    hasUnsavedChanges.value = false;
  } catch (error) {
    console.error('Failed to load saved meals:', error);
    loadingStore.displayTransientToast('Failed to load saved meals');
  } finally {
    isLoading.value = false;
  }
}

async function saveTemplateEdits() {
  isSaving.value = true;
  try {
    templates.value = await $fetch<TrackedMeal[]>('/api/tracking/templates/save', {
      method: 'POST',
      body: { templates: templates.value },
    });
    hasUnsavedChanges.value = false;
    loadingStore.displayTransientToast('Saved template changes');
  } catch (error) {
    console.error('Failed to save template changes:', error);
    loadingStore.displayTransientToast('Failed to save template changes');
  } finally {
    isSaving.value = false;
  }
}

async function deleteTemplate(templateId: number | undefined, groupIndex: number) {
  if (!templateId) {
    templates.value.splice(groupIndex, 1);
    return;
  }

  try {
    await $fetch('/api/tracking/templates/delete', {
      method: 'POST',
      body: { templateId },
    });
    templates.value.splice(groupIndex, 1);
    hasUnsavedChanges.value = false;
    loadingStore.displayTransientToast('Deleted saved meal');
  } catch (error) {
    console.error('Failed to delete saved meal:', error);
    loadingStore.displayTransientToast('Failed to delete saved meal');
  }
}

async function toggleDailySchedule(template: TrackedMeal) {
  if (!template.id) return;
  const nextActive = !template.dailySchedule?.active;
  try {
    await $fetch('/api/tracking/templates/toggle-daily', {
      method: 'POST',
      body: {
        templateId: template.id,
        active: nextActive,
      },
    });
    template.dailySchedule!.active = nextActive;
    template.dailySchedule!.schedule_until = null;
    loadingStore.displayTransientToast(nextActive ? 'Daily schedule enabled' : 'Daily schedule stopped');
  } catch (error) {
    console.error('Failed to toggle daily schedule:', error);
    loadingStore.displayTransientToast('Failed to update schedule');
  }
}

function openScheduleStopModal(template: TrackedMeal) {
  scheduleTarget.value = template;
  scheduleDays.value = 5;
  scheduleModalOpen.value = true;
}

function closeScheduleStopModal() {
  scheduleModalOpen.value = false;
  scheduleTarget.value = null;
}

function addDays(logicalDate: string, days: number) {
  const next = new Date(`${logicalDate}T12:00:00`);
  next.setDate(next.getDate() + Math.max(0, days - 1));
  return next.toISOString();
}

async function scheduleForNextDays(template: TrackedMeal | null) {
  if (!template?.id) return;
  const days = Math.max(1, Math.min(60, Number(scheduleDays.value ?? 5)));
  try {
    await $fetch('/api/tracking/templates/schedule-days', {
      method: 'POST',
      body: {
        templateId: template.id,
        days,
        startDate: todayLogicalDate(),
      },
    });
    closeScheduleStopModal();
    template.dailySchedule!.schedule_until = addDays(todayLogicalDate(), days);
    template.dailySchedule!.active = true;
    loadingStore.displayTransientToast(`Scheduled for ${days} days`);
  } catch (error) {
    console.error('Failed to schedule template:', error);
    loadingStore.displayTransientToast('Failed to schedule template');
  }
}

watch(
  templates,
  () => {
    hasUnsavedChanges.value = true;
  },
  { deep: true },
);

onMounted(loadTemplates);
</script>

<style scoped></style>
