<template>
  <div class="flex flex-col gap-4 mt-8 lg:mt-2">
    <div class="flex flex-col w-full gap-2">
      <div class="flex items-end xl:justify-center">
        <div>
          <input
            type="text"
            v-model="form.targetInputs.value.kcal.input"
            class="text-8xl focus:outline-none bg-transparent border-none font-bold h-16"
            :style="{ width: `${(form.targetInputs.value.kcal.input.length || 1) + 0.1}ch` }"
          />
          <span class="text-2xl text-gray-500 leading-none">kcal</span>
        </div>
      </div>
      <div class="w-full h-2 rounded-full overflow-hidden flex">
        <div
          class="h-full bg-carbs"
          :style="{ width: `${macroBarWidth('carbohydrates', 4)}%` }"
        ></div>
        <div
          class="h-full bg-protein"
          :style="{ width: `${macroBarWidth('protein', 4)}%` }"
        ></div>
        <div
          class="h-full bg-fat"
          :style="{ width: `${macroBarWidth('fat', 9)}%` }"
        ></div>
      </div>
    </div>

    <div class="flex gap-4 justify-between mt-6 flex-col xl:flex-row">
      <div class="flex flex-col flex-1">
        <div class="flex items-center justify-between">
          <label for="carbohydrates" class="text-2xl font-bold leading-none">Carbohydrates</label>
          <IconLock
            class="text-gray-600 w-5"
            v-if="form.targetInputs.value.carbohydrates.locked"
            strokeWidth="2.3"
            @click="form.targetInputs.value.carbohydrates.locked = false"
          />
          <IconUnlock
            class="text-gray-400 w-5"
            v-else
            strokeWidth="2.3"
            @click="form.targetInputs.value.carbohydrates.locked = true"
          />
        </div>
        <div class="flex mt-6 items-end justify-between">
          <input
            id="carbohydrates"
            type="text"
            v-model="form.targetInputs.value.carbohydrates.input"
            class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
          />
          <div class="flex gap-2 text-2xl text-gray-500 items-center select-none">
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.targetInputs.value.carbohydrates.selectedUnit === 'g' }"
              @click="form.toggleCarbohydrateUnit()"
              >g</span
            >
            <span>|</span>
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.targetInputs.value.carbohydrates.selectedUnit === '%' }"
              @click="form.toggleCarbohydrateUnit()"
              >%</span
            >
          </div>
        </div>
        <div class="w-full h-2 rounded-full bg-carbs/20 mt-1"></div>
      </div>

      <div class="w-0.5 bg-gray-200 hidden xl:block"></div>

      <div class="flex flex-col flex-1">
        <div class="flex items-center justify-between">
          <label for="protein" class="text-2xl font-bold leading-none">Protein</label>
          <IconLock
            class="text-gray-600 w-5"
            v-if="form.targetInputs.value.protein.locked"
            strokeWidth="2.3"
            @click="form.targetInputs.value.protein.locked = false"
          />
          <IconUnlock
            class="text-gray-400 w-5"
            v-else
            strokeWidth="2.3"
            @click="form.targetInputs.value.protein.locked = true"
          />
        </div>
        <div class="flex mt-6 items-end justify-between">
          <input
            id="protein"
            type="text"
            v-model="form.targetInputs.value.protein.input"
            class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
          />
          <div class="flex gap-2 text-2xl text-gray-500 items-center select-none">
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.targetInputs.value.protein.selectedUnit === 'g' }"
              @click="form.toggleProteinUnit()"
              >g</span
            >
            <span>|</span>
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.targetInputs.value.protein.selectedUnit === '%' }"
              @click="form.toggleProteinUnit()"
              >%</span
            >
          </div>
        </div>
        <div class="w-full h-2 rounded-full bg-protein/20 mt-1"></div>
      </div>

      <div class="w-0.5 bg-gray-200 hidden xl:block"></div>

      <div class="flex flex-col flex-1">
        <div class="flex items-center justify-between">
          <label for="fat" class="text-2xl font-bold leading-none">Fat</label>
          <IconLock
            class="text-gray-600 w-5"
            v-if="form.targetInputs.value.fat.locked"
            strokeWidth="2.3"
            @click="form.targetInputs.value.fat.locked = false"
          />
          <IconUnlock
            class="text-gray-400 w-5"
            v-else
            strokeWidth="2.3"
            @click="form.targetInputs.value.fat.locked = true"
          />
        </div>
        <div class="flex mt-6 items-end justify-between">
          <input
            id="fat"
            type="text"
            v-model="form.targetInputs.value.fat.input"
            class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
          />
          <div class="flex gap-2 text-2xl text-gray-500 items-center select-none">
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.targetInputs.value.fat.selectedUnit === 'g' }"
              @click="form.toggleFatUnit()"
              >g</span
            >
            <span>|</span>
            <span
              class="cursor-pointer"
              :class="{ 'font-bold text-gray-700': form.targetInputs.value.fat.selectedUnit === '%' }"
              @click="form.toggleFatUnit()"
              >%</span
            >
          </div>
        </div>
        <div class="w-full h-2 rounded-full bg-fat/20 mt-1"></div>
      </div>
    </div>

    <div class="h-0.5 bg-gray-200 my-6 hidden xl:block"></div>

    <h3 class="text-2xl font-bold">Additional Targets</h3>
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="flex xl:justify-center flex-1">
        <div class="flex flex-col gap-4 shrink-0 flex-1">
          <label for="sugar" class="text-2xl font-bold leading-none">Sugar</label>
          <div class="flex gap-2 items-end border-b-2 border-gray-300 pb-2">
            <input
              id="sugar"
              type="text"
              v-model="form.targetInputs.value.sugar.input"
              class="text-4xl focus:outline-none bg-transparent font-bold flex-1 w-[2.1ch] h-8"
            />
            <span class="text-2xl text-gray-500 leading-none">g</span>
          </div>
          <div class="flex gap-2">
            <button
              class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
              @click.prevent="form.targetInputs.value.sugar.input = form.commonSuggestedTargets.value.sugarWhoMax"
              :class="{ 'bg-primary!': form.targetInputs.value.sugar.input === form.commonSuggestedTargets.value.sugarWhoMax }"
            >
              WHO Max
            </button>
            <button
              class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
              @click.prevent="form.targetInputs.value.sugar.input = form.commonSuggestedTargets.value.sugarLow"
              :class="{ 'bg-primary!': form.targetInputs.value.sugar.input === form.commonSuggestedTargets.value.sugarLow }"
            >
              Low Sugar
            </button>
          </div>
        </div>
      </div>

      <div class="flex xl:justify-center flex-1">
        <div class="flex flex-col gap-4 shrink-0 flex-1">
          <label for="fiber" class="text-2xl font-bold leading-none">Fiber</label>
          <div class="flex gap-2 items-end border-b-2 border-gray-300 pb-2">
            <input
              id="fiber"
              type="text"
              v-model="form.targetInputs.value.fiber.input"
              class="text-4xl focus:outline-none bg-transparent font-bold flex-1 w-[2.1ch] h-8"
            />
            <span class="text-2xl text-gray-500 leading-none">g</span>
          </div>
          <div class="flex gap-2">
            <button
              class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
              @click.prevent="form.targetInputs.value.fiber.input = form.commonSuggestedTargets.value.fiberFDA"
              :class="{ 'bg-primary!': form.targetInputs.value.fiber.input === form.commonSuggestedTargets.value.fiberFDA }"
            >
              FDA Adequate Intake
            </button>
            <button
              class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
              @click.prevent="form.targetInputs.value.fiber.input = form.commonSuggestedTargets.value.fiberHigh"
              :class="{ 'bg-primary!': form.targetInputs.value.fiber.input === form.commonSuggestedTargets.value.fiberHigh }"
            >
              High Fiber
            </button>
          </div>
        </div>
      </div>

      <div class="flex xl:justify-center flex-1">
        <div class="flex flex-col gap-4 shrink-0 flex-1">
          <label for="salt" class="text-2xl font-bold leading-none">Salt</label>
          <div class="flex gap-2 items-end border-b-2 border-gray-300 pb-2">
            <input
              id="salt"
              type="text"
              v-model="form.targetInputs.value.salt.input"
              class="text-4xl focus:outline-none bg-transparent font-bold flex-1 w-[2.1ch] h-8"
            />
            <span class="text-2xl text-gray-500 leading-none">g</span>
          </div>
          <div class="flex gap-2">
            <button
              class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
              @click.prevent="form.targetInputs.value.salt.input = form.commonSuggestedTargets.value.saltWhoMax"
              :class="{ 'bg-primary!': form.targetInputs.value.salt.input === form.commonSuggestedTargets.value.saltWhoMax }"
            >
              WHO Max
            </button>
            <button
              class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
              @click.prevent="form.targetInputs.value.salt.input = form.commonSuggestedTargets.value.saltLow"
              :class="{ 'bg-primary!': form.targetInputs.value.salt.input === form.commonSuggestedTargets.value.saltLow }"
            >
              Low Sodium
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackingSectionForm } from '~/composables/useTrackingGoalsForm';

const props = defineProps<{
  form: TrackingSectionForm;
}>();

function macroBarWidth(key: 'carbohydrates' | 'protein' | 'fat', kcalPerGram: number) {
  const input = props.form.targetInputs.value[key];
  if (input.selectedUnit === 'g') {
    return Number(props.form.convertGramsToPercent(input.input, kcalPerGram));
  }

  return Number(input.input);
}
</script>
