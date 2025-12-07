<script setup lang="ts">
import * as LucideIcons from 'lucide-vue-next';

const props = defineProps<{
  name: string;
  size?: number;
  class?: string;
}>();

const iconMap: Record<string, any> = {
  'chevrons-up': LucideIcons.ChevronsUp,
  'chevron-up': LucideIcons.ChevronUp,
  'chevron-down': LucideIcons.ChevronDown,
  'chevrons-down': LucideIcons.ChevronsDown,
  check: LucideIcons.Check,
  minus: LucideIcons.Minus,
  'alert-triangle': LucideIcons.AlertTriangle,
  star: LucideIcons.Star,
  pencil: LucideIcons.Pencil,
  download: LucideIcons.Download,
  eye: LucideIcons.Eye,
  x: LucideIcons.X,
  database: LucideIcons.Database,
  'scan-barcode': LucideIcons.ScanBarcode,
  heart: LucideIcons.Heart,
  'utensils-crossed': LucideIcons.UtensilsCrossed,
  'loader-circle': LucideIcons.LoaderCircle,
  'chart-no-axes-column': LucideIcons.ChartNoAxesColumn,
  users: LucideIcons.Users,
  'chef-hat': LucideIcons.ChefHat,
  compass: LucideIcons.Compass,
  add: LucideIcons.Plus,
  'chart-line': LucideIcons.ChartLine,
  'users-round': LucideIcons.UsersRound,
  // Backwards compatibility for Material Icons (genericDescriptors.ts)
  warning: LucideIcons.AlertTriangle,
  stat_minus_3: LucideIcons.ChevronsDown,
  stat_minus_2: LucideIcons.ChevronDown,
  stat_minus_1: LucideIcons.ChevronDown,
  remove: LucideIcons.Minus,
  stat_1: LucideIcons.ChevronUp,
  stat_2: LucideIcons.ChevronUp,
  stat_3: LucideIcons.ChevronsUp,
  star_rate: LucideIcons.Star,
  weight: LucideIcons.Weight,
  banknote: LucideIcons.Banknote,
  factory: LucideIcons.Factory,
};

const icon = computed(() => iconMap[props.name]);

const iconSize = computed(() => {
  const size = props.size || 20;
  if (props.name === 'star_rate') return size - 4;
  return size;
});
</script>

<template>
  <component
    :is="icon"
    :size="iconSize"
    :class="class"
    :style="{ minWidth: size + 'px' }"
  />
</template>
