<template>
    <div class="main-card main-card-padding main-card-rounded flex flex-col">
        <div class="flex-1 flex flex-col justify-between">
            <div>
                <h2 class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Diet Fingerprint
                </h2>
                <p class="text-sm text-gray-400">Nutrition quality, last 30 days</p>
            </div>

            <div class="mt-8 px-4 h-80 relative">
                <ClientOnly>
                    <apexchart v-if="hasRadarData" type="radar" height="290" :options="radarChartOptions"
                        :series="radarChartSeries" class="" />
                    <template #fallback>
                        <div class="h-104 flex items-center justify-center text-gray-400 text-sm">
                            Loading chart…
                        </div>
                    </template>
                </ClientOnly>

                <div v-if="hasRadarData"
                    class="pointer-events-none absolute left-1/2 top-[50%] aspect-square w-[20rem] -translate-x-1/2 -translate-y-1/2">
                    <div v-for="axis in radarAxisOverlays" :key="axis.key"
                        class="absolute w-24 -translate-x-1/2 -translate-y-1/2 text-center"
                        :style="{ left: `${axis.left}%`, top: `${axis.top}%` }">
                        <div
                            class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/8 shadow-md">
                            <img :src="axis.illustration" :alt="axis.label" class="h-7 w-7 object-contain opacity-90" />
                        </div>
                        <div class="mt-1 text-xs leading-none">
                            {{ axis.label }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-center items-center gap-1 self-center -mb-2 md:-mb-4 pt-2 mt-8 border-t w-full border-black/5 text-center text-gray-400 hover:text-gray-600 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors"
                @click="showFullReport = true">
                Show full report
                <IconChevronRight class="w-4" />
            </div>
        </div>
        <BlocksResponsiveInfo v-model="showFullReport" sidePanelClass="w-120">
            <PagesReport id="tracking-trends-period-report" :isFood="false" :computedRecipe="recipeRow" :showTitle="true" class="m-4" />
        </BlocksResponsiveInfo>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    recipeRow: Record<string, unknown> | null | undefined;
}>();

const showFullReport = ref(false);

const RADAR_SCORE_MAX = 100;
const RADAR_SCALE_INPUTS = [0, 20, 40, 60, 100] as const;
const RADAR_SCALE_OUTPUTS = [0, 25, 50, 75, 100] as const;
const RADAR_LABEL_RADIUS = 50;
const RADAR_LABEL_CENTER_X = 50;
const RADAR_LABEL_CENTER_Y = 50;
const RADAR_PRIMARY_COLOR = 'var(--color-primary)';
const RADAR_LABEL_PLACEHOLDER = '/nutrition-highlights/whole.webp';
const RADAR_AXES = [
    { key: 'fat_profile_score', label: 'Fat Quality', illustration: '/nutrition-highlights/fat.webp' },
    { key: 'protein_score', label: 'Protein', illustration: '/nutrition-highlights/protein.webp' },
    { key: 'sugar_score', label: 'Sugar', illustration: '/nutrition-highlights/sugar.webp' },
    { key: 'salt_score', label: 'Sodium', illustration: '/nutrition-highlights/salt2.webp' },
    { key: 'protective_score', label: 'Protective Compounds', illustration: '/nutrition-highlights/protective.webp' },
    { key: 'fiber_score', label: 'Fiber', illustration: '/nutrition-highlights/fiber.webp' },
    { key: 'satiety', label: 'Satiety', illustration: '/nutrition-highlights/satiety.webp' },
    { key: 'processing_level_score', label: 'Processing Level', illustration: '/nutrition-highlights/whole.webp' },
    { key: 'mnidx', label: 'Micronutrients', illustration: '/nutrition-highlights/micronutrients.webp' },
] as const;

type RadarAxisKey = typeof RADAR_AXES[number]['key'];

function normalizeRadarScore(value: unknown): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(RADAR_SCORE_MAX, Math.round(numeric)));
}

function remapRadarScore(
    value: number,
    from: readonly [number, number, number, number, number],
    to: readonly [number, number, number, number, number],
) {
    if (value <= from[0]) return to[0];
    if (value >= from[4]) return to[4];

    for (let i = 1 as 1 | 2 | 3 | 4; i < from.length; i++) {
        if (value <= from[i]) {
            const prevIndex = (i - 1) as 0 | 1 | 2 | 3;
            const fromStart = from[prevIndex];
            const fromEnd = from[i];
            const toStart = to[prevIndex];
            const toEnd = to[i];
            const progress = (value - fromStart) / (fromEnd - fromStart);
            return toStart + progress * (toEnd - toStart);
        }
    }

    return to[4];
}

function toRadarDisplayScore(value: number) {
    return remapRadarScore(value, RADAR_SCALE_INPUTS, RADAR_SCALE_OUTPUTS);
}

function fromRadarDisplayScore(value: number) {
    return remapRadarScore(value, RADAR_SCALE_OUTPUTS, RADAR_SCALE_INPUTS);
}

const radarAxes = computed(() =>
    RADAR_AXES.map(axis => ({
        ...axis,
        rawScore: props.recipeRow?.[axis.key as RadarAxisKey] ?? null,
        score: normalizeRadarScore(props.recipeRow?.[axis.key as RadarAxisKey]),
        displayScore: toRadarDisplayScore(normalizeRadarScore(props.recipeRow?.[axis.key as RadarAxisKey])),
    }))
);

const hasRadarData = computed(() =>
    radarAxes.value.some(axis => axis.rawScore != null)
);

const radarChartSeries = computed(() => [
    {
        name: 'Diet fingerprint',
        data: radarAxes.value.map(axis => axis.displayScore),
    },
]);

const radarChartOptions = computed(() => ({
    chart: {
        type: 'radar',
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: 'Libertinus Sans, sans-serif',
        animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 400,
            animateGradually: { enabled: false },
        },
    },
    xaxis: {
        categories: radarAxes.value.map(axis => axis.label),
        labels: {
            show: false,
        },
    },
    yaxis: {
        min: 0,
        max: RADAR_SCORE_MAX,
        tickAmount: 4,
        labels: {
            show: false,
            formatter: (val: number | string) => `${Math.round(fromRadarDisplayScore(Number(val)))}`,
        },
    },
    stroke: {
        width: 2.5,
        colors: [RADAR_PRIMARY_COLOR],
    },
    fill: {
        opacity: 0.18,
        colors: [RADAR_PRIMARY_COLOR],
    },
    markers: {
        size: 4,
        colors: [RADAR_PRIMARY_COLOR],
        strokeColors: '#ffffff',
        strokeWidth: 2,
        hover: { size: 6 },
    },
    dataLabels: {
        enabled: false,
    },
    plotOptions: {
        radar: {
            polygons: {
                strokeColors: '#e2e8f0',
                connectorColors: '#e2e8f0',
                fill: {
                    colors: ['#fafafa', 'var(--color-primary-20)'],
                },
            },
        },
    },
    tooltip: {
        y: {
            formatter: (val: number | undefined, context: { dataPointIndex: number }) => {
                const axis = radarAxes.value[context.dataPointIndex];
                return `${axis ? axis.score : Math.round(fromRadarDisplayScore(Number(val ?? 0)))}/100${axis ? ` ${axis.label}` : ''}`;
            },
        },
    },
    legend: { show: false },
}));

const radarAxisOverlays = computed(() => {
    const step = (Math.PI * 2) / RADAR_AXES.length;
    return radarAxes.value.map((axis, index) => {
        const angle = -Math.PI / 2 + step * index;
        return {
            ...axis,
            left: RADAR_LABEL_CENTER_X + Math.cos(angle) * RADAR_LABEL_RADIUS,
            top: RADAR_LABEL_CENTER_Y + Math.sin(angle) * RADAR_LABEL_RADIUS,
            illustration: axis.illustration || RADAR_LABEL_PLACEHOLDER,
        };
    });
});
</script>
