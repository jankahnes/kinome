import * as generics from '~/utils/format/genericDescriptors';
import contributorsToReadable from '~~/server/utils/reportHumanReadable/contributorsToReadable';
import { getGrade } from '~/utils/constants/grades';
import type {
  DisplayHints,
  AxisHint,
} from '~~/server/utils/reportHumanReadable/displayHints';

type ReadableGradeItem = {
  value: number;
  description: string;
  bgColor: string;
  color: string;
  icon: string;
  subtitle?: string | null;
  // Display flags consumed by Report.vue.
  trace?: boolean;
  lowAbs?: boolean;
  capped?: boolean;
};

type ReadableGrades = ReadableGradeItem[];

const satietyDescriptors = {
  F: { description: 'Not filling at all', ...generics.POOR },
  E: { description: 'Not very filling', ...generics.BAD },
  D: { description: 'Not very filling', ...generics.SUBOPTIMAL },
  C: { description: 'Somewhat filling', ...generics.OKAY },
  B: { description: 'Filling', ...generics.GOOD },
  A: { description: 'Very filling', ...generics.GREAT },
  S: { description: 'Extremely filling', ...generics.EXCELLENT },
};

const processingLevelDescriptors = {
  F: { description: 'Ultra-processed ingredients', ...generics.POOR },
  E: { description: 'Very processed ingredients', ...generics.BAD },
  D: { description: 'Mostly processed ingredients', ...generics.SUBOPTIMAL },
  C: { description: 'Moderately processed ingredients', ...generics.OKAY },
  B: { description: 'Mostly unprocessed ingredients', ...generics.GOOD },
  A: { description: 'Mostly whole ingredients', ...generics.GREAT },
  S: { description: 'Whole ingredients', ...generics.EXCELLENT },
};

const processingLevelDescriptorsFood = {
  4: { description: 'Ultra-processed', ...generics.POOR },
  3: { description: 'Processed Food', ...generics.SUBOPTIMAL },
  2: { description: 'Traditionally processed', ...generics.OKAY },
  1: { description: 'Unprocessed Food', ...generics.GREAT },
};

type ScoreDescriptor = {
  appendName: string;
  descriptor: any;
  contributor_col?: string;
  display_subtitle_thresh?: number;
  display_if?: string;
  // Which displayHints axis (if any) gates this row. Without a hint key,
  // the row always renders normally (satiety, processingLevel).
  hint?: keyof DisplayHints;
};

const scoreDescriptors: Record<string, ScoreDescriptor> = {
  mnidx: {
    appendName: 'Micronutrients',
    descriptor: generics.positiveAmountDescriptors,
    contributor_col: 'mnidx',
    display_subtitle_thresh: 38,
    display_if: 'bigger',
    hint: 'micronutrients',
  },
  satiety: {
    appendName: '',
    descriptor: satietyDescriptors,
    contributor_col: 'sidx',
    display_subtitle_thresh: 38,
    display_if: 'bigger',
  },
  fat_profile_score: {
    appendName: 'Fatty Acid Profile',
    descriptor: generics.genericDescriptors,
    hint: 'fat_profile',
  },
  processing_level_score: {
    appendName: '',
    descriptor: processingLevelDescriptors,
  },
  protein_score: {
    appendName: 'Protein',
    descriptor: generics.positiveAmountDescriptors,
    contributor_col: 'protein',
    display_subtitle_thresh: 38,
    display_if: 'bigger',
    hint: 'protein',
  },
  sugar_score: {
    appendName: 'Sugar',
    descriptor: generics.negativeAmountDescriptors,
    contributor_col: 'sugar',
    display_subtitle_thresh: 38,
    display_if: 'smaller',
    hint: 'sugar',
  },
  fiber_score: {
    appendName: 'Fiber',
    descriptor: generics.positiveAmountDescriptors,
    contributor_col: 'fiber',
    display_subtitle_thresh: 38,
    display_if: 'bigger',
    hint: 'fiber',
  },
  salt_score: {
    appendName: 'Sodium',
    descriptor: generics.negativeAmountDescriptors,
    contributor_col: 'salt',
    display_subtitle_thresh: 38,
    display_if: 'smaller',
    hint: 'salt',
  },
  protective_score: {
    appendName: 'Protective Compounds',
    descriptor: generics.positiveAmountDescriptors,
    contributor_col: 'protective_score',
    display_subtitle_thresh: 38,
    display_if: 'bigger',
    hint: 'protective',
  },
};

// Capped-display descriptor for negative axes (sugar/salt) when raw is trace.
// "Minimal sugar / Minimal sodium" with a neutral colour and low value so it
// sorts to the bottom — true but uninformative, so don't reward with S+.
const cappedNegativeAxisDescriptor = (axis: string) => ({
  // value lower than NEUTRAL but higher than TRACE so it sits above
  // the suppressed/trace items but below normally-graded rows.
  value: 0.5,
  bgColor: 'bg-gray-100',
  color: 'text-gray-700',
  icon: 'check_small',
  description: `Minimal ${axis}`,
});

// When `state === 'low'`, the per-kcal density score is computed against
// such a small absolute amount that the strongest verdicts in EITHER
// direction are misleading. Clamp into a moderate band — the underlying
// score is unchanged.
//
// - Positive axes: clamp to ['D', 'B']. Cucumber 0.5g fiber stops claiming
//   "Excellent" (S → B), but a genuinely-poor score isn't dragged up: F-grade
//   on a low-absolute food just means "not much per 100g and per 2000kcal" —
//   we floor at D to avoid the "Not a source of" overclaim too.
// - Negative axes: clamp to ['D', 'B']. Cucumber F-sugar from 1.7g/100g
//   (density-inflated) stops claiming "Very High" (F → D); white bread's B
//   grade for a low-but-not-trace 0.45g salt stays at B.
const LOW_BAND_MIN = 'D';
const LOW_BAND_MAX = 'B';
const POSITIVE_GRADE_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
function clampToBand(
  grade: string,
  minGrade: string,
  maxGrade: string,
): string {
  const gi = POSITIVE_GRADE_ORDER.indexOf(grade);
  const mn = POSITIVE_GRADE_ORDER.indexOf(minGrade);
  const mx = POSITIVE_GRADE_ORDER.indexOf(maxGrade);
  if (gi < 0 || mn < 0 || mx < 0) return grade;
  if (gi < mn) return minGrade;
  if (gi > mx) return maxGrade;
  return grade;
}

export default function gradesToReadable(
  report: any,
  recipe: Recipe | FullFoodRow | InsertableRecipe,
  isFood: boolean,
) {
  // Create a copy to avoid mutating the global object
  const descriptors = isFood
    ? Object.fromEntries(
        Object.entries(scoreDescriptors).filter(
          ([key]) => key !== 'processing_level_score',
        ),
      )
    : scoreDescriptors;

  const hints: DisplayHints | undefined = report?.displayHints;

  const readable: ReadableGrades = [];
  for (const scoreCategory in descriptors) {
    const item = descriptors[scoreCategory as keyof typeof scoreDescriptors];
    const hint: AxisHint | undefined = item.hint
      ? hints?.[item.hint]
      : undefined;

    // ── three-state gating ───────────────────────────────────────────────
    if (hint?.state === 'trace') {
      if (hint.polarity === 'positive') {
        // Whole-food F's for absences (salmon F-fiber). Suppress entirely.
        continue;
      }
      // Negative axis: render a capped, neutral-colored bullet so the
      // overview doesn't claim "Minimal Sodium" with an S+ flourish.
      const axisLabel =
        item.appendName ||
        scoreCategory.replace(/_score$/, '').replace(/_/g, ' ');
      const capped = cappedNegativeAxisDescriptor(axisLabel.toLowerCase());
      readable.push({
        ...capped,
        capped: true,
        subtitle: null,
      });
      continue;
    }

    const score = (recipe as any)[scoreCategory];
    let roundedGrade = getGrade(score, 'single')[0];
    // Low state: clamp to moderate band so cucumber doesn't read "Excellent
    // source of Fiber" off 0.5g/100g or "Very High in Sugar" off 1.7g/100g,
    // and white-bread-with-0.45g-salt doesn't get celebrated as "Very low".
    if (hint?.state === 'low') {
      roundedGrade = clampToBand(roundedGrade, LOW_BAND_MIN, LOW_BAND_MAX);
    }
    let descriptor =
      item.descriptor[roundedGrade as keyof typeof item.descriptor];
    if (!descriptor) {
      throw new Error(
        `No descriptor found for score category: ${scoreCategory} for ${roundedGrade}`,
      );
    }
    const description = descriptor.description + ' ' + item.appendName;
    let subtitle: string | null = null;
    let display_subtitle = false;
    if (!isFood) {
      const contributors =
        report?.contributors?.[item?.contributor_col ?? ''] || [];
      subtitle = contributorsToReadable(contributors);
      const display_subtitle_thresh = item.display_subtitle_thresh;
      const display_if = item.display_if;
      display_subtitle =
        display_if === 'bigger'
          ? score > (display_subtitle_thresh ?? 0)
          : score < (display_subtitle_thresh ?? 0);
    }
    // 'low' state: keep the grade but flag with a low-absolute caveat.
    // We don't override the descriptor here so the colour/icon still convey
    // the score; Report.vue dims via `lowAbs`.
    const isLow = hint?.state === 'low';
    readable.push({
      value: descriptor.value,
      description,
      bgColor: descriptor.bgColor,
      color: descriptor.color,
      icon: descriptor.icon,
      subtitle: display_subtitle && subtitle ? subtitle : null,
      ...(isLow ? { lowAbs: true } : {}),
    });
  }
  if (isFood) {
    if ((recipe as FullFoodRow).aisle === 'Produce') {
      processingLevelDescriptorsFood[1].description = 'Whole Food';
    }
    readable.push(processingLevelDescriptorsFood[(recipe as FullFoodRow).nova]);
  }
  readable.sort((a, b) => b.value - a.value);
  return readable;
}
