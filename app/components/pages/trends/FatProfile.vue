<template>
    <div class="main-card main-card-padding flex min-w-0 flex-col gap-4">
        <div>
            <div class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Fat Profile</div>
        </div>

        <div v-if="segments.length" class="flex flex-col items-center gap-4">
            <div class="w-30 flex-shrink-0">
                <Ring :segments="segments.map(segment => ({ value: segment.value / 100, color: segment.color }))"
                    :stroke-width="10" ring-background="stroke-slate-100">
                    <div class="flex flex-col items-center justify-center text-xs uppercase font-bold rounded-full w-16 h-16" :class="overallPill.color"
                        >
                        <Icon :name="overallPill.icon" class="w-4 h-4" />
                        {{ overallPill.label }}
                    </div>
                </Ring>
            </div>

            <div class="flex flex-1 flex-wrap max-w-36">
                <div v-for="segment in segments" :key="segment.label" class="flex items-center gap-3 flex-1">
                    <div class="h-2.5 w-2.5 rounded-full flex-shrink-0" :class="segment.bgClass" />
                    <div class="min-w-0 flex-1 text-xs text-gray-500">{{ segment.label }}</div>
                    <div class="text-xs font-semibold text-gray-800">{{ segment.value }}%</div>
                </div>
            </div>
        </div>

        <div v-else class="text-sm text-gray-400">
            Log some food to see your fat profile.
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    fatProfile: {
        fatPer2000kcal?: number;
        totalFatPer100g?: number;
        satFatPercent?: number;
        o3Percent?: number;
        o6Percent?: number;
        mufaPercent?: number;
        transFatPercent?: number;
        o3Score?: number;
        o6Score?: number;
        mufaScore?: number;
        satFatScore?: number;
        overall?: number;
    } | null | undefined;
}>();

function roundPercent(value: number) {
    return Math.round(value);
}

const overallPill = computed(() => {
    if (!props.fatProfile?.overall || props.fatProfile.overall < 38) return {
        color: 'text-red-700 bg-red-100/60',
        label: 'Poor',
        icon: 'shield-alert',
    };
    if (props.fatProfile.overall < 54) return {
        color: 'text-yellow-700 bg-yellow-100/60',
        label: 'Fair',
        icon: "check"
    };
    if (props.fatProfile.overall < 78) return {
        color: 'text-green-700 bg-secondary',
        label: 'Good',
        icon: 'check-check',
    };
    return {
        color: 'text-blue-700 bg-blue-100/60',
        label: 'Excellent',
        icon: 'star'
    };
});


const segments = computed(() => {
    if (!props.fatProfile) return [];
    //const factor = 100 / (props.fatProfile?.satFatPercent + props.fatProfile?.o3Percent + props.fatProfile?.o6Percent + props.fatProfile?.mufaPercent + props.fatProfile?.transFatPercent);
    const factor = 1
    return [
        {
            label: 'Saturated Fat',
            value: roundPercent(props.fatProfile.satFatPercent * factor),
            color: 'stroke-orange-400',
            bgClass: 'bg-orange-400',
        },
        {
            label: 'Omega-3',
            value: roundPercent(props.fatProfile.o3Percent * factor),
            color: 'stroke-sky-400',
            bgClass: 'bg-sky-400',
        },
        {
            label: 'Omega-6',
            value: roundPercent(props.fatProfile.o6Percent * factor),
            color: 'stroke-amber-400',
            bgClass: 'bg-amber-400',
        },
        {
            label: 'MUFAs',
            value: roundPercent(props.fatProfile.mufaPercent * factor),
            color: 'stroke-emerald-400',
            bgClass: 'bg-emerald-400',
        },
        {
            label: 'Trans Fats',
            value: roundPercent(props.fatProfile.transFatPercent * factor),
            color: 'stroke-red-400',
            bgClass: 'bg-red-400',
        },
    ];
});
</script>
