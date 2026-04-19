<template>
  <Transition name="loaded-content">
    <div class="max-w-screen-xl" v-if="mounted">
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-2 xl:px-4 relative mt-10">
        <div class="w-full xl:py-4 xl:px-8 py-2 px-4 main-card-rounded transition-colors duration-400"
          :class="{ 'bg-primary-5': form.currentStep.value > 1 }" @click="form.currentStep.value = 1">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <h2 class="text-5xl font-bold">Step 1</h2>
              <p class="text-lg text-gray-500">The Basics</p>
            </div>
            <Transition name="fade-slow">
              <IconCheck class="text-green-500" :size="32" v-if="form.currentStep.value > 1" />
            </Transition>
          </div>
          <BlocksCollapsible class="flex flex-col gap-4" :modelValue="form.currentStep.value === 1">
            <FormsTrackingBasicsSection :form="form" />
            <button
              class="bg-primary text-white px-6 py-3 font-bold self-end text-xl main-button animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
              @click.stop.prevent="form.currentStep.value = 2" :disabled="!form.canContinueToStep2.value">
              Next Step: The Objective
            </button>
          </BlocksCollapsible>
        </div>

        <div v-if="form.currentStep.value >= 2"
          class="w-full xl:py-4 xl:px-8 py-2 px-4 main-card-rounded transition-colors duration-400"
          :class="{ 'bg-primary-5': form.currentStep.value > 2 }" @click="form.currentStep.value = 2">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <h2 class="text-5xl font-bold">Step 2</h2>
              <p class="text-lg text-gray-500">The Objective</p>
            </div>
            <Transition name="fade-slow">
              <IconCheck class="text-green-500" :size="32" v-if="form.currentStep.value > 2" />
            </Transition>
          </div>
          <BlocksCollapsible class="flex flex-col gap-4" :modelValue="form.currentStep.value === 2">
            <FormsTrackingGoalSection :form="form" />
            <button
              class="bg-primary text-white px-6 py-3 font-bold self-end text-xl main-button animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
              @click.stop.prevent="goToTargets" :disabled="!form.canContinueToStep3.value">
              Next Step: The Details
            </button>
          </BlocksCollapsible>
        </div>

        <div v-if="form.currentStep.value >= 3"
          class="w-full xl:py-4 xl:px-8 py-2 px-4 main-card-rounded transition-colors duration-400"
          :class="{ 'bg-primary-5': form.currentStep.value > 3 }" @click="form.currentStep.value = 3">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <h2 class="text-5xl font-bold">Step 3</h2>
              <p class="text-lg text-gray-500">The Details</p>
            </div>
            <Transition name="fade-slow">
              <IconCheck class="text-green-500" :size="32" v-if="form.currentStep.value > 3" />
            </Transition>
          </div>
          <BlocksCollapsible class="flex flex-col gap-4" :modelValue="form.currentStep.value === 3">
            <FormsTrackingTargetsSection :form="form" />
            <button
              class="bg-primary text-white px-6 py-3 font-bold self-end text-xl main-button animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!form.canSubmit.value" type="submit">
              Finish
            </button>
          </BlocksCollapsible>
        </div>
      </form>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const mounted = ref(false);
const form = useTrackingGoalsForm();

function goToTargets() {
  form.calculateTargets();
  form.currentStep.value = 3;
}

async function handleSubmit() {
  const saved = await form.saveTracking();
  if (saved) {
    navigateTo('/tracking/daily');
  }
}

onMounted(() => {
  mounted.value = true;
});
</script>
