<template>
    <div class="main-card main-card-padding main-card-rounded flex min-w-0 flex-col gap-2">
        <div>
            <h2 class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Gut Health Drivers</h2>
            <p class="text-sm text-gray-400">Health Markers, last 30 days</p>
        </div>

        <div v-if="gutHealth" class="flex flex-col gap-4 justify-between flex-1">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2">
                        <span class="text-5xl font-bold tabular-nums tracking-tight" :class="scoreTone.text">{{
                            gutHealth.overallScore }}</span>
                        <span class="text-xl font-semibold text-gray-400">/100</span>
                    </div>
                    <div class="mt-1 h-2.5 rounded-full bg-primary/8 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-300" :class="scoreTone.bar"
                            :style="{ width: `${Math.min(100, Math.max(0, gutHealth.overallScore))}%` }" />
                    </div>
                </div>
                <div class="shrink-0 flex justify-center sm:justify-end">
                    <img src="/nutrition-highlights/gut-health.webp" alt="Gut health" class="w-20 object-contain" />
                </div>
            </div>

            <div v-if="positiveFactors.length" class="space-y-2">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide">What's helping</div>
                <div v-for="row in positiveFactors" :key="row.key"
                    class="flex justify-between items-center gap-3 rounded-2xl px-3 py-2.5 bg-primary/8 border-primary/20">
                    <div class="min-w-0">
                        <div class="font-semibold text-sm text-emerald-900">{{ row.title }}</div>
                        <div class="text-xs text-emerald-800/70">{{ row.subtitle }}</div>
                    </div>
                    <span v-if="row.badge != null"
                        class="text-lg font-bold tabular-nums text-emerald-700 shrink-0">{{ row.badge }}</span>
                </div>
            </div>

            <div v-if="negativeFactors.length" class="space-y-2">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Watch outs</div>
                <div v-for="row in negativeFactors" :key="row.key"
                    class="flex justify-between items-center gap-3 rounded-2xl px-3 py-2.5 border"
                    :class="row.tone === 'red' ? 'bg-red-50/90 border-red-100' : 'bg-orange-50/90 border-orange-100'">
                    <div class="min-w-0">
                        <div class="font-semibold text-sm"
                            :class="row.tone === 'red' ? 'text-red-900' : 'text-orange-900'">{{ row.title }}</div>
                        <div class="text-xs" :class="row.tone === 'red' ? 'text-red-800/75' : 'text-orange-800/75'">{{
                            row.subtitle }}
                        </div>
                    </div>
                    <span class="text-lg font-bold tabular-nums shrink-0"
                        :class="row.tone === 'red' ? 'text-red-700' : 'text-orange-700'">{{ row.badge }}</span>
                </div>
            </div>

            <div v-if="trackedDays && trackedDays > 0"
                class="pt-4 border-t border-primary/20 flex gap-3 -mb-3 justify-center">
                <div class="px-3 text-center">
                    <div class="text-[10px] text-gray-400 uppercase font-mono">Avg.
                        added sugar / day</div>
                    <div class="text-xl font-bold tabular-nums text-gray-800 mt-1 leading-tight">{{
                        avgAddedSugarDisplay }}</div>
                </div>
                <div class="px-3 text-center">
                    <div class="text-[10px] text-gray-400 uppercase font-mono">Avg.
                        animal protein / day</div>
                    <div class="text-xl font-bold tabular-nums text-gray-800 mt-1 leading-tight">{{
                        avgAnimalProteinDisplay }}</div>
                </div>
            </div>
        </div>

        <p v-else class="text-sm text-gray-400">Log some food to see gut health drivers.</p>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    gutHealth?: {
        overallScore: number;
        fiberPer2000kcal: number;
        fiberSubScore: number;
        polyphenolRaw: number;
        polyphenolSubScore: number;
        sugarPer100g: number;
        sugarSubScore: number;
        novaValue: number;
        processingSubScore: number;
        sfatPer100g: number;
        sfatSubScore: number;
        saltPer100g: number;
        sodiumSubScore: number;
        uniquePlantCount: number;
        uniquePlantCountRolling7dAvg: number;
        diversityBonus: number;
        uniquePlantsThisWeek?: string[];
        addedSugarG: number;
        animalProteinG: number;
        upfKcalPct: number;
    } | null;
    trackedDays?: number;
}>();

const trackedDays = computed(() => props.trackedDays ?? 0);

const scoreTone = computed(() => {
    const s = props.gutHealth?.overallScore ?? 0;
    if (s >= 62) return { text: 'text-emerald-700', bar: 'bg-emerald-400' };
    if (s >= 42) return { text: 'text-amber-700', bar: 'bg-amber-400' };
    return { text: 'text-orange-800', bar: 'bg-orange-400' };
});

type FactorRow = {
    key: string;
    title: string;
    subtitle: string;
    badge?: string | number;
    tone?: 'red' | 'orange';
};

function driverSlotCounts(overall: number) {
    let positive = 3;
    let negative = 0;
    if (overall >= 72) {
        positive = 3;
        negative = 0;
    } else if (overall >= 56) {
        positive = 2;
        negative = 1;
    } else if (overall >= 44) {
        positive = 2;
        negative = 1;
    } else {
        positive = 2;
        negative = 2;
    }
    return { positive, negative };
}

const positiveFactors = computed((): FactorRow[] => {
    const gh = props.gutHealth;
    if (!gh) return [];

    const { positive: n } = driverSlotCounts(gh.overallScore);

    type Cand = { key: string; weight: number; row: FactorRow };
    const cands: Cand[] = [];

    if (gh.fiberSubScore > 0) {
        cands.push({
            key: 'fiber',
            weight: gh.fiberSubScore,
            row: {
                key: 'fiber',
                title: 'Fiber density',
                subtitle: 'per 2000 kcal',
                badge: `${gh.fiberPer2000kcal}g`,
            },
        });
    }
    if (gh.polyphenolSubScore > 0) {
        cands.push({
            key: 'polyphenol',
            weight: gh.polyphenolSubScore,
            row: {
                key: 'polyphenol',
                title: 'Polyphenols',
                subtitle: 'Concentration index',
                badge: `${gh.polyphenolRaw}/10`,
            },
        });
    }
    if (gh.uniquePlantCount > 0) {
        cands.push({
            key: 'plants',
            weight: gh.diversityBonus + gh.uniquePlantCountRolling7dAvg * 4,
            row: {
                key: 'plants',
                title: 'Plant variety',
                subtitle: gh.diversityBonus > 0 ? `avg plants · +${gh.diversityBonus} bonus` : `avg unique plants`,
                badge: gh.uniquePlantCountRolling7dAvg,
            },
        });
    }

    cands.sort((a, b) => b.weight - a.weight);
    const picked: Cand[] = [...cands.slice(0, n)];

    if (picked.length < n && gh.processingSubScore >= 52) {
        const exists = picked.some((p) => p.key === 'processing');
        if (!exists) {
            picked.push({
                key: 'processing-pos',
                weight: gh.processingSubScore,
                row: {
                    key: 'processing-pos',
                    title: 'Gentle processing',
                    subtitle: 'Avg component processing',
                    badge: `NOVA ${gh.novaValue}`,
                },
            });
        }
    }

    return picked.slice(0, n).map((p) => p.row);
});

const negativeFactors = computed((): FactorRow[] => {
    const gh = props.gutHealth;
    if (!gh) return [];

    const { negative: n } = driverSlotCounts(gh.overallScore);
    if (n <= 0) return [];

    type Cand = { key: string; weight: number; row: FactorRow };
    const cands: Cand[] = [];
    cands.push({
        key: 'processing',
        weight: gh.processingSubScore,
        row: {
            key: 'processing',
            title: 'Processing level',
            subtitle: 'Avg component processing',
            badge: `NOVA ${gh.novaValue}`,
            tone: gh.processingSubScore < 18 ? 'red' : 'orange',
        },
    });
    cands.push({
        key: 'sugar',
        weight: gh.sugarSubScore,
        row: {
            key: 'sugar',
            title: 'Sugar load',
            subtitle: 'avg added sugar per 100g',
            badge: `${gh.sugarPer100g}g`,
            tone: gh.sugarSubScore < 12 ? 'red' : 'orange',
        },
    });
    cands.push({
        key: 'sfat',
        weight: gh.sfatSubScore,
        row: {
            key: 'sfat',
            title: 'Saturated fat',
            subtitle: 'avg sat fat per 100g',
            badge: `${gh.sfatPer100g}g`,
            tone: gh.sfatSubScore < 8 ? 'red' : 'orange',
        },
    });
    cands.push({
        key: 'sodium',
        weight: gh.sodiumSubScore,
        row: {
            key: 'sodium',
            title: 'Sodium',
            subtitle: 'avg salt per 100g',
            badge: `${gh.saltPer100g}g`,
            tone: gh.sodiumSubScore < 8 ? 'red' : 'orange',
        },
    });

    cands.sort((a, b) => a.weight - b.weight);
    return cands.slice(0, n).map((p) => p.row);
});

const avgAddedSugarDisplay = computed(() => {
    const gh = props.gutHealth;
    const days = trackedDays.value;
    if (!gh || days <= 0) return '—';
    const v = Math.round(gh.addedSugarG / days);
    return `${v}g`;
});

const avgAnimalProteinDisplay = computed(() => {
    const gh = props.gutHealth;
    const days = trackedDays.value;
    if (!gh || days <= 0) return '—';
    const v = Math.round(gh.animalProteinG / days);
    return `${v}g`;
});
</script>
