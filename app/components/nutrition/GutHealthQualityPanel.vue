<template>
  <BlocksResponsiveInfo v-model="open" sidePanelClass="w-100">
  <div class="p-5 flex flex-col gap-5">
    <div>
      <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Nutrition Quality</div>
      <h2 class="text-2xl font-bold">Gut Health</h2>
    </div>
    <div v-if="gutHealth">
      <div class="mb-1 flex justify-between text-sm">
        <span class="font-semibold text-slate-600">Overall Score</span>
        <span class="font-bold">{{ gutHealth.overallScore }}/100</span>
      </div>
      <div class="h-2 rounded-full bg-secondary overflow-hidden mb-5">
        <div class="h-full rounded-full bg-emerald-400 transition-all duration-300"
          :style="{ width: Math.max(0, gutHealth.overallScore) + '%' }" />
      </div>

      <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Gut-friendly factors</div>
      <div class="flex flex-col gap-2 mb-5">
        <div class="flex justify-between items-center p-3 rounded-xl"
          :class="gutHealth.fiberSubScore > 50 ? 'bg-emerald-50' : gutHealth.fiberSubScore > 20 ? 'bg-secondary' : 'bg-orange-50'">
          <div>
            <div class="font-semibold text-sm"
              :class="gutHealth.fiberSubScore > 50 ? 'text-emerald-800' : gutHealth.fiberSubScore > 20 ? 'text-slate-600' : 'text-orange-800'">
              Fiber density</div>
            <div class="text-xs text-slate-500">{{ gutHealth.fiberPer2000kcal }}g per 2000 kcal</div>
          </div>
          <span class="text-xl font-bold"
            :class="gutHealth.fiberSubScore > 50 ? 'text-emerald-700' : gutHealth.fiberSubScore > 20 ? 'text-slate-500' : 'text-orange-700'">
            {{ gutHealth.fiberSubScore }}</span>
        </div>
        <div class="flex justify-between items-center p-3 rounded-xl"
          :class="gutHealth.polyphenolSubScore > 50 ? 'bg-emerald-50' : gutHealth.polyphenolSubScore > 20 ? 'bg-secondary' : 'bg-orange-50'">
          <div>
            <div class="font-semibold text-sm"
              :class="gutHealth.polyphenolSubScore > 50 ? 'text-emerald-800' : gutHealth.polyphenolSubScore > 20 ? 'text-slate-600' : 'text-orange-800'">
              Polyphenols</div>
            <div class="text-xs text-slate-500">Concentration {{ gutHealth.polyphenolRaw }}/10</div>
          </div>
          <span class="text-xl font-bold"
            :class="gutHealth.polyphenolSubScore > 50 ? 'text-emerald-700' : gutHealth.polyphenolSubScore > 20 ? 'text-slate-500' : 'text-orange-700'">
            {{ gutHealth.polyphenolSubScore }}</span>
        </div>
        <div v-if="gutHealth.uniquePlantCount > 0"
          class="flex justify-between items-center p-3 rounded-xl bg-emerald-50">
          <div>
            <div class="font-semibold text-sm text-emerald-800">Plant variety</div>
            <div class="text-xs text-slate-500">{{ gutHealth.uniquePlantCount }} unique plants · +{{
              gutHealth.diversityBonus }} bonus</div>
          </div>
          <span class="text-xl font-bold text-emerald-700">{{ gutHealth.uniquePlantCount }}</span>
        </div>
      </div>

      <div class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Impact factors</div>
      <div class="flex flex-col gap-2 mb-5">
        <div class="flex justify-between items-center p-3 rounded-xl"
          :class="gutHealth.processingSubScore > 50 ? 'bg-secondary' : gutHealth.processingSubScore > 15 ? 'bg-orange-50' : 'bg-red-50'">
          <div>
            <div class="font-semibold text-sm"
              :class="gutHealth.processingSubScore > 50 ? 'text-slate-600' : gutHealth.processingSubScore > 15 ? 'text-orange-800' : 'text-red-800'">
              Processing level</div>
            <div class="text-xs text-slate-500">NOVA {{ gutHealth.novaValue }}</div>
          </div>
          <span class="text-xl font-bold"
            :class="gutHealth.processingSubScore > 50 ? 'text-slate-500' : gutHealth.processingSubScore > 15 ? 'text-orange-700' : 'text-red-700'">
            {{ gutHealth.processingSubScore }}</span>
        </div>
        <div class="flex justify-between items-center p-3 rounded-xl"
          :class="gutHealth.sugarSubScore > 40 ? 'bg-secondary' : gutHealth.sugarSubScore > 15 ? 'bg-orange-50' : 'bg-red-50'">
          <div>
            <div class="font-semibold text-sm"
              :class="gutHealth.sugarSubScore > 40 ? 'text-slate-600' : gutHealth.sugarSubScore > 15 ? 'text-orange-800' : 'text-red-800'">
              Sugar</div>
            <div class="text-xs text-slate-500">{{ gutHealth.sugarPer100g }}g per 100g</div>
          </div>
          <span class="text-xl font-bold"
            :class="gutHealth.sugarSubScore > 40 ? 'text-slate-500' : gutHealth.sugarSubScore > 15 ? 'text-orange-700' : 'text-red-700'">
            {{ gutHealth.sugarSubScore }}</span>
        </div>
        <div class="flex justify-between items-center p-3 rounded-xl"
          :class="gutHealth.sfatSubScore > 30 ? 'bg-secondary' : gutHealth.sfatSubScore > 0 ? 'bg-orange-50' : 'bg-red-50'">
          <div>
            <div class="font-semibold text-sm"
              :class="gutHealth.sfatSubScore > 30 ? 'text-slate-600' : gutHealth.sfatSubScore > 0 ? 'text-orange-800' : 'text-red-800'">
              Saturated fat</div>
            <div class="text-xs text-slate-500">{{ gutHealth.sfatPer100g }}g per 100g</div>
          </div>
          <span class="text-xl font-bold"
            :class="gutHealth.sfatSubScore > 30 ? 'text-slate-500' : gutHealth.sfatSubScore > 0 ? 'text-orange-700' : 'text-red-700'">
            {{ gutHealth.sfatSubScore }}</span>
        </div>
        <div class="flex justify-between items-center p-3 rounded-xl"
          :class="gutHealth.sodiumSubScore > 30 ? 'bg-secondary' : gutHealth.sodiumSubScore > 0 ? 'bg-orange-50' : 'bg-red-50'">
          <div>
            <div class="font-semibold text-sm"
              :class="gutHealth.sodiumSubScore > 30 ? 'text-slate-600' : gutHealth.sodiumSubScore > 0 ? 'text-orange-800' : 'text-red-800'">
              Sodium</div>
            <div class="text-xs text-slate-500">{{ gutHealth.saltPer100g }}g salt per 100g</div>
          </div>
          <span class="text-xl font-bold"
            :class="gutHealth.sodiumSubScore > 30 ? 'text-slate-500' : gutHealth.sodiumSubScore > 0 ? 'text-orange-700' : 'text-red-700'">
            {{ gutHealth.sodiumSubScore }}</span>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-slate-400">Log some food to see gut health data.</p>
  </div>
  </BlocksResponsiveInfo>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false });

defineProps<{
  gutHealth: {
    overallScore: number;
    fiberSubScore: number;
    fiberPer2000kcal: number;
    polyphenolSubScore: number;
    polyphenolRaw: number;
    uniquePlantCount: number;
    diversityBonus: number;
    processingSubScore: number;
    novaValue: number;
    sugarSubScore: number;
    sugarPer100g: number;
    sfatSubScore: number;
    sfatPer100g: number;
    sodiumSubScore: number;
    saltPer100g: number;
  } | null | undefined;
}>();
</script>
