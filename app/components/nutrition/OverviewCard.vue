<template>
  <div class="flex flex-col bg-primary-10/40 rounded-4xl p-4">
    <div class="flex justify-between items-center mb-3 mx-2 gap-4 gap-y-2 flex-wrap">
      <h3 class="text-4xl font-bold tracking-tighter shrink-0">Nutrition Overview</h3>
      <div class="flex items-center gap-2 ">
        <div v-if="mode === 'info' && dropdownChoices?.length" class="relative min-w-36">
          <FormsDropdown
            :choices="dropdownChoices"
            :model-value="selectedUnit ?? dropdownChoices[0]"
            @update:model-value="emit('update:selectedUnit', $event)"
            :style="'bg-primary-10'"
          />
        </div>
        <button
          @click="mode === 'info' ? emit('viewFullNutrition') : emit('viewOverallReport')"
          class="flex items-center gap-0.5 animated-button text-sm p-2"
          :class="mode === 'info' ? 'bg-primary-10' : 'text-slate-400'"
        >
          <span v-if="mode === 'info'" class="hidden sm:inline">View Full</span>
          <IconChevronRight class="w-6" />
        </button>
      </div>
    </div>

    <div class="flex flex-wrap 2xl:grid grid-cols-4 gap-2">
      <!-- Kcal card (col-span-2) -->
      <div class="flex flex-col justify-between p-4 basis-70 bg-primary-10 rounded-3xl col-span-2 gap-6 flex-2">
        <div>
          <div class="text-2xl font-bold leading-none">Kcal</div>
          <div class="text-[58px] leading-none font-bold">
            {{ kcalValue
            }}<span v-if="mode === 'tracking'" class="text-xl text-nowrap">/{{ kcalGoal }} kcal</span
            ><span v-else class="text-xl text-slate-400"> kcal</span>
          </div>
        </div>
        <div class="flex w-full h-3 rounded-full overflow-hidden bg-slate-200">
          <div
            class="h-full rounded-full transition-all duration-300 bg-slate-400"
            :style="{ width: Math.min(100, (kcalValue / kcalGoal) * 100) + '%' }"
          />
        </div>
      </div>

      <!-- Fiber, Salt, Protein, Fat -->
      <div
        v-for="item in overviewItems.slice(0, 4)"
        :key="item.title"
        class="flex flex-col items-center justify-between p-4 bg-primary-10 rounded-3xl gap-1 flex-1 basis-30"
        :class="{'opacity-80': item.total < 0.5}"
      >
        <div class="w-14 h-14 p-2 rounded-full" :class="item.bgLightClass">
          <img
            class="w-full h-full object-contain"
            :src="`/nutrition-highlights/${item.img}`"
            :alt="item.title"
          />
        </div>
        <div class="text-lg mt-1 leading-none">{{ item.title }}</div>
        <div class="font-bold text-xl leading-none">
          {{ item.total }}{{ item.unit
          }}<span v-if="mode === 'tracking'" class="text-sm font-normal">/{{ item.goal }}{{ item.unit }}</span>
        </div>
        <div class="flex w-full h-2 rounded-full overflow-hidden" :class="item.bgLightClass">
          <template v-if="item.saturatedFatPct !== undefined">
            <div
              class="h-full rounded-full transition-all duration-300 bg-saturated-fat z-10"
              :style="{ width: item.saturatedFatPct + '%' }"
            />
            <div
              class="h-full rounded-full transition-all duration-300 -ml-2 z-0"
              :class="item.bgClass"
              :style="{ width: Math.min(100, (item.total / item.goal) * 100) + '%' }"
            />
          </template>
          <div
            v-else
            class="h-full rounded-full transition-all duration-300"
            :class="item.bgClass"
            :style="{ width: Math.min(100, (item.total / item.goal) * 100) + '%' }"
          />
        </div>
      </div>

      <!-- Carbs + Sugar paired card -->
      <div class="col-span-2 flex gap-2 rounded-3xl bg-primary-10/50 p-1 flex-2">
        <div
          v-for="item in overviewItems.slice(4)"
          :key="item.title"
          class="flex flex-col items-center justify-between p-3 bg-primary-10 rounded-[1.25rem] gap-1 flex-1"
          :class="{'opacity-80': item.total < 0.5}"
        >
          <div class="w-14 h-14 p-2 rounded-full" :class="item.bgLightClass">
            <img
              class="w-full h-full object-contain"
              :src="`/nutrition-highlights/${item.img}`"
              :alt="item.title"
            />
          </div>
          <div class="text-lg mt-1 leading-none">{{ item.title }}</div>
          <div class="font-bold text-xl leading-none">
            {{ item.total }}{{ item.unit
            }}<span v-if="mode === 'tracking'" class="text-sm font-normal">/{{ item.goal }}{{ item.unit }}</span>
          </div>
          <div class="flex w-full h-2 rounded-full overflow-hidden" :class="item.bgLightClass">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="item.bgClass"
              :style="{ width: Math.min(100, (item.total / item.goal) * 100) + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NutritionSource {
  kcal?: number | null;
  protein?: number | null;
  fat?: number | null;
  saturated_fat?: number | null;
  carbohydrates?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  salt?: number | null;
}

interface TrackingGoals {
  kcal?: number;
  protein?: number;
  fat?: number;
  carbohydrates?: number;
  fiber?: number;
  sugar?: number;
  salt?: number;
}

const props = defineProps<{
  mode: 'info' | 'tracking';
  nutrition: NutritionSource | null;
  portionMultiplier?: number;
  dropdownChoices?: { value: number; displayName: string }[];
  selectedUnit?: { value: number; displayName: string };
  trackingGoals?: TrackingGoals | null;
}>();

const emit = defineEmits<{
  'update:selectedUnit': [value: { value: number; displayName: string }];
  viewFullNutrition: [];
  viewOverallReport: [];
}>();

const mult = computed(() => (props.mode === 'info' ? (props.portionMultiplier ?? 1) : 1));

function val(key: keyof NutritionSource): number {
  const v = props.nutrition?.[key];
  return typeof v === 'number' ? v * mult.value : 0;
}

const kcalValue = computed(() => Math.round(val('kcal')));
const kcalGoal = computed(() => props.trackingGoals?.kcal ?? 2000);

const overviewItems = computed(() => {
  const n = props.nutrition;
  const g = props.trackingGoals ?? {};

  return [
    {
      title: 'Fiber',
      img: 'fiber2.webp',
      bgClass: 'bg-fiber',
      bgLightClass: 'bg-fiber/30',
      total: Math.round(val('fiber')),
      goal: g.fiber ?? 30,
      unit: 'g',
      saturatedFatPct: undefined as number | undefined,
    },
    {
      title: 'Salt',
      img: 'salt2.webp',
      bgClass: 'bg-salt',
      bgLightClass: 'bg-salt/30',
      total: Math.round(val('salt')),
      goal: g.salt ?? 5,
      unit: 'g',
      saturatedFatPct: undefined as number | undefined,
    },
    {
      title: 'Protein',
      img: 'protein2.webp',
      bgClass: 'bg-protein',
      bgLightClass: 'bg-protein/30',
      total: Math.round(val('protein')),
      goal: g.protein ?? 100,
      unit: 'g',
      saturatedFatPct: undefined as number | undefined,
    },
    {
      title: 'Fat',
      img: 'fat.webp',
      bgClass: 'bg-fat',
      bgLightClass: 'bg-fat/30',
      total: Math.round(val('fat')),
      goal: g.fat ?? 70,
      unit: 'g',
      saturatedFatPct: n
        ? Math.min(100, ((n.saturated_fat ?? 0) / (n.fat ?? 1)) * 100)
        : (undefined as number | undefined),
    },
    {
      title: 'Carbs',
      img: 'fiber.webp',
      bgClass: 'bg-carbs',
      bgLightClass: 'bg-carbs/30',
      total: Math.round(val('carbohydrates')),
      goal: g.carbohydrates ?? 275,
      unit: 'g',
      saturatedFatPct: undefined as number | undefined,
    },
    {
      title: 'Sugar',
      img: 'sugar.webp',
      bgClass: 'bg-sugar',
      bgLightClass: 'bg-sugar/30',
      total: Math.round(val('sugar')),
      goal: g.sugar ?? 40,
      unit: 'g',
      saturatedFatPct: undefined as number | undefined,
    },
  ];
});
</script>
