import {
  getHighestThreshold,
  TRACE,
  LOW_ABS,
} from '~/utils/format/genericDescriptors';
import capitalize from '~/utils/format/capitalize';

const thresholds = {
  0: {
    description: 'No',
    color: 'text-gray-700',
    icon: 'remove',
  },
  5: { description: 'Trace', color: 'text-gray-800', icon: 'remove' },
  20: { description: 'Some', color: 'text-green-700', icon: 'stat_1' },
  30: { description: 'Moderate', color: 'text-green-800', icon: 'stat_1' },
  40: { description: 'Decent', color: 'text-emerald-700', icon: 'stat_2' },
  50: { description: 'High in', color: 'text-emerald-800', icon: 'stat_2' },
  60: { description: 'Very high in', color: 'text-blue-800', icon: 'stat_3' },
  100: {
    description: 'Excellent source of',
    color: 'text-blue-900',
    icon: 'stat_3',
  },
  120: {
    description: 'Exceptional source of',
    color: 'text-purple-800',
    icon: 'star_rate',
  },
  180: {
    description: 'Superior source of',
    color: 'text-purple-900',
    icon: 'star_rate',
  },
};

const compounds = {
  polyphenolsPer2000kcal: 'polyphenols',
  carotenoidsPer2000kcal: 'carotenoids',
  glucosinolatesPer2000kcal: 'glucosinolates',
};

// Per-100g raw (0–10 internal scale) gates so the per-2000kcal extrapolation
// can't claim "Rich" / "Excellent" on dilute foods like cola or cucumber.
const TRACE_RAW_PER100G = 1;
const LOW_ABS_RAW_PER100G = 3;

export default function protectiveCompoundsToReadable(report: any) {
  const items = [];
  for (const [densityKey, rawKey] of Object.entries(compounds)) {
    const value = report.protectiveCompounds[densityKey];
    const rawPer100g = report.protectiveCompounds[rawKey] ?? 0;
    const label = capitalize(densityKey.replace('Per2000kcal', ''));

    const contributors =
      report?.contributors?.[rawKey]?.filter(
        (contributor: any) =>
          contributor.totalContribution > 3 && contributor.value > 0.33,
      ) || [];

    const highestThreshold = getHighestThreshold(value, thresholds);
    const description = highestThreshold.description + ' ' + label;
    const subtitle =
      contributors.length > 0
        ? 'From ' +
          contributors.map((contributor: any) => contributor.name).join(', ')
        : null;

    items.push({
      description,
      color: highestThreshold.color,
      icon: highestThreshold.icon,
      value,
      subtitle,
      ...(rawPer100g < LOW_ABS_RAW_PER100G ? { lowAbs: true, ...LOW_ABS } : {}),
    });
  }
  // Trace items sort to bottom via their negative `value`.
  items.sort((a, b) => b.value - a.value);
  return items;
}
