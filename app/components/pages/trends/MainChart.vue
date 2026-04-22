<template>
    <div class="main-card main-card-padding main-card-rounded flex flex-col gap-2">
        <div class="flex flex-wrap items-end justify-between">
            <div>
                <div class="text-sm font-semibold text-gray-500 tracking-wide uppercase">progress chart</div>
                <p class="text-gray-400 text-sm">{{ dateRangeLabel }}</p>
            </div>
            <div class="flex gap-6 flex-wrap text-sm pt-4">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: currentMetric?.color }" />
                    <span class="text-gray-500">Avg</span>
                    <span class="font-bold">{{ avgValue }}{{ currentMetric?.unit }}</span>
                </div>
                <div v-if="targetValue != null" class="flex items-center gap-2">
                    <div class="w-6 border-t-2 border-dashed border-gray-400 flex-shrink-0" />
                    <span class="text-gray-500">Target</span>
                    <span class="font-bold">{{ targetValue }}{{ currentMetric?.unit }}</span>
                </div>
            </div>
        </div>

        <div class="relative -mx-3">
            <ClientOnly>
                <apexchart type="line" height="300" :options="chartOptions" :series="chartSeries" />
                <template #fallback>
                    <div class="h-72 flex items-center justify-center text-gray-400 text-sm">
                        Loading chart…
                    </div>
                </template>
            </ClientOnly>
        </div>

        <div class="flex flex-wrap gap-4 -mb-1 md:-mb-2">
            <div class="flex-1 basis-50 flex shrink-0 rounded-full justify-center md:justify-start">
                <div class="bg-primary/5 rounded-full">
                    <button v-for="tf in timeframes" :key="tf.key" type="button" @click="selectedTimeframe = tf.key"
                        class="px-4 py-1 rounded-full text-sm font-semibold transition-all" :class="selectedTimeframe === tf.key
                            ? 'bg-primary shadow-sm text-white'
                            : 'text-gray-500 hover:text-gray-700 '">
                        {{ tf.label }}
                    </button>
                </div>
            </div>

            <div class="basis-105 min-w-0 flex-1 overflow-x-auto flex justify-center md:justify-end">
                <div class="flex gap-2 bg-primary/5 rounded-full flex-wrap justify-center">
                    <button v-for="m in metrics" :key="m.key" type="button" @click="selectedMetric = m.key"
                        class="px-3 py-1 rounded-full text-sm font-semibold transition-all shrink-0" :class="selectedMetric === m.key
                            ? 'text-white'
                            : 'text-gray-500 hover:text-gray-700'"
                        :style="selectedMetric === m.key ? { backgroundColor: m.color } : {}">
                        {{ m.label }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TimeframeKey } from '~/utils/trends/mealPeriod';

const props = defineProps<{
    mealsData: any[];
    userTrackingGoals: any;
}>();

const selectedTimeframe = defineModel<TimeframeKey>('selectedTimeframe', { required: true });

const metrics = [
    { key: 'kcal', label: 'Kcal', color: 'var(--color-primary)', unit: ' kcal' },
    { key: 'protein', label: 'Protein', color: '#fea1a2', unit: 'g' },
    { key: 'fat', label: 'Fat', color: '#d6c755', unit: 'g' },
    { key: 'carbohydrates', label: 'Carbs', color: '#bddafe', unit: 'g' },
    { key: 'fiber', label: 'Fiber', color: '#a7e0a5', unit: 'g' },
    { key: 'salt', label: 'Salt', color: '#cecccc', unit: 'g' },
] as const;

type MetricKey = (typeof metrics)[number]['key'];

const timeframes = [
    { key: '1W' as const, label: '1W' },
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
];

const selectedMetric = ref<MetricKey>('kcal');

const currentMetric = computed(() => metrics.find(m => m.key === selectedMetric.value));

const { dailyTotals, allDates, dateRangeLabel } = useTrendsMealPeriod(
    toRef(props, 'mealsData'),
    selectedTimeframe,
);

const actualSeries = computed(() =>
    allDates.value.map(date => {
        const entry = dailyTotals.value.get(date);
        const raw = entry?.[selectedMetric.value as MetricKey];
        const y = raw != null && raw > 0 ? Math.round(raw * 10) / 10 : null;
        return { x: new Date(date + 'T00:00:00').getTime(), y };
    })
);

const targetValue = computed(
    () => (props.userTrackingGoals?.targets?.[selectedMetric.value] as number | undefined) ?? null,
);

const targetSeries = computed(() =>
    allDates.value.map(date => ({
        x: new Date(date + 'T00:00:00').getTime(),
        y: targetValue.value,
    }))
);

const chartSeries = computed(() => [
    { name: currentMetric.value?.label ?? '', data: actualSeries.value },
    ...(targetValue.value != null ? [{ name: 'Target', data: targetSeries.value }] : []),
]);

const trackedValues = computed(() =>
    actualSeries.value.map(p => p.y).filter((v): v is number => v != null)
);

const avgValue = computed(() => {
    const vals = trackedValues.value;
    if (!vals.length) return '-';
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
});

const is1W = computed(() => selectedTimeframe.value === '1W');
const X_AXIS_TIME_PAD_MS = 6 * 60 * 60 * 1000;

const chartOptions = computed(() => {
    const dates = allDates.value;
    let xMin: number | undefined;
    let xMax: number | undefined;
    if (dates.length) {
        xMin = new Date(`${dates[0]}T00:00:00`).getTime() - X_AXIS_TIME_PAD_MS;
        xMax = new Date(`${dates[dates.length - 1]}T00:00:00`).getTime() + X_AXIS_TIME_PAD_MS;
    }

    return {
        chart: {
            type: 'line',
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Libertinus Sans, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 400,
                animateGradually: { enabled: false },
            },
        },
        colors: [currentMetric.value?.color ?? 'var(--color-primary)', 'var(--color-primary-100)'],
        stroke: {
            width: [2.5, 1.5],
            curve: 'smooth' as const,
            dashArray: [0, 6],
        },
        markers: {
            size: [is1W.value ? 10 : 5, 0],
            colors: [currentMetric.value?.color ?? 'var(--color-primary)'],
            strokeColors: '#FFFDF7',
            strokeWidth: 2,
            hover: { size: is1W.value ? 14 : 6, sizeOffset: 2 },
        },
        dataLabels: { enabled: false },
        xaxis: {
            type: 'datetime' as const,
            min: xMin,
            max: xMax,
            labels: {
                style: { colors: '#9ca3af', fontSize: '12px' },
                datetimeFormatter: {
                    day: is1W.value ? 'ddd' : 'MMM dd',
                    month: 'MMM',
                },
                datetimeUTC: false,
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false },
        },
        yaxis: {
            min: 0,
            labels: {
                style: { colors: '#9ca3af', fontSize: '12px' },
                formatter: (val: number) => `${Math.round(val)}`,
            },
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { top: 4, right: 16, bottom: 0, left: 8 },
        },
        tooltip: {
            theme: 'light',
            enabledOnSeries: [0],
            x: { format: 'MMM dd' },
            y: {
                formatter: (val: number | null) =>
                    val != null
                        ? `${Math.round(val * 10) / 10}${currentMetric.value?.unit ?? ''}`
                        : 'Not logged',
            },
        },
        legend: { show: false },
    };
});
</script>
