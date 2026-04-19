export type MacroInput = {
  kcal: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
};

type Tier = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

function tier(pct: number, thresholds: [number, number, number, number]): Tier {
  if (pct < thresholds[0]) return 'very_low';
  if (pct < thresholds[1]) return 'low';
  if (pct < thresholds[2]) return 'moderate';
  if (pct < thresholds[3]) return 'high';
  return 'very_high';
}

const LABEL: Record<Tier, string> = {
  very_low: 'very low',
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  very_high: 'very high',
};

export function getMacroSummary(macros: MacroInput): string {
  const { kcal, protein, carbohydrates, fat, fiber } = macros;
  if (!kcal || kcal < 20) return '';

  const proteinKcal = protein * 4;
  const carbKcal = carbohydrates * 4;
  const fatKcal = fat * 9;
  const totalMacroKcal = proteinKcal + carbKcal + fatKcal || 1;

  const pctP = (proteinKcal / totalMacroKcal) * 100;
  const pctC = (carbKcal / totalMacroKcal) * 100;
  const pctF = (fatKcal / totalMacroKcal) * 100;

  // AMDR-aligned tiers: Carbs 45-65%, Protein 10-35%, Fat 20-35%.
  // "moderate" spans the mainstream dietary-range band; only clear outliers are flagged.
  const proteinTier = tier(pctP, [10, 14, 28, 38]);
  const carbTier = tier(pctC, [20, 38, 58, 68]);
  const fatTier = tier(pctF, [15, 22, 38, 50]);

  // Archetype detection first — more specific than the tiered breakdown
  if (pctC < 15 && pctF > 55) {
    return 'Very high in fat, very low in carbs — typical of keto or low-carb meals.';
  }
  if (pctC < 25 && pctF > 50 && pctP > 20) {
    return 'High-fat, low-carb, protein-forward — fits a low-carb or ketogenic style.';
  }
  if (pctP > 40) {
    return 'Protein-dominant — a classic lean, high-protein plate.';
  }
  if (pctC > 68 && pctF < 18) {
    return 'Carb-heavy and low in fat — reads like a high-carb grain or fruit-based meal.';
  }
  if (pctF > 55 && pctP < 15) {
    return 'Mostly fat, with very little protein — heavily oil- or dairy-leaning.';
  }
  if (pctC >= 40 && pctC <= 60 && pctP >= 25 && pctF < 30) {
    return 'Balanced carbs and protein with modest fat — a solid athletic or everyday plate.';
  }
  // All three within the moderate / AMDR band → fully balanced
  if (proteinTier === 'moderate' && carbTier === 'moderate' && fatTier === 'moderate') {
    return 'Well-balanced macros — carbs, protein, and fat all fall within standard dietary ranges.';
  }
  if (pctC > 38 && pctC < 60 && pctF > 22 && pctF < 40 && pctP > 12 && pctP < 28) {
    return 'Broadly balanced macros — a Mediterranean-style distribution of carbs, protein, and fat.';
  }

  // Fallback: describe each macro by tier
  const parts: string[] = [];
  parts.push(`${LABEL[proteinTier]} protein`);
  parts.push(`${LABEL[carbTier]} carbs`);
  parts.push(`${LABEL[fatTier]} fat`);

  let sentence = capitalize(parts.join(', ')) + '.';

  if (fiber != null && kcal > 0) {
    const fiberPer2000 = (fiber / kcal) * 2000;
    if (fiberPer2000 >= 35) sentence += ' Notably high in fiber.';
    else if (fiberPer2000 < 8) sentence += ' Low in fiber.';
  }

  return sentence;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
