<template>
    <Transition name="loaded-content">
        <div class="max-w-screen-xl py-10" v-if="mounted">
            <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
                <div class="space-y-2">
                    <h1 class="text-4xl sm:text-5xl font-bold tracking-tight">Adjust your Metrics & Goals</h1>
                </div>

                <FormsTrackingBasicsSection :form="form" />

                <FormsTrackingGoalSection :form="form" />
                <button
                    class="bg-primary text-white px-6 py-3 font-bold text-xl animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    @click.prevent="form.calculateTargets()" :disabled="!form.canContinueToStep3.value" type="button">
                    Recalculate Targets
                </button>

                <FormsTrackingTargetsSection :form="form" />

                <div class="flex justify-end">
                    <button
                        class="bg-primary text-white px-6 py-3 font-bold text-xl animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="!form.canSubmit.value || saving" type="submit">
                        {{ saving ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
            </form>
        </div>
    </Transition>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const loadingStore = useLoadingStore();
const mounted = ref(false);
const saving = ref(false);
const form = useTrackingGoalsForm();
const lastLoadedTracking = ref<string | null>(null);

async function handleSubmit() {
    if (saving.value) return;
    saving.value = true;
    const saved = await form.saveTracking();
    saving.value = false;

    if (saved) {
        loadingStore.displayTransientToast('Tracking settings saved');
    }
}

onMounted(() => {
  mounted.value = true;
});

watch(
  () => auth.user?.user_data,
  (userData) => {
  if (!auth.profileFetched) return;
    const tracking = (userData as Record<string, any> | undefined)?.tracking ?? null;
    const serialized = JSON.stringify(tracking);
    if (serialized === lastLoadedTracking.value) return;

    form.loadFromTrackingData(tracking);
    lastLoadedTracking.value = serialized;
  },
  { immediate: true },
);
</script>
