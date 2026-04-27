<template>
    <div>


        <div class="overflow-hidden main-card main-card-rounded bg-faint! gap-px grid grid-cols-1 lg:grid-cols-2">
            <button v-for="row in qualityCards" :key="row.title"
                class="text-left bg-white md:bg-primary-5 gap-3 px-4 py-4 transition hover:bg-[#fbf5ef] flex items-center justify-between"
                @click="row.clickable ? handleQualityCardClick(row.title) : emit('openFullAnalysis')">
                <div class="flex gap-3 items-center">
                    <img :src="row.img" :alt="ALTS[row.img]" class="w-6 h-6 object-contain shrink-0">
                    <div>
                        <p class="font-semibold font-headers">{{ row.title }}
                        </p>
                        <p class="text-[13px] mt-0.5 text-gray-500 font-light">{{ row.subtitle }}</p>
                    </div>
                </div>
                <div class="flex md:justify-end">
                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-nowrap"
                        :class="row.pillClass">
                        {{ row.rating }}
                    </span>
                </div>
            </button>

            <div class="flex items-center justify-between gap-8 px-4 py-1 bg-primary-5 md:bg-primary-10 lg:col-span-2">
                <p class="text-xs text-gray-500">Composite score - weighted by current nutrition science</p>
                <p class="font-headers text-xs text-gray-500 text-nowrap">
                    <span class="font-semibold text-xl text-black ml-0.5" :class="gradeTextColors[getGrade(foodRow?.hidx ?? 0, 'ovr')] ?? ''"> {{ getGrade(foodRow?.hidx ?? 0, 'ovr') + " "
                    }}</span>
                    <span class="text-[11px] text-gray-500">{{ overallScoreLabel }}</span>
                </p>
            </div>
        </div>

        <NutritionGutHealthQualityPanel v-model="showGutPanel" :gut-health="foodRow?.report?.details?.gutHealth" />
        <NutritionFatQualityPanel v-model="showFatPanel" :fat-profile="foodRow?.report?.details?.fatProfile"
            :fat-profile-readable="foodRow?.report?.humanReadable?.fatProfile ?? []" />
        <NutritionMicronutrientsQualityPanel v-model="showMicroPanel"
            :micronutrients="foodRow?.report?.details?.micronutrients" :kcal-progress="(foodRow?.kcal ?? 0) / 2000" />
    </div>
</template>

<script setup lang="ts">
import type { FullFoodRow } from '~/types/types';
import type { DailyQualityCard } from '~/utils/nutrition/getDailyQualityCards';

const props = defineProps<{
    qualityCards: DailyQualityCard[];
    foodRow: FullFoodRow | null | undefined;
}>();

const emit = defineEmits<{
    openFullAnalysis: [];
}>();

const showGutPanel = ref(false);
const showFatPanel = ref(false);
const showMicroPanel = ref(false);


const bonus = computed(() => {
    if (props.foodRow?.title) { //title = Recipe
        return 15;
    }
    return 10;
});

const overallScoreLabel = computed(() => {
    const score = Math.max(0, Math.min(10, ((props.foodRow?.hidx ?? 0) + bonus.value) / 10));
    return ` · ${score.toFixed(1)} / 10`;
});

function handleQualityCardClick(title: string) {
    if (title === 'Gut Health') {
        showGutPanel.value = true;
    } else if (title === 'Fat Quality') {
        showFatPanel.value = true;
    } else if (title === 'Micronutrients') {
        showMicroPanel.value = true;
    }
}
</script>
