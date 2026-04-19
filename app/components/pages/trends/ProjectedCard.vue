<template>
    <div class="main-card main-card-padding main-card-rounded flex flex-col gap-3 flex-1" v-if="tdee != null">
        <div class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Projected</div>
        <div v-if="projectedBodyChange != null" class="flex flex-col my-auto">
            <div class="text-5xl font-bold tracking-tighter leading-none transition-colors"
                :class="projectedColorClass">
                {{ projectedBodyChange > 0 ? '+' : '' }}{{ projectedBodyChange }} kg
            </div>
            <div class="text-sm text-gray-400 mt-1">
                {{ periodLabel }}
            </div>
        </div>
        <div v-else class="text-sm text-gray-400">No data yet</div>
        <div class="text-xs text-gray-400 leading-snug">
            Based on {{ avgKcalRounded }} avg kcal/day vs {{ tdee }} TDEE
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TimeframeKey } from '~/utils/trends/mealPeriod';

const props = defineProps<{
    mealsData: any[];
    selectedTimeframe: TimeframeKey;
    userTrackingGoals: any;
}>();

const { dailyTotals, allDates } = useTrendsMealPeriod(
    toRef(props, 'mealsData'),
    toRef(props, 'selectedTimeframe'),
);

const tdee = computed((): number | null => {
    const explicit = props.userTrackingGoals?.biometrics?.tdee;
    if (explicit) return Math.round(explicit);
    const kcalTarget = props.userTrackingGoals?.targets?.kcal as number | undefined;
    const twc = props.userTrackingGoals?.goal?.targetWeightChange as number | undefined;
    if (kcalTarget != null && twc != null) {
        return Math.round(kcalTarget - (twc * 7700 / 7));
    }
    return null;
});

const avgKcalRounded = computed(() => {
    const days = [...dailyTotals.value.values()].filter(d => d.kcal > 0);
    if (!days.length) return null;
    return Math.round(days.reduce((a, b) => a + b.kcal, 0) / days.length);
});

const projectedBodyChange = computed((): number | null => {
    if (!tdee.value || !avgKcalRounded.value) return null;
    const dailyDeficit = tdee.value - avgKcalRounded.value;
    const totalDeficit = dailyDeficit * allDates.value.length;
    return Math.round(-(totalDeficit / 7700) * 10) / 10;
});

const projectedColorClass = computed(() => {
    const projected = projectedBodyChange.value;
    if (projected == null) return 'text-gray-400';
    if (projected === 0) return 'text-gray-400';
    
    const twc = props.userTrackingGoals?.goal?.targetWeightChange as number | undefined;
    
    if (twc !== undefined && twc > 0) {
        return projected > 0 ? 'text-emerald-500' : 'text-red-400';
    } else if (twc !== undefined && twc < 0) {
        return projected < 0 ? 'text-emerald-500' : 'text-red-400';
    } else {
        return Math.abs(projected) < 0.3 ? 'text-emerald-500' : 'text-amber-500';
    }
});

const periodLabel = computed(() => {
    if (props.selectedTimeframe === '1W') return 'projected this week';
    if (props.selectedTimeframe === '1M') return 'projected this month';
    return 'projected over 3 months';
});
</script>
