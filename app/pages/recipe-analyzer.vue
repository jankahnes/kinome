<template>
    <div class="min-h-screen pb-20 max-w-[1100px] mx-auto ">
        <!-- Hero -->
        <section class="px-4 lg:px-8 pt-10 md:pt-16">
            <div class="text-center mb-10">
                <span class="font-mono text-[10px] text-primary/70 uppercase tracking-[0.22em]">Free Tool · No
                    signup</span>
                <h1 class="text-5xl sm:text-6xl md:text-7xl font-headers tracking-tight leading-none mt-3">
                    Recipe Analyzer<span class="text-primary">.</span>
                </h1>
                <p class="text-gray-600 mt-5 max-w-[580px] mx-auto leading-snug">
                    Paste any recipe and get a full nutrition breakdown, health grade, and ingredient-by-ingredient
                    analysis —
                    instantly.
                </p>
            </div>

            <!-- Input Card -->
            <div class="main-card main-card-padding main-card-rounded">
                <!-- Mode toggle -->
                <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <div class="font-mono text-[10px] uppercase text-gray-400 tracking-wider">
                        {{ mode === 'nl' ? 'Paste your ingredients' : 'Build your ingredient list' }}
                    </div>
                    <div class="flex bg-primary/8 rounded-full p-0.5 text-xs font-mono">
                        <button type="button" class="px-3.5 py-1.5 rounded-full transition-all"
                            :class="mode === 'nl' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
                            @click="switchMode('nl')">Paste text</button>
                        <button type="button" class="px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1"
                            :class="mode === 'structured' ? 'bg-linear-to-br from-primary to-primary-700 text-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
                            @click="switchMode('structured')">
                            Structured
                        </button>
                    </div>
                </div>

                <!-- NL tip -->
                <div v-if="mode === 'nl' && !hasParsed" class="text-sm text-gray-500 mb-3 leading-snug">
                    Enter your ingredients below, one per line with amount and unit. Fractions and natural phrasing are
                    fine.
                </div>

                <Transition name="slide" mode="out-in">
                    <!-- NL textarea (before analyze) -->
                    <textarea v-if="mode === 'nl' && !hasParsed" key="textarea" v-model="naturalLanguageText" rows="9"
                        placeholder="200g chicken breast&#10;1 cup of rice&#10;2 tbsp olive oil&#10;1/2 onion, diced&#10;1 clove garlic&#10;100g spinach"
                        class="w-full bg-primary-5/70 rounded-2xl p-4 outline-none resize-y font-mono text-sm leading-relaxed focus:bg-primary-5 transition-colors" />

                    <!-- Parsed / structured list -->
                    <div v-else key="structured">
                        <div v-if="hasParsed" class="flex items-center justify-between mb-3 gap-3 flex-wrap">
                            <div class="text-sm text-gray-500 leading-snug">
                                Tap any ingredient to adjust the match, amount, or unit. Changes recompute
                                automatically.
                            </div>
                            <button type="button"
                                class="text-xs font-mono uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                                @click="resetToText">
                                <IconArrowLeft class="w-3.5" />
                                Edit text
                            </button>
                        </div>
                        <div v-else class="text-sm text-gray-500 mb-3 leading-snug">
                            Add ingredients one at a time. Amounts, units, and food names are recognized as you type.
                        </div>

                        <EditableGroupList v-model="categories" :show-collapse="false" :show-group-header="false"
                            :show-kcal="true" />
                    </div>
                </Transition>

                <!-- Controls: serves + analyze -->
                <div class="flex items-center justify-between mt-6 flex-wrap gap-4">
                    <BlocksServesStepper v-model="serves" />

                    <div class="flex items-center gap-2">
                        <div v-if="resolvedCount > 0"
                            class="text-xs font-mono text-gray-400 uppercase tracking-wider hidden sm:block">
                            {{ resolvedCount }} {{ resolvedCount === 1 ? 'ingredient' : 'ingredients' }} recognized
                        </div>
                        <button v-if="mode === 'nl' && !hasParsed" type="button"
                            class="main-button animated-button bg-primary! text-white px-6 py-3 font-bold flex items-center gap-2 disabled:opacity-40"
                            :disabled="parsing || !canAnalyze" @click="analyze">
                            <IconLoaderCircle v-if="parsing" class="w-5 animate-spin" />
                            <span>{{ parsing ? 'Analyzing…' : 'Analyze' }}</span>
                            <IconArrowRight v-if="!parsing" class="w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Results -->
        <section v-if="hasResults" class="px-4 lg:px-8 mt-10 md:mt-14">
            <!-- Section label -->
            <div class="flex items-end justify-between gap-3 flex-wrap">
                <div>
                    <span class="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Your analysis</span>
                    <h2 class="text-4xl md:text-5xl font-headers tracking-tight leading-none mt-1">
                        Per serving<span class="text-primary">.</span>
                    </h2>
                </div>
                <div class="relative">
                    <Transition name="fade">
                        <div v-if="computing"
                            class="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                            <IconLoaderCircle class="w-3.5 animate-spin" />
                            Recomputing
                        </div>
                    </Transition>
                </div>
            </div>

            <!-- Macro + Grade -->
            <div class="flex flex-col sm:flex-row gap-3 mt-6">
                <NutritionMacroCard class="main-card main-card-padding main-card-rounded sm:basis-1/2"
                    :kcal="macros.kcal" :carbohydrates="macros.carbohydrates" :protein="macros.protein"
                    :fat="macros.fat" />
                <div v-if="hidx && hidx >= 30"
                    class="main-card main-card-padding main-card-rounded flex-row sm:flex-col items-center justify-center gap-2 sm:min-w-[190px] flex">
                    <GradeContainer :score="hidx" type="ovr" class="text-4xl sm:text-5xl" />
                    <span class="text-sm text-slate-600">Health Grade</span>
                </div>
            </div>

            <!-- Written summary -->
            <div v-if="macroSummary"
                class="main-card main-card-rounded px-5 md:px-7 py-5 leading-relaxed text-slate-700 relative mt-3 max-w-max">
                <span
                    class="absolute left-3 top-2 text-4xl font-headers text-primary/30 leading-none select-none">“</span>
                <p class="pl-4">{{ macroSummary }}</p>
            </div>

            <!-- Quality cards -->
            <div v-if="qualityCards.length" class="space-y-3 mt-10">
                <div class="flex items-end justify-between flex-wrap gap-2 px-1">
                    <h3 class="text-2xl md:text-3xl font-headers tracking-tight leading-none">Quality highlights</h3>
                    <div class="font-mono text-[10px] uppercase text-gray-400 tracking-wider">Tap cards for detail</div>
                </div>
                <NutritionQualityCards :cards="qualityCards" :gut-health="report?.details?.gutHealth"
                    :fat-profile="report?.details?.fatProfile"
                    :fat-profile-readable="report?.humanReadable?.fatProfile ?? []"
                    :micronutrients="report?.details?.micronutrients" :kcal-progress="macros.kcal / 2000" mode="full" />
            </div>

            <!-- Signup CTA -->
            <div class="relative main-card-rounded overflow-hidden mt-10">
                <div class="absolute inset-0 bg-linear-to-br from-primary-100 via-primary-50 to-primary-20"></div>
                <div
                    class="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div class="max-w-[560px]">
                        <span class="font-mono text-[10px] text-primary/80 uppercase tracking-[0.22em]">Take it
                            further</span>
                        <h3 class="text-2xl md:text-3xl font-headers tracking-tight leading-none mt-2">
                            Save this analysis<span class="text-primary">.</span>
                        </h3>
                        <p class="text-slate-700 mt-3 leading-snug text-sm md:text-base">
                            Create a free account to save recipes, track your meals, and see how they fit into your
                            long-term
                            nutrition — micronutrient trends, diet patterns, and more.
                        </p>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <NuxtLink to="/sign-up"
                            class="main-button animated-button bg-primary! text-white px-5 py-3 font-bold flex items-center gap-2 whitespace-nowrap">
                            Create account
                            <IconArrowRight class="w-4" />
                        </NuxtLink>
                        <NuxtLink to="/sign-in"
                            class="main-button animated-button main-card px-5 py-3 font-semibold whitespace-nowrap">
                            Sign in
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex flex-col gap-3 mt-10">
                <div class="flex items-end justify-between flex-wrap gap-3 px-1">
                    <h3 class="text-2xl md:text-3xl font-headers tracking-tight leading-none">Detailed breakdown</h3>
                </div>

                <div
                    class="flex bg-primary/8 rounded-full p-0.5 text-xs font-mono w-full sm:w-auto overflow-x-auto scrollbar-hide self-start">
                    <button v-for="t in tabs" :key="t.key" type="button"
                        class="px-4 py-2 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5"
                        :class="activeTab === t.key ? 'bg-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
                        @click="activeTab = t.key">
                        <Icon :name="t.icon" class="w-3.5" />
                        {{ t.label }}
                    </button>
                </div>

                <div class="main-card main-card-rounded main-card-padding">
                    <!-- Nutrition facts -->
                    <div v-show="activeTab === 'nutrition'">
                        <FoodFullNutritionFacts v-if="computedRecipe" :recipe="(computedRecipe as any)"
                            :show-macros="true" />
                    </div>

                    <!-- Ingredient breakdown (on-demand) -->
                    <div v-show="activeTab === 'breakdown'">
                        <div v-if="activeTab === 'breakdown' || breakdownLoaded">
                            <NutritionIngredientContributionsTable v-if="fullIngredients.length"
                                :ingredients="fullIngredients" :serves="serves" />
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="i in 4" :key="i" class="h-10 bg-primary-5/60 rounded-xl animate-pulse" />
                        </div>
                    </div>

                    <!-- Health report -->
                    <div v-show="activeTab === 'health'" class="">
                        <PagesReport v-if="healthReportLoaded && computedRecipe" :key="computeKey" :id="'analyzer'"
                            :is-food="false" :computed-recipe="(computedRecipe as any)" :hide-nutrition="true"
                            :show-title="false" />
                        <div v-else class="space-y-3">
                            <div v-for="i in 5" :key="i" class="h-12 bg-primary-5/60 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Empty state below input, shown when no analysis yet -->
        <section v-else-if="!parsing && !computing" class="max-w-[1100px] mx-auto px-4 lg:px-8 mt-10">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div v-for="(f, i) in features" :key="i"
                    class="main-card main-card-padding main-card-rounded flex flex-col items-start gap-2">
                    <div class="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center text-primary">
                        <Icon :name="f.icon" class="w-5 icon-fill" />
                    </div>
                    <div class="font-semibold text-lg leading-tight">{{ f.title }}</div>
                    <div class="text-sm text-slate-600 leading-snug">{{ f.body }}</div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import type { TrackedMeal, EditableIngredient, FullIngredient, ComputableRecipe, InsertableRecipe } from '~/types/types';
import { parseIngredientString } from '~/utils/format/parseIngredientString';
import { getDailyQualityCards } from '~/utils/nutrition/getDailyQualityCards';
import { getMacroSummary } from '~/utils/nutrition/getMacroSummary';

definePageMeta({
    layout: 'default',
});

const SEO_TITLE = 'Free Recipe Nutrition Analyzer · Instant Health Score, Macros & Micros';
const SEO_DESCRIPTION =
    'Paste any recipe and get a free instant nutrition breakdown — calories, macros, and detailed quality markers. Powered by USDA food data. No signup required.';
const SEO_URL = 'https://kinome.app/recipe-analyzer';
const SEO_IMAGE = 'https://kinome.app/og/recipe-analyzer.png';

useHead({
    title: SEO_TITLE,
    link: [{ rel: 'canonical', href: SEO_URL }],
    meta: [
        { name: 'description', content: SEO_DESCRIPTION },
        {
            name: 'keywords',
            content:
                'recipe nutrition analyzer, free recipe analyzer, calorie calculator, macro calculator, micronutrient calculator, recipe health score, meal nutrition breakdown, USDA nutrition',
        },
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { name: 'author', content: 'Kinome' },

        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Kinome' },
        { property: 'og:url', content: SEO_URL },
        { property: 'og:title', content: 'Free Recipe Nutrition Analyzer' },
        { property: 'og:description', content: SEO_DESCRIPTION },
        { property: 'og:image', content: SEO_IMAGE },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Kinome Recipe Analyzer — instant nutrition breakdown' },

        // Twitter / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Free Recipe Nutrition Analyzer' },
        { name: 'twitter:description', content: SEO_DESCRIPTION },
        { name: 'twitter:image', content: SEO_IMAGE },
    ],
    script: [
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                    {
                        '@type': 'WebApplication',
                        name: 'Kinome Recipe Analyzer',
                        url: SEO_URL,
                        applicationCategory: 'HealthApplication',
                        operatingSystem: 'Any',
                        description: SEO_DESCRIPTION,
                        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                        featureList: [
                            'Instant recipe nutrition analysis',
                            'Calorie and macro breakdown',
                            'Vitamin and mineral coverage',
                            'Fat quality and gut health insights',
                            'Overall health grade',
                        ],
                    },
                    {
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: 'Is the Recipe Analyzer really free?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Yes — no signup, no paywall. Paste a list of ingredients and get a full nutrition breakdown instantly.',
                                },
                            },
                            {
                                '@type': 'Question',
                                name: 'Where does the nutrition data come from?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Every ingredient is matched against our food database, which is built on USDA-aligned per-100g nutrition values. There is no AI guessing — only direct lookups.',
                                },
                            },
                            {
                                '@type': 'Question',
                                name: 'What does the health grade mean?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'The health grade combines macro balance, micronutrient density, fat quality, fiber, gut health signals, and processing level into a single A–F score for the recipe per serving.',
                                },
                            },
                        ],
                    },
                ],
            }),
        },
    ],
});

const supabase = useSupabaseClient();

// --- Input state ---
const mode = ref<'nl' | 'structured'>('nl');
const naturalLanguageText = ref('');
const serves = ref(4);
const hasParsed = ref(false); // has the NL text been parsed at least once
const parsing = ref(false);
const showGroupHeader = ref(false); // shown when user adds categories manually

const categories = ref<TrackedMeal[]>([
    { name: null, editableIngredients: [{ rawText: '', displayText: '' }], collapsed: false },
]);

// --- Results state ---
const computedRecipe = ref<InsertableRecipe | null>(null);
const computing = ref(false);
const activeTab = ref<'nutrition' | 'breakdown' | 'health'>('nutrition');
const breakdownLoaded = ref(false);
const healthReportLoaded = ref(false);

watch(activeTab, (t) => {
    if (t === 'breakdown') breakdownLoaded.value = true;
    if (t === 'health') healthReportLoaded.value = true;
});

const tabs = [
    { key: 'nutrition' as const, label: 'Full nutrition', icon: 'chart-bar' },
    { key: 'health' as const, label: 'Quality analysis', icon: 'activity' },
    { key: 'breakdown' as const, label: 'Ingredient breakdown', icon: 'list-checks' },
];

const features = [
    {
        icon: 'zap',
        title: 'Instant results',
        body: 'Full nutrition facts, macros, and a health score — in seconds. No account needed.',
    },
    {
        icon: 'shield-check',
        title: 'Grounded in real data',
        body: 'Every ingredient is matched against our food database with USDA-aligned nutrition values.',
    },
    {
        icon: 'sparkles',
        title: 'Beyond just macros',
        body: 'Fat quality, gut health, micronutrient coverage, processing level — a complete picture.',
    },
];

// --- Derived: resolved ingredients & compute key ---
function groupsToFullIngredients(mealCategories: TrackedMeal[]): FullIngredient[] {
    return mealCategories.flatMap((category) =>
        category.editableIngredients
            .filter((ing) => ing.foodNameId && (ing.rawText ?? '').trim())
            .map(
                (ing) =>
                    ({
                        ...(ing.foodData as any),
                        id: ing.foodNameId!,
                        name: ing.ingredientName ?? '',
                        amount: ing.amount ?? 0,
                        unit: ing.unit ?? 'G',
                        category: category.name || null,
                        preparation_description: ing.preparationDescription ?? null,
                    }) as unknown as FullIngredient,
            ),
    );
}

const fullIngredients = computed(() => groupsToFullIngredients(categories.value));
const resolvedCount = computed(() => fullIngredients.value.length);

const canAnalyze = computed(() => {
    return naturalLanguageText.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean).length > 0;
});

const parsingRecipe = computed<ComputableRecipe>(
    () =>
        ({
            title: 'Recipe Analyzer',
            description: null,
            user_id: null,
            source: null,
            source_type: 'PREPARSED',
            serves: serves.value,
            fullIngredients: fullIngredients.value,
            instructions: [],
        }) as unknown as ComputableRecipe,
);

// Stable key for what actually changes the nutrition result —
// changes only when a line is resolved (foodNameId/amount/unit) or serves changes.
const computeKey = computed(() => {
    const parts = fullIngredients.value.map(
        (ing: any) => `${ing.id}:${ing.amount}:${ing.unit}`,
    );
    return `${serves.value}|${parts.join(',')}`;
});

const hasResults = computed(() => !!computedRecipe.value && resolvedCount.value > 0);

const macros = computed(() => {
    const r: any = computedRecipe.value ?? {};
    return {
        kcal: Math.round(r.kcal ?? 0),
        protein: Number(r.protein ?? 0),
        carbohydrates: Number(r.carbohydrates ?? 0),
        fat: Number(r.fat ?? 0),
        fiber: Number(r.fiber ?? 0),
    };
});

const hidx = computed(() => (computedRecipe.value as any)?.hidx ?? null);
const report = computed(() => (computedRecipe.value as any)?.report ?? null);
const protectiveScore = computed(
    () => report.value?.overall?.protective_score ?? (computedRecipe.value as any)?.protective_score ?? null,
);

const qualityCards = computed(() => {
    if (!report.value) return [];
    return getDailyQualityCards(report.value, {
        totalFat: macros.value.fat,
        protectiveScore: protectiveScore.value,
    });
});

const macroSummary = computed(() =>
    getMacroSummary({
        kcal: macros.value.kcal,
        protein: macros.value.protein,
        carbohydrates: macros.value.carbohydrates,
        fat: macros.value.fat,
        fiber: macros.value.fiber,
    }),
);

// --- Actions ---
async function analyze() {
    if (parsing.value) return;
    const lines = naturalLanguageText.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    if (!lines.length) return;

    parsing.value = true;
    try {
        const parsed = await Promise.all(
            lines.map((line) => parseIngredientString(supabase as any, line)),
        );

        const editable: EditableIngredient[] = parsed.map((p, i) => ({
            rawText: p.displayText || lines[i]!,
            displayText: p.displayText || lines[i]!,
            displayTextContext: p.displayTextContext,
            displayTextIngredient: p.displayTextIngredient,
            displayTextExtra: p.displayTextExtra,
            amount: p.amount ?? null,
            unit: p.unit ?? 'G',
            preparationDescription: p.preparationDescription ?? null,
            foodNameId: p.foodNameId,
            ingredientName: p.ingredientName,
            foodData: p.foodData,
            foodVariants: p.foodVariants,
        }));

        categories.value = [
            {
                name: null,
                editableIngredients: editable.length
                    ? editable
                    : [{ rawText: '', displayText: '' }],
                collapsed: false,
            },
        ];
        hasParsed.value = true;
        mode.value = 'structured';
    } finally {
        parsing.value = false;
    }
}

function switchMode(next: 'nl' | 'structured') {
    if (next === mode.value) return;
    if (next === 'nl' && hasParsed.value) {
        // Going back to paste-text reopens the textarea so the user can edit raw input
        resetToText();
        return;
    }
    // Note: going NL -> structured no longer auto-parses; Analyze is the single entry point
    mode.value = next;
}

function resetToText() {
    mode.value = 'nl';
    hasParsed.value = false;
    categories.value = [
        { name: null, editableIngredients: [{ rawText: '', displayText: '' }], collapsed: false },
    ];
    computedRecipe.value = null;
    breakdownLoaded.value = false;
    healthReportLoaded.value = false;
}

// --- Compute ---
async function compute() {
    if (fullIngredients.value.length === 0) {
        computedRecipe.value = null;
        breakdownLoaded.value = false;
        healthReportLoaded.value = false;
        return;
    }
    computing.value = true;
    try {
        const response = (await $fetch('/api/calculate/recipe', {
            method: 'POST',
            body: {
                nutritionEngineArgs: {
                    recipe: parsingRecipe.value,
                    useGpt: false,
                    logToReport: true,
                    considerProcessing: true,
                    disableSatiety: true,
                },
            },
        })) as { recipeRow: InsertableRecipe };
        computedRecipe.value = response.recipeRow;
        // Reset on-demand tab content so it picks up new numbers
        healthReportLoaded.value = activeTab.value === 'health';
    } catch (err) {
        console.error('Recipe analyzer compute failed', err);
    } finally {
        computing.value = false;
    }
}

// Recompute only when resolved ingredients change
watch(computeKey, () => {
    compute();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
    transition:
        opacity 220ms ease,
        transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-enter-from {
    opacity: 0;
    transform: translateX(24px);
}

.slide-leave-to {
    opacity: 0;
    transform: translateX(-24px);
}
</style>