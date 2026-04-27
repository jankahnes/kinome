<template>
    <div>
        <div v-if="food" class="mx-auto max-w-6xl px-4 pb-20 pt-4 md:px-8 md:pb-4 lg:px-10 space-y-5">
            <div class="flex gap-2 items-center">
                <div class="ai-ring main-card-rounded p-px flex items-center">
                    <div class="flex items-center rounded-[31px] px-4 main-button">
                        <IconSearch class="w-4 " />
                        <input type="text" :placeholder="'Search recipes, ingredients, techniques...'"
                            v-model="searchQuery" @keyup.enter="handleSearch" @blur="handleSearch"
                            class="text-xs grow focus:outline-none w-80 px-2 py-2" />
                    </div>
                </div>
                <div class="gap-2 hidden md:flex">
                    <NuxtLink to="/kitchen/recipes" class="subnav-pill" active-class="active">
                        All Recipes</NuxtLink>
                    <NuxtLink to="/foods" class="subnav-pill" active-class="active">
                        All Foods
                    </NuxtLink>
                </div>
            </div>
            <div class="h-px bg-gray-200/70"></div>
            <div class="space-y-10 md:space-y-12">
                <section class="space-y-4">
                    <div class="space-y-3">
                        <p class="text-[11px] font-mono uppercase tracking-widest text-gray-400">
                            <NuxtLink to="/" class="transition hover:text-[#3d2a1e]">Home</NuxtLink>
                            <span class="mx-2 text-[#ccb9a6]">/</span>
                            <NuxtLink to="/foods" class="transition hover:text-[#3d2a1e]">Foods</NuxtLink>
                            <span class="mx-2 text-[#ccb9a6]">/</span>
                            <span>{{ food?.aisle ?? 'Food' }}</span>
                            <span class="mx-2 text-[#ccb9a6]">/</span>
                            <img :src="'/foods/' + food?.visual_category + '.webp'"
                                :alt="ALTS[`/foods/${food?.visual_category}.webp`]"
                                class="inline-block h-4 object-contain shrink-0 mr-2" />
                            <span class="text-primary font-headers">{{ foodName }}</span>
                        </p>
                    </div>
                    <div class="flex gap-5 justify-between items-end flex-wrap">
                        <div class="space-y-5">
                            <div class="flex flex-col gap-3 items-start">
                                <h1 class="max-w-[22ch] font-headers text-4xl md:text-6xl tracking-tight">
                                    {{ foodName }}

                                </h1>
                                <p class="max-w-xl text-gray-600 text-sm leading-relaxed">
                                    <span :class="descExpanded ? '' : 'line-clamp-4 md:line-clamp-3'">
                                        {{ food?.description || fallbackDescription }}
                                    </span>
                                    <button v-if="food?.description" type="button"
                                        class="ml-0.5 font-medium text-[#3d2a1e] underline decoration-[#d5c1ae] underline-offset-4"
                                        @click="descExpanded = !descExpanded">
                                        {{ descExpanded ? 'Read less' : 'Read more' }}
                                    </button>
                                </p>
                                <p v-if="foodMetaLine"
                                    class="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                                    {{ foodMetaLine }}
                                </p>
                            </div>
                        </div>

                        <div
                            class="p-3 md:p-4 bg-white md:bg-primary-5 border border-faint rounded-2xl flex-1 md:flex-0 md:mb-6">
                            <p class="mb-1 text-[10px] font-mono uppercase tracking-wider text-gray-400 text-nowrap">
                                Kinome Health Grade
                            </p>
                            <div class="flex items-center gap-3">
                                <div class="text-5xl font-headers leading-none" :class="healthGradeTextColor">
                                    {{ healthGrade || '-' }}
                                </div>
                                <div class="space-y-0.5">
                                    <p class="text-[13px] font-semibold text-dark text-nowrap">{{ healthGradeLabel }}
                                    </p>
                                    <p class="text-xs text-gray-500">{{ percentile ? `Top ${percentile}%` : '-' }}</p>
                                </div>
                            </div>
                            <div class="mt-2 h-1 rounded-full bg-[#f1e6db]">
                                <div class="h-full rounded-full bg-[#74b36b]"
                                    :style="{ width: `${Math.max(8, Math.min(100, food?.hidx ?? 0))}%` }" />
                            </div>
                        </div>
                    </div>
                </section>

                <section class="space-y-4">
                    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 class="font-headers text-2xl leading-none tracking-tight">
                                Nutrition
                            </h2>
                            <p class="mt-1 text-xs text-gray-500">
                                Macronutrients per selected portion. {{ foodData?.is_primary ? 'Averaged from verified sources' : 'Derived from ' + food?.primary_name }}.
                            </p>
                        </div>
                        <div class="flex gap-3 md:gap-4 items-center max-w-full">
                            <div class="flex-1 min-w-0">
                                <div
                                    class="bg-primary-200/5 border border-primary-200/30 rounded-full px-[3px] pb-[3px] pt-px max-w-full md:max-w-80 xl:max-w-96 overflow-hidden">
                                    <BlocksCarousel ref="unitCarousel" showArrows>
                                        <div v-for="choice in dropdownChoices" :key="choice.displayName"
                                            :class="selectedUnit.displayName === choice.displayName ? 'shrink-0 carousel-active' : 'shrink-0'">
                                            <button type="button" class="rounded-full px-3 py-1 text-xs" :class="selectedUnit.displayName === choice.displayName
                                                ? 'bg-white text-black'
                                                : 'text-gray-500'" @click="selectedUnit = choice">
                                                {{ choice.displayName }}
                                            </button>
                                        </div>
                                    </BlocksCarousel>
                                </div>
                            </div>
                            <button
                                class="shrink-0 flex items-center gap-1 rounded-full bg-dark px-4 py-2 text-xs font-medium text-white transition"
                                @click="contextMode = 'nutrition'; contextModalOpen = true">
                                <span class="">Full nutrition label</span>
                                <IconChevronRight class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <NutritionLabel :nutrition-source="food" :portion-multiplier="portionMultiplier" />
                </section>
                <section class="space-y-4">
                    <div class="flex gap-3 items-end md:justify-between">
                        <div>
                            <h2 class="font-headers text-2xl leading-none tracking-tight">
                                Nutrition quality
                            </h2>
                            <p class="mt-1 max-w-[620px] text-xs text-gray-500">
                                Scored against dietary guidelines. Tap rows for a deeper breakdown.
                            </p>
                        </div>
                        <button
                            class="shrink-0 flex items-center gap-1 rounded-full bg-dark px-4 py-2 text-xs font-medium text-white transition"
                            @click="contextMode = 'health'; contextModalOpen = true">
                            <span>Full analysis</span>
                            <IconChevronRight class="h-4 w-4" />
                        </button>
                    </div>
                    <NutritionQualityList :quality-cards="qualityCards" :food-row="food"
                        @open-full-analysis="openHealthReport" />
                </section>

                <section v-if="suggestedSwaps.length" class="space-y-4">
                    <div>
                        <h2 class="font-headers text-2xl leading-none tracking-tight">
                            Healthy alternatives
                        </h2>
                        <p class="mt-1 max-w-[700px] text-xs text-gray-500">
                            Ingredients that rank higher on the overall quality profile and might substitute well in
                            some recipes.
                        </p>
                    </div>

                    <div class="overflow-hidden main-card-rounded border border-[#f1ede9] gap-px flex flex-col">
                        <NuxtLink v-for="(swap, index) in suggestedSwaps" :key="swap.id"
                            :to="getFoodUrl(swap.id, swap.name)"
                            class="flex gap-4 bg-primary-5 py-4 px-6 items-center ">
                            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-[#b5a18e]">
                                {{ `${index + 1}`.padStart(2, '0') }}
                            </p>
                            <div class="flex-1 text-left">
                                <p class="font-medium tracking-tight font-headers">{{ swap.name }}
                                </p>
                                <p class="mt-0.5 text-xs text-gray-500">{{ getSwapReason(swap) }}</p>
                            </div>
                            <GradeContainer :score="swap.hidx" :type="'ovr'" />
                        </NuxtLink>
                    </div>
                </section>

                <section v-if="containedInRecipes?.length" class="space-y-4">
                    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 class="font-headers text-2xl leading-none tracking-tight">
                                Recipes featuring {{ featuredFoodLabel }}
                            </h2>
                            <p class="mt-1 text-xs text-gray-500">
                                Top-rated recipes across the kinome library.
                            </p>
                        </div>
                        <NuxtLink :to="allRecipesUrl"
                            class="inline-flex items-center gap-1 self-start rounded-full border border-[#d6c3b0] px-4 py-2 text-xs font-medium text-[#3d2a1e] transition hover:border-[#b89e86]">
                            <span>All {{ featuredRecipesCount ?? containedInRecipes.length }} recipes</span>
                            <IconChevronRight class="h-4 w-4" />
                        </NuxtLink>
                    </div>

                    <div class="grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-4 md:gap-x-4">
                        <RecipeCard v-for="recipe in containedInRecipes" :key="recipe.id" :recipe="recipe"
                            class="min-w-0 text-[19px] md:text-[24px]" />
                    </div>
                </section>

                <section v-if="faqItems.length" class="">
                    <h2 class="font-headers text-2xl leading-none tracking-tight">
                        Frequently asked
                    </h2>
                    <div class="h-px bg-gray-200 mt-4"></div>
                    <div class="grid gap-x-10 md:grid-cols-2">
                        <div v-for="(column, columnIndex) in faqColumns" :key="`faq-column-${columnIndex}`">
                            <details v-for="(item, itemIndex) in column" :key="item.question"
                                class="group border-b border-gray-200 py-3 space-y-2"
                                :open="columnIndex === 0 && itemIndex === 0">
                                <summary class="flex cursor-pointer list-none items-start gap-3">
                                    <span class="font-mono text-[10px] uppercase  text-[#b5a18e] px-2 mt-1">
                                        Q.{{ `${columnIndex + itemIndex * 2 + 1}`.padStart(2, '0') }}
                                    </span>
                                    <span class="flex-1 font-medium font-headers">
                                        {{ item.question }}
                                    </span>
                                    <IconChevronDown
                                        class="mt-1 h-4 w-4 shrink-0 text-[#9f8975] transition group-open:rotate-180" />
                                </summary>
                                <p class="text-[13px] text-gray-600 pl-13">
                                    {{ item.answer }}
                                </p>
                            </details>
                        </div>
                    </div>
                </section>

                <div
                    class="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9ddd1] pt-6 text-[10px] font-mono uppercase tracking-[0.28em] text-[#b09a86]">
                    <span>Kinome</span>
                    <span>{{ food?.aisle ?? 'Foods' }}</span>
                </div>
            </div>

            <BlocksResponsiveInfo v-model="contextModalOpen" sidePanelClass="w-120">
                <div v-if="contextMode === 'nutrition'" class="m-4">
                    <h2 class="mb-8 text-3xl font-headers tracking-tighter">Full Nutrition</h2>
                    <FoodFullNutritionFacts :food="food" :portion-multiplier="portionMultiplier" class="mt-10"
                        single-column show-macros :subtitle="`per ${selectedUnit.displayName}`" />
                </div>
                <PagesReport v-if="contextMode === 'health' && id" :id="id" :isFood="true" class="m-4"
                    :showTitle="true" />
            </BlocksResponsiveInfo>
        </div>
    </div>
</template>

<script setup lang="ts">
import pluralize from 'pluralize';
import { gradeTextColors } from '~/utils/constants/grades';
import { getCount } from '~/utils/db/getters/getCount';

const route = useRoute();
const paramValue = route.params.id as string;
const id = paramValue.split('-')[0];
const supabase = useSupabaseClient<Database>();

const selectedUnit = ref({ value: 100, displayName: '100g' });
const unitCarousel = ref<{ centerActiveItem: () => void } | null>(null);
const descExpanded = ref(false);
const contextModalOpen = ref(false);
const contextMode = ref<'nutrition' | 'health'>('nutrition');

const openHealthReport = () => {
    contextMode.value = 'health';
    contextModalOpen.value = true;
};

const qualityCards = computed(() => {
    if (!food.value) return [];
    const cards = getDailyQualityCards(food.value.report, {
        totalFat: food.value.fat,
        protectiveScore: food.value.protective_score,
    });
    const wholeIdx = cards.findIndex((c) => c.title === 'Whole Food %');
    if (wholeIdx >= 0) {
        const nova = food.value.nova as number | undefined;
        cards[wholeIdx] = {
            ...cards[wholeIdx]!,
            title: 'Processing',
            rating: nova ? (novaLabels[nova] ?? '-') : '-',
            pillClass: nova ? (novaPillClass[nova] ?? 'bg-primary/8') : 'bg-primary/8',
            subtitle: nova ? `NOVA ${nova}` : '',
        };
    }
    return cards;
});


const dropdownChoices = computed(() => {
    const choices = [{ value: 100, displayName: '100g' }];
    for (const [unit, weight] of Object.entries(food.value?.countable_units ?? {})) {
        if (unit === '') {
            choices.push({
                value: Number(weight),
                displayName: `1 ${capitalize(foodName.value)} (${weight}g)`,
            });
        } else {
            choices.push({
                value: Number(weight),
                displayName: `${capitalize(unit)} (${weight}g)`,
            });
        }
    }
    return choices.sort((a, b) => a.value - b.value);
});

const { data: foodData } = await useAsyncData(
    `food-details-${id}`,
    () => getFoodName(supabase, { eq: { id: Number(id) } }),
    {
        lazy: import.meta.client,
    }
);

const foodName = computed(() => foodData.value?.name || '');
const food = computed(() => foodData.value?.food);

const suggestedSwaps = computed(() => {
    return (((food.value as any)?.suggested_swaps ?? []) as NonNullable<Food['suggested_swaps']>) ?? [];
});

function getSwapReason(swap: NonNullable<Food['suggested_swaps']>[0]): string {
    if (!food.value) return '';

    const categories = [
        { key: 'fiber_score', label: 'More fiber · similar role in recipes' },
        { key: 'protein_score', label: 'Leaner · higher protein density' },
        { key: 'fat_profile_score', label: 'Better fats · cleaner profile' },
        { key: 'salt_score', label: 'Less salt · lighter overall' },
        { key: 'sugar_score', label: 'Less sugar · steadier energy' },
        { key: 'satiety', label: 'More filling per calorie' },
        { key: 'mnidx', label: 'Richer micronutrient profile' },
        { key: 'protective_score', label: 'More antioxidants overall' },
    ] as const;

    let maxDiff = -Infinity;
    let bestCategory = '';

    for (const category of categories) {
        const currentValue = (food.value as any)[category.key] ?? 0;
        const swapValue = swap[category.key] ?? 0;
        const diff = swapValue - currentValue;

        if (diff > maxDiff && diff > 5) {
            maxDiff = diff;
            bestCategory = category.label;
        }
    }

    return bestCategory || 'Healthier overall - easy substitute';
}

const portionMultiplier = computed(() => selectedUnit.value.value / 100);

watch(
    () => selectedUnit.value.displayName,
    async () => {
        await nextTick();
        unitCarousel.value?.centerActiveItem();
    },
    { immediate: true }
);

const novaLabels: Record<number, string> = {
    1: 'Unprocessed',
    2: 'Culinary processed',
    3: 'Processed',
    4: 'Ultra-processed',
};

const novaPillClass: Record<number, string> = {
    1: 'bg-green-100 text-green-700',
    2: 'bg-green-100 text-green-700',
    3: 'bg-orange-100 text-orange-700',
    4: 'bg-red-100 text-red-700',
};

const foodMetaLine = computed(() => {
    const f = food.value;
    if (!f) return '';
    const parts: string[] = [];
    if (f.vegan) {
        parts.push('Vegan');
    } else if (f.vegetarian) {
        parts.push('Vegetarian');
    }
    if (f.lactose_free) {
        parts.push('Lactose free');
    }
    if (f.gluten_free) {
        parts.push('Gluten free');
    }
    const nova = f.nova as number | undefined;
    if (nova) {
        parts.push(
            `${novaLabels[nova]}`
        );
    }
    const p = f.price;
    if (p != null && !Number.isNaN(Number(p))) {
        parts.push(`~${Number(p).toFixed(2)}€/100g`);
    }


    return parts.join(' · ');
});

const { data: containedInRecipes } = useAsyncData(
    `recipes-containing-${id}`,
    () => getRecipesContaining(supabase, [Number(id)])
);

const { data: featuredRecipesCount } = useAsyncData(
    `recipes-containing-count-${id}`,
    async () => {
        const { data: foodNameRow, error: foodNameError } = await supabase
            .from('food_names')
            .select('food_id')
            .eq('id', Number(id))
            .single();

        if (foodNameError || !foodNameRow?.food_id) return 0;

        const { data: aliases, error: aliasError } = await supabase
            .from('food_names')
            .select('id')
            .eq('food_id', foodNameRow.food_id);

        if (aliasError || !aliases?.length) return 0;

        const aliasIds = aliases.map((alias) => alias.id);

        const { data: recipeFoods, error: recipeFoodsError } = await supabase
            .from('recipe_foods')
            .select('recipe_id')
            .in('food_name_id', aliasIds);

        if (recipeFoodsError || !recipeFoods?.length) return 0;

        const recipeIds = [...new Set(recipeFoods.map((row) => row.recipe_id))];

        return getCount(supabase, {
            in: { id: recipeIds },
        });
    }
);

watchEffect(() => {
    if (foodName.value && !paramValue.includes('-')) {
        navigateTo(getFoodUrl(Number(id), foodName.value), { replace: true });
    }
});

const healthGrade = computed(() =>
    food.value?.hidx ? getGrade(food.value.hidx, 'ovr') : null
);

const healthGradeTextColor = computed(() => {
    const rounded = healthGrade.value?.replace('+', '').replace('-', '') ?? '';
    return gradeTextColors[rounded as keyof typeof gradeTextColors] ?? 'text-[#2c1d14]';
});

const description = computed(() => {
    const f = food.value;
    if (!f) return `${foodName.value}: calories, protein, carbs and fat per 100g.`;

    const grade = healthGrade.value;
    const gradeText = grade &&
        (grade.startsWith('A') || grade.startsWith('B') || grade.startsWith('C') || grade.startsWith('S'))
        ? ` Health Grade: ${grade}.`
        : '';

    return `100g of ${foodName.value} contains ${f.kcal} kcal, ${f.protein}g protein, ${f.carbohydrates}g carbs and ${f.fat}g fat.${gradeText} See the full macro and micronutrient breakdown.`;
});

const fallbackDescription = computed(() => description.value);

const foodUrl = computed(
    () => `https://kinome.app${getFoodUrl(Number(id), foodName.value)}`
);

function getFoodHealthHighlight(f: FullFoodRow, isPlural: boolean): string {
    const report = f.report as any;

    const candidates = [
        { key: 'mnidx', score: f.mnidx ?? 0 },
        { key: 'protein_score', score: f.protein_score ?? 0 },
        { key: 'fiber_score', score: f.fiber_score ?? 0 },
        { key: 'fat_profile_score', score: f.fat_profile_score ?? 0 },
        { key: 'protective_score', score: f.protective_score ?? 0 },
        { key: 'satiety', score: f.satiety ?? 0 },
    ]
        .filter((c) => c.score > 60)
        .sort((a, b) => b.score - a.score);

    const top = candidates[0];
    if (!top) return '';

    switch (top.key) {
        case 'mnidx': {
            const micros = (report?.details?.micronutrients ?? []) as { displayName: string; rdaPerServing: number }[];
            const top2 = [...micros].sort((a, b) => b.rdaPerServing - a.rdaPerServing).slice(0, 2);
            if (top2.length >= 2) return `${isPlural ? 'They are' : 'It is'} an excellent source of ${top2[0]!.displayName} and ${top2[1]!.displayName}.`;
            if (top2.length === 1) return `${isPlural ? 'They are' : 'It is'} an excellent source of ${top2[0]!.displayName}.`;
            return 'It is rich in essential micronutrients.';
        }
        case 'protein_score':
            return `${isPlural ? 'They are' : 'It is'} high in protein with ${f.protein}g per 100g.`;
        case 'fiber_score':
            return `${isPlural ? 'They are' : 'It is'} a good source of dietary fiber (${f.fiber}g per 100g).`;
        case 'fat_profile_score':
            return `${isPlural ? 'They have' : 'It has'} a strong fat quality profile.`;
        case 'protective_score':
            return `${isPlural ? 'They are' : 'It is'} rich in protective compounds.`;
        case 'satiety':
            return `${isPlural ? 'They are' : 'It is'} highly satiating for the calories provided.`;
        default:
            return '';
    }
}

const schemaScripts = computed(() => {
    const f = food.value;
    if (!f) return [];

    const scripts: { type: string; children: string }[] = [];

    scripts.push({
        type: 'application/ld+json',
        children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: foodName.value,
            description: description.value,
            url: foodUrl.value,
            nutrition: {
                '@type': 'NutritionInformation',
                servingSize: '100g',
                calories: `${f.kcal} kcal`,
                proteinContent: `${f.protein}g`,
                carbohydrateContent: `${f.carbohydrates}g`,
                fatContent: `${f.fat}g`,
                saturatedFatContent: `${f.saturated_fat}g`,
                fiberContent: `${f.fiber}g`,
                sugarContent: `${f.sugar}g`,
                ...(f.trans_fats_mg != null && { transFatContent: `${(f.trans_fats_mg / 1000).toFixed(2)}g` }),
                ...(f.salt != null && { sodiumContent: `${Math.round((f.salt / 2.5) * 1000)}mg` }),
            },
        }),
    });

    if (faqItems.value.length > 0) {
        scripts.push({
            type: 'application/ld+json',
            children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqItems.value.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
            }),
        });
    }

    return scripts;
});

const faqItems = computed<{ question: string; answer: string }[]>(() => {
    const f = food.value;
    if (!f) return [];

    const name = foodName.value;
    const isPlural = pluralize.isPlural(name);
    const isOrAre = isPlural ? 'are' : 'is';
    const IsOrAre = isOrAre === 'are' ? 'Are' : 'Is';
    const items: { question: string; answer: string }[] = [];
    const grade = healthGrade.value;

    if (grade) {
        const highlight = getFoodHealthHighlight(f, isPlural);
        let answer: string;
        if (grade.startsWith('S')) {
            answer = `Yes, ${name} ${isOrAre} exceptionally healthy, earning an S Health Grade. ${highlight}`;
        } else if (grade.startsWith('A')) {
            answer = `Yes, ${name} ${isOrAre} very healthy with a Health Grade of ${grade}. ${highlight}`;
        } else if (grade.startsWith('B')) {
            answer = `Yes, ${name} ${isOrAre} considered healthy with a Health Grade of ${grade}. ${highlight}`;
        } else if (grade.startsWith('C')) {
            answer = `${name} ${isOrAre} rated moderate (Health Grade ${grade}) per 100g and can be part of a balanced diet.`;
        } else {
            answer = `${name} ${isOrAre} rated ${grade} on overall nutritional quality and is best consumed in moderation alongside more nutrient-dense foods.`;
        }
        items.push({ question: `${IsOrAre} ${name} healthy?`, answer: answer.trim() });
    }

    items.push({
        question: `What are the macros in ${name}?`,
        answer: `100g of ${name} ${isPlural ? 'contain' : 'contains'} ${f.kcal} kcal, ${f.protein}g protein, ${f.carbohydrates}g carbohydrates, ${f.fat}g fat, and ${f.fiber}g fiber.`,
    });

    const nova = f.nova as number | undefined;
    if (nova) {
        items.push({
            question: `What NOVA processing level ${isOrAre} ${name}?`,
            answer: `${name} ${isOrAre} NOVA ${nova} - ${novaLabels[nova]}.`,
        });
    }

    if (f.vegan) {
        items.push({ question: `${IsOrAre} ${name} vegan?`, answer: `Yes, ${name} ${isOrAre} vegan.` });
    } else if (f.vegetarian) {
        items.push({ question: `${IsOrAre} ${name} vegetarian?`, answer: `Yes, ${name} ${isOrAre} vegetarian but not vegan.` });
    }

    if (f.gluten_free) {
        items.push({ question: `${IsOrAre} ${name} gluten free?`, answer: `Yes, ${name} ${isOrAre} gluten free.` });
    }

    if (f.lactose_free) {
        items.push({ question: `${IsOrAre} ${name} lactose free?`, answer: `Yes, ${name} ${isOrAre} lactose free.` });
    }

    return items.slice(0, 6);
});

const healthGradeLabel = computed(() => {
    const grade = healthGrade.value ?? '';
    if (grade.startsWith('S')) return 'Optimal';
    if (grade.startsWith('A')) return 'Excellent';
    if (grade.startsWith('B')) return 'Healthy';
    if (grade.startsWith('C')) return 'Fair';
    return 'Use selectively';
});

const healthRankText = computed(() => {
    const score = food.value?.hidx ?? 0;
    if (score >= 90) return 'Top 5% of foods';
    if (score >= 83) return 'Top 12% of foods';
    if (score >= 73) return 'Top 20% of foods';
    if (score >= 60) return 'Strong everyday choice';
    if (score >= 45) return 'Moderate overall quality';
    return 'Best used in balance';
});

const percentile = ref<number | null>(null);


async function getPercentile() {
    const { data, error } = await supabase
        .rpc('get_percentile', {
            p_table_name: 'foods',
            p_column_name: 'hidx',
            p_value: food.value?.hidx ?? 0
        });

    if (error) {
        throw new Error('Error calling calculate_percentile:', error);
    }
    percentile.value = Math.round(100 - data);
}

onMounted(async () => {
    await getPercentile();
});


const featuredFoodLabel = computed(() => {
    const lower = foodName.value.trim();
    return lower || 'this food';
});

const allRecipesUrl = computed(() => `/kitchen/recipes?q=${encodeURIComponent(foodName.value)}`);

const faqColumns = computed(() => {
    const left = faqItems.value.filter((_, index) => index % 2 === 0);
    const right = faqItems.value.filter((_, index) => index % 2 === 1);
    return [left, right];
});

const searchQuery = ref('');

const handleSearch = () => {
    if (!searchQuery.value.trim()) {
        return;
    }
    const params = new URLSearchParams({ q: searchQuery.value });
    navigateTo(`/kitchen/recipes?${params.toString()}`);
};


defineOgImage('Food.takumi', {
    name: foodName,
    aisle: computed(() => food.value?.aisle ?? 'Food'),
    illustration: computed(() =>
        `https://kinome.app/foods/${food.value?.visual_category ?? 'herb_fresh'}.webp`
    ),
    grade: healthGrade,
    kcal: computed(() => food.value?.kcal ?? 0),
    protein: computed(() => food.value?.protein ?? 0),
    carbs: computed(() => food.value?.carbohydrates ?? 0),
    fat: computed(() => food.value?.fat ?? 0),
    fiber: computed(() => food.value?.fiber ?? 0),
});

useHead(() => ({
    title: `${foodName.value} - Complete Nutrition Facts & Analysis`,
    script: schemaScripts.value,
    meta: [
        {
            name: 'description',
            content: description.value.slice(0, 160),
        },
        {
            property: 'og:title',
            content: `${foodName.value} - Complete Nutrition Facts & Analysis`,
        },
        {
            property: 'og:description',
            content: description.value.slice(0, 200),
        },
        {
            property: 'og:type',
            content: 'article',
        },
        {
            property: 'og:url',
            content: foodUrl.value,
        },
    ],
    link: [
        {
            rel: 'canonical',
            href: foodUrl.value,
        },
    ],
}));
</script>
