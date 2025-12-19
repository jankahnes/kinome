<template>
    <Transition name="loaded-content">
        <div v-if="mounted" class="pt-10 max-w-[1644px]">
            <div class="flex flex-col gap-4" v-if="!isChartLoading && !isRadarLoading">
                <div class="flex gap-4 flex-wrap flex-col xl:flex-row" v-if="mounted">
                    <PagesTrendsMainChart v-model:selected-timeframe="selectedTimeframe" :meals-data="mealsData"
                        :user-tracking-goals="userTrackingGoals" class="flex-1 min-w-0" />
                    <div class="flex flex-row xl:flex-col gap-4 flex-shrink-0 basis-1/5">
                        <PagesTrendsAdherenceCard :meals-data="mealsData" :selected-timeframe="selectedTimeframe"
                            :user-tracking-goals="userTrackingGoals" />
                        <PagesTrendsProjectedCard :meals-data="mealsData" :selected-timeframe="selectedTimeframe"
                            :user-tracking-goals="userTrackingGoals" />
                    </div>
                </div>

                <div class="flex gap-4 flex-wrap">
                    <PagesTrendsDietFingerprint
                        :recipe-row="nutritionPerPeriod?.full30d?.recipeRow" @open-full-report="showFullReport = true"
                        class="flex-1 md:grow-0 basis-115" />
                    <PagesTrendsNutrientsToWatch :nutrition-bundle="nutritionPerPeriod"
                        class="flex-1 md:grow-0 basis-74" />
                    <PagesTrendsAminoAcids
                        :protein-quality="nutritionPerPeriod?.full30d?.recipeRow?.report?.details?.protein?.dailyEAARange"
                        class="flex-1 md:grow-0 basis-84" />
                    <PagesTrendsGutHealthDrivers
                        :gut-health="nutritionPerPeriod?.full30d?.recipeRow?.report?.details?.gutHealth"
                        :tracked-days="nutritionPerPeriod?.full30d?.trackedDays" class="flex-1 basis-84" />
                    <div class="flex gap-4 flex-row flex-1 md:flex-initial md:flex-col">
                        <PagesTrendsProcessingMix
                            :processing-level="nutritionPerPeriod?.full30d?.recipeRow?.report?.details?.processingLevel"
                            class="flex-1" />
                        <PagesTrendsFatProfile
                            :fat-profile="nutritionPerPeriod?.full30d?.recipeRow?.report?.details?.fatProfile"
                            class="flex-1" />
                    </div>
                    <PagesTrendsPlantDiversity :recipe-row="nutritionPerPeriod?.full30d?.recipeRow"
                        :ingredients="nutritionPerPeriod?.full30d?.ingredients ?? []" class="basis-142" />
                    <PagesTrendsContributors :full-report="nutritionPerPeriod?.full30d?.fullReport"
                        class="basis-100 flex-1" />
                </div>
            </div>
            <div v-else class="flex flex-col gap-4">
                <div class="flex gap-4 flex-wrap flex-col md:flex-row">
                    <Skeleton class="flex-1 basis-100 h-117" />
                    <div class="flex flex-row sm:flex-col gap-4 flex-shrink-0 basis-1/5">
                        <Skeleton class="flex-1 min-h-50" />
                        <Skeleton class="flex-1 min-h-50" />
                    </div>
                </div>
                <div class="flex gap-4 flex-wrap">
                    <Skeleton class="flex-1 basis-100 h-130" />
                    <Skeleton class="flex-1 basis-60 h-130" />
                    <Skeleton class="flex-1 basis-70 h-130" />
                    <Skeleton class="flex-1 basis-80 h-130" />
                    <div class="flex gap-4 flex-row flex-1 md:flex-initial md:flex-col">
                        <Skeleton class="flex-1 min-h-50" />
                        <Skeleton class="flex-1 min-h-50" />
                    </div>
                    <Skeleton class="flex-1 basis-142 h-140" />
                    <Skeleton class="flex-1 basis-100 h-140" />
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { ComputableRecipe } from '~/types/types';
import { formatTrendsDate, trendsDateRange, type TimeframeKey } from '~/utils/trends/mealPeriod';

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const auth = useAuthStore();

const mounted = ref(false);
// @ts-ignore 
const userTrackingGoals = computed(() => auth.user?.user_data?.tracking);

const isChartLoading = ref(true);
const mealsData = ref<any[]>([]);
const selectedTimeframe = ref<TimeframeKey>('1W');

const nutritionPerPeriod = ref<any | null>(null);

const isRadarLoading = ref(true);

const showFullReport = ref(false);

const periodNutrition = computed(() => nutritionPerPeriod.value?.full30d?.recipeRow ?? undefined);

watch(selectedTimeframe, () => {
    fetchMacroMeals();
});

onMounted(async () => {
    mounted.value = true;
    await fetchInitialData();
});

async function fetchInitialData() {
    if (!user.value) return;
    await Promise.all([
        fetchMacroMeals(),
        fetchPeriodNutrition(),
    ]);
}

function stripReport(food: any) {
    if (!food) return food;
    const {
        report: _report,
        fullReport: _fullReport,
        full_report: _full_report,
        ...rest
    } = food;
    return rest;
}

function parseTrackedDay(value?: string | Date | null): Date | null {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [yearPart, monthPart, dayPart] = value.split('-');
        const year = Number(yearPart);
        const month = Number(monthPart);
        const day = Number(dayPart);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLoggedDate(ingredient: any): Date | null {
    return parseTrackedDay(ingredient?.loggedDate);
}

async function fetchMacroMeals() {
    if (!user.value) return;
    isChartLoading.value = true;
    try {
        const dr = trendsDateRange(selectedTimeframe.value);
        const { data, error } = await supabase
            .from('tracked_meals')
            .select('meal_date, kcal, protein, fat, carbohydrates, fiber, sugar, salt')
            .eq('user_id', user.value.id)
            .gte('meal_date', formatTrendsDate(dr.start))
            .lte('meal_date', formatTrendsDate(dr.end))
            .order('meal_date', { ascending: true });

        if (error) {
            console.error('Failed to load tracked meals for trends:', error);
            mealsData.value = [];
            return;
        }

        mealsData.value = data ?? [];
    } finally {
        isChartLoading.value = false;
    }
}

const analysisDateRange = computed(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);
    return { start, end };
});

const recent14DateRange = computed(() => {
    const end = new Date(analysisDateRange.value.end);
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 13);
    return { start, end };
});

const previous14DateRange = computed(() => {
    const end = new Date(recent14DateRange.value.start);
    end.setMilliseconds(end.getMilliseconds() - 1);
    const start = new Date(recent14DateRange.value.start);
    start.setDate(start.getDate() - 14);
    return { start, end };
});

function countTrackedDays(ingredients: any[]) {
    const days = new Set<string>();
    for (const ingredient of ingredients) {
        const loggedDate = getLoggedDate(ingredient);
        if (!loggedDate) continue;
        days.add(formatTrendsDate(loggedDate));
    }
    return days.size;
}

function isWithinRange(loggedDate: Date | null, start: Date, end: Date) {
    if (!loggedDate) return false;
    return loggedDate.getTime() >= start.getTime() && loggedDate.getTime() <= end.getTime();
}

async function calculateDietPeriod(title: string, ingredients: any[], fullReport: boolean = false) {
    const trackedDays = countTrackedDays(ingredients);

    if (!ingredients.length) {
        return {
            recipeRow: null,
            trackedDays,
            ingredients,
        };
    }

    const sendingRecipe = {
        title,
        fullIngredients: ingredients,
        serves: 1,
    } as ComputableRecipe;

    const nutrition = await $fetch('/api/calculate/recipe', {
        method: 'POST',
        body: {
            nutritionEngineArgs: {
                recipe: sendingRecipe,
                useGpt: false,
                logToReport: true,
                considerProcessing: false,
                disableSatiety: true,
                isDiet: true,
                fullReport: fullReport,
            },
        },
    });

    return {
        recipeRow: nutrition.recipeRow,
        trackedDays,
        ingredients,
        fullReport: nutrition?.fullReport,
    };
}

function trackedFoodToIngredient(food: any, loggedDate?: string | Date | null) {
    const rawFoodData = food.branded_food?.food_name?.food || food.food_name?.food;
    const foodNameId = food.branded_food?.food_name?.id || food.food_name?.id;
    const foodName = food.branded_food?.food_name?.name || food.food_name?.name;
    const foodId = rawFoodData?.id;

    if (!rawFoodData || !foodNameId || food.amount == null) return null;

    return {
        ...food,
        ...stripReport(rawFoodData),
        foodId,
        foodNameId,
        id: foodNameId,
        name: foodName,
        loggedDate: parseTrackedDay(loggedDate) ?? undefined,
    };
}

async function fetchPeriodNutrition() {
    if (!user.value) return;
    isRadarLoading.value = true;
    try {
        const { data, error } = await supabase
            .from('tracked_meals')
            .select(`
                meal_date,
                tracked_meal_foods (
                    id,
                    amount,
                    unit,
                    raw_text,
                    food_name:food_names(id, name, food:food_data(*)),
                    branded_food:branded_foods(*, food_name:food_names(id, name, food:food_data(*)))
                )
            `)
            .eq('user_id', user.value.id)
            .gte('meal_date', formatTrendsDate(analysisDateRange.value.start))
            .lte('meal_date', formatTrendsDate(analysisDateRange.value.end))
            .order('meal_date', { ascending: true });

        if (error) {
            console.error('Failed to load tracked foods for trends:', error);
            nutritionPerPeriod.value = null;
            return;
        }

        const fullIngredients = (data ?? [])
            .flatMap((meal: any) =>
                (meal.tracked_meal_foods ?? []).map((food: any) =>
                    trackedFoodToIngredient(food, meal.meal_date)
                )
            )
            .filter(Boolean);

        if (!fullIngredients.length) {
            nutritionPerPeriod.value = null;
            return;
        }

        const recent14Ingredients = fullIngredients.filter((ingredient: any) =>
            isWithinRange(getLoggedDate(ingredient), recent14DateRange.value.start, recent14DateRange.value.end)
        );
        const previous14Ingredients = fullIngredients.filter((ingredient: any) =>
            isWithinRange(getLoggedDate(ingredient), previous14DateRange.value.start, previous14DateRange.value.end)
        );

        const [full30d, previous14d, recent14d] = await Promise.all([
            calculateDietPeriod('30-Day Summary', fullIngredients, true),
            calculateDietPeriod('Previous 14 Days', previous14Ingredients, false),
            calculateDietPeriod('Recent 14 Days', recent14Ingredients, false),
        ]);

        const bundle = {
            full30d,
            previous14d,
            recent14d,
        };
        nutritionPerPeriod.value = bundle;
    } finally {
        isRadarLoading.value = false;
    }
}
</script>

<style scoped></style>
