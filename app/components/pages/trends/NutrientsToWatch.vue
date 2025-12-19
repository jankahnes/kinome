<template>
    <div class="main-card main-card-padding flex min-w-0 flex-col">
        <div class="flex flex-col justify-between flex-1">
            <div>
                <h2 class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Nutrients To Watch</h2>
                <p class="text-sm text-gray-400">Avg %RDA, last 14 days</p>

                <div v-if="items.length" class="flex flex-col mt-4 gap-3 -mx-2">
                    <template v-for="(item, idx) in items" :key="item.name">
                        <div v-if="idx === 2 && mappedNutrients.length > 4" class="flex justify-center -mt-2">
                            <span
                                class="text-gray-300 text-xl leading-none select-none tracking-widest font-serif">...</span>
                        </div>

                        <div class="rounded-3xl bg-secondary/60 hover:bg-secondary border-secondary/80 cursor-pointer transition-all border p-4 flex items-center justify-between gap-6 group"
                            @click="selectedNutrient = item; panelOpen = true">

                            <div class="flex flex-col justify-center gap-1 flex-1">
                                <div class="font-bold text-[15px] truncate text-gray-800 transition-colors">{{
                                    item.displayName }}</div>
                                <div class="h-1.5 bg-black/5 rounded-full overflow-hidden">
                                    <div class="h-full transition-all duration-500 rounded-full"
                                        :class="getBarColor(item.avgDailyRDA)"
                                        :style="{ width: Math.min(item.avgDailyRDA, 100) + '%' }"></div>
                                </div>
                            </div>

                            <div class="flex flex-col items-end gap-1">
                                <div class="text-[20px] leading-none font-bold tracking-tight text-gray-800">
                                    {{ item.avgDailyRDA }}%
                                </div>
                                <div v-if="item.trend"
                                    class="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none cursor-help"
                                    :class="item.trend.badgeClass"
                                    :title="`Compared to ${item.trend.previousValue}% in the previous 14 days`">
                                    {{ item.trend.badgeText }}
                                </div>
                                <div v-else class="h-[14px]"></div>
                            </div>
                        </div>
                    </template>
                </div>
                <div v-else class="text-sm text-gray-400 mt-4">
                    Log some food to see micronutrients.
                </div>
            </div>

            <div class="flex justify-center items-center gap-1 self-center -mb-2 md:-mb-4 mt-3 pt-2 border-t w-full border-black/5 text-center text-gray-400 hover:text-gray-600 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors"
                @click="selectedNutrient = null; panelOpen = true">
                See all micronutrients
                <IconChevronRight class="w-4" />
            </div>
        </div>

        <PagesTrendsMicronutrientDetailPanel v-model="panelOpen" :full30d="nutritionBundle?.full30d"
            :micronutrient="selectedNutrient?.name" :avgDailyRDA="selectedNutrient?.avgDailyRDA"
            :allNutrients="mappedNutrients" />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    nutritionBundle: {
        recent14d?: { recipeRow?: any; trackedDays?: number } | null;
        previous14d?: { recipeRow?: any; trackedDays?: number } | null;
        full30d?: { recipeRow?: any; trackedDays?: number } | null;
    } | null;
}>();

const selectedNutrient = ref<{ name: string; avgDailyRDA: number } | null>(null);
const panelOpen = ref(false);

const getBarColor = (val: number) => {
    if (val < 80) return 'bg-primary';
    if (val <= 120) return 'bg-emerald-400';
    return 'bg-blue-400';
}

const getTrendBadge = (oldValue: number | null, newValue: number | null) => {
    if (oldValue == null || newValue == null) return null;
    const delta = Math.round(newValue - oldValue);
    if (delta > 2) return {
        badgeText: `+${delta}%`,
        badgeClass: 'bg-emerald-100/60 text-emerald-700',
        previousValue: oldValue
    }
    else if (delta < -2) return {
        badgeText: `${delta}%`,
        badgeClass: 'bg-red-100/60 text-red-700',
        previousValue: oldValue
    }
    return null;
}

const mappedNutrients = computed(() => {
    const recentPeriod = props.nutritionBundle?.recent14d;
    const previousPeriod = props.nutritionBundle?.previous14d;
    const recentMicronutrients = recentPeriod?.recipeRow?.report?.details?.micronutrients ?? [];
    const previousMicronutrients = previousPeriod?.recipeRow?.report?.details?.micronutrients ?? [];

    if (!recentMicronutrients.length || !recentPeriod?.trackedDays) return [];

    const previousByName = new Map<string, any>(
        previousMicronutrients.map((nutrient: any) => [nutrient.name, nutrient])
    );

    return recentMicronutrients
        .map((nutrient: any) => {
            const avgDailyRDA = nutrient.rdaPerServing / (recentPeriod?.trackedDays ?? 0);
            const previousMatch = previousByName.get(nutrient.name);
            const previousAvgDailyRDA =
                previousMatch && previousPeriod?.trackedDays
                    ? previousMatch.rdaPerServing / previousPeriod.trackedDays
                    : null;

            return {
                name: nutrient.name,
                displayName: nutrient.displayName,
                avgDailyRDA: Math.round(avgDailyRDA),
                trend: getTrendBadge(previousAvgDailyRDA, avgDailyRDA),
            };
        })
        .sort((a: any, b: any) => b.avgDailyRDA - a.avgDailyRDA);
});

const items = computed(() => {
    const sorted = mappedNutrients.value;
    if (sorted.length <= 4) return sorted;
    return [
        sorted[0],
        sorted[1],
        sorted[sorted.length - 2],
        sorted[sorted.length - 1],
    ];
});
</script>
