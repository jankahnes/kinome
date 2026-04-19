<template>
    <BlocksResponsiveInfo v-model="isOpen" sidePanelClass="w-[420px]">
        <div class="flex flex-col">
            <Transition :name="`micronutrient-panel-${navDirection}`" mode="out-in">
                <!-- State 1: List View -->
                <div v-if="!localSelected" key="list" class="flex flex-col min-h-0 space-y-4 p-4">
                    <div class="px-1">
                        <h2 class="text-2xl font-bold">All Micronutrients</h2>
                        <p class="text-gray-400 text-sm text-balance">Ranked by your average intake over the last 14
                            days, compared to the previous 14 days.</p>
                    </div>

                    <div class="overflow-y-auto flex-1 custom-scrollbar min-h-0">
                        <div v-if="allNutrients && allNutrients.length" class="flex flex-col gap-3 pb-4">
                            <template v-for="(item, index) in allNutrients" :key="item.name">
                                <div class="micronutrient-list-row rounded-3xl bg-primary/8 hover:bg-primary/8 border-primary/20 cursor-pointer transition-all border p-4 flex items-center justify-between gap-4 group"
                                    :style="{ '--stagger': index }" @click="selectNutrient(item)">

                                    <div class="flex flex-col justify-center gap-1.5 w-[55%]">
                                        <div class="font-bold text-[15px] truncate text-gray-800 transition-colors">{{
                                            item.displayName }}</div>
                                        <!-- Progress bar -->
                                        <div class="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                            <div class="h-full transition-all duration-500 rounded-full"
                                                :class="getBarColor(item.avgDailyRDA)"
                                                :style="{ width: Math.min(item.avgDailyRDA, 100) + '%' }"></div>
                                        </div>
                                    </div>

                                    <div class="flex flex-col items-end gap-1">
                                        <!-- Value -->
                                        <div class="text-[20px] leading-none font-bold tracking-tight text-gray-800">
                                            {{ item.avgDailyRDA }}%
                                        </div>
                                        <!-- Badge -->
                                        <div v-if="item.trend"
                                            class="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none cursor-help text-center"
                                            :class="item.trend.badgeClass"
                                            :title="`Compared to ${item.trend.previousValue}% in the previous 14 days`">
                                            {{ item.trend.badgeText }}
                                        </div>
                                        <!-- Placeholder to maintain height if no trend -->
                                        <div v-else class="h-[14px]"></div>
                                    </div>
                                </div>
                            </template>
                        </div>
                        <div v-else class="text-center text-gray-400 py-10">No data available.</div>
                    </div>
                </div>

                <!-- State 2: Detail View -->
                <div v-else key="detail"
                    class="h-full min-h-0 flex flex-col px-4 gap-6 overflow-y-auto custom-scrollbar">
                    <div>
                        <button v-if="allNutrients && allNutrients.length" @click="backToList"
                            class="main-button animated-button -ml-2 p-2 hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-800 flex items-center justify-center shrink-0"
                            title="Back to list">
                            <IconChevronLeft class="w-6" />
                        </button>
                        <div class="text-xs text-slate-400 font-bold uppercase mt-4">Micronutrient</div>
                        <h2 class="text-3xl font-bold mb-2">{{ nutrientInfo?.displayName }}</h2>
                        <div class="text-sm text-gray-600 leading-relaxed">{{ nutrientInfo?.description }}</div>
                    </div>

                    <div v-if="nutrientInfo?.sources?.length"
                        class="text-sm text-gray-600 bg-primary/8 shadow-sm p-3 rounded-3xl self-start -mx-2">
                        <span class="font-semibold mb-1 flex items-center gap-1">
                            <IconInfo class="w-4 text-gray-500" /><span class="leading-none">Common sources:</span>
                        </span>
                        <p> {{
                            nutrientInfo.sources.join(', ')
                        }}</p>
                    </div>

                    <div class="flex min-w-0 flex-col gap-2 flex-1 pt-4 border-t border-black/5">
                        <div class="flex flex-wrap items-end justify-between gap-2">
                            <p class="text-base mt-1">Your intake over the last 30 days</p>
                            <div class="flex gap-3 flex-wrap text-sm">
                                <div class="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-xl">
                                    <span
                                        class="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Avg</span>
                                    <span class="font-bold border-l pl-2 border-black/10">{{
                                        Number(trackedAvg).toFixed(1)
                                        }}{{
                                            unit
                                        }}</span>
                                </div>
                                <div v-if="targetValue != null"
                                    class="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-xl">
                                    <span
                                        class="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Target</span>
                                    <span class="font-bold border-l pl-2 border-black/10">{{
                                        Number(targetValue).toFixed(1)
                                        }}{{
                                            unit
                                        }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="relative -mx-2">
                            <ClientOnly>
                                <apexchart type="line" height="280" :options="chartOptions" :series="chartSeries" />
                                <template #fallback>
                                    <div class="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                                        Loading chart…
                                    </div>
                                </template>
                            </ClientOnly>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </BlocksResponsiveInfo>
</template>

<script setup lang="ts">
import { buildAllDates, trendsDateRange } from '~/utils/trends/mealPeriod';
import { nutrientInformation } from '~/utils/trends/micronutrientInfo'

const props = defineProps<{
    modelValue: boolean;
    full30d: { recipeRow?: any; trackedDays?: number } | null | undefined;
    micronutrient: keyof RecipeCumulativeData | undefined;
    avgDailyRDA: number | undefined;
    allNutrients?: any[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

const isOpen = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
});

const localSelected = ref<string | null>(props.micronutrient || null);
const localAvgDailyRDA = ref<number | undefined>(props.avgDailyRDA);

/** forward: list → detail (slide left); back: detail → list (slide right) */
const navDirection = ref<'forward' | 'back'>('forward');

watch(() => props.micronutrient, (newVal, oldVal) => {
    if (newVal && !oldVal) navDirection.value = 'forward';
    else if (!newVal && oldVal) navDirection.value = 'back';
    localSelected.value = newVal || null;
});

watch(() => props.avgDailyRDA, (newVal) => {
    localAvgDailyRDA.value = newVal;
});

function backToList() {
    navDirection.value = 'back';
    localSelected.value = null;
}

function selectNutrient(item: any) {
    navDirection.value = 'forward';
    localSelected.value = item.name;
    localAvgDailyRDA.value = item.avgDailyRDA;
}

const getBarColor = (val: number) => {
    if (val < 80) return 'bg-primary';
    if (val <= 120) return 'bg-emerald-400';
    return 'bg-blue-400';
}

const dateRange = trendsDateRange('1M');
const allDates = buildAllDates(dateRange);
const nutrientInfo = computed(() => localSelected.value ? nutrientInformation[localSelected.value as keyof typeof nutrientInformation] : null);

const trackedAvg = computed(() => {
    if (nutrientInfo.value?.rda != null && localAvgDailyRDA.value != null) {
        return nutrientInfo.value.rda * localAvgDailyRDA.value / 100;
    }
    return 0;
});

const unit = computed(() => localSelected.value?.includes('mg') ? 'mg' : 'µg');

const valueSeries = computed(() =>
    allDates.map(date => {
        const entry = props.full30d?.recipeRow?.report?.dailyTotals?.[date + "T11:00:00.000Z"];
        const raw = localSelected.value ? entry?.[localSelected.value] : null;
        const y = raw != null && raw > 0 ? Math.round(raw * 10) / 10 : null;
        return { x: new Date(date + 'T00:00:00').getTime(), y };
    })
);

const targetValue = computed(
    () => nutrientInfo.value?.rda ?? 0
);

const targetSeries = computed(() =>
    allDates.map(date => ({
        x: new Date(date + 'T00:00:00').getTime(),
        y: targetValue.value,
    }))
);

const X_AXIS_TIME_PAD_MS = 6 * 60 * 60 * 1000;

const chartSeries = computed(() => [
    { name: nutrientInfo.value?.displayName ?? '', data: valueSeries.value },
    ...(targetValue.value != null ? [{ name: 'Target', data: targetSeries.value }] : []),
]);

const dates = allDates;
let xMin: number | undefined;
let xMax: number | undefined;
if (dates.length) {
    xMin = new Date(`${dates[0]}T00:00:00`).getTime() - X_AXIS_TIME_PAD_MS;
    xMax = new Date(`${dates[dates.length - 1]}T00:00:00`).getTime() + X_AXIS_TIME_PAD_MS;
}

const chartOptions = {
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
    colors: ['var(--color-primary)', 'var(--color-primary-100)'],
    stroke: {
        width: [2.5, 1.5],
        curve: 'smooth' as const,
        dashArray: [0, 6],
    },
    markers: {
        size: [5, 0],
        colors: ['var(--color-primary)'],
        strokeColors: '#FFFDF7',
        strokeWidth: 2,
        hover: { size: 6, sizeOffset: 2 },
    },
    dataLabels: { enabled: false },
    xaxis: {
        type: 'datetime' as const,
        min: xMin,
        max: xMax,
        labels: {
            style: { colors: '#9ca3af', fontSize: '12px' },
            datetimeFormatter: {
                day: 'MMM dd',
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
                    ? `${Math.round(val * 10) / 10}${unit.value}`
                    : 'Not logged',
        },
    },
    legend: { show: false },
};
</script>

<style scoped>
.micronutrient-panel-forward-enter-active,
.micronutrient-panel-forward-leave-active,
.micronutrient-panel-back-enter-active,
.micronutrient-panel-back-leave-active {
    transition:
        transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.2s ease;
}

.micronutrient-panel-forward-enter-from {
    transform: translateX(28px);
    opacity: 0;
}

.micronutrient-panel-forward-enter-to,
.micronutrient-panel-forward-leave-from {
    transform: translateX(0);
    opacity: 1;
}

.micronutrient-panel-forward-leave-to {
    transform: translateX(-20px);
    opacity: 0;
}

/* Detail → list: current leaves right, next enters from left */
.micronutrient-panel-back-enter-from {
    transform: translateX(-20px);
    opacity: 0;
}

.micronutrient-panel-back-enter-to,
.micronutrient-panel-back-leave-from {
    transform: translateX(0);
    opacity: 1;
}

.micronutrient-panel-back-leave-to {
    transform: translateX(20px);
    opacity: 0;
}

.micronutrient-list-row {
    animation: micronutrient-list-row-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: calc(var(--stagger, 0) * 40ms);
}

@keyframes micronutrient-list-row-in {
    from {
        opacity: 0;
        transform: translateX(14px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@media (prefers-reduced-motion: reduce) {

    .micronutrient-panel-forward-enter-active,
    .micronutrient-panel-forward-leave-active,
    .micronutrient-panel-back-enter-active,
    .micronutrient-panel-back-leave-active {
        transition-duration: 0.01ms;
    }

    .micronutrient-list-row {
        animation: none;
    }
}
</style>
