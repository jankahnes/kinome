<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-2xl font-bold mt-4">Gender</h3>
    <div class="flex w-full rounded-4xl bg-[#e7e5e2] p-1">
      <button
        class="flex flex-1 items-center justify-center bg-transparent py-3 text-2xl rounded-4xl"
        :class="{ 'bg-primary-10! shadow-xl font-bold': form.gender.value === 'Male' }"
        @click.prevent="form.gender.value = 'Male'"
      >
        Male
      </button>
      <button
        class="flex flex-1 items-center justify-center bg-transparent py-3 text-2xl rounded-4xl"
        :class="{ 'bg-primary-10! shadow-xl font-bold': form.gender.value === 'Female' }"
        @click.prevent="form.gender.value = 'Female'"
      >
        Female
      </button>
    </div>

    <div class="flex gap-4 justify-between mt-8 flex-col xl:flex-row">
      <div class="flex flex-col flex-1">
        <label for="age" class="text-2xl font-bold">Age</label>
        <div class="flex mt-4 items-end justify-between">
          <input
            id="age"
            type="text"
            placeholder="18"
            v-model="form.age.value"
            class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
          />
          <span class="text-2xl text-gray-600">yrs</span>
        </div>
        <div
          class="w-full h-2 rounded-full bg-[#e7e5e2] mt-1"
          :class="{ 'bg-green-500': !!form.age.value }"
        ></div>
      </div>

      <div class="w-0.5 bg-gray-200"></div>

      <div class="flex flex-col flex-1">
        <label for="height" class="text-2xl font-bold">Height</label>
        <div class="flex mt-4 items-end justify-between">
          <input
            v-if="form.selectedHeightUnit.value === 'cm'"
            id="height"
            type="text"
            placeholder="180"
            v-model="form.heightCm.value"
            class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
          />
          <div class="flex gap-4 items-end flex-1 mr-4" v-else>
            <input
              type="text"
              placeholder="5"
              v-model="form.heightFt.value"
              class="text-6xl focus:outline-none bg-transparent border-none font-bold w-[0.8em] h-14"
            />
            <span class="text-2xl text-gray-600 -ml-6">ft</span>
            <input
              type="text"
              placeholder="10"
              v-model="form.heightInch.value"
              class="text-6xl focus:outline-none bg-transparent border-none font-bold w-[1.4em] h-14"
            />
            <span class="text-2xl text-gray-600 -ml-6">in</span>
          </div>
          <div class="flex gap-2 text-2xl text-gray-500 items-center select-none">
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.selectedHeightUnit.value === 'cm' }"
              @click="form.selectedHeightUnit.value = 'cm'"
              >cm</span
            >
            <span>|</span>
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.selectedHeightUnit.value === 'ft' }"
              @click="form.selectedHeightUnit.value = 'ft'"
              >ft</span
            >
          </div>
        </div>
        <div
          class="w-full h-2 rounded-full bg-[#e7e5e2] mt-1"
          :class="{ 'bg-green-500': !!form.height.value }"
        ></div>
      </div>

      <div class="w-0.5 bg-gray-200 hidden xl:block"></div>

      <div class="flex flex-col flex-1">
        <label for="weight" class="text-2xl font-bold">Current Weight</label>
        <div class="flex mt-4 items-end justify-between">
          <input
            id="weight"
            type="text"
            :placeholder="form.selectedWeightUnit.value === 'kg' ? '70' : '160'"
            v-model="form.weightInput.value"
            class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
          />
          <div class="flex gap-2 text-2xl text-gray-500 items-center select-none">
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.selectedWeightUnit.value === 'kg' }"
              @click="form.selectedWeightUnit.value = 'kg'"
              >kg</span
            >
            <span>|</span>
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.selectedWeightUnit.value === 'lb' }"
              @click="form.selectedWeightUnit.value = 'lb'"
              >lb</span
            >
          </div>
        </div>
        <div
          class="w-full h-2 rounded-full bg-[#e7e5e2] mt-1"
          :class="{ 'bg-green-500': !!form.weight.value }"
        ></div>
      </div>
    </div>

    <div class="h-0.5 bg-gray-200 my-6 hidden xl:block"></div>

    <h3 class="text-2xl font-bold">How active are you?</h3>
    <div class="flex gap-4 mt-4 flex-wrap">
      <div
        class="p-4 bg-primary-10 rounded-4xl! border-2 border-gray-200 flex flex-col gap-2 items-center text-nowrap basis-auto shrink-0 flex-1 animated-button"
        v-for="(activity, index) in form.activityCards"
        :key="activity.title"
        :class="{ 'border-green-300 bg-green-100/40!': form.selectedActivityCard.value === index }"
        @click="form.selectedActivityCard.value = index"
      >
        <img :src="activity.illustration" :alt="activity.title" class="h-40" />
        <h4 class="text-xl font-bold">{{ activity.title }}</h4>
        <p class="text-center -mt-2 leading-none">{{ activity.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingSectionForm } from '~/composables/useTrackingGoalsForm';

defineProps<{
  form: TrackingSectionForm;
}>();
</script>
