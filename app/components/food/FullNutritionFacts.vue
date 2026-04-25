<template>
  <div v-if="fullNutrition">
    <div class="flex-row flex-wrap gap-x-10 gap-y-9 hidden md:flex" :class="{ 'hidden!': singleColumn }">
      <div class="flex-1 min-w-0 flex flex-col gap-6 basis-80">
        <NutritionMicroGroup v-for="s in rail1" :key="s.title" :title="s.title" :subtitle="s.subtitle"
          :accent-class="s.accentClass" :bar-class="s.barClass" :kind="s.kind" :items="s.items" :kcal="kcalForNorm" />
      </div>
      <div class="flex-1 min-w-0 flex flex-col gap-6 basis-80">
        <NutritionMicroGroup v-for="s in rail2" :key="s.title" :title="s.title" :subtitle="s.subtitle"
          :accent-class="s.accentClass" :bar-class="s.barClass" :kind="s.kind" :items="s.items" :kcal="kcalForNorm" />
      </div>
    </div>
    <div class="flex flex-col gap-6 md:hidden" :class="{ 'flex!': singleColumn }">
      <NutritionMicroGroup v-for="s in fullColumn" :key="s.title" :title="s.title" :subtitle="s.subtitle"
        :accent-class="s.accentClass" :bar-class="s.barClass" :kind="s.kind" :items="s.items" :kcal="kcalForNorm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FullFoodRow } from '~/types/types';

const props = withDefaults(defineProps<{
  food?: FullFoodRow;
  recipe?: Recipe;
  portionMultiplier?: number;
  /** Include a Macros group (carbs, fat, protein, fiber, salt) at the top of rail 1 */
  showMacros?: boolean;
  singleColumn?: boolean;
  subtitle?: string;
}>(), {
  showMacros: false,
  singleColumn: false,
  subtitle: null,
});

const fullNutrition = computed(() => {
  if (props.food) return props.food;
  if (props.recipe) return props.recipe.report?.cumulative ?? {};
  return {};
});

const report = computed(() => {
  if (props.food) return props.food.report;
  if (props.recipe) return props.recipe.report;
  return {} as any;
});

const scaled = computed(() => {
  const source = fullNutrition.value as Record<string, unknown>;
  const mult = props.portionMultiplier ?? 1;
  const out: Record<string, number> = {};
  if (!source) return out;
  for (const key in source) {
    if (typeof source[key] === 'number') out[key] = (source[key] as number) * mult;
  }
  return out;
});

/** Base kcal used to normalize the on-track badge. Prefer recipe-level kcal, else cumulative. */
const kcalForNorm = computed(() => {
  const recipeKcal = (props.recipe as any)?.kcal;
  if (typeof recipeKcal === 'number' && recipeKcal > 0) {
    return recipeKcal * (props.portionMultiplier ?? 1);
  }
  return scaled.value['kcal'] ?? 2200;
});

// ---------- RDA definitions ----------
const rdaValues: Record<string, number> = {
  // Vitamins
  vitamin_a_ug_rae: 900,
  vitamin_b6_mg: 1.3,
  vitamin_b12_ug: 2.4,
  vitamin_c_mg: 90,
  vitamin_d_ug: 20,
  vitamin_e_mg_alpha_te: 15,
  vitamin_k_ug: 120,
  thiamine_b1_mg: 1.2,
  riboflavin_b2_mg: 1.3,
  niacin_b3_mg: 16,
  folate_ug_dfe: 400,
  choline_mg: 550,
  // Minerals
  calcium_mg: 1000,
  copper_mg: 0.9,
  iodine_ug: 150,
  iron_mg: 18,
  magnesium_mg: 420,
  manganese_mg: 2.3,
  potassium_mg: 4700,
  selenium_ug: 55,
  zinc_mg: 11,
  // Amino Acids
  cysteine_mg: 700,
  histidine_mg: 700,
  isoleucine_mg: 1400,
  leucine_mg: 2730,
  lysine_mg: 2100,
  methionine_mg: 700,
  phenylalanine_mg: 1750,
  threonine_mg: 1050,
  tryptophan_mg: 280,
  tyrosine_mg: 1750,
  valine_mg: 1820,
  // Fatty Acids (rough targets / upper limits)
  saturated_fat: 20,
  trans_fats_mg: 2000,
  mufas_total_mg: 30000,
  omega3_total_mg: 1600,
  omega6_total_mg: 17000,
};

const vitaminDefs = [
  { key: 'vitamin_a_ug_rae', label: 'Vitamin A', unit: 'μg RAE' },
  { key: 'vitamin_b6_mg', label: 'Vitamin B6', unit: 'mg' },
  { key: 'vitamin_b12_ug', label: 'Vitamin B12', unit: 'μg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg' },
  { key: 'vitamin_d_ug', label: 'Vitamin D', unit: 'μg' },
  { key: 'vitamin_e_mg_alpha_te', label: 'Vitamin E', unit: 'mg α-TE' },
  { key: 'vitamin_k_ug', label: 'Vitamin K', unit: 'μg' },
  { key: 'thiamine_b1_mg', label: 'Thiamine (B1)', unit: 'mg' },
  { key: 'riboflavin_b2_mg', label: 'Riboflavin (B2)', unit: 'mg' },
  { key: 'niacin_b3_mg', label: 'Niacin (B3)', unit: 'mg' },
  { key: 'folate_ug_dfe', label: 'Folate', unit: 'μg DFE' },
  { key: 'choline_mg', label: 'Choline', unit: 'mg' },
];

const mineralDefs = [
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'copper_mg', label: 'Copper', unit: 'mg' },
  { key: 'iodine_ug', label: 'Iodine', unit: 'μg' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg' },
  { key: 'manganese_mg', label: 'Manganese', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'selenium_ug', label: 'Selenium', unit: 'μg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
];

const aminoDefs = [
  { key: 'cysteine_mg', label: 'Cysteine', unit: 'mg' },
  { key: 'histidine_mg', label: 'Histidine', unit: 'mg' },
  { key: 'isoleucine_mg', label: 'Isoleucine', unit: 'mg' },
  { key: 'leucine_mg', label: 'Leucine', unit: 'mg' },
  { key: 'lysine_mg', label: 'Lysine', unit: 'mg' },
  { key: 'methionine_mg', label: 'Methionine', unit: 'mg' },
  { key: 'phenylalanine_mg', label: 'Phenylalanine', unit: 'mg' },
  { key: 'threonine_mg', label: 'Threonine', unit: 'mg' },
  { key: 'tryptophan_mg', label: 'Tryptophan', unit: 'mg' },
  { key: 'tyrosine_mg', label: 'Tyrosine', unit: 'mg' },
  { key: 'valine_mg', label: 'Valine', unit: 'mg' },
];

const fattyAcidDefs = [
  { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g' },
  { key: 'trans_fats_mg', label: 'Trans Fats', unit: 'mg' },
  { key: 'mufas_total_mg', label: 'Monounsaturated Fats', unit: 'mg' },
  { key: 'omega3_total_mg', label: 'Omega-3', unit: 'mg' },
  { key: 'omega6_total_mg', label: 'Omega-6', unit: 'mg' },
];

const protectiveDefs = [
  { key: 'carotenoidsPer2000kcal', label: 'Carotenoids' },
  { key: 'polyphenolsPer2000kcal', label: 'Polyphenols' },
  { key: 'glucosinolatesPer2000kcal', label: 'Glucosinolates' },
];

// ---------- Section row builders ----------
function rdaRows(defs: { key: string; label: string; unit: string }[]) {
  return defs.map((d) => ({
    key: d.key,
    label: d.label,
    unit: d.unit,
    value: scaled.value[d.key] ?? 0,
    rda: rdaValues[d.key] ?? 0,
  }));
}

const levelRows = computed(() =>
  protectiveDefs.map((d) => ({
    key: d.key,
    label: d.label,
    levelValue: (report.value?.details?.protectiveCompounds?.[d.key] as number) ?? 0,
  })),
);

const macroRows = computed(() => {
  const s = scaled.value;
  return [
    {
      key: 'kcal',
      label: 'Calories',
      unit: 'kcal',
      value: s.kcal,
      ref: 2000,
      barClass: 'bg-primary-200',
    },
    {
      key: 'carbohydrates',
      label: 'Carbs',
      unit: 'g',
      value: s.carbohydrates ?? 0,
      ref: 260,
      barClass: 'bg-carbs',
      subLabel: 'Sugar',
      subValue: s.sugar ?? 0,
      subBarClass: 'bg-sugar',
    },
    {
      key: 'fat',
      label: 'Fat',
      unit: 'g',
      value: s.fat ?? 0,
      ref: 70,
      barClass: 'bg-fat',
      subLabel: 'Saturated Fat',
      subValue: s.saturated_fat ?? 0,
      subBarClass: 'bg-saturated-fat',
    },
    {
      key: 'protein',
      label: 'Protein',
      unit: 'g',
      value: s.protein ?? 0,
      ref: 50,
      barClass: 'bg-protein',
    },
    {
      key: 'fiber',
      label: 'Fiber',
      unit: 'g',
      value: s.fiber ?? 0,
      ref: 25,
      barClass: 'bg-fiber',
    },
    {
      key: 'salt',
      label: 'Salt',
      unit: 'g',
      value: s.salt ?? 0,
      ref: 5,
      barClass: 'bg-salt',
    },
  ];
});

// ---------- Section objects & rail layout ----------
type Section = {
  title: string;
  subtitle?: string;
  accentClass: string;
  barClass: string;
  kind: 'rda' | 'level' | 'macro';
  items: any[];
};

const macroSection = computed<Section>(() => ({
  title: 'Macros',
  subtitle: props.subtitle ?? 'per serving',
  accentClass: 'bg-slate-500',
  barClass: 'bg-slate-200',
  kind: 'macro',
  items: macroRows.value,
}));

const vitaminSection = computed<Section>(() => ({
  title: 'Vitamins',
  accentClass: 'bg-purple-400',
  barClass: 'bg-purple-200',
  kind: 'rda',
  items: rdaRows(vitaminDefs),
}));

const mineralSection = computed<Section>(() => ({
  title: 'Minerals',
  accentClass: 'bg-orange-400',
  barClass: 'bg-orange-200',
  kind: 'rda',
  items: rdaRows(mineralDefs),
}));

const fattyAcidSection = computed<Section>(() => ({
  title: 'Fatty Acids',
  accentClass: 'bg-green-400',
  barClass: 'bg-green-200',
  kind: 'rda',
  items: rdaRows(fattyAcidDefs),
}));

const aminoSection = computed<Section>(() => ({
  title: 'Amino Acids',
  accentClass: 'bg-blue-400',
  barClass: 'bg-blue-200',
  kind: 'rda',
  items: rdaRows(aminoDefs),
}));

const protectiveSection = computed<Section>(() => ({
  title: 'Protective Compounds',
  accentClass: 'bg-teal-400',
  barClass: 'bg-teal-200',
  kind: 'level',
  items: levelRows.value,
}));

/**
 * Balanced rails (~equal vertical height). Row counts:
 *   With macros:    rail1 = 5+12+5 = 22,   rail2 = 9+11+3 = 23
 *   Without macros: rail1 = 12+5+3 = 20,   rail2 = 9+11    = 20
 */
const rail1 = computed<Section[]>(() => {
  if (props.showMacros) return [macroSection.value, vitaminSection.value, fattyAcidSection.value];
  return [vitaminSection.value, fattyAcidSection.value, protectiveSection.value];
});

const rail2 = computed<Section[]>(() => {
  if (props.showMacros) return [mineralSection.value, aminoSection.value, protectiveSection.value];
  return [mineralSection.value, aminoSection.value];
});

const fullColumn = computed<Section[]>(() => {
  return [macroSection.value, vitaminSection.value, mineralSection.value, fattyAcidSection.value, protectiveSection.value, aminoSection.value,];
});
</script>
