<template>
  <Transition name="loaded-content">
    <div class="max-w-screen-xl" v-if="mounted">
      <form @submit.prevent class="flex flex-col gap-2 xl:px-4 relative mt-10">
        <!-- Step 1: Basics -->
        <div
          class="w-full xl:py-4 xl:px-8 py-2 px-4 rounded-4xl transition-colors duration-400"
          :class="{ 'bg-primary-10': currentStep > 1 }"
          @click="currentStep = 1"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <h2 class="text-5xl font-bold">Step 1</h2>
              <p class="text-lg text-gray-500">The Basics</p>
            </div>
            <Transition name="fade-slow">
              <IconCheck
                class="text-green-500"
                :size="32"
                v-if="currentStep > 1"
              />
            </Transition>
          </div>
          <BlocksCollapsible
            class="flex flex-col gap-4"
            :modelValue="currentStep === 1"
          >
            <h3 class="text-2xl font-bold mt-4">Gender</h3>
            <div class="flex w-full rounded-4xl bg-[#e7e5e2] p-1">
              <button
                class="flex flex-1 items-center justify-center bg-transparent py-3 text-2xl rounded-4xl"
                :class="{
                  'bg-primary-10! shadow-xl font-bold': gender === 'Male',
                }"
                @click="gender = 'Male'"
              >
                Male
              </button>
              <button
                class="flex flex-1 items-center justify-center bg-transparent py-3 text-2xl rounded-4xl"
                :class="{
                  'bg-primary-10! shadow-xl font-bold': gender === 'Female',
                }"
                @click="gender = 'Female'"
              >
                Female
              </button>
            </div>
            <div class="flex gap-4 justify-between mt-8 flex-col xl:flex-row">
              <div class="flex flex-col flex-1">
                <label for="name" class="text-2xl font-bold">Age</label>
                <div class="flex mt-4 items-end justify-between">
                  <input
                    type="text"
                    placeholder="18"
                    v-model="age"
                    class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
                  />
                  <span class="text-2xl text-gray-600">yrs</span>
                </div>
                <div
                  class="w-full h-2 rounded-full bg-[#e7e5e2] mt-1"
                  :class="{ 'bg-green-500': !!age }"
                ></div>
              </div>
              <div class="w-0.5 bg-gray-200"></div>
              <div class="flex flex-col flex-1">
                <label for="name" class="text-2xl font-bold">Height</label>
                <div class="flex mt-4 items-end justify-between">
                  <input
                    type="text"
                    placeholder="180"
                    v-model="heightCm"
                    class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
                    v-if="selectedHeightUnit === 'cm'"
                  />
                  <div class="flex gap-4 items-end flex-1 mr-4" v-else>
                    <input
                      type="text"
                      placeholder="5"
                      v-model="heightFt"
                      class="text-6xl focus:outline-none bg-transparent border-none font-bold w-[0.8em] h-14"
                    />
                    <span class="text-2xl text-gray-600 -ml-6">ft</span>
                    <input
                      type="text"
                      placeholder="10"
                      v-model="heightInch"
                      class="text-6xl focus:outline-none bg-transparent border-none font-bold w-[1.4em] h-14"
                    />
                    <span class="text-2xl text-gray-600 -ml-6">in</span>
                  </div>
                  <div
                    class="flex gap-2 text-2xl text-gray-500 items-center select-none"
                  >
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700': selectedHeightUnit === 'cm',
                      }"
                      @click="selectedHeightUnit = 'cm'"
                      >cm</span
                    >
                    <span class="">|</span>
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700': selectedHeightUnit === 'ft',
                      }"
                      @click="selectedHeightUnit = 'ft'"
                      >ft</span
                    >
                  </div>
                </div>
                <div
                  class="w-full h-2 rounded-full bg-[#e7e5e2] mt-1"
                  :class="{ 'bg-green-500': !!height }"
                ></div>
              </div>
              <div class="w-0.5 bg-gray-200 hidden xl:block"></div>
              <div class="flex flex-col flex-1">
                <label for="name" class="text-2xl font-bold"
                  >Current Weight</label
                >
                <div class="flex mt-4 items-end justify-between">
                  <input
                    type="text"
                    :placeholder="selectedWeightUnit === 'kg' ? '70' : '160'"
                    v-model="weightInput"
                    class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
                  />
                  <div
                    class="flex gap-2 text-2xl text-gray-500 items-center select-none"
                  >
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700': selectedWeightUnit === 'kg',
                      }"
                      @click="selectedWeightUnit = 'kg'"
                      >kg</span
                    >
                    <span class="">|</span>
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700': selectedWeightUnit === 'lb',
                      }"
                      @click="selectedWeightUnit = 'lb'"
                      >lb</span
                    >
                  </div>
                </div>
                <div
                  class="w-full h-2 rounded-full bg-[#e7e5e2] mt-1"
                  :class="{ 'bg-green-500': !!weight }"
                ></div>
              </div>
            </div>
            <div class="h-0.5 bg-gray-200 my-6 hidden xl:block"></div>
            <h3 class="text-2xl font-bold">How active are you?</h3>
            <div class="flex gap-4 mt-4 flex-wrap">
              <div
                class="p-4 bg-primary-10 rounded-4xl! border-2 border-gray-200 flex flex-col gap-2 items-center text-nowrap basis-50 shrink-0 flex-1 max-w-60 animated-button"
                v-for="(activity, index) in activityCards"
                :key="activity.title"
                :class="{
                  'border-green-300 bg-green-100/40!':
                    selectedActivityCard === index,
                }"
                @click="selectedActivityCard = index"
              >
                <img
                  :src="activity.illustration"
                  :alt="activity.title"
                  class="h-40"
                />
                <h4 class="text-xl font-bold">{{ activity.title }}</h4>
                <p class="text-center -mt-2 leading-none">
                  {{ activity.description }}
                </p>
              </div>
            </div>
            <button
              class="bg-primary text-white px-6 py-3 font-bold self-end text-xl animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
              @click.stop="currentStep = 2"
              :disabled="!canContinueToStep2"
            >
              Next Step: The Objective
            </button>
          </BlocksCollapsible>
        </div>
        <!-- Step 2: The Objective -->
        <div
          class="w-full xl:py-4 xl:px-8 py-2 px-4 rounded-4xl transition-colors duration-400"
          :class="{ 'bg-primary-10': currentStep > 2 }"
          @click="currentStep = 2"
          v-if="currentStep >= 2"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <h2 class="text-5xl font-bold">Step 2</h2>
              <p class="text-lg text-gray-500">The Objective</p>
            </div>
            <Transition name="fade-slow">
              <IconCheck
                class="text-green-500"
                :size="32"
                v-if="currentStep > 2"
              />
            </Transition>
          </div>
          <BlocksCollapsible
            class="flex flex-col gap-4"
            :modelValue="currentStep === 2"
          >
            <h3 class="text-2xl font-bold mt-4">Your Goal</h3>
            <div class="flex gap-4 flex-wrap">
              <div
                class="p-4 bg-primary-10 rounded-4xl! border-2 border-gray-200 flex flex-col gap-2 items-center text-nowrap shrink-0 flex-1 animated-button"
                v-for="(objective, index) in objectiveCards"
                :key="objective.title"
                :class="{
                  'border-green-300 bg-green-100/40!':
                    selectedObjectiveCard === index,
                }"
                @click="selectedObjectiveCard = index"
              >
                <img
                  :src="objective.illustration"
                  :alt="objective.title"
                  class="h-34"
                />
                <h4 class="text-xl font-bold">{{ objective.title }}</h4>
                <p class="text-center -mt-2 leading-none">
                  {{ objective.description }}
                </p>
              </div>
            </div>
            <BlocksCollapsible
              :modelValue="
                selectedObjectiveCard != null && selectedObjectiveCard != 1
              "
              class=""
            >
              <h3 class="text-2xl font-bold">Your Pace</h3>
              <div class="py-14 px-4">
                <div class="relative w-full h-6">
                  <div
                    class="absolute top-1/2 -translate-y-1/2 w-full h-6 bg-[#e7e5e2] rounded-xl z-1"
                  ></div>
                  <div
                    class="slider-gradient-fill primary-gradient"
                    :style="{
                      width: `${
                        selectedPaceIndex === 0
                          ? 5
                          : selectedPaceIndex === 1
                          ? 35
                          : selectedPaceIndex === 2
                          ? 65
                          : 95
                      }%`,
                    }"
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    v-model.number="selectedPaceIndex"
                    class="slider-input"
                  />
                  <div
                    v-for="(pace, index) in sliderValues"
                    :key="pace.title"
                    class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 z-20"
                    :class="{ active: selectedPaceIndex === index }"
                    :style="{
                      left: `${
                        index === 0
                          ? 5
                          : index === 1
                          ? 35
                          : index === 2
                          ? 65
                          : 95
                      }%`,
                    }"
                  >
                    <Transition name="fade-up">
                      <img
                        v-if="selectedPaceIndex === index"
                        :src="pace.illustration"
                        :alt="pace.title"
                        class="absolute bottom-[calc(100%+10px)] h-[40px] w-[60px] object-contain max-w-none pointer-events-none"
                      />
                    </Transition>
                    <div
                      class="w-9 h-9 bg-white border-3 border-[#e7e5e2] rounded-full shadow-md transition-all duration-300 opacity-60 [.active_&]:opacity-0"
                    ></div>
                    <div
                      class="absolute top-[calc(100%+10px)] flex flex-col items-center whitespace-nowrap transition-all duration-300"
                    >
                      <span
                        class="text-lg text-gray-500 transition-all duration-300 leading-none font-bold"
                        >{{ pace.title }}</span
                      >
                      <span
                        class="text-sm text-gray-400 transition-all duration-300 leading-none"
                        >{{ pace.description }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </BlocksCollapsible>
            <h3 class="text-2xl font-bold mt-6">Your Preference</h3>
            <div class="flex gap-4 flex-wrap">
              <div
                class="px-4 py-2 bg-primary-10 rounded-4xl! flex flex-col gap-2 items-center text-nowrap shrink-0 flex-1 animated-button"
                v-for="(item, index) in dietPills"
                :key="item.title"
                :class="{
                  'bg-primary!': selectedPreference === index,
                }"
                @click="selectedPreference = index"
              >
                <h4 class="text-xl font-bold">{{ item.title }}</h4>
                <p class="text-center -mt-2 leading-none">
                  {{ item.description }}
                </p>
              </div>
            </div>
            <button
              class="bg-primary text-white px-6 py-3 font-bold self-end text-xl animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
              @click.stop="
                calculateTargets();
                currentStep = 3;
              "
              :disabled="!canContinueToStep3"
            >
              Next Step: The Details
            </button>
          </BlocksCollapsible>
        </div>
        <!-- Step 3: The Diet -->
        <div
          class="w-full xl:py-4 xl:px-8 py-2 px-4 rounded-4xl transition-colors duration-400"
          :class="{ 'bg-primary-10': currentStep > 3 }"
          @click="currentStep = 3"
          v-if="currentStep >= 3"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <h2 class="text-5xl font-bold">Step 3</h2>
              <p class="text-lg text-gray-500">The Details</p>
            </div>
            <Transition name="fade-slow">
              <IconCheck
                class="text-green-500"
                :size="32"
                v-if="currentStep > 3"
              />
            </Transition>
          </div>
          <BlocksCollapsible
            class="flex flex-col gap-4 mt-8 lg:mt-2"
            :modelValue="currentStep === 3"
          >
            <div class="flex flex-col w-full gap-2">
              <div class="flex items-end xl:justify-center">
                <div class="">
                  <input
                    type="text"
                    v-model="targetInputs.kcal.input"
                    class="text-8xl focus:outline-none bg-transparent border-none font-bold h-16"
                    :style="{
                      width: `${(targetInputs.kcal.input.length || 1) + 0.1}ch`,
                    }"
                  />
                  <span class="text-2xl text-gray-500 leading-none">kcal</span>
                </div>
              </div>
              <div class="w-full h-2 rounded-full overflow-hidden flex">
                <div
                  class="h-full bg-carbs"
                  :style="{
                    width: `${
                      targetInputs.carbohydrates.selectedUnit === 'g'
                        ? Number(
                            convertGramsToPercent(
                              targetInputs.carbohydrates.input,
                              4
                            )
                          )
                        : Number(targetInputs.carbohydrates.input)
                    }%`,
                  }"
                ></div>
                <div
                  class="h-full bg-protein"
                  :style="{
                    width: `${
                      targetInputs.protein.selectedUnit === 'g'
                        ? Number(
                            convertGramsToPercent(targetInputs.protein.input, 4)
                          )
                        : Number(targetInputs.protein.input)
                    }%`,
                  }"
                ></div>
                <div
                  class="h-full bg-fat"
                  :style="{
                    width: `${
                      targetInputs.fat.selectedUnit === 'g'
                        ? Number(
                            convertGramsToPercent(targetInputs.fat.input, 9)
                          )
                        : Number(targetInputs.fat.input)
                    }%`,
                  }"
                ></div>
              </div>
            </div>
            <div class="flex gap-4 justify-between mt-6 flex-col xl:flex-row">
              <div class="flex flex-col flex-1">
                <div class="flex items-center justify-between">
                  <label
                    for="carbohydrates"
                    class="text-2xl font-bold leading-none"
                    >Carbohydrates</label
                  >
                  <IconLock
                    class="text-gray-600 w-5"
                    v-if="targetInputs.carbohydrates.locked"
                    strokeWidth="2.3"
                    @click="targetInputs.carbohydrates.locked = false"
                  />
                  <IconUnlock
                    class="text-gray-400 w-5"
                    strokeWidth="2.3"
                    v-else
                    @click="targetInputs.carbohydrates.locked = true"
                  />
                </div>
                <div class="flex mt-6 items-end justify-between">
                  <input
                    type="text"
                    v-model="targetInputs.carbohydrates.input"
                    class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
                  />
                  <div
                    class="flex gap-2 text-2xl text-gray-500 items-center select-none"
                  >
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700':
                          targetInputs.carbohydrates.selectedUnit === 'g',
                      }"
                      @click="toggleCarbohydrateUnit()"
                      >g</span
                    >
                    <span class="">|</span>
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700':
                          targetInputs.carbohydrates.selectedUnit === '%',
                      }"
                      @click="toggleCarbohydrateUnit()"
                      >%</span
                    >
                  </div>
                </div>
                <div class="w-full h-2 rounded-full bg-carbs mt-1"></div>
              </div>
              <div class="w-0.5 bg-gray-200"></div>
              <div class="flex flex-col flex-1">
                <div class="flex items-center justify-between">
                  <label for="protein" class="text-2xl font-bold leading-none"
                    >Protein</label
                  >
                  <IconLock
                    class="text-gray-600 w-5"
                    v-if="targetInputs.protein.locked"
                    strokeWidth="2.3"
                    @click="targetInputs.protein.locked = false"
                  />
                  <IconUnlock
                    class="text-gray-400 w-5"
                    strokeWidth="2.3"
                    v-else
                    @click="targetInputs.protein.locked = true"
                  />
                </div>
                <div class="flex mt-6 items-end justify-between">
                  <input
                    type="text"
                    v-model="targetInputs.protein.input"
                    class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
                  />
                  <div
                    class="flex gap-2 text-2xl text-gray-500 items-center select-none"
                  >
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700':
                          targetInputs.protein.selectedUnit === 'g',
                      }"
                      @click="toggleProteinUnit()"
                      >g</span
                    >
                    <span class="">|</span>
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700':
                          targetInputs.protein.selectedUnit === '%',
                      }"
                      @click="toggleProteinUnit()"
                      >%</span
                    >
                  </div>
                </div>
                <div class="w-full h-2 rounded-full bg-protein mt-1"></div>
              </div>
              <div class="w-0.5 bg-gray-200 hidden xl:block"></div>
              <div class="flex flex-col flex-1">
                <div class="flex items-center justify-between">
                  <label for="fat" class="text-2xl font-bold leading-none"
                    >Fat</label
                  >
                  <IconLock
                    class="text-gray-600 w-5"
                    v-if="targetInputs.fat.locked"
                    strokeWidth="2.3"
                    @click="targetInputs.fat.locked = false"
                  />
                  <IconUnlock
                    class="text-gray-400 w-5"
                    strokeWidth="2.3"
                    v-else
                    @click="targetInputs.fat.locked = true"
                  />
                </div>
                <div class="flex mt-6 items-end justify-between">
                  <input
                    type="text"
                    v-model="targetInputs.fat.input"
                    class="text-6xl focus:outline-none bg-transparent border-none flex-1 font-bold w-full h-14"
                  />
                  <div
                    class="flex gap-2 text-2xl text-gray-500 items-center select-none"
                  >
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700':
                          targetInputs.fat.selectedUnit === 'g',
                      }"
                      @click="toggleFatUnit()"
                      >g</span
                    >
                    <span class="">|</span>
                    <span
                      class="cursor-pointer"
                      :class="{
                        'font-bold text-gray-700':
                          targetInputs.fat.selectedUnit === '%',
                      }"
                      @click="toggleFatUnit()"
                      >%</span
                    >
                  </div>
                </div>
                <div class="w-full h-2 rounded-full bg-fat mt-1"></div>
              </div>
            </div>
            <div class="h-0.5 bg-gray-200 my-6"></div>
            <div class="flex gap-x-16 gap-y-8 flex-col xl:flex-row">
              <div class="flex xl:justify-center flex-1">
                <div class="flex flex-col gap-4 shrink-0 flex-1">
                  <label for="sugar" class="text-2xl font-bold leading-none"
                    >Sugar</label
                  >
                  <div
                    class="flex gap-2 items-end border-b-2 border-gray-300 pb-2"
                  >
                    <input
                      type="text"
                      v-model="targetInputs.sugar.input"
                      class="text-4xl focus:outline-none bg-transparent font-bold flex-1 w-[2.1ch] h-8"
                    />
                    <span class="text-2xl text-gray-500 leading-none">g</span>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
                      @click="
                        targetInputs.sugar.input =
                          commonSuggestedTargets.sugarWhoMax
                      "
                      :class="{
                        'bg-primary!':
                          targetInputs.sugar.input ===
                          commonSuggestedTargets.sugarWhoMax,
                      }"
                    >
                      WHO Max
                    </button>
                    <button
                      class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
                      @click="
                        targetInputs.sugar.input =
                          commonSuggestedTargets.sugarLow
                      "
                      :class="{
                        'bg-primary!':
                          targetInputs.sugar.input ===
                          commonSuggestedTargets.sugarLow,
                      }"
                    >
                      Low Sugar
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex xl:justify-center flex-1">
                <div class="flex flex-col gap-4 shrink-0 flex-1">
                  <label for="fiber" class="text-2xl font-bold leading-none"
                    >Fiber</label
                  >
                  <div
                    class="flex gap-2 items-end border-b-2 border-gray-300 pb-2"
                  >
                    <input
                      type="text"
                      v-model="targetInputs.fiber.input"
                      class="text-4xl focus:outline-none bg-transparent font-bold flex-1 w-[2.1ch] h-8"
                    />
                    <span class="text-2xl text-gray-500 leading-none">g</span>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
                      @click="
                        targetInputs.fiber.input =
                          commonSuggestedTargets.fiberFDA
                      "
                      :class="{
                        'bg-primary!':
                          targetInputs.fiber.input ===
                          commonSuggestedTargets.fiberFDA,
                      }"
                    >
                      FDA Adequate Intake
                    </button>
                    <button
                      class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
                      @click="
                        targetInputs.fiber.input =
                          commonSuggestedTargets.fiberHigh
                      "
                      :class="{
                        'bg-primary!':
                          targetInputs.fiber.input ===
                          commonSuggestedTargets.fiberHigh,
                      }"
                    >
                      High Fiber
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex xl:justify-center flex-1">
                <div class="flex flex-col gap-4 shrink-0 flex-1">
                  <label for="salt" class="text-2xl font-bold leading-none"
                    >Salt</label
                  >
                  <div
                    class="flex gap-2 items-end border-b-2 border-gray-300 pb-2"
                  >
                    <input
                      type="text"
                      v-model="targetInputs.salt.input"
                      class="text-4xl focus:outline-none bg-transparent font-bold flex-1 w-[2.1ch] h-8"
                    />
                    <span class="text-2xl text-gray-500 leading-none">g</span>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
                      @click="
                        targetInputs.salt.input =
                          commonSuggestedTargets.saltWhoMax
                      "
                      :class="{
                        'bg-primary!':
                          targetInputs.salt.input ===
                          commonSuggestedTargets.saltWhoMax,
                      }"
                    >
                      WHO Max
                    </button>
                    <button
                      class="bg-primary-10 rounded-4xl px-2 py-1 text-sm font-bold self-start"
                      @click="
                        targetInputs.salt.input = commonSuggestedTargets.saltLow
                      "
                      :class="{
                        'bg-primary!':
                          targetInputs.salt.input ===
                          commonSuggestedTargets.saltLow,
                      }"
                    >
                      Low Sodium
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              class="bg-primary text-white px-6 py-3 font-bold self-end text-xl animated-button rounded-full! disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canContinueToStep4"
              @click.stop="saveTracking()"
            >
              Finish
            </button>
          </BlocksCollapsible>
        </div>
      </form>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const currentStep = ref(1);
const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();
const mounted = ref(false);

const isValueValid = (value: string | null) => {
  return value && !isNaN(Number(value)) && Number(value) >= 0;
};

onMounted(() => {
  mounted.value = true;
});

//computed top-level
const height = computed(() => {
  if (selectedHeightUnit.value === 'cm' && heightCm.value) {
    const height = Number(heightCm.value);
    if (isNaN(height) || height <= 0) return null;
    return height;
  } else if (
    selectedHeightUnit.value === 'ft' &&
    heightFt.value &&
    heightInch.value
  ) {
    const inches = Number(heightFt.value) * 12 + Number(heightInch.value);
    const height = inches * 2.54;
    if (isNaN(height) || height <= 0) return null;
    return height;
  } else {
    return null;
  }
});

const weight = computed(() => {
  if (selectedWeightUnit.value === 'kg' && weightInput.value) {
    return Number(weightInput.value);
  } else if (selectedWeightUnit.value === 'lb' && weightInput.value) {
    return Number(weightInput.value) * 0.453592;
  } else {
    return null;
  }
});

const activityLevel = computed(() => {
  if (selectedActivityCard.value == null) return 1;
  return activityCards[selectedActivityCard.value]?.value;
});

const macroDistribution = computed(() => {
  if (selectedPreference.value == null)
    return { protein: 0.35, carbohydrates: 0.3, fat: 0.3 };
  return dietPills[selectedPreference.value]?.value;
});

const targetWeightChange = computed(() => {
  if (selectedObjectiveCard.value == null || selectedPaceIndex.value == null)
    return 0;
  const multiplier = objectiveCards[selectedObjectiveCard.value]!.multiplier;
  return multiplier * sliderValues[selectedPaceIndex.value]!.value;
});

//step 1 inputs & cards
const age = ref<string | null>(null);
const gender = ref('Male');

const selectedHeightUnit = ref('cm');
const selectedWeightUnit = ref('kg');

const heightCm = ref(null);
const heightFt = ref(null);
const heightInch = ref(null);

const weightInput = ref<string | null>(null);
const selectedActivityCard = ref<number | null>(null);

const canContinueToStep2 = computed(() => {
  return (
    isValueValid(weightInput.value) &&
    height.value &&
    isValueValid(age.value) &&
    selectedActivityCard.value != null
  );
});

const activityCards = [
  {
    title: 'Sedentary',
    description: 'Little or no exercise',
    illustration: '/tracking/activity/sedentary.png',
    value: 1.2,
  },
  {
    title: 'Lightly Active',
    description: '1-3 days/week',
    illustration: '/tracking/activity/lightly-active.png',
    value: 1.375,
  },
  {
    title: 'Moderately Active',
    description: '3-5 days/week',
    illustration: '/tracking/activity/active.png',
    value: 1.55,
  },
  {
    title: 'Very Active',
    description: '6-7 days/week',
    illustration: '/tracking/activity/very-active.png',
    value: 1.725,
  },
  {
    title: 'Extra Active',
    description: 'Physically demanding job',
    illustration: '/tracking/activity/extra-active.png',
    value: 1.9,
  },
];

//step 2 inputs & cards

const selectedObjectiveCard = ref<number | null>(null);
const selectedPaceIndex = ref<number | null>(1);
const selectedPreference = ref<number | null>(0);

const canContinueToStep3 = computed(() => {
  return (
    selectedObjectiveCard.value != null &&
    selectedPaceIndex.value != null &&
    selectedPreference.value != null
  );
});

const objectiveCards = [
  {
    title: 'Lose Weight',
    description: 'Caloric Deficit',
    illustration: '/tracking/goal/lose.png',
    multiplier: -1,
  },
  {
    title: 'Maintain Weight',
    description: 'Caloric Balance',
    illustration: '/tracking/goal/maintain.png',
    multiplier: 0,
  },
  {
    title: 'Gain Muscle',
    description: 'Caloric Surplus',
    illustration: '/tracking/goal/gain.png',
    multiplier: 1,
  },
];

const dietPills = [
  {
    title: 'Balanced',
    description: '35%P · 30%C · 30%F',
    value: {
      protein: 0.35,
      carbohydrates: 0.3,
      fat: 0.3,
    },
  },
  {
    title: 'High-Protein',
    description: '50%P · 30%C · 20%F',
    value: {
      protein: 0.5,
      carbohydrates: 0.3,
      fat: 0.2,
    },
  },
  {
    title: 'Low-Carb',
    description: '30%P · 10%C · 60%F',
    value: {
      protein: 0.3,
      carbohydrates: 0.1,
      fat: 0.6,
    },
  },
  {
    title: 'Low-Fat',
    description: '25%P · 55%C · 20%F',
    value: {
      protein: 0.25,
      carbohydrates: 0.55,
      fat: 0.2,
    },
  },
  {
    title: 'Keto',
    description: '20%P · 5%C · 75%F',
    value: {
      protein: 0.2,
      carbohydrates: 0.05,
      fat: 0.75,
    },
  },
];

const sliderValues = [
  {
    title: 'Steady',
    value: 0.25,
    description: '0.25kg/week',
    illustration: '/tracking/pace/snail.png',
  },
  {
    title: 'Moderate',
    value: 0.5,
    description: '0.5kg/week',
    illustration: '/tracking/pace/horse.png',
  },
  {
    title: 'Fast',
    value: 0.75,
    description: '0.75kg/week',
    illustration: '/tracking/pace/rabbit.png',
  },
  {
    title: 'Aggressive',
    value: 1,
    description: '1kg/week',
    illustration: '/tracking/pace/cheetah.png',
  },
];

//step 3 inputs & functions
const targetInputs = ref({
  kcal: {
    input: '1940',
    locked: true,
  },
  protein: {
    input: '150',
    locked: false,
    selectedUnit: 'g',
  },
  carbohydrates: {
    input: '200',
    locked: false,
    selectedUnit: 'g',
  },
  fat: {
    input: '60',
    locked: false,
    selectedUnit: 'g',
  },
  fiber: {
    input: '',
  },
  sugar: {
    input: '',
  },
  salt: {
    input: '',
  },
});

const commonSuggestedTargets = ref({
  sugarLow: '',
  sugarWhoMax: '',
  fiberFDA: '',
  fiberHigh: '',
  saltLow: '3.5',
  saltWhoMax: '5',
});
/*
sugarLow  5%E
sugarWhoMax 10%E
fiberFDA 14g/1000kcal
fiberHigh 18g/1000kcal
saltLow 3.5g/day
saltWhoMax 5g/day 
*/
function fillCommonSuggestedTargets() {
  const kcal = Number(targetInputs.value.kcal.input);
  commonSuggestedTargets.value.sugarLow = ((kcal * 0.05) / 4).toFixed(1);
  commonSuggestedTargets.value.sugarWhoMax = ((kcal * 0.1) / 4).toFixed(1);
  commonSuggestedTargets.value.fiberFDA = ((kcal * 14) / 1000).toFixed(1);
  commonSuggestedTargets.value.fiberHigh = ((kcal * 18) / 1000).toFixed(1);
}

function toggleProteinUnit() {
  if (targetInputs.value.protein.selectedUnit === 'g') {
    targetInputs.value.protein.input = convertGramsToPercent(
      targetInputs.value.protein.input,
      4
    );
    targetInputs.value.protein.selectedUnit = '%';
  } else {
    targetInputs.value.protein.input = convertPercentToGrams(
      targetInputs.value.protein.input,
      4
    );
    targetInputs.value.protein.selectedUnit = 'g';
  }
}

function toggleCarbohydrateUnit() {
  if (targetInputs.value.carbohydrates.selectedUnit === 'g') {
    targetInputs.value.carbohydrates.input = convertGramsToPercent(
      targetInputs.value.carbohydrates.input,
      4
    );
    targetInputs.value.carbohydrates.selectedUnit = '%';
  } else {
    targetInputs.value.carbohydrates.input = convertPercentToGrams(
      targetInputs.value.carbohydrates.input,
      4
    );
    targetInputs.value.carbohydrates.selectedUnit = 'g';
  }
}

function toggleFatUnit() {
  if (targetInputs.value.fat.selectedUnit === 'g') {
    targetInputs.value.fat.input = convertGramsToPercent(
      targetInputs.value.fat.input,
      9
    );
    targetInputs.value.fat.selectedUnit = '%';
  } else {
    targetInputs.value.fat.input = convertPercentToGrams(
      targetInputs.value.fat.input,
      9
    );
    targetInputs.value.fat.selectedUnit = 'g';
  }
}

function convertGramsToPercent(gramsInput: string, kcalPerGram: number) {
  const grams = Number(gramsInput);
  const kcal = Number(targetInputs.value.kcal.input);
  if (isNaN(grams) || isNaN(kcal) || kcal === 0) return '';
  return (((grams * kcalPerGram) / kcal) * 100).toFixed(0);
}

function convertPercentToGrams(percentInput: string, kcalPerGram: number) {
  const percent = Number(percentInput) / 100;
  const kcal = Number(targetInputs.value.kcal.input);
  if (isNaN(percent) || isNaN(kcal) || kcal === 0) return '';
  return ((percent * kcal) / kcalPerGram).toFixed(0);
}

const calculateTargets = () => {
  if (
    !weight.value ||
    !height.value ||
    !age.value ||
    !activityLevel.value ||
    !macroDistribution.value ||
    selectedPaceIndex.value == null ||
    targetWeightChange.value == null
  )
    return;
  const genderConstant = gender.value === 'Male' ? 5 : -161;
  const bmr =
    10 * weight.value +
    6.25 * height.value -
    5 * Number(age.value) +
    genderConstant;
  const tdee = bmr * activityLevel.value;
  const kcalPerDayDiff = targetWeightChange.value * 1100; //*7700/7
  const targetKcal = tdee + kcalPerDayDiff;

  targetInputs.value.kcal.input = targetKcal.toFixed(0);
  targetInputs.value.protein.input = (
    (targetKcal * macroDistribution.value.protein) /
    4
  ).toFixed(0);
  targetInputs.value.fat.input = (
    (targetKcal * macroDistribution.value.fat) /
    9
  ).toFixed(0);
  targetInputs.value.carbohydrates.input = (
    (targetKcal * macroDistribution.value.carbohydrates) /
    4
  ).toFixed(0);
  fillCommonSuggestedTargets();
  targetInputs.value.sugar.input = commonSuggestedTargets.value.sugarWhoMax;
  targetInputs.value.fiber.input = commonSuggestedTargets.value.fiberFDA;
  targetInputs.value.salt.input = commonSuggestedTargets.value.saltWhoMax;
};

const canContinueToStep4 = computed(() => {
  return (
    isValueValid(targetInputs.value.kcal.input) &&
    isValueValid(targetInputs.value.protein.input) &&
    isValueValid(targetInputs.value.carbohydrates.input) &&
    isValueValid(targetInputs.value.fat.input) &&
    isValueValid(targetInputs.value.sugar.input) &&
    isValueValid(targetInputs.value.fiber.input) &&
    isValueValid(targetInputs.value.salt.input)
  );
});

const saveTracking = async () => {
  if (!canContinueToStep4.value) return;
  if (!auth.user) return;
  //@ts-ignore
  const userData = auth.user.user_data ?? {};

  userData.tracking = {
    biometrics: {
      weight: weight.value!,
      height: height.value!,
      age: Number(age.value),
      gender: gender.value,
      activityFactor: activityLevel.value!,
    },
    goal: {
      targetWeightChange: targetWeightChange.value!,
      startDate: new Date().toISOString(),
    },
    targets: {
      kcal: Number(targetInputs.value.kcal.input),
      protein: Number(targetInputs.value.protein.input),
      carbohydrates: Number(targetInputs.value.carbohydrates.input),
      fat: Number(targetInputs.value.fat.input),
      sugar: Number(targetInputs.value.sugar.input),
      fiber: Number(targetInputs.value.fiber.input),
      salt: Number(targetInputs.value.salt.input),
    },
  };

  const { error } = await supabase
    .from('profiles')
    .update({ user_data: userData })
    .eq('id', auth.user.id);
  if (error) {
    console.error('Failed to save tracking:', error);
  }
  auth.fetchProfile();
  navigateTo('/tracking/today');
};
</script>

<style scoped>
.slider-gradient-fill {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 24px;
  border-radius: 12px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  pointer-events: none;
}

.slider-input {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: calc(90% + 42px);
  left: calc(5% - 21px);
  height: 24px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  z-index: 30;
}

/* Chrome, Safari, Edge */
.slider-input::-webkit-slider-track {
  width: 100%;
  height: 24px;
  background: transparent;
  border-radius: 12px;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 42px;
  height: 42px;
  background: white;
  border: 4px solid #ff6b6b;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
  transition: all 0.2s ease;
  margin-top: -9px;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.slider-input::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

/* Firefox */
.slider-input::-moz-range-track {
  width: 100%;
  height: 24px;
  background: transparent;
  border-radius: 12px;
}

.slider-input::-moz-range-thumb {
  width: 42px;
  height: 42px;
  background: white;
  border: 4px solid #ff6b6b;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
  transition: all 0.2s ease;
  border: none;
}

.slider-input::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.slider-input::-moz-range-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-enter-to,
.fade-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-down-enter-to,
.fade-down-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
