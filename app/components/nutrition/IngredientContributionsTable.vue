<template>
  <div class="overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[10px] uppercase font-mono text-gray-400 tracking-wider border-b border-gray-100">
            <th class="text-left font-normal py-3 pl-4 pr-3 sticky left-0 z-10 bg-white md:bg-primary-5 shadow-[1px_0_0_0_rgb(243_244_246)]">Ingredient</th>
            <th v-for="col in columns" :key="col.key"
              class="font-normal py-3 px-2 whitespace-nowrap cursor-pointer select-none hover:text-gray-600 transition-colors"
              :class="col.align === 'right' ? 'text-right' : 'text-left'"
              @click="toggleSort(col.key)">
              <span class="inline-flex items-center gap-1">
                {{ col.label }}
                <IconChevronUp v-if="sortKey === col.key && sortDir === 'asc'" class="w-3" />
                <IconChevronDown v-else-if="sortKey === col.key" class="w-3" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sortedRows" :key="row.id"
            class="group border-b border-gray-50 last:border-0 hover:bg-primary-5/60 transition-colors">
            <td class="py-2.5 pl-4 pr-3 sticky left-0 z-10 bg-white md:bg-primary-5 group-hover:bg-primary-5 transition-colors shadow-[1px_0_0_0_rgb(249_250_251)]">
              <div class="flex items-center gap-2.5 min-w-0">
                <img v-if="row.visualCategory" :src="`/foods/${row.visualCategory}.webp`"
                  class="w-7 h-7 object-contain shrink-0" :alt="row.name" />
                <div v-else class="w-7 h-7 shrink-0" />
                <span class="truncate font-medium">{{ row.name }}</span>
              </div>
            </td>
            <td class="py-2.5 px-2 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">{{ fmtGrams(row.grams) }}</td>
            <td class="py-2.5 px-2 text-right font-mono tabular-nums whitespace-nowrap">
              <div>{{ Math.round(row.kcal) }}</div>
              <div class="text-[10px] text-gray-400 leading-none">{{ pct(row.kcal, totals.kcal) }}</div>
            </td>
            <td class="py-2.5 px-2 text-right font-mono tabular-nums whitespace-nowrap">
              <div>{{ fmtMacro(row.protein) }}</div>
              <div class="text-[10px] text-gray-400 leading-none">{{ pct(row.protein, totals.protein) }}</div>
            </td>
            <td class="py-2.5 px-2 text-right font-mono tabular-nums whitespace-nowrap">
              <div>{{ fmtMacro(row.carbohydrates) }}</div>
              <div class="text-[10px] text-gray-400 leading-none">{{ pct(row.carbohydrates, totals.carbohydrates) }}</div>
            </td>
            <td class="py-2.5 px-2 text-right font-mono tabular-nums whitespace-nowrap">
              <div>{{ fmtMacro(row.fat) }}</div>
              <div class="text-[10px] text-gray-400 leading-none">{{ pct(row.fat, totals.fat) }}</div>
            </td>
            <td class="py-2.5 px-2 text-right font-mono tabular-nums whitespace-nowrap pr-4">
              <div>{{ fmtMacro(row.fiber) }}</div>
              <div class="text-[10px] text-gray-400 leading-none">{{ pct(row.fiber, totals.fiber) }}</div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t border-gray-100 text-sm">
            <td class="py-3 pl-4 pr-3 font-mono text-[10px] uppercase text-gray-400 tracking-wider sticky left-0 z-10 bg-white shadow-[1px_0_0_0_rgb(243_244_246)]">Total · per serving</td>
            <td class="py-3 px-2 text-right font-mono text-slate-600 tabular-nums">{{ fmtGrams(totals.grams) }}</td>
            <td class="py-3 px-2 text-right font-mono font-semibold tabular-nums">{{ Math.round(totals.kcal) }}</td>
            <td class="py-3 px-2 text-right font-mono font-semibold tabular-nums">{{ fmtMacro(totals.protein) }}</td>
            <td class="py-3 px-2 text-right font-mono font-semibold tabular-nums">{{ fmtMacro(totals.carbohydrates) }}</td>
            <td class="py-3 px-2 text-right font-mono font-semibold tabular-nums">{{ fmtMacro(totals.fat) }}</td>
            <td class="py-3 px-2 pr-4 text-right font-mono font-semibold tabular-nums">{{ fmtMacro(totals.fiber) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="text-[11px] text-gray-400 px-4 py-2 border-t border-gray-50 leading-snug">
      Contributions calculated client-side from USDA-style per-100g values and resolved weights. Numbers are per serving.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FullIngredient } from '~/types/types';
import convertToGrams from '~/utils/format/convertToGrams';

const props = defineProps<{
  ingredients: FullIngredient[];
  serves: number;
}>();

type Row = {
  id: string | number;
  name: string;
  visualCategory?: string | null;
  grams: number;
  kcal: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
};

type SortKey = 'name' | 'grams' | 'kcal' | 'protein' | 'carbohydrates' | 'fat' | 'fiber';

const columns: { key: SortKey; label: string; align?: 'left' | 'right' }[] = [
  { key: 'grams', label: 'Weight', align: 'right' },
  { key: 'kcal', label: 'kcal', align: 'right' },
  { key: 'protein', label: 'Protein', align: 'right' },
  { key: 'carbohydrates', label: 'Carbs', align: 'right' },
  { key: 'fat', label: 'Fat', align: 'right' },
  { key: 'fiber', label: 'Fiber', align: 'right' },
];

const sortKey = ref<SortKey>('kcal');
const sortDir = ref<'asc' | 'desc'>('desc');

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = key === 'name' ? 'asc' : 'desc';
  }
}

const rows = computed<Row[]>(() => {
  const serves = Math.max(1, props.serves || 1);
  return props.ingredients.map((ing, idx) => {
    const density = (ing as any).density ?? 1;
    const unitWeight = (ing as any).unit_weight ?? 0;
    const grams = convertToGrams(ing.amount ?? 0, ing.unit ?? 'G', density, unitWeight) / serves;
    const scale = grams / 100;
    return {
      id: (ing as any).id ?? idx,
      name: ing.name ?? 'Ingredient',
      visualCategory: (ing as any).visual_category ?? null,
      grams,
      kcal: ((ing as any).kcal ?? 0) * scale,
      protein: ((ing as any).protein ?? 0) * scale,
      carbohydrates: ((ing as any).carbohydrates ?? 0) * scale,
      fat: ((ing as any).fat ?? 0) * scale,
      fiber: ((ing as any).fiber ?? 0) * scale,
    };
  });
});

const totals = computed(() => {
  const t = { grams: 0, kcal: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
  for (const r of rows.value) {
    t.grams += r.grams;
    t.kcal += r.kcal;
    t.protein += r.protein;
    t.carbohydrates += r.carbohydrates;
    t.fat += r.fat;
    t.fiber += r.fiber;
  }
  return t;
});

const sortedRows = computed(() => {
  const arr = [...rows.value];
  const dir = sortDir.value === 'asc' ? 1 : -1;
  arr.sort((a, b) => {
    const av = a[sortKey.value];
    const bv = b[sortKey.value];
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
    return ((av as number) - (bv as number)) * dir;
  });
  return arr;
});

function fmtGrams(g: number) {
  if (!g) return '0 g';
  if (g >= 100) return `${Math.round(g)} g`;
  return `${g.toFixed(1)} g`;
}
function fmtMacro(v: number) {
  if (v < 0.1) return '0 g';
  if (v < 10) return `${v.toFixed(1)} g`;
  return `${Math.round(v)} g`;
}
function pct(part: number, total: number) {
  if (!total || total <= 0) return '';
  const p = Math.round((part / total) * 100);
  if (p === 0) return '';
  return `${p}%`;
}
</script>
