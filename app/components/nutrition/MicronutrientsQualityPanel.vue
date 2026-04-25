<template>
  <BlocksResponsiveInfo v-model="open" sidePanelClass="w-100">
    <div class="p-4 md:p-2 flex flex-col gap-6">
      <div>
        <div class="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Nutrition Quality</div>
        <h2 class="text-3xl font-headers tracking-tight">Micronutrients</h2>
      </div>

      <template v-if="hasAny">
        <NutritionMicroGroup
          v-if="vitaminItems.length"
          title="Vitamins"
          accent-class="bg-purple-400"
          bar-class="bg-purple-200"
          kind="rda"
          :items="vitaminItems"
          :kcal="normalizingKcal"
          color-coded-bars
        />
        <NutritionMicroGroup
          v-if="mineralItems.length"
          title="Minerals"
          accent-class="bg-orange-400"
          bar-class="bg-orange-200"
          kind="rda"
          :items="mineralItems"
          :kcal="normalizingKcal"
          color-coded-bars
        />
      </template>
      <p v-else class="text-sm text-gray-400">Log some food to see micronutrient data.</p>
    </div>
  </BlocksResponsiveInfo>
</template>

<script setup lang="ts">
type MicroNutrient = { name: string; displayName: string; rdaPerServing: number };

const VITAMIN_ORDER = [
  'vitamin_a_ug_rae', 'thiamine_b1_mg', 'riboflavin_b2_mg', 'niacin_b3_mg',
  'vitamin_b6_mg', 'folate_ug_dfe', 'vitamin_b12_ug',
  'vitamin_c_mg', 'vitamin_d_ug', 'vitamin_e_mg_alpha_te', 'vitamin_k_ug',
];
const MINERAL_ORDER = [
  'calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'zinc_mg',
  'selenium_ug', 'iodine_ug', 'copper_mg', 'manganese_mg',
];
const VITAMIN_SET = new Set(VITAMIN_ORDER);

const props = defineProps<{
  micronutrients?: MicroNutrient[] | null;
  /** Share of the reference kcal day the user has consumed so far (e.g. 0.4 = 40%). */
  kcalProgress?: number | null;
}>();

const open = defineModel<boolean>({ default: false });

// Map each nutrient's rdaPerServing into the { value, rda, unit } shape MicroGroup expects.
// value = rdaPerServing, rda = 100 → rawPct matches the source %.
// kcal is set so MicroGroup's density math equals the old "projected = rda / kcalProgress".
function toItem(n: MicroNutrient) {
  return {
    key: n.name,
    label: n.displayName,
    unit: '',
    value: n.rdaPerServing,
    rda: 100,
  };
}

const vitaminItems = computed(() =>
  (props.micronutrients ?? [])
    .filter((n) => VITAMIN_SET.has(n.name))
    .sort((a, b) => VITAMIN_ORDER.indexOf(a.name) - VITAMIN_ORDER.indexOf(b.name))
    .map(toItem),
);

const mineralItems = computed(() =>
  (props.micronutrients ?? [])
    .filter((n) => !VITAMIN_SET.has(n.name))
    .sort((a, b) => {
      const ai = MINERAL_ORDER.indexOf(a.name);
      const bi = MINERAL_ORDER.indexOf(b.name);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    })
    .map(toItem),
);

const hasAny = computed(() => (props.micronutrients?.length ?? 0) > 0);

// MicroGroup's density math: (value/rda) * (2200/kcal) * 100
// We want: rdaPerServing / kcalProgress  (the panel's old "projected")
// So kcal = 2200 * kcalProgress gives (rdaPerServing/100) * (2200 / (2200*p)) * 100 = rdaPerServing/p ✓
const normalizingKcal = computed(() => {
  const p = Math.max(0.0001, props.kcalProgress ?? 1);
  return 2200 * p;
});
</script>
