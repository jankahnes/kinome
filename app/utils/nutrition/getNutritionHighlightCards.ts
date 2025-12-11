const nutritionHighlightsCategories: {
  name: string;
  score: Extract<keyof Recipe, keyof FullFoodRow>;
  underlying?: {
    col: Extract<keyof Recipe, keyof FullFoodRow>;
    threshold: number;
  };
  illustration: string;
  relevance: number;
  thresholds: { value: number; description: string }[];
}[] = [
  {
    name: 'Protein',
    score: 'protein_score',
    underlying: {
      col: 'protein',
      threshold: 5,
    },
    illustration: 'protein.webp',
    relevance: 10,
    thresholds: [
      {
        value: 50,
        description: 'High',
      },
      {
        value: 70,
        description: 'Very High',
      },
      {
        value: 85,
        description: 'Excellent',
      },
    ],
  },
  {
    name: 'Fat Quality',
    score: 'fat_profile_score',
    underlying: {
      col: 'fat',
      threshold: 5,
    },
    illustration: 'fat.webp',
    relevance: 7,
    thresholds: [
      {
        value: 55,
        description: 'Good',
      },
      {
        value: 70,
        description: 'Very Good',
      },
      {
        value: 85,
        description: 'Excellent',
      },
    ],
  },
  {
    name: 'Fiber',
    score: 'fiber_score',
    underlying: {
      col: 'fiber',
      threshold: 5,
    },
    illustration: 'fiber.webp',
    relevance: 6,
    thresholds: [
      {
        value: 50,
        description: 'High',
      },
      {
        value: 70,
        description: 'Very High',
      },
      {
        value: 85,
        description: 'Excellent',
      },
    ],
  },
  {
    name: 'Sodium',
    score: 'salt_score',
    illustration: 'salt.webp',
    relevance: 4,
    thresholds: [
      {
        value: 70,
        description: 'Low',
      },
      {
        value: 85,
        description: 'Very Low',
      },
    ],
  },
  {
    name: 'Sugar',
    score: 'sugar_score',
    illustration: 'sugar.webp',
    relevance: 4,
    thresholds: [
      {
        value: 70,
        description: 'Low',
      },
      {
        value: 85,
        description: 'Very Low',
      },
    ],
  },
  {
    name: 'Satiety',
    score: 'sidx',
    illustration: 'satiety.webp',
    relevance: 5,
    thresholds: [
      {
        value: 60,
        description: 'High',
      },
      {
        value: 75,
        description: 'Very High',
      },
    ],
  },
  {
    name: 'Protective Compounds',
    score: 'protective_score',
    illustration: 'protective.webp',
    relevance: 4,
    thresholds: [
      {
        value: 60,
        description: 'High',
      },
      {
        value: 80,
        description: 'Very High',
      },
    ],
  },
  {
    name: 'Micronutrients',
    score: 'mnidx',
    illustration: 'micronutrients.webp',
    relevance: 8,
    thresholds: [
      {
        value: 55,
        description: 'High',
      },
      {
        value: 75,
        description: 'Very High',
      },
      {
        value: 85,
        description: 'Excellent',
      },
    ],
  },
];

const genericBackgrounds = {
  good: 'bg-green-100',
  great: 'bg-emerald-100',
  excellent: 'bg-blue-100',
};

const getRatingBackground = (rating: string) => {
  const lowerRating = rating.toLowerCase();
  if (lowerRating.includes('excellent')) return genericBackgrounds.excellent;
  if (lowerRating.includes('very')) return genericBackgrounds.great;
  return genericBackgrounds.good;
};

export default function getNutritionHighlightCards(
  computable: Recipe | FullFoodRow | null | undefined
) {
  if (!computable) return [];
  const highlights = [];
  for (const category of nutritionHighlightsCategories) {
    const score = computable?.[category.score] ?? 0;

    if (category.underlying) {
      const underlying = computable?.[category.underlying.col] ?? 0;
      if (underlying < category.underlying.threshold) {
        continue;
      }
    }

    const sortedThresholds = [...category.thresholds].sort(
      (a, b) => b.value - a.value
    );
    const metThreshold = sortedThresholds.find((t) => score >= t.value);
    if (!metThreshold) continue;

    let subtitle = '';
    if (category.name === 'Protein') {
      const value = (computable?.protein ?? 0).toFixed(0);
      subtitle = `${value}g per serving`;
    } else if (category.name === 'Fiber') {
      const value = (computable?.fiber ?? 0).toFixed(0);
      subtitle = `${value}g per serving`;
    } else if (category.name === 'Sodium') {
      const value = ((computable?.salt ?? 0) * 1000).toFixed(0);
      subtitle = `${value}mg per serving`;
    } else if (category.name === 'Sugar') {
      const value = (computable?.sugar ?? 0).toFixed(0);
      subtitle = `${value}g per serving`;
    } else if (category.name === 'Micronutrients') {
      const details = computable?.report?.details?.micronutrients ?? [];
      const top3 = [...details]
        .sort((a, b) => (b.rdaPerServing ?? 0) - (a.rdaPerServing ?? 0))
        .slice(0, 2)
        .map((d) => d.displayName)
        .join(', ');
      subtitle = top3 || '';
    } else if (category.name === 'Fat Quality') {
      const fatProfileKeys = {
        o3Score: 'High in Omega-3s',
        o6Score: 'Good Omega-6 Balance',
        mufaScore: 'High in Healthy Fats',
        satFatScore: 'Low in Saturated Fat',
      };
      let best = { key: 'mufaScore', value: 0 };
      for (const key of Object.keys(fatProfileKeys)) {
        const value = computable?.report?.details?.fatProfile?.[key] ?? 0;
        if (value > best.value) {
          best.key = key;
          best.value = value;
        }
      }
      if (best.key) {
        subtitle = fatProfileKeys[best.key as keyof typeof fatProfileKeys];
      }
    } else if (category.name === 'Protective Compounds') {
      const protective = computable?.report?.details?.protectiveCompounds;
      const protectiveKeys = {
        polyphenols: 'Rich in Polyphenols',
        carotenoids: 'Rich in Carotenoids',
        glucosinolates: 'Rich in Glucosinolates',
      };
      let best = { key: 'polyphenols', value: 0 };
      for (const key of Object.keys(protectiveKeys)) {
        const value = protective?.[key] ?? 0;
        if (value > best.value) {
          best.key = key;
          best.value = value;
        }
      }
      if (best.key) {
        subtitle = protectiveKeys[best.key as keyof typeof protectiveKeys];
      }
    } else if (category.name === 'Satiety') {
      const satietyKeywords = {
        Fullness: 'High Fullness Factor',
        Water: 'High Water Content',
        Calories: 'Low Calories',
        'Glycemic Index': 'Low Glycemic Index',
      };
      const bestSatietyDescription =
        computable?.report?.humanReadable?.satiety[0].description;
      if (bestSatietyDescription) {
        const bestSatietyKey = Object.keys(satietyKeywords).find((key) =>
          bestSatietyDescription.includes(key)
        );
        if (bestSatietyKey) {
          subtitle =
            satietyKeywords[bestSatietyKey as keyof typeof satietyKeywords];
        }
      }
    }

    highlights.push({
      title: category.name,
      subtitle,
      illustration: category.illustration,
      relevance: category.relevance,
      rating: metThreshold.description,
      background: getRatingBackground(metThreshold.description),
      score,
    });
  }

  // Sort by relevance (higher first)
  return highlights.sort((a, b) => b.relevance - a.relevance);
}
