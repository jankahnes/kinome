<template>
    <div class="main-card main-card-padding main-card-rounded flex flex-col gap-2 overflow-hidden">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h2 class="text-sm font-semibold text-gray-500 tracking-wide uppercase">Plant Diversity
                </h2>
                <p class="text-sm text-gray-400">Unique plants detected this week</p>
            </div>

            <div
                class="bg-primary/8 text-green-800 px-6 text-sm -mr-4 -mt-4 md:-mr-6 md:-mt-6 rounded-bl-3xl h-18 flex items-center justify-center">
                <span class="text-2xl font-bold">{{ plants.length }}</span>/30
            </div>
        </div>

        <div class="relative mx-auto aspect-square main-card-rounded w-full bg-gradient-to-center from-secondary/10 via-secondary/30 to-secondary/10"
            v-if="plants.length">
            <div v-for="plant in plants" :key="plant.id"
                class="absolute rounded-full shadow-md transition-transform will-change-transform duration-200 hover:scale-[1.01]"
                :title="`${plant.name} • ${formatGrams(plant.grams)} g this week`" :style="plant.style" tabindex="0"
                @mouseenter="hoveredPlant = plant" @mouseleave="hoveredPlant = null" @focus="hoveredPlant = plant"
                @blur="hoveredPlant = null">
                <div class="flex h-full w-full flex-col items-center justify-center gap-1 px-2 py-3 text-center">
                    <img :src="plant.illustration" :alt="plant.name" class="shrink-0 object-contain drop-shadow-sm"
                        :style="plant.imageStyle" />
                    <div v-if="plant.showName" class="max-w-full text-gray-800 text-xs" :style="plant.nameStyle">
                        {{ plant.name }}
                    </div>
                </div>
            </div>
            <div v-if="hoveredPlant"
                class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/90 bg-white/95 px-3 py-2 text-center shadow-[0_12px_32px_rgba(15,23,42,0.18)] backdrop-blur-sm"
                :style="hoveredPlant.tooltipStyle">
                <div class="max-w-40 text-sm font-semibold leading-tight text-gray-800">
                    {{ hoveredPlant.name }}
                </div>
                <div class="mt-0.5 text-xs text-gray-500">
                    {{ formatGrams(hoveredPlant.grams) }} g this week
                </div>
            </div>
        </div>

        <div v-else class="text-sm text-gray-400">
            Log some plant foods to see this week's diversity.
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    recipeRow: Record<string, unknown> | null | undefined;
    ingredients: any[];
}>();

const BUBBLE_VIEWBOX = 1000;
const BUBBLE_PADDING = 10;
const BUBBLE_GAP = 6;
const NAME_THRESHOLD = 130;
const LARGE_NAME_THRESHOLD = 165;

type PlantMeta = {
    id: string;
    name: string;
    illustration: string;
    grams: number;
    category: string;
};

type PositionedPlant = PlantMeta & {
    radius: number;
    x: number;
    y: number;
    diameter: number;
    showName: boolean;
    allowTwoLineName: boolean;
    style: Record<string, string>;
    imageStyle: Record<string, string>;
    nameStyle: Record<string, string>;
    tooltipStyle: Record<string, string>;
};

const hoveredPlant = ref<PositionedPlant | null>(null);

function normalizeId(value: unknown) {
    if (value == null || value === '') return null;
    return String(value);
}

function hashHue(value: string) {
    let hash = 0;
    for (const char of value) {
        hash = (hash * 31 + char.charCodeAt(0)) % 360;
    }
    return hash;
}

function getCategoryHue(category: string, id: string): number {
    const variance = (hashHue(id) % 24) - 12; // -12 to +12 degrees for slight organic variance

    if (category.startsWith('veg')) return 110 + variance; // Green
    if (category.startsWith('fruit')) return 10 + variance; // Peach/Red
    if (category.startsWith('grain')) return 40 + variance; // Yellow/Beige
    if (category.startsWith('legume')) return 30 + variance; // Orange/Brown
    if (category.startsWith('nut')) return 25 + variance; // Warm brown
    if (category.startsWith('seed')) return 45 + variance; // Golden/Warm yellow
    if (category.startsWith('herb')) return 130 + variance; // Forest/Teal green
    if (category.startsWith('spice')) return 15 + variance; // Warm red/orange

    return hashHue(id);
}

function formatGrams(value: number) {
    if (!Number.isFinite(value)) return '0';
    return value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, '');
}

function collides(x: number, y: number, radius: number, placed: Array<{ x: number; y: number; radius: number }>) {
    return placed.some((bubble) => {
        const dx = x - bubble.x;
        const dy = y - bubble.y;
        return Math.hypot(dx, dy) < radius + bubble.radius + BUBBLE_GAP;
    });
}

function packPlants(items: PlantMeta[]) {
    if (!items.length) return [];

    const gramsValues = items.map((item) => Math.max(item.grams, 1));
    const sqrtValues = gramsValues.map((value) => Math.sqrt(value));
    const minSqrt = Math.min(...sqrtValues);
    const maxSqrt = Math.max(...sqrtValues);
    const maxRadius = items.length > 18 ? 112 : 136;
    const minRadius = items.length > 18 ? 48 : 58;

    const sized = items
        .map((item) => {
            const grams = Math.max(item.grams, 1);
            const normalized = maxSqrt === minSqrt
                ? 0.65
                : (Math.sqrt(grams) - minSqrt) / (maxSqrt - minSqrt);

            return {
                ...item,
                radius: minRadius + normalized * (maxRadius - minRadius),
            };
        })
        .sort((a, b) => b.radius - a.radius);

    const placed: Array<PlantMeta & { radius: number; x: number; y: number }> = [];

    for (const item of sized) {
        if (!placed.length) {
            placed.push({
                ...item,
                x: BUBBLE_VIEWBOX / 2,
                y: BUBBLE_VIEWBOX / 2,
            });
            continue;
        }

        let candidate = null as { x: number; y: number } | null;
        const spiralStep = Math.max(4, item.radius * 0.16);

        for (let step = 0; step < 4000; step++) {
            const angle = step * 0.42;
            const distance = spiralStep * Math.sqrt(step);
            const x = BUBBLE_VIEWBOX / 2 + Math.cos(angle) * distance;
            const y = BUBBLE_VIEWBOX / 2 + Math.sin(angle) * distance;

            if (!collides(x, y, item.radius, placed)) {
                candidate = { x, y };
                break;
            }
        }

        placed.push({
            ...item,
            x: candidate?.x ?? BUBBLE_VIEWBOX / 2,
            y: candidate?.y ?? BUBBLE_VIEWBOX / 2,
        });
    }

    const minX = Math.min(...placed.map((item) => item.x - item.radius));
    const maxX = Math.max(...placed.map((item) => item.x + item.radius));
    const minY = Math.min(...placed.map((item) => item.y - item.radius));
    const maxY = Math.max(...placed.map((item) => item.y + item.radius));
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const scale = Math.min(
        (BUBBLE_VIEWBOX - BUBBLE_PADDING * 2) / width,
        (BUBBLE_VIEWBOX - BUBBLE_PADDING * 2) / height,
    );
    const offsetX = (BUBBLE_VIEWBOX - width * scale) / 2;
    const offsetY = (BUBBLE_VIEWBOX - height * scale) / 2;

    return placed.map((item): PositionedPlant => {
        const radius = item.radius * scale;
        const diameter = radius * 2;
        const x = offsetX + (item.x - minX) * scale;
        const y = offsetY + (item.y - minY) * scale;
        const hue = getCategoryHue(item.category, item.id);
        const sizePercent = (diameter / BUBBLE_VIEWBOX) * 100;
        const prefersAbove = y - radius > 120;
        const tooltipX = Math.min(BUBBLE_VIEWBOX - 110, Math.max(110, x));
        const tooltipY = prefersAbove
            ? Math.max(48, y - radius - 26)
            : Math.min(BUBBLE_VIEWBOX - 48, y + radius + 26);

        return {
            ...item,
            radius,
            diameter,
            x,
            y,
            showName: diameter >= NAME_THRESHOLD,
            allowTwoLineName: diameter >= LARGE_NAME_THRESHOLD,
            style: {
                left: `${(x / BUBBLE_VIEWBOX) * 100}%`,
                top: `${(y / BUBBLE_VIEWBOX) * 100}%`,
                width: `${sizePercent}%`,
                height: `${sizePercent}%`,
                transform: 'translate(-50%, -50%)',
                background: `hsla(${hue}, 85%, 94%, 0.97)`,
            },
            imageStyle: {
                width: diameter >= LARGE_NAME_THRESHOLD ? '42%' : diameter >= NAME_THRESHOLD ? '42%' : '60%',
                height: diameter >= LARGE_NAME_THRESHOLD ? '42%' : diameter >= NAME_THRESHOLD ? '42%' : '60%',
                maxWidth: diameter >= LARGE_NAME_THRESHOLD ? '3.5rem' : diameter >= NAME_THRESHOLD ? '2.75rem' : '2.5rem',
                maxHeight: diameter >= LARGE_NAME_THRESHOLD ? '3.5rem' : diameter >= NAME_THRESHOLD ? '2.75rem' : '2.5rem',
                flex: diameter >= LARGE_NAME_THRESHOLD ? '0 0 42%' : diameter >= NAME_THRESHOLD ? '0 0 42%' : '0 0 60%',
            },
            nameStyle: {
                fontSize: diameter >= NAME_THRESHOLD ? `${Math.max(10, Math.min(13, diameter * 0.058))}px` : '1px',
                lineHeight: '1.08',
                maxWidth: diameter >= LARGE_NAME_THRESHOLD ? '74%' : '68%',
                maxHeight: diameter >= LARGE_NAME_THRESHOLD ? '2.3em' : '1.15em',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: diameter >= LARGE_NAME_THRESHOLD ? '2' : '1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: '600',
                letterSpacing: '-0.01em',
            },
            tooltipStyle: {
                left: `${(tooltipX / BUBBLE_VIEWBOX) * 100}%`,
                top: `${(tooltipY / BUBBLE_VIEWBOX) * 100}%`,
            },
        };
    });
}

const plants = computed(() => {
    const uniquePlantsThisWeek: any[] =
        (props.recipeRow as any)?.report?.details?.gutHealth?.uniquePlantsThisWeek ?? [];
    const ingredients = props.ingredients ?? [];
    if (!uniquePlantsThisWeek.length) return [];

    const ingredientMeta = new Map<string, { name: string; illustration: string; category: string }>();
    for (const ingredient of ingredients) {
        const canonicalFoodId = normalizeId(
            ingredient?.foodId
            ?? ingredient?.food_id
            ?? ingredient?.canonicalFoodId
            ?? ingredient?.canonical_food_id,
        );
        const ingredientId = normalizeId(ingredient?.id);
        const meta = {
            name: ingredient.name ?? `Food ${canonicalFoodId ?? ingredientId ?? 'Unknown'}`,
            illustration: `/foods/${ingredient.visual_category ?? 'herb_fresh'}.webp`,
            category: ingredient.visual_category ?? 'unknown',
        };

        if (canonicalFoodId && !ingredientMeta.has(canonicalFoodId)) {
            ingredientMeta.set(canonicalFoodId, meta);
        }

        if (ingredientId && !ingredientMeta.has(ingredientId)) {
            ingredientMeta.set(ingredientId, meta);
        }
    }

    const aggregated = new Map<string, PlantMeta>();
    for (const entry of uniquePlantsThisWeek) {
        const plantId = Array.isArray(entry) ? normalizeId(entry[0]) : normalizeId(entry);
        if (!plantId) continue;

        const grams = Array.isArray(entry) ? Number(entry[1]) || 0 : 1;
        const existing = aggregated.get(plantId);
        const meta = ingredientMeta.get(plantId);

        aggregated.set(plantId, {
            id: plantId,
            name: meta?.name ?? `Food ${plantId}`,
            illustration: meta?.illustration ?? '/foods/herb_fresh.webp',
            grams: (existing?.grams ?? 0) + grams,
            category: meta?.category ?? 'unknown',
        });
    }

    return packPlants(Array.from(aggregated.values()));
});
</script>
