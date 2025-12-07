<template>
  <div class="flex flex-wrap gap-6">
    <!-- Vitamins Section -->
    <div class="nutrient-section">
      <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>💊</span>
        <span>Vitamins</span>
      </h3>
      <div class="flex flex-col gap-4">
        <div v-for="nutrient in vitamins" :key="nutrient.key">
          <div class="flex justify-between items-center gap-2 mb-1">
            <span class="text-lg tracking-tight">{{ nutrient.label }}</span>
            <div class="flex flex-col items-end">
              <span class="font-semibold whitespace-nowrap leading-none">
                {{ formatValue(scaledFood[nutrient.key]) }} {{ nutrient.unit }}
              </span>
              <!-- RDA indicator bar under value -->

              <span
                class="text-xs text-gray-500 leading-none mt-2"
                v-if="false"
              >
                {{
                  getRdaBarPercentage(
                    scaledFood[nutrient.key],
                    rdaValues[nutrient.key]
                  ).toFixed(0)
                }}% RDA
              </span>
              <div
                class="flex w-10 h-1 rounded-full overflow-hidden bg-gray-200 mt-1"
              >
                <div
                  class="h-full rounded-full bg-gray-700 transition-all duration-300"
                  :style="{
                    width:
                      getRdaBarPercentage(
                        scaledFood[nutrient.key],
                        rdaValues[nutrient.key]
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>
          </div>
          <!-- Main bar (relative to calories) -->
          <div class="flex w-full h-2 rounded-full overflow-hidden bg-gray-100">
            <div
              class="h-full rounded-full transition-all duration-300 bg-purple-200"
              :style="{
                width:
                  getMainBarPercentage(
                    scaledFood[nutrient.key],
                    rdaValues[nutrient.key]
                  ) + '%',
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Minerals Section -->
    <div class="nutrient-section">
      <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>⚡</span>
        <span>Minerals</span>
      </h3>
      <div class="flex flex-col gap-4">
        <div v-for="nutrient in minerals" :key="nutrient.key">
          <div class="flex justify-between items-baseline gap-2 mb-1">
            <span class="text-lg tracking-tight">{{ nutrient.label }}</span>
            <div class="flex flex-col items-end gap-0.5">
              <span class="font-semibold whitespace-nowrap leading-none">
                {{ formatValue(scaledFood[nutrient.key]) }} {{ nutrient.unit }}
              </span>
              <!-- RDA indicator bar under value -->
              <div
                class="flex w-10 h-1 rounded-full overflow-hidden bg-gray-200 mt-1"
              >
                <div
                  class="h-full rounded-full bg-gray-700 transition-all duration-300"
                  :style="{
                    width:
                      getRdaBarPercentage(
                        scaledFood[nutrient.key],
                        rdaValues[nutrient.key]
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>
          </div>
          <!-- Main bar (relative to calories) -->
          <div class="flex w-full h-2 rounded-full overflow-hidden bg-gray-100">
            <div
              class="h-full rounded-full transition-all duration-300 bg-orange-200"
              :style="{
                width:
                  getMainBarPercentage(
                    scaledFood[nutrient.key],
                    rdaValues[nutrient.key]
                  ) + '%',
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Amino Acids Section -->
    <div class="nutrient-section">
      <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>🧬</span>
        <span>Amino Acids</span>
      </h3>
      <div class="flex flex-col gap-4">
        <div v-for="nutrient in aminoAcids" :key="nutrient.key">
          <div class="flex justify-between items-baseline gap-2 mb-1">
            <span class="text-lg tracking-tight">{{ nutrient.label }}</span>
            <div class="flex flex-col items-end gap-0.5">
              <span class="font-semibold whitespace-nowrap leading-none">
                {{ formatValue(scaledFood[nutrient.key]) }} {{ nutrient.unit }}
              </span>
              <!-- RDA indicator bar under value -->
              <div
                class="flex w-10 h-1 rounded-full overflow-hidden bg-gray-200 mt-1"
              >
                <div
                  class="h-full rounded-full bg-gray-700 transition-all duration-300"
                  :style="{
                    width:
                      getRdaBarPercentage(
                        scaledFood[nutrient.key],
                        rdaValues[nutrient.key]
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>
          </div>
          <!-- Main bar (relative to calories) -->
          <div class="flex w-full h-2 rounded-full overflow-hidden bg-gray-100">
            <div
              class="h-full rounded-full transition-all duration-300 bg-blue-200"
              :style="{
                width:
                  getMainBarPercentage(
                    scaledFood[nutrient.key],
                    rdaValues[nutrient.key]
                  ) + '%',
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fatty Acids Section -->
    <div class="nutrient-section">
      <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>🥑</span>
        <span>Fatty Acids</span>
      </h3>
      <div class="flex flex-col gap-4">
        <div v-for="nutrient in fattyAcids" :key="nutrient.key">
          <div class="flex justify-between items-baseline gap-2 mb-1">
            <span class="text-lg tracking-tight">{{ nutrient.label }}</span>
            <div class="flex flex-col items-end gap-0.5">
              <span class="font-semibold whitespace-nowrap leading-none">
                {{ formatValue(scaledFood[nutrient.key]) }} {{ nutrient.unit }}
              </span>
              <!-- RDA indicator bar under value -->
              <div
                class="flex w-10 h-1 rounded-full overflow-hidden bg-gray-200 mt-1"
              >
                <div
                  class="h-full rounded-full bg-gray-700 transition-all duration-300"
                  :style="{
                    width:
                      getRdaBarPercentage(
                        scaledFood[nutrient.key],
                        rdaValues[nutrient.key]
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>
          </div>
          <!-- Main bar (relative to calories) -->
          <div class="flex w-full h-2 rounded-full overflow-hidden bg-gray-100">
            <div
              class="h-full rounded-full transition-all duration-300 bg-green-200"
              :style="{
                width:
                  getMainBarPercentage(
                    scaledFood[nutrient.key],
                    rdaValues[nutrient.key]
                  ) + '%',
              }"
            ></div>
          </div>
        </div>
      </div>
      <h3 class="text-2xl font-bold mb-4 flex items-center gap-2 mt-8">
        <span>🛡️</span>
        <span>Protective Compounds</span>
      </h3>
      <div class="flex flex-col gap-4">
        <div v-for="compound in protectiveCompounds" :key="compound.key">
          <div class="flex justify-between items-baseline gap-2 mb-1">
            <span class="text-lg tracking-tight">{{ compound.label }}</span>
            <span
              class="font-semibold leading-none"
              :class="
                getLevelColor(food[compound.key as keyof FullFoodRow] as number)
              "
            >
              {{
                getLevelText(food[compound.key as keyof FullFoodRow] as number)
              }}
            </span>
          </div>
          <!-- Bar showing 0-10 scale -->
          <div class="flex w-full h-2 rounded-full overflow-hidden bg-gray-100">
            <div
              class="h-full rounded-full bg-teal-200 transition-all duration-300"
              :style="{
                width:
                  ((food[compound.key as keyof FullFoodRow] as number) / 10) *
                    100 +
                  '%',
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FullFoodRow } from '~/types/types';

const props = defineProps<{
  food: FullFoodRow;
  portionMultiplier: number;
}>();

// Scaled food values
const scaledFood = computed(() => {
  const scaled: Record<string, number> = {};
  for (const key in props.food) {
    if (typeof props.food[key as keyof FullFoodRow] === 'number') {
      scaled[key] =
        (props.food[key as keyof FullFoodRow] as number) *
        props.portionMultiplier;
    }
  }
  return scaled;
});

// RDA values in the appropriate units
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

  // Amino Acids (essential amino acids - rough estimates for adults)
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

  // Fatty Acids (based on typical recommendations)
  saturated_fat: 20, // g, upper limit
  trans_fats_mg: 2000, // mg, upper limit (2g)
  mufas_total_mg: 30000, // mg (30g)
  omega3_total_mg: 1600, // mg (1.6g)
  omega6_total_mg: 17000, // mg (17g)
};

const vitamins = [
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

const minerals = [
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

const aminoAcids = [
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

const fattyAcids = [
  { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g' },
  { key: 'trans_fats_mg', label: 'Trans Fats', unit: 'mg' },
  { key: 'mufas_total_mg', label: 'Monounsaturated Fats', unit: 'mg' },
  { key: 'omega3_total_mg', label: 'Omega-3', unit: 'mg' },
  { key: 'omega6_total_mg', label: 'Omega-6', unit: 'mg' },
];

const protectiveCompounds = [
  { key: 'carotenoids', label: 'Carotenoids' },
  { key: 'polyphenols', label: 'Polyphenols' },
  { key: 'glucosinolates', label: 'Glucosinolates' },
];

// Helper function to format value
function formatValue(val: number | undefined): string {
  if (val === 0 || val === null || val === undefined) return '0';
  if (val < 0.01) return val.toFixed(4);
  if (val < 1) return val.toFixed(2);
  if (val < 10) return val.toFixed(1);
  return val.toFixed(0);
}

// Helper function to calculate main bar percentage
function getMainBarPercentage(
  value: number | undefined,
  rda: number | undefined
): number {
  if (!value || !rda) return 0;
  const kcal = scaledFood.value['kcal'] ?? 2200;
  return Math.min((value / rda) * (2200 / kcal) * 100, 100);
}

// Helper function to calculate RDA bar percentage
function getRdaBarPercentage(
  value: number | undefined,
  rda: number | undefined
): number {
  if (!value || !rda) return 0;
  return Math.min((value / rda) * 100, 100);
}

// Helper function to get level text for protective compounds
function getLevelText(value: number | undefined): string {
  if (!value || value == 0) return 'None';
  if (value == 1) return 'Trace';
  if (value < 3) return 'Low';
  if (value < 5) return 'Some';
  if (value < 7) return 'Good Source';
  if (value < 9) return 'High in';
  return 'Very High in';
}

// Helper function to get level color for protective compounds
function getLevelColor(value: number | undefined): string {
  if (!value || value < 1) return 'text-gray-400';
  if (value < 3) return 'text-yellow-600';
  if (value < 5) return 'text-lime-600';
  if (value < 7) return 'text-green-600';
  if (value < 9) return 'text-emerald-700';
  return 'text-green-800';
}
</script>

<style scoped>
.nutrient-section {
  flex: 1 1 350px;
  min-width: 300px;
  max-width: 450px;
}
</style>
