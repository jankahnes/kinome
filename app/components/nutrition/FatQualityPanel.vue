<template>
  <BlocksResponsiveInfo v-model="open" sidePanelClass="w-108">
    <div class="p-4 md:p-2 flex flex-col gap-5">
      <div>
        <div class="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Nutrition Quality</div>
        <h2 class="text-3xl font-headers tracking-tight">Fat Profile</h2>
      </div>
      <div v-if="fatProfile" class="flex flex-col items-center gap-4">
        <div class="w-44 h-44">
          <Ring :segments="fatDonutSegments.map(s => ({ value: s.value, color: s.color }))" :stroke-width="13">
            <div class="text-center leading-tight">
              <div class="text-2xl font-semibold">{{ fatProfile.totalFatPer100g?.toFixed(0) }}g</div>
              <div class="text-xs text-gray-400">per 100g</div>
            </div>
          </Ring>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm w-full">
          <div v-for="seg in fatDonutSegments.filter(s => s.pct > 0)" :key="seg.label" class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full shrink-0" :class="seg.bgClass" />
            <span class="text-gray-600 flex-1">{{ seg.label }}</span>
            <span class="">{{ seg.pct }}%</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="item in fatProfileReadable" :key="item.description" class="flex items-start gap-3 p-3 rounded-xl"
          :class="[item.bgColor, { 'italic': item.trace }]">
          <div>
            <div class="font-semibold text-sm" :class="item.color">{{ item.description }}</div>
            <div v-if="item.subtitle" class="text-xs text-slate-500 mt-0.5">{{ item.subtitle }}</div>
          </div>
        </div>
        <p v-if="!fatProfileReadable.length" class="text-sm text-slate-400">Log some food with fat content to see
          fat
          profile data.</p>
      </div>
    </div>
  </BlocksResponsiveInfo>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false });

const props = defineProps<{
  fatProfile: {
    totalFatPer100g?: number;
    satFatPercent?: number;
    o3Percent?: number;
    o6Percent?: number;
    mufaPercent?: number;
  } | null | undefined;
  fatProfileReadable: { description: string; subtitle?: string | null; color: string; bgColor: string; trace?: boolean; lowAbs?: boolean }[];
}>();

const fatDonutSegments = computed(() => {
  const fp = props.fatProfile;
  if (!fp) return [] as { value: number; color: string; bgClass: string; label: string; pct: number }[];
  const sat = fp.satFatPercent ?? 0;
  const o3 = fp.o3Percent ?? 0;
  const o6 = fp.o6Percent ?? 0;
  const mufa = fp.mufaPercent ?? 0;
  const other = Math.max(0, 100 - sat - o3 - o6 - mufa);
  return [
    { value: sat / 100, color: 'stroke-orange-400', bgClass: 'bg-orange-400', label: 'Saturated', pct: Math.round(sat) },
    { value: o3 / 100, color: 'stroke-emerald-500', bgClass: 'bg-emerald-500', label: 'Omega-3', pct: Math.round(o3) },
    { value: mufa / 100, color: 'stroke-blue-400', bgClass: 'bg-blue-400', label: 'MUFA', pct: Math.round(mufa) },
    { value: o6 / 100, color: 'stroke-yellow-400', bgClass: 'bg-yellow-400', label: 'Omega-6', pct: Math.round(o6) },
    { value: other / 100, color: 'stroke-secondary', bgClass: 'bg-primary/8', label: 'Other', pct: Math.round(other) },
  ];
});
</script>
