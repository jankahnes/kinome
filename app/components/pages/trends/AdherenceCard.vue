<template>
    <div class="main-card main-card-padding main-card-rounded flex flex-col gap-3 flex-1">
        <div class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Adherence</div>
        <div v-if="adherenceScore != null" class="flex flex-col my-auto">
            <div class="text-5xl font-bold tracking-tighter leading-none transition-colors" :class="adherenceLabelClass">
                {{ adherenceScore }}%
            </div>
            <div class="text-sm mt-1" :class="adherenceLabelClass">
                {{ adherenceLabel }}
            </div>
        </div>
        <div v-else class="text-sm text-gray-400">No data yet</div>
        <div class="text-xs text-gray-400 leading-snug">
            Avg. daily closeness to all macro targets
        </div>
    </div>
</template>

<script setup lang="ts">
import type { NutrientKey, TimeframeKey } from '~/utils/trends/mealPeriod';

const props = defineProps<{
    mealsData: any[];
    selectedTimeframe: TimeframeKey;
    userTrackingGoals: any;
}>();

const { dailyTotals, allDates } = useTrendsMealPeriod(
    toRef(props, 'mealsData'),
    toRef(props, 'selectedTimeframe'),
);

function metricAdherenceScore(actual: number, target: number, rule: 'lower' | 'higher'): number {
    if (rule === 'higher') return Math.min(actual / target, 1);
    return actual <= target ? 1 : Math.max(0, target / actual);
}

const trackedDaysCount = computed(() =>
    [...dailyTotals.value.values()].filter(d => d.kcal > 0).length
);

const adherenceScore = computed((): number | null => {
    const targets = props.userTrackingGoals?.targets;
    if (!targets) return null;

    const trackedDays = [...dailyTotals.value.values()].filter(d => d.kcal > 0);
    if (!trackedDays.length) return null;

    const allScores: number[] = [];

    if (targets.kcal) {
        const totalActual = trackedDays.reduce((a, d) => a + d.kcal, 0);
        const totalTarget = (targets.kcal as number) * trackedDays.length;
        allScores.push(Math.max(0, 1 - Math.abs(totalActual - totalTarget) / totalTarget));
    }

    const dailyMetrics: { key: NutrientKey; rule: 'lower' | 'higher' }[] = [
        { key: 'protein', rule: 'higher' },
        { key: 'fat', rule: 'lower' },
        { key: 'carbohydrates', rule: 'lower' },
        { key: 'fiber', rule: 'higher' },
        { key: 'salt', rule: 'lower' },
        { key: 'sugar', rule: 'lower' },
    ];

    for (const { key, rule } of dailyMetrics) {
        const target = targets[key] as number | undefined;
        if (target == null) continue;
        const dayScores = trackedDays.map(d => metricAdherenceScore(d[key], target, rule));
        allScores.push(dayScores.reduce((a, b) => a + b, 0) / dayScores.length);
    }

    if (!allScores.length) return null;
    return Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100);
});

const adherenceLabel = computed(() => {
    const s = adherenceScore.value;
    if (s == null) return '';
    if (s >= 90) return 'Excellent';
    if (s >= 75) return 'Good';
    if (s >= 60) return 'Fair';
    return 'Needs work';
});

const adherenceLabelClass = computed(() => {
    const s = adherenceScore.value;
    if (s == null) return '';
    if (s >= 90) return 'text-emerald-500';
    if (s >= 75) return 'text-lime-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-400';
});
</script>
