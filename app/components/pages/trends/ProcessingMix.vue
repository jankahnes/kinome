<template>
    <div class="main-card main-card-padding flex min-w-0 flex-col gap-4">
        <div>
            <div class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Processing Mix</div>
        </div>

        <div v-if="segments.length" class="flex flex-col items-center gap-4">
            <div class="w-30 flex-shrink-0">
                <Ring :segments="segments.map(segment => ({ value: segment.value / 100, color: segment.color }))"
                    :stroke-width="10" ring-background="stroke-slate-100">
                    <div class="flex flex-col items-center justify-center text-xs uppercase font-bold rounded-full w-16 h-16"
                        :class="overallPill.color">
                        <Icon :name="overallPill.icon" class="w-4 h-4" />
                        {{ overallPill.label }}
                    </div>
                </Ring>
            </div>

            <div class="flex flex-1 flex-wrap max-w-30">
                <div v-for="segment in segments" :key="segment.label" class="flex items-center gap-3 flex-1">
                    <div class="h-2.5 w-2.5 rounded-full flex-shrink-0" :class="segment.bgClass" />
                    <div class="min-w-0 flex-1 text-xs text-gray-500">{{ segment.label }}</div>
                    <div class="text-xs font-semibold text-gray-800">{{ segment.value }}%</div>
                </div>
            </div>
        </div>

        <div v-else class="text-sm text-gray-400">
            Log some food to see your NOVA breakdown.
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    processingLevel: {
        pctWhole?: number;
        pctCulinaryProcessed?: number;
        pctProcessed?: number;
        pctUPF?: number;
        overall?: number;
    } | null | undefined;
}>();

function roundPercent(value: number) {
    return Math.round(value);
}

const overallPill = computed(() => {
    if (!props.processingLevel?.overall || props.processingLevel.overall < 38) return {
        color: 'text-red-700 bg-red-100/60',
        label: 'poor',
        icon: 'shield-alert',
    };
    if (props.processingLevel.overall < 54) return {
        color: 'text-yellow-700 bg-yellow-100/60',
        label: 'fair',
        icon: "check"
    };
    if (props.processingLevel.overall < 78) return {
        color: 'text-green-700 bg-secondary',
        label: 'good',
        icon: 'check-check',
    };
    return {
        color: 'text-blue-700 bg-blue-100/60',
        label: 'clean diet',
        icon: 'star'
    };
});

const segments = computed(() => {
    if (!props.processingLevel) return [];

    return [
        {
            label: 'Whole',
            value: roundPercent(props.processingLevel.pctWhole ?? 0),
            color: 'stroke-emerald-500',
            bgClass: 'bg-emerald-500',
        },
        {
            label: 'Culinary',
            value: roundPercent(props.processingLevel.pctCulinaryProcessed ?? 0),
            color: 'stroke-sky-400',
            bgClass: 'bg-sky-400',
        },
        {
            label: 'Processed',
            value: roundPercent(props.processingLevel.pctProcessed ?? 0),
            color: 'stroke-amber-400',
            bgClass: 'bg-amber-400',
        },
        {
            label: 'UPF',
            value: roundPercent(props.processingLevel.pctUPF ?? 0),
            color: 'stroke-rose-400',
            bgClass: 'bg-rose-400',
        },
    ];
});
</script>