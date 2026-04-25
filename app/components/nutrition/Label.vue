<template>
    <div class="main-card main-card-rounded overflow-hidden grid grid-cols-2 md:grid-cols-4 bg-faint! gap-px">
        <div class="bg-white md:bg-primary-5 col-span-2 flex flex-col justify-between gap-3 p-4">
            <h3 class="text-[14px] font-semibold">Calories</h3>
            <div class="flex flex-col gap-2">
                <div class="text-[46px] font-headers leading-none">{{ formattedCalories }}<span
                        class="font-main text-xs text-gray-500 tracking-tighter"> kcal</span>
                </div>
                <div class="space-y-2">
                    <div class="h-1 rounded-full bg-primary/10">
                        <div class="h-full rounded-full bg-primary-700"
                            :style="{ width: `${nutritionDailyProgress.calories}%` }" />
                    </div>
                    <p class="text-[11px] font-mono tracking-wider text-gray-400">
                        {{ nutritionDailyLabels.calories }}
                    </p>
                </div>
            </div>
        </div>
        <div class="bg-white md:bg-primary-5 flex flex-col justify-between gap-3 p-4" v-for="item in nutritionCards"
            :key="item.key">
            <h3 class="text-[14px] font-semibold">{{ item.label }}</h3>
            <div class="flex flex-col gap-2">
                <div class="text-3xl font-headers leading-none" :class="item.value === '0' ? 'text-gray-400' : ''">{{
                    item.value }}<span class="font-main text-xs text-gray-500 tracking-tighter"
                        :class="item.value === '0' ? 'text-gray-400!' : ''"> {{ " " + item.unit }}
                    </span>
                </div>
                <div class="space-y-2">
                    <div class="h-1 rounded-full bg-dark/10">
                        <div class="h-full rounded-full bg-dark" :style="{ width: `${item.progress}%` }" />
                    </div>
                    <p class="text-[11px] font-mono tracking-wider text-gray-400">
                        {{ item.subtext }}
                    </p>
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

const props = defineProps<{
    nutritionSource: NutritionSource | null | undefined;
    portionMultiplier: number;
}>();

function getScaledValue(value: number | null | undefined): number {
    return (value ?? 0) * props.portionMultiplier;
}

function formatValue(value: number | null | undefined): string {
    const scaled = getScaledValue(value);
    if (scaled === 0) return '0';
    if (scaled >= 100) return Math.round(scaled).toString();
    if (scaled >= 10) return scaled.toFixed(0);
    if (scaled >= 1) return scaled.toFixed(1).replace(/\.0$/, '');
    return scaled.toFixed(1).replace(/\.0$/, '');
}

function formatPercent(value: number, goal: number): number {
    return Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
}

const nutritionDailyProgress = computed(() => ({
    calories: formatPercent(getScaledValue(props.nutritionSource?.kcal), 2000),
    protein: formatPercent(getScaledValue(props.nutritionSource?.protein), 50),
    fat: formatPercent(getScaledValue(props.nutritionSource?.fat), 70),
    carbohydrates: formatPercent(getScaledValue(props.nutritionSource?.carbohydrates), 275),
    sugar: formatPercent(getScaledValue(props.nutritionSource?.sugar), 50),
    fiber: formatPercent(getScaledValue(props.nutritionSource?.fiber), 30),
    salt: formatPercent(getScaledValue(props.nutritionSource?.salt), 5),
}));

const energyLabel = computed(() => {
    if(props.nutritionSource?.title) return ''; //is recipe
    const kcal = getScaledValue(props.nutritionSource?.kcal);
    if (kcal <= 180) return '· low-calorie';
    if (kcal >= 220) return '· energy-dense';
    return '· moderate-calorie';
});

const nutritionDailyLabels = computed(() => ({
    calories: `${nutritionDailyProgress.value.calories}% of Daily kcal ${energyLabel.value}`,
    protein: `${nutritionDailyProgress.value.protein}% RDI`,
    fat: `${nutritionDailyProgress.value.fat}% RDI`,
    carbohydrates: `${nutritionDailyProgress.value.carbohydrates}% RDI`,
    sugar: `${nutritionDailyProgress.value.sugar}% RDI`,
    fiber: `${nutritionDailyProgress.value.fiber}% RDI`,
    salt: `${nutritionDailyProgress.value.salt}% RDI`,
}));

const formattedCalories = computed(() => Math.round(getScaledValue(props.nutritionSource?.kcal)));

const nutritionCards = computed(() => [
    {
        key: 'protein',
        label: 'Protein',
        value: formatValue(props.nutritionSource?.protein),
        unit: 'g',
        progress: nutritionDailyProgress.value.protein,
        subtext: nutritionDailyLabels.value.protein,
    },
    {
        key: 'fat',
        label: 'Fat',
        value: formatValue(props.nutritionSource?.fat),
        unit: 'g',
        progress: nutritionDailyProgress.value.fat,
        subtext: `${formatValue(props.nutritionSource?.saturated_fat)}g sat fat`,
    },
    {
        key: 'carbohydrates',
        label: 'Carbs',
        value: formatValue(props.nutritionSource?.carbohydrates),
        unit: 'g',
        progress: nutritionDailyProgress.value.carbohydrates,
        subtext: nutritionDailyLabels.value.carbohydrates,
    },
    {
        key: 'sugar',
        label: 'Sugar',
        value: formatValue(props.nutritionSource?.sugar),
        unit: 'g',
        progress: nutritionDailyProgress.value.sugar,
        subtext: nutritionDailyLabels.value.sugar,
    },
    {
        key: 'fiber',
        label: 'Fiber',
        value: formatValue(props.nutritionSource?.fiber),
        unit: 'g',
        progress: nutritionDailyProgress.value.fiber,
        subtext: nutritionDailyLabels.value.fiber,
    },
    {
        key: 'salt',
        label: 'Salt',
        value: formatValue(props.nutritionSource?.salt),
        unit: 'g',
        progress: nutritionDailyProgress.value.salt,
        subtext: nutritionDailyLabels.value.salt,
    },
]);
</script>
