import type { Ref } from 'vue';
import { buildAllDates, buildDailyTotals, trendsDateRange, type TimeframeKey } from '~/utils/trends/mealPeriod';

export type { NutrientKey, TimeframeKey } from '~/utils/trends/mealPeriod';
export { ALL_NUTRIENTS } from '~/utils/trends/mealPeriod';

export function useTrendsMealPeriod(
    mealsData: Ref<any[]>,
    selectedTimeframe: Ref<TimeframeKey>,
) {
    const dateRange = computed(() => trendsDateRange(selectedTimeframe.value));

    const dailyTotals = computed(() => buildDailyTotals(mealsData.value));

    const allDates = computed(() => buildAllDates(dateRange.value));

    const dateRangeLabel = computed(() => {
        const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        const s = dateRange.value.start.toLocaleDateString('en-US', opts);
        const e = dateRange.value.end.toLocaleDateString('en-US', opts);
        return `${s} - ${e}`;
    });

    return { dateRange, dailyTotals, allDates, dateRangeLabel };
}