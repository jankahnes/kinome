<template>
  <BlocksResponsiveInfo v-model="open" sidePanelClass="w-100">
    <div class="p-5 flex flex-col gap-5">
      <div>
        <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Nutrition Quality</div>
        <h2 class="text-2xl font-bold">Micronutrients</h2>
      </div>
      <template v-if="micronutrientGroups.hasAny">
        <div v-if="micronutrientGroups.vitamins.length">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Vitamins</div>
          <div class="flex flex-col gap-3">
            <div v-for="nutrient in micronutrientGroups.vitamins" :key="nutrient.name">
              <div class="flex justify-between items-center mb-1.5">
                <span class="text-sm font-semibold">{{ nutrient.displayName }}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-slate-400">{{ Math.min(nutrient.rdaPerServing, 999) }}%</span>
                  <span v-if="getOnTrackBadge(nutrient.rdaPerServing)" class="text-xs px-1.5 py-0.5 rounded-full"
                  :class="getOnTrackBadge(nutrient.rdaPerServing)!.cls">
                  {{ getOnTrackBadge(nutrient.rdaPerServing)!.label }}
                </span>
                </div>
              </div>
              <div class="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300"
                  :class="getMicroBarClass(nutrient.rdaPerServing)"
                  :style="{ width: Math.min(120, nutrient.rdaPerServing) + '%' }" />
              </div>
            </div>
          </div>
        </div>
        <div v-if="micronutrientGroups.minerals.length">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Minerals</div>
          <div class="flex flex-col gap-3">
            <div v-for="nutrient in micronutrientGroups.minerals" :key="nutrient.name">
              <div class="flex justify-between items-center mb-1.5">
                <span class="text-sm font-semibold">{{ nutrient.displayName }}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-slate-400">{{ Math.min(nutrient.rdaPerServing, 999) }}%</span>
                  <span v-if="getOnTrackBadge(nutrient.rdaPerServing)" class="text-xs px-1.5 py-0.5 rounded-full"
                    :class="getOnTrackBadge(nutrient.rdaPerServing)!.cls">
                    {{ getOnTrackBadge(nutrient.rdaPerServing)!.label }}
                  </span>
                </div>
              </div>
              <div class="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300"
                  :class="getMicroBarClass(nutrient.rdaPerServing)"
                  :style="{ width: Math.min(120, nutrient.rdaPerServing) + '%' }" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <p v-else class="text-sm text-slate-400">Log some food to see micronutrient data.</p>
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
  kcalProgress?: number | null;
}>();

const open = defineModel<boolean>({ default: false });

const micronutrientGroups = computed(() => {
  const all = props.micronutrients ?? [];
  const vitamins = all
    .filter((n) => VITAMIN_SET.has(n.name))
    .sort((a, b) => VITAMIN_ORDER.indexOf(a.name) - VITAMIN_ORDER.indexOf(b.name));
  const minerals = all
    .filter((n) => !VITAMIN_SET.has(n.name))
    .sort((a, b) => {
      const ai = MINERAL_ORDER.indexOf(a.name);
      const bi = MINERAL_ORDER.indexOf(b.name);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  return { vitamins, minerals, hasAny: all.length > 0 };
});

/** Same meaning as daily tracking: share of reference day (goal or 2000 kcal). */
const effectiveKcalProgress = computed(() => {
  if (props.kcalProgress != null) {
    return Math.max(0, props.kcalProgress);
  }
  const ref = props.referenceKcal ?? 2000;
  return Math.max(0, (props.kcal ?? 0) / ref);
});

function getMicroBarClass(rda: number): string {
  if (rda >= 100) return 'bg-blue-400';
  if (rda >= 70) return 'bg-emerald-400';
  if (rda >= 40) return 'bg-yellow-400';
  return 'bg-red-400';
}

function getOnTrackBadge(rda: number): { label: string; cls: string } | null {
  const p = effectiveKcalProgress.value;
  const projected = rda / p;
  if (projected >= 100) return { label: 'On track', cls: 'bg-blue-100 text-blue-700' };
  if (projected >= 70) return { label: 'On track', cls: 'bg-green-100 text-green-700' };
  if (projected >= 40) return { label: 'Moderate', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Low', cls: 'bg-red-100 text-red-700' };
}
</script>
