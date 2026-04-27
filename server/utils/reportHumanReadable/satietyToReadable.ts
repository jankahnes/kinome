import * as generics from "~/utils/format/genericDescriptors";


const ffThresholds = {
    0: { description: "Very low", ...generics.POOR},
    1: { description: "Low", ...generics.BAD},
    1.5: { description: "Below average", ...generics.SUBOPTIMAL},
    2: { description: "Decent", ...generics.NEUTRAL},
    2.5: { description: "Moderate", ...generics.OKAY},
    3: { description: "High", ...generics.GREAT},
    3.5: { description: "Very high", ...generics.GREAT},
    4: { description: "Excellent", ...generics.EXCELLENT},
}

const waterThresholds = {
    0: { description: "Minimal", ...generics.NEUTRAL},
    15: { description: "Low", ...generics.NEUTRAL},
    30: { description: "Slightly low", ...generics.OKAY},
    50: { description: "Average", ...generics.OKAY},
    60: { description: "Moderate", ...generics.GOOD},
    70: { description: "High", ...generics.GREAT},
    85: { description: "Very high", ...generics.EXCELLENT},
}

const kcalThresholds = {
    25: { description: "Extremely low", ...generics.OUTSTANDING},
    50: { description: "Very Low", ...generics.EXCELLENT},
    100: { description: "Low", ...generics.GOOD},
    150: { description: "Average", ...generics.OKAY},
    250: { description: "Elevated", ...generics.SUBOPTIMAL},
    300: { description: "High", ...generics.BAD},
    380: { description: "Very high", ...generics.POOR},
}

const giThresholds = {
    "-100": { description: "Low", ...generics.GOOD},
    "0": { description: "Average", ...generics.NEUTRAL},
    10: { description: "High", ...generics.SUBOPTIMAL},
}

const scoreDescriptors = {
    "ff": {
        appendName: "Fullness Factor",
        descriptor: ffThresholds,
    },
    "water": {
        appendName: "Water Content",
        descriptor: waterThresholds,
    },
    "kcal": {
        appendName: "Calories",
        descriptor: kcalThresholds,
    },
    "giProxy": {
        appendName: "Estimated Glycemic Index",
        descriptor: giThresholds,
    }
}


// Drinks bypass most satiety mechanisms; the engine already downweights waterE
// here (`liquid_keywords`) but the readable output kept showing "Low Calorie
// Density" as a positive bullet for sodas. Mirror the keyword check so the
// satiety summary matches the score's intent.
const LIQUID_KEYWORDS = [
    'juice','liquid','broth','soda','smoothie','drink','tea','coffee',
    'milk','water','cola','beer','wine','cocktail',
];
function isLiquidByName(name: string | null | undefined): boolean {
    if (!name) return false;
    const words = name.toLowerCase().split(' ').map(w => w.replace(/[^\w\s]/g,''));
    return LIQUID_KEYWORDS.some(kw => words.includes(kw));
}

export default function satietyToReadable(report: any, isFood: boolean, title?: string | null) {
    if(!report.satiety) return []
    const items = []
    const liquid = isLiquidByName(title);
    for(const [key, value] of Object.entries(scoreDescriptors)) {
        const score = report.satiety[key]
        const item = generics.getHighestThreshold(score, value.descriptor)
        if(!item) continue
        // For liquids, calorie-density and water-content readouts are positive
        // labels for what's actually a satiety problem (drinks bypass volume
        // satiety). Suppress those two items; the score itself already reflects this.
        if (liquid && (key === 'kcal' || key === 'water')) continue;
        const description = item.description + " " + value.appendName
        items.push({
            description,
            color: item.color,
            icon: item.icon,
            value: item.value
        })
    }
    if(!isFood) {
    const contributors = report.contributors["sidx"] || []
    for(const contributor of contributors) {
        if(contributor.totalContribution > 75) {
            items.push({
                description: "Filling from " + contributor.name,
                ...generics.GOOD
            })
        }
    }
}
    items.sort((a, b) => b.value - a.value)
    return items
}
