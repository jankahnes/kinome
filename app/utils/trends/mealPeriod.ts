export const ALL_NUTRIENTS = ['kcal', 'protein', 'fat', 'carbohydrates', 'fiber', 'salt', 'sugar'] as const;
export type NutrientKey = (typeof ALL_NUTRIENTS)[number];

export type TimeframeKey = '1W' | '1M' | '3M';

export function formatTrendsDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function trendsDateRange(selectedTimeframe: TimeframeKey): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (selectedTimeframe === '1W') start.setDate(start.getDate() - 6);
    else if (selectedTimeframe === '1M') start.setDate(start.getDate() - 29);
    else start.setDate(start.getDate() - 89);
    return { start, end };
}

export function buildDailyTotals(meals: any[]): Map<string, Record<NutrientKey, number>> {
    const map = new Map<string, Record<NutrientKey, number>>();
    for (const meal of meals) {
        const date = meal.meal_date as string;
        if (!map.has(date)) {
            const zero = Object.fromEntries(ALL_NUTRIENTS.map(k => [k, 0])) as Record<NutrientKey, number>;
            map.set(date, zero);
        }
        const entry = map.get(date)!;
        for (const key of ALL_NUTRIENTS) {
            entry[key] += (meal[key] as number) ?? 0;
        }
    }
    return map;
}

export function buildAllDates(dateRange: { start: Date; end: Date }): string[] {
    const dates: string[] = [];
    const cur = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    while (cur <= end) {
        dates.push(formatTrendsDate(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}
