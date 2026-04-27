import * as generics from '~/utils/format/genericDescriptors';

const avgNOVAThresholds = {
  1: { description: 'Unprocessed ingredients', ...generics.GREAT },
  1.5: { description: 'Mostly unprocessed ingredients', ...generics.GOOD },
  2: { description: 'Culinary processed ingredients', ...generics.OKAY },
  3: { description: 'Processed ingredients', ...generics.SUBOPTIMAL },
  3.5: { description: 'Ultra-processed ingredients', ...generics.BAD },
};

// Mirrors wholeFoodTiers in getDailyQualityCards so the card and panel agree.
const pctWholeThresholds = {
  0: { description: 'Mostly processed ingredients', ...generics.POOR },
  20: { description: 'Mixed processing levels', ...generics.SUBOPTIMAL },
  60: { description: 'Mostly whole ingredients', ...generics.GOOD },
  75: { description: 'Majority whole ingredients', ...generics.GREAT },
  92: { description: 'Almost entirely whole ingredients', ...generics.EXCELLENT },
};

const pctUPFThresholds = {
  0: { ...generics.OKAY },
  1: { ...generics.OKAY },
  10: { ...generics.SUBOPTIMAL },
  25: { ...generics.BAD },
  50: { ...generics.POOR },
};

const novaDescriptorsFood = {
  1: { description: 'NOVA Classification: Whole (1)', ...generics.GOOD },
  2: {
    description: 'NOVA Classification: Traditionally processed (2)',
    ...generics.OKAY,
  },
  3: {
    description: 'NOVA Classification: Processed (3)',
    ...generics.SUBOPTIMAL,
  },
  4: {
    description: 'NOVA Classification: Ultra-processed (4)',
    ...generics.BAD,
  },
};

export default function processingLevelToReadable(
  report: any,
  isFood: boolean
) {
  if (!report.processingLevel) return [];
  if (isFood) {
    return [
      novaDescriptorsFood[
        report.processingLevel.nova as keyof typeof novaDescriptorsFood
      ],
    ];
  }
  const items = [];
  const avgNOVAItem = generics.getHighestThreshold(
    report.processingLevel.avgNOVA,
    avgNOVAThresholds
  );
  const pctUPFItem = generics.getHighestThreshold(
    report.processingLevel.pctUPF,
    pctUPFThresholds
  );
  const pctWholeItem = generics.getHighestThreshold(
    report.processingLevel.pctWhole,
    pctWholeThresholds
  );
  items.push(avgNOVAItem);
  if (report.processingLevel.upfCount > 0) {
    items.push({
      ...pctUPFItem,
      description:
        report.processingLevel.upfCount +
        ' ' +
        (report.processingLevel.upfCount == 1
          ? 'ultra-processed ingredient'
          : 'ultra-processed ingredients'),
      subtitle: report.processingLevel.upfIngredients.join(', ') || null,
    });
  }
  // pctWholeItem.description already carries the rating ("Mostly whole...").
  // Putting the raw count in the subtitle avoids "3 whole ingredients" rendered
  // in red, which reads as if the count itself is the bad signal.
  items.push({
    ...pctWholeItem,
    subtitle:
      `${Math.round(report.processingLevel.pctWhole)}% whole` +
      (report.processingLevel.wholeIngredients?.length
        ? ` · ${report.processingLevel.wholeIngredients.join(', ')}`
        : ''),
  });
  items.sort((a, b) => b.value - a.value);
  return items;
}
