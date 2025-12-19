type Threshold = {
  minScore: number;
  rating: string;
  pillClass: string;
};

export type DailyQualityCard = {
  title: string;
  img: string;
  rating: string;
  pillClass: string;
  subtitle: string;
  clickable: boolean;
};

const NULL_PILL = 'bg-secondary';

function resolve(
  score: number | null | undefined,
  thresholds: Threshold[],
): { rating: string; pillClass: string } {
  if (score == null) return { rating: '–', pillClass: NULL_PILL };
  const first = thresholds[0];
  if (!first) return { rating: '–', pillClass: NULL_PILL };
  let result = first;
  for (const t of thresholds) {
    if (score >= t.minScore) result = t;
  }
  return result;
}

// Shared tier sets reused across metrics
const genericTiers: Threshold[] = [
  { minScore: -Infinity, rating: 'Low', pillClass: 'bg-red-100 text-red-700' },
  {
    minScore: 30,
    rating: 'Moderate',
    pillClass: 'bg-orange-100 text-orange-700',
  },
  { minScore: 55, rating: 'Good', pillClass: 'bg-green-100 text-green-700' },
  {
    minScore: 75,
    rating: 'Very Good',
    pillClass: 'bg-emerald-100 text-emerald-700',
  },
  { minScore: 88, rating: 'Excellent', pillClass: 'bg-blue-100 text-blue-700' },
];

const qualityTiers: Threshold[] = [
  {
    minScore: -Infinity,
    rating: 'Imbalanced',
    pillClass: 'bg-red-100 text-red-700',
  },
  { minScore: 30, rating: 'Fair', pillClass: 'bg-orange-100 text-orange-700' },
  { minScore: 55, rating: 'Good', pillClass: 'bg-green-100 text-green-700' },
  {
    minScore: 75,
    rating: 'Very Good',
    pillClass: 'bg-emerald-100 text-emerald-700',
  },
  { minScore: 88, rating: 'Excellent', pillClass: 'bg-blue-100 text-blue-700' },
];

const gutHealthTiers: Threshold[] = [
  {
    minScore: -Infinity,
    rating: 'Insufficient',
    pillClass: 'bg-red-100 text-red-700',
  },
  { minScore: 30, rating: 'Fair', pillClass: 'bg-orange-100 text-orange-700' },
  { minScore: 55, rating: 'Good', pillClass: 'bg-green-100 text-green-700' },
  {
    minScore: 75,
    rating: 'Very Good',
    pillClass: 'bg-emerald-100 text-emerald-700',
  },
  { minScore: 88, rating: 'Excellent', pillClass: 'bg-blue-100 text-blue-700' },
];

const wholeFoodTiers: Threshold[] = [
  {
    minScore: -Infinity,
    rating: 'Mostly Processed Foods',
    pillClass: 'bg-red-100 text-red-700',
  },
  { minScore: 20, rating: 'Mixed', pillClass: 'bg-orange-100 text-orange-700' },
  {
    minScore: 60,
    rating: 'Mostly Whole',
    pillClass: 'bg-green-100 text-green-700',
  },
  {
    minScore: 75,
    rating: 'Majority Whole',
    pillClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    minScore: 92,
    rating: 'Clean Diet',
    pillClass: 'bg-blue-100 text-blue-700',
  },
];

const electrolyteTiers: Threshold[] = [
  {
    minScore: -Infinity,
    rating: 'High Na Load',
    pillClass: 'bg-red-100 text-red-700',
  },
  {
    minScore: 30,
    rating: 'Imbalanced',
    pillClass: 'bg-orange-100 text-orange-700',
  },
  { minScore: 55, rating: 'Fair', pillClass: 'bg-yellow-100 text-yellow-700' },
  {
    minScore: 75,
    rating: 'Balanced',
    pillClass: 'bg-green-100 text-green-700',
  },
  { minScore: 90, rating: 'Optimal', pillClass: 'bg-blue-100 text-blue-700' },
];

const satietyTiers: Threshold[] = [
  {
    minScore: -Infinity,
    rating: 'Very Low',
    pillClass: 'bg-red-100 text-red-700',
  },
  { minScore: 30, rating: 'Low', pillClass: 'bg-orange-100 text-orange-700' },
  { minScore: 55, rating: 'Fair', pillClass: 'bg-green-100 text-green-700' },
  {
    minScore: 75,
    rating: 'High',
    pillClass: 'bg-emerald-100 text-emerald-700',
  },
  { minScore: 88, rating: 'Very High', pillClass: 'bg-blue-100 text-blue-700' },
];

function pillIsNegative(pillClass: string): boolean {
  return pillClass.includes('red-'); // || pillClass.includes('orange-');
}

function micronutrientSubtitle(
  microDetails: { displayName: string; rdaPerServing: number }[],
  negative: boolean,
): string {
  if (!microDetails.length) return '';
  if (negative) {
    const sorted = [...microDetails].sort(
      (a, b) => (a.rdaPerServing ?? 0) - (b.rdaPerServing ?? 0),
    );
    return `Low in ${sorted[0]!.displayName}`;
  }
  return [...microDetails]
    .sort((a, b) => (b.rdaPerServing ?? 0) - (a.rdaPerServing ?? 0))
    .slice(0, 2)
    .map((d) => d.displayName)
    .join(', ');
}

const fatProfileGood: Record<string, string> = {
  o3Score: 'Rich in Omega-3s',
  mufaScore: 'Rich in Healthy Fats',
  satFatScore: 'Low in Saturated Fat',
};

const fatProfileBad: Record<string, string> = {
  o3Score: 'Low in Omega-3s',
  mufaScore: 'Low Healthy Fats',
  satFatScore: 'High in Saturated Fat',
};

function fatQualitySubtitle(
  fatProfile: Record<string, number> | undefined,
  negative: boolean,
): string {
  if (!fatProfile) return '';
  const keys = Object.keys(fatProfileGood);
  if (negative) {
    let worst = { key: '', value: Infinity };
    for (const key of keys) {
      const v = fatProfile[key] ?? 0;
      if (v < worst.value) worst = { key, value: v };
    }
    return fatProfileBad[worst.key] ?? '';
  }
  let best = { key: '', value: -Infinity };
  for (const key of keys) {
    const v = fatProfile[key] ?? 0;
    if (v > best.value) best = { key, value: v };
  }
  return fatProfileGood[best.key] ?? '';
}

type GutSubKey =
  | 'fiberSubScore'
  | 'polyphenolSubScore'
  | 'sugarSubScore'
  | 'sfatSubScore'
  | 'processingSubScore'
  | 'sodiumSubScore';

const gutSubLabels: Record<GutSubKey, { positive: string; negative: string }> =
  {
    fiberSubScore: { positive: 'Good Fiber', negative: 'Low Fiber' },
    polyphenolSubScore: {
      positive: 'Rich in Polyphenols',
      negative: 'Low Polyphenols',
    },
    sugarSubScore: { positive: 'Low Sugar', negative: 'High Sugar' },
    sfatSubScore: {
      positive: 'Low Saturated Fat',
      negative: 'High Saturated Fat',
    },
    processingSubScore: {
      positive: 'Whole Foods',
      negative: 'Processed Foods',
    },
    sodiumSubScore: { positive: 'Low Sodium', negative: 'High Sodium' },
  };

const gutSubScoreKeys: GutSubKey[] = [
  'fiberSubScore',
  'polyphenolSubScore',
  'sugarSubScore',
  'sfatSubScore',
  'processingSubScore',
  'sodiumSubScore',
];

function gutHealthSubtitle(
  gh: Record<string, number> | undefined,
  negative: boolean,
): string {
  if (!gh) return '';
  const sfat = gh.sfatSubScore ?? gh.sFatSubScore ?? NaN;
  const entries: { v: number; positive: string; negative: string }[] = [];
  for (const key of gutSubScoreKeys) {
    const raw = key === 'sfatSubScore' ? sfat : gh[key];
    const v = Number(raw);
    if (Number.isNaN(v)) continue;
    const labels = gutSubLabels[key];
    if (!labels) continue;
    entries.push({ v, positive: labels.positive, negative: labels.negative });
  }
  if (!entries.length) return '';
  if (negative) {
    const min = entries.reduce((a, b) => (a.v <= b.v ? a : b));
    return min.negative;
  }
  if ((gh.diversityBonus ?? 0) >= 10) return 'High Plant Diversity';
  const max = entries.reduce((a, b) => (a.v >= b.v ? a : b));
  return max.positive;
}

function satietySubtitle(
  humanReadable: { satiety: { description: string }[] } | undefined,
  negative: boolean,
): string {
  if (!humanReadable) return '';
  const satietyKeywords = {
    Fullness: {
      positive: 'High Fullness Factor',
      negative: 'Low Fullness Factor',
    },
    Water: { positive: 'High Water Content', negative: 'Low Water Content' },
    Calories: {
      positive: 'Low Calorie Density',
      negative: 'High Calorie Density',
    },
    'Glycemic Index': {
      positive: 'Low Glycemic Index',
      negative: 'High Glycemic Index',
    },
  };
  if (negative) {
    const worstSatietyDescription =
      humanReadable.satiety[humanReadable.satiety.length - 1]?.description;
    if (worstSatietyDescription) {
      const worstSatietyKey = Object.keys(satietyKeywords).find((key) =>
        worstSatietyDescription.includes(key),
      );
      if (worstSatietyKey) {
        return satietyKeywords[worstSatietyKey as keyof typeof satietyKeywords]
          .negative;
      }
    }
  }
  const bestSatietyDescription = humanReadable.satiety[0]?.description;
  if (bestSatietyDescription) {
    const bestSatietyKey = Object.keys(satietyKeywords).find((key) =>
      bestSatietyDescription.includes(key),
    );
    if (bestSatietyKey) {
      return satietyKeywords[bestSatietyKey as keyof typeof satietyKeywords]
        .positive;
    }
  }
  return '';
}

export function getDailyQualityCards(report: any): DailyQualityCard[] {
  const overall = report?.overall;
  const details = report?.details;

  // --- Micronutrients ---
  const mnResolved = resolve(overall?.mnidx, genericTiers);
  const microSubtitle = micronutrientSubtitle(
    details?.micronutrients ?? [],
    pillIsNegative(mnResolved.pillClass),
  );

  // --- Fat Quality ---
  const fatResolved = resolve(overall?.fat_profile_score, qualityTiers);
  const fatSubtitle = fatQualitySubtitle(
    details?.fatProfile,
    pillIsNegative(fatResolved.pillClass),
  );

  // --- Gut Health ---
  const gutResolved = resolve(overall?.gutHealth, gutHealthTiers);
  const gutSubtitle = gutHealthSubtitle(
    details?.gutHealth,
    pillIsNegative(gutResolved.pillClass),
  );

  // --- Whole Food % ---
  const pctWhole: number | null = details?.processingLevel?.pctWhole ?? null;
  const wholeResolved = resolve(pctWhole, wholeFoodTiers);
  const wholeFoodSubtitle =
    pctWhole != null
      ? pillIsNegative(wholeResolved.pillClass)
        ? `Only ${Math.round(pctWhole)}% whole`
        : `${Math.round(pctWhole)}% whole`
      : '';

  // --- Electrolytes ---
  const naKRatio: number | null = details?.salt?.naKRatio ?? null;
  const electrolyteScore =
    naKRatio != null
      ? Math.round(
          Math.min(100, Math.max(0, 100 - (100 / 3) * (naKRatio - 0.5))),
        )
      : null;
  const electrolyteResolved = resolve(electrolyteScore, electrolyteTiers);
  const electrolyteSubtitle =
    naKRatio != null
      ? pillIsNegative(electrolyteResolved.pillClass)
        ? `Na:K ${naKRatio.toFixed(1)} · skewed toward sodium`
        : `Na:K ratio ${naKRatio.toFixed(1)}`
      : '';

  // --- Satiety ---
  const satiety: number | null = overall?.satiety ?? null;
  const satietyResolved = resolve(satiety, satietyTiers);
  const satietySub = satietySubtitle(
    report?.humanReadable,
    pillIsNegative(satietyResolved.pillClass),
  );

  return [
    {
      title: 'Micronutrients',
      img: 'micronutrients.webp',
      ...mnResolved,
      subtitle: microSubtitle,
      clickable: true,
    },
    {
      title: 'Fat Quality',
      img: 'fat.webp',
      ...fatResolved,
      subtitle: fatSubtitle,
      clickable: true,
    },
    {
      title: 'Gut Health',
      img: 'gut-health.webp',
      ...gutResolved,
      subtitle: gutSubtitle,
      clickable: true,
    },
    {
      title: 'Whole Food %',
      img: 'whole.webp',
      ...wholeResolved,
      subtitle: wholeFoodSubtitle,
      clickable: false,
    },
    {
      title: 'Electrolytes',
      img: 'balance.webp',
      ...electrolyteResolved,
      subtitle: electrolyteSubtitle,
      clickable: false,
    },
    {
      title: 'Satiety',
      img: 'satiety.webp',
      ...satietyResolved,
      subtitle: satietySub,
      clickable: false,
    },
  ];
}
