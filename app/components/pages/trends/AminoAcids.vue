<template>
    <div class="main-card main-card-padding main-card-rounded flex min-w-0 flex-col gap-10 overflow-hidden">
        <div>
            <h2 class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Amino Acids</h2>
            <p class="text-sm text-gray-400">Protein completeness, last 14 days</p>
        </div>

        <div v-if="!hasData" class="flex h-64 items-center justify-center text-sm text-gray-400">
            No amino acid data for this range.
        </div>
        <div class="flex-1 flex flex-col gap-4 justify-between">

            <div class="flex flex-col gap-4 p-2 py-4 rounded-3xl bg-[#F9F4F2]/20">
                <!--
              Linear 0 → vmax on the radial axis (vmax = max(3, peak)); then 1.5× DRI is halfway when vmax = 3.
              Y-axis 0–100 + stepSize keeps Apex radar grid stable. Corner dots = markers on max/min series (DietFingerprint).
            -->
                <ClientOnly>
                    <!-- Negative margin pulls the SVG up: Apex reserves headroom for x-axis category labels. Diet hides those labels (overlays instead), so it looked tighter by default. -->
                    <div class="-mt-14 -mb-20">
                        <apexchart type="radar" height="340" :options="chartOptions" :series="chartSeries"
                            :key="chartKey" />
                    </div>
                    <template #fallback>
                        <div class="flex h-64 items-center justify-center text-sm text-gray-400">Chart loading…</div>
                    </template>
                </ClientOnly>
                <ul class="mt-1 flex items-center justify-center text-xs gap-2">
                    <li class="flex gap-1">
                        <span class="mt-0.5 h-3 w-3 shrink-0 rounded-full" :style="{ background: RADAR_PRIMARY_COLOR }"
                            aria-hidden="true" />
                        <span class="text-slate-700">Daily max</span>
                    </li>
                    <li class="flex gap-1">
                        <span class="mt-0.5 h-3 w-3 shrink-0 rounded-full border border-white/80"
                            :style="{ background: STROKE_MIN }" aria-hidden="true" />
                        <span class="text-slate-700">Daily min</span>
                    </li>
                    <li class="flex gap-1">
                        <span
                            class="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-500 bg-transparent"
                            aria-hidden="true" />
                        <span class="text-slate-700">1x guide</span>
                    </li>
                </ul>
            </div>
            <div class="px-6 py-4 flex flex-col -mx-4 -mb-4 md:-mx-6 md:-mb-6"
                :class="minProfileComplete ? 'text-emerald-900 bg-primary/8' : 'text-amber-900 bg-amber-50/90'">
                <div class="text-xl font-bold tracking-tight">
                    <span v-if="minProfileComplete">✓ Optimal Profile</span>
                    <span v-else>Not Complete on All Days</span>
                </div>
                <div class="text-sm font-medium text-current/80">
                    <span v-if="minProfileComplete">Complete Amino Acids on all days</span>
                    <span v-else>
                        Limiting EAA: <span class="font-bold">{{ limitingLabel }}</span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    proteinQuality: Record<string, unknown> | null | undefined;
}>();

const AA_AXIS_ORDER = [
    'Histidine',
    'Isoleucine',
    'Leucine',
    'Lysine',
    'SAA',
    'AAA',
    'Threonine',
    'Valine',
    'Tryptophan',
] as const;

function pickNum(v: unknown): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}

const segments = computed(() => {
    const pq = props.proteinQuality;
    if (!pq || typeof pq !== 'object') return [];
    const out: { key: string; label: string; min: number; max: number }[] = [];
    for (const key of AA_AXIS_ORDER) {
        if (!(key in pq)) continue;
        const bucket = pq[key as string] as Record<string, unknown> | null | undefined;
        if (!bucket || typeof bucket !== 'object') continue;
        const min = pickNum(bucket.min);
        const max = pickNum(bucket.max);
        if (min == null || max == null) continue;
        out.push({
            key,
            label: key,
            min,
            max: Math.max(min, max),
        });
    }
    return out;
});

const hasData = computed(() => segments.value.length > 0);

const limiting = computed(() => {
    const segs = segments.value;
    if (!segs.length) return null;
    return segs.reduce((a, b) => (a.min <= b.min ? a : b));
});

const limitingLabel = computed(() => limiting.value?.label ?? '-');
const limitingMinFormatted = computed(() =>
    limiting.value != null ? limiting.value.min.toFixed(2) : '-',
);

// `proteinQuality[AA].min` represents the *worst day* within the selected range.
// So completeness on *all days* means the worst day is still >= 1x DRI for every shown AA.
const minProfileComplete = computed(() => segments.value.length > 0 && segments.value.every(s => s.min >= 1));

/**
 * Linear radial scale from 0 → vmax (× DRI). vmax ≥ 3 so typical data fits; when vmax = 3, half the radius = 1.5× DRI.
 */
const chartMax = computed(() => {
    const segs = segments.value;
    if (!segs.length) return 3;
    const peak = Math.max(...segs.flatMap(s => [s.min, s.max]));
    return Math.max(3, Math.ceil(peak * 10) / 10);
});

function driToPlot(v: number, vmax: number): number {
    if (!Number.isFinite(v) || vmax <= 0) return 0;
    return Math.min(100, Math.max(0, (v / vmax) * 100));
}

function plotToDri(p: number, vmax: number): number {
    if (!Number.isFinite(p) || vmax <= 0) return 0;
    return (Math.max(0, Math.min(100, p)) / 100) * vmax;
}

const plotScale = computed(() => {
    const vmax = chartMax.value;
    return {
        toY: (v: number) => driToPlot(v, vmax),
        fromY: (plot: number) => plotToDri(plot, vmax),
    };
});

const chartKey = computed(() => {
    const segs = segments.value;
    const vmax = chartMax.value;
    return `${segs.map(s => `${s.min}-${s.max}`).join('|')}-${vmax}`;
});

const RADAR_PRIMARY_COLOR = 'var(--color-primary)';

const STROKE_MAX = RADAR_PRIMARY_COLOR;
const STROKE_MIN = 'rgba(148, 163, 184, 0.9)';
const STROKE_GUIDE = '#64748b';

const FILL_MAX = 'rgba(207, 97, 57, 0.1)';
const FILL_MIN = 'rgba(255, 255, 255, 0.5)';

const chartSeries = computed(() => {
    const segs = segments.value;
    if (!segs.length) return [];
    const { toY } = plotScale.value;
    return [
        { name: 'Daily max', data: segs.map(s => toY(s.max)) },
        { name: 'Daily min', data: segs.map(s => toY(s.min)) },
        { name: 'Completeness (1x)', data: segs.map(() => toY(1)) },
    ];
});

const chartOptions = computed(() => {
    const segs = segments.value;
    const vmax = chartMax.value;
    const { fromY } = plotScale.value;
    return {
        chart: {
            type: 'radar',
            background: 'transparent',
            toolbar: { show: false },
            /** Default 15 adds empty slack for “axis charts”; radar still gets it unless zeroed. */
            parentHeightOffset: 0,
            fontFamily: 'Libertinus Sans, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 400,
                animateGradually: { enabled: false },
            },
        },
        xaxis: {
            categories: segs.map(s => s.label),
            labels: {
                style: { fontSize: '11px', colors: '#64748b' },
            },
        },
        yaxis: {
            min: 0,
            max: 100,
            stepSize: 20,
            labels: {
                show: true,
                style: { colors: '#94a3b8', fontSize: '10px' },
                formatter: (val: number | string) => {
                    const n = Number(val);
                    if (!Number.isFinite(n)) return '';
                    return plotToDri(n, vmax).toFixed(1);
                },
            },
        },
        stroke: {
            width: 2,
            colors: [STROKE_MAX, STROKE_MIN, STROKE_GUIDE],
            dashArray: [0, 0, 4],
        },
        fill: {
            opacity: [1, 1, 0],
            colors: [FILL_MAX, FILL_MIN, 'transparent'],
        },
        markers: {
            size: [4, 4, 0],
            colors: [STROKE_MAX, STROKE_MIN, STROKE_GUIDE],
            strokeColors: '#ffffff',
            strokeWidth: 2,
            hover: { size: 6 },
        },
        dataLabels: { enabled: false },
        plotOptions: {
            radar: {
                offsetY: -20,
                polygons: {
                    strokeColors: '#e2e8f0',
                    connectorColors: '#e2e8f0',
                    fill: {
                        colors: ['#fafafa', '#E6FDEC'],
                    },
                },
            },
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: (val: number | undefined, opts: { seriesIndex: number; dataPointIndex: number }) => {
                    const plot = val ?? 0;
                    const v = fromY(plot);
                    const i = opts.dataPointIndex;
                    const seg = segs[i];
                    const name = seg?.label ?? '';
                    if (opts.seriesIndex === 0) return `${v.toFixed(2)}× max ${name}`;
                    if (opts.seriesIndex === 1) return `${v.toFixed(2)}× min ${name}`;
                    return `1.00× guide ${name}`;
                },
            },
        },
        legend: {
            show: false,
        },
        colors: [STROKE_MAX, STROKE_MIN, STROKE_GUIDE],
    };
});
</script>