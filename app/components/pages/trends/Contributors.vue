<template>
    <div class="main-card main-card-padding main-card-rounded flex min-w-0 flex-col gap-5">
        <div>
            <h2 class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Top Contributors
            </h2>
            <p class="text-sm text-gray-400">Last 14 days</p>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1">
            <div v-for="metric in metricsToDisplay" :key="metric.key"
                class="flex flex-col gap-3 rounded-2xl border bg-primary/5 border-primary/10 p-4">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-gray-700">{{ metric.label }}</span>
                        <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            :class="[metric.bg, metric.color]">
                            {{ metric.badgeText }}
                        </span>
                    </div>
                    <p class="text-xs text-gray-500">
                        {{ getConcentrationInsight(metric.key) }}
                    </p>
                </div>

                <div class="mt-2 flex flex-col gap-3">
                    <template v-if="dietContributorSummary[metric.key]?.length">
                        <div v-for="(food, index) in dietContributorSummary[metric.key]" :key="index"
                            class="flex items-center gap-3">
                            <div
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                                <img :src="`/foods/${food.visualCategory}.webp`" :alt="food.name"
                                    class="h-6 w-6 object-contain" loading="lazy" />
                            </div>

                            <div class="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                <div class="flex items-center justify-between">
                                    <span class="truncate text-sm font-medium text-gray-700">
                                        {{ food.name }}
                                    </span>
                                    <span class="text-xs font-bold text-gray-900">
                                        {{ (food.value * 100).toFixed(0) }}%
                                    </span>
                                </div>
                                <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div class="h-full rounded-full" :class="metric.barColor"
                                        :style="{ width: `${food.value * 100}%` }"></div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <div v-else class="py-4 text-center text-xs text-gray-400">
                        Not enough data tracked yet.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    fullReport: any;
}>();

const dietContributorSummary = computed(() => props.fullReport?.dietContributorSummary || {});

const metricsToDisplay = [
    {
        key: 'kcal',
        label: 'Energy',
        badgeText: 'Fuel',
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        barColor: 'bg-amber-400'
    },
    {
        key: 'protein',
        label: 'Protein',
        badgeText: 'Satiety',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        barColor: 'bg-blue-400'
    },
    {
        key: 'fiber',
        label: 'Fiber',
        badgeText: 'Gut Health',
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
        barColor: 'bg-emerald-400'
    },
    {
        key: 'sugar',
        label: 'Sugar',
        badgeText: 'Monitor',
        color: 'text-rose-600',
        bg: 'bg-rose-100',
        barColor: 'bg-rose-400'
    }
];

const getConcentrationInsight = (metricKey: string) => {
    const items = dietContributorSummary.value[metricKey];
    if (!items || items.length === 0) return 'Log more meals to see insights.';

    const totalPercentage = items.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

    return `These 3 foods drive ${Math.round(totalPercentage * 100)}% of your total intake.`;
};

</script>