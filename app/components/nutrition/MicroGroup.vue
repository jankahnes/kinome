<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-2.5 mb-3.5 pb-2 border-b border-gray-100">
      <div class="w-1 h-5 rounded-full" :class="accentClass"></div>
      <h3 class="font-headers text-xl tracking-tight leading-none">{{ title }}</h3>
      <span v-if="subtitle"
        class="font-mono text-[10px] text-gray-400 uppercase tracking-wider ml-1 leading-none self-end mb-0.5">
        {{ subtitle }}
      </span>
    </div>

    <div class="flex flex-col">
      <!-- RDA kind: vitamins, minerals, fatty acids, amino acids -->
      <template v-if="kind === 'rda'">
        <div v-for="item in itemsWithBadges" :key="item.key" class="py-1.5 first:pt-0">
          <div class="flex items-center justify-between gap-3 mb-1.5">
            <span class="text-sm text-slate-700">{{ item.label }}</span>
            <div class="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-slate-500 whitespace-nowrap">
              <span class="text-slate-700 font-semibold text-xs">{{ fmtPct(rawPct(item.value, item.rda)) }}%<span
                  class="font-normal text-slate-400 text-[11px]"> RDA</span></span>
              <template v-if="item.unit">
                <span class="text-gray-300">·</span>
                <span class="text-slate-700">{{ fmtValue(item.value) }}<span class="font-normal text-slate-400"> {{
                  item.unit }}</span></span>
              </template>
              <template v-if="item.badge">
                <span class="text-gray-300">·</span>
                <button v-if="item.badge" type="button"
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none whitespace-nowrap ml-0.5 cursor-help hover:brightness-95 transition"
                  :class="item.badge.cls" :title="badgeTitle(item)" @click="openExplainer">{{ item.badge.text
                  }}</button>
              </template>
            </div>
          </div>
          <div class="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              :class="colorCodedBars ? statusBarClass(rawPct(item.value, item.rda)) : barClass"
              :style="{ width: barPct(item.value, item.rda) + '%' }"></div>
          </div>
        </div>
      </template>

      <!-- Level kind: protective compounds -->
      <template v-else-if="kind === 'level'">
        <div v-for="item in items" :key="item.key" class="py-1.5 first:pt-0">
          <div class="flex items-center justify-between gap-3 mb-1.5">
            <span class="text-sm text-slate-700">{{ item.label }}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none whitespace-nowrap"
              :class="levelBadge(item.levelValue).cls">{{ levelBadge(item.levelValue).text }}</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500" :class="barClass"
              :style="{ width: Math.min((item.levelValue / 50) * 100, 100) + '%' }"></div>
          </div>
        </div>
      </template>

      <!-- Macro kind: carbs, fat, protein, fiber, salt -->
      <template v-else>
        <div v-for="item in items" :key="item.key" class="py-1.5 first:pt-0">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-medium text-slate-800">{{ item.label }}</span>
            <div class="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-slate-500 whitespace-nowrap">
              <template v-if="item.ref">
                <span>{{ fmtPct(rawPct(item.value, item.ref)) }}% DV</span>
                <span class="text-gray-300">·</span>
              </template>
              <span class="text-slate-700 font-semibold text-xs">{{ fmtValue(item.value) }}<span
                  class="font-normal text-slate-400 text-[11px]"> {{ item.unit || 'g' }}</span></span>
            </div>
          </div>
          <div v-if="item.subLabel" class="flex items-center justify-between gap-3 mt-0.5 pl-3">
            <span class="text-xs text-slate-500">{{ item.subLabel }}</span>
            <div class="font-mono text-xs font-semibold tabular-nums text-slate-600 whitespace-nowrap">
              {{ fmtValue(item.subValue ?? 0) }} <span class="text-slate-400 text-[11px]">{{ item.unit || 'g' }}</span>
            </div>
          </div>
          <div class="mt-1.5 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
            <div v-if="item.subValue != null && barPct(item.subValue, item.ref) > 0.5"
              class="h-full transition-all duration-500 rounded-l-full" :class="item.subBarClass || barClass"
              :style="{ width: barPct(item.subValue, item.ref) + '%' }"></div>
            <div class="h-full transition-all duration-500" :class="[
              item.barClass || barClass,
              item.subValue != null && barPct(item.subValue, item.ref) > 0.5 ? '' : 'rounded-l-full',
              'rounded-r-full',
            ]" :style="{ width: barPct(Math.max(0, item.value - (item.subValue ?? 0)), item.ref) + '%' }"></div>
          </div>
        </div>
      </template>
    </div>

    <!-- Badge explainer modal -->
    <BlocksModal v-if="kind === 'rda'" v-model="explainerOpen" responsive>
      <div class="p-6 md:p-8 max-w-[480px]">
        <div class="mb-4">
          <span class="font-mono text-[10px] text-primary/70 uppercase tracking-[0.22em]">On-track badge</span>
          <h3 class="text-2xl font-headers tracking-tight leading-none mt-2">Nutrient density<span
              class="text-primary">.</span></h3>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed mb-5">
          A recipe can be small but nutrient-packed. The on-track badge estimates how well this micro is covered
          if you ate food at this concentration across a <span class="font-semibold">2200-kcal day</span>.
          Useful because a tiny salad covering only 12% RDA directly might still be "complete" by density.
        </p>
        <div class="space-y-1.5">
          <div v-for="tier in tierRows" :key="tier.text"
            class="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none whitespace-nowrap" :class="tier.cls">
              {{ tier.text }}
            </span>
            <span class="font-mono text-xs tabular-nums text-slate-500">{{ tier.range }}</span>
            <span class="text-xs text-slate-600 ml-auto">{{ tier.note }}</span>
          </div>
        </div>
        <button type="button"
          class="main-button animated-button bg-primary-5 px-4 py-2 mt-6 text-sm font-semibold w-full"
          @click="explainerOpen = false">Got it</button>
      </div>
    </BlocksModal>
  </div>
</template>

<script setup lang="ts">
type Kind = 'rda' | 'level' | 'macro';

type Badge = { text: string; cls: string };

const props = defineProps<{
  title: string;
  subtitle?: string;
  accentClass: string;
  barClass: string;
  kind: Kind;
  items: any[];
  /** For 'rda' kind: recipe kcal, used to normalize the on-track badge against a 2200-kcal day */
  kcal?: number;
  /** When true, RDA bars use status colors (red/yellow/emerald/blue) instead of the static barClass */
  colorCodedBars?: boolean;
}>();

function statusBarClass(rdaPercent: number): string {
  if (rdaPercent >= 100) return 'bg-blue-400';
  if (rdaPercent >= 70) return 'bg-emerald-400';
  if (rdaPercent >= 40) return 'bg-yellow-400';
  return 'bg-red-400';
}

const explainerOpen = ref(false);
function openExplainer() {
  explainerOpen.value = true;
}

function fmtValue(val: number | undefined | null): string {
  if (val === 0 || val == null) return '0';
  if (val < 0.01) return val.toFixed(4);
  if (val < 1) return val.toFixed(2);
  if (val < 10) return val.toFixed(1);
  return val.toFixed(0);
}

/** Uncapped raw percentage - used for display text. */
function rawPct(value: number | undefined, ref: number | undefined): number {
  if (!value || !ref) return 0;
  return (value / ref) * 100;
}

/** Clamped to 100 - used for bar widths so they never overflow. */
function barPct(value: number | undefined, ref: number | undefined): number {
  return Math.min(rawPct(value, ref), 100);
}

function fmtPct(p: number): string {
  if (p >= 1000) return '999+';
  if (p < 1 && p > 0) return p < 0.5 ? '<1' : '1';
  return Math.round(p).toString();
}

const BADGE_TIERS = {
  very_high: { text: 'Very high', cls: 'bg-purple-100 text-purple-700' },
  complete: { text: 'Complete', cls: 'bg-emerald-100 text-emerald-700' },
  solid: { text: 'Solid', cls: 'bg-sky-100 text-sky-700' },
  some: { text: 'Some', cls: 'bg-slate-100 text-slate-600' },
  low: { text: 'Low', cls: 'bg-orange-50 text-orange-400' },
  none: { text: 'None', cls: 'bg-slate-50 text-slate-400' },
} as const;

/** Normalized density: how much of RDA this meal's nutrient concentration would hit across a 2200-kcal day. */
function normalizedDensity(value: number, rda: number): number {
  if (!value || !rda) return 0;
  const k = props.kcal ?? 2200;
  return (value / rda) * (2200 / (k || 2200)) * 100;
}

function rdaBadge(value: number | undefined, rda: number | undefined): Badge | null {
  const n = normalizedDensity(value, rda);
  if (n >= 130) return BADGE_TIERS.very_high;
  if (n >= 90) return BADGE_TIERS.complete;
  if (n >= 50) return BADGE_TIERS.solid;
  if (n >= 25) return BADGE_TIERS.some;
  if (n > 0) return BADGE_TIERS.low;
  return BADGE_TIERS.none;
}

function levelBadge(value: number | undefined): Badge {
  if (!value || value < 5) return { text: 'None', cls: 'bg-slate-50 text-slate-400' };
  if (value < 20) return { text: 'Trace', cls: 'bg-slate-100 text-slate-600' };
  if (value < 30) return { text: 'Some', cls: 'bg-green-100 text-green-700' };
  if (value < 40) return { text: 'Moderate', cls: 'bg-emerald-100 text-emerald-700' };
  if (value < 60) return { text: 'High', cls: 'bg-sky-100 text-sky-700' };
  if (value < 100) return { text: 'Very High', cls: 'bg-blue-100 text-blue-800' };
  if (value < 120) return { text: 'Excellent', cls: 'bg-purple-100 text-purple-800' };
  if (value < 180) return { text: 'Exceptional', cls: 'bg-purple-200 text-purple-900' };
  return { text: 'Superior', cls: 'bg-purple-200 text-purple-900' };
}

const itemsWithBadges = computed(() =>
  props.items.map((it: any) => ({ ...it, badge: rdaBadge(it.value, it.rda) })),
);

function badgeTitle(item: { value: number; rda: number; label: string; unit: string }): string {
  const raw = Math.round(rawPct(item.value, item.rda));
  const norm = Math.round(normalizedDensity(item.value, item.rda));
  return `${raw}% of ${item.label} RDA in this recipe. At a 2200-kcal day this density ≈ ${norm}% RDA.`;
}

const tierRows = [
  { ...BADGE_TIERS.very_high, range: '≥ 130%', note: 'Above a full day in a single meal' },
  { ...BADGE_TIERS.complete, range: '≥ 90%', note: 'Enough to cover the day' },
  { ...BADGE_TIERS.solid, range: '≥ 50%', note: 'A meaningful chunk of the day' },
  { ...BADGE_TIERS.some, range: '≥ 25%', note: 'A modest contribution' },
  { ...BADGE_TIERS.low, range: '< 25%', note: 'Sparse for this nutrient' },
];
</script>
