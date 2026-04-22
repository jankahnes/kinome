const nonNouns = ["large", "small", "medium", "big", "sized"]
const defaultUnits: string[] = []//["G", "ML", "OZ", "LB", "KG", "L", "TSP", "TBSP", "FREE"]

export default function unitIsNoun(unit: string) {
    if(!unit || defaultUnits.includes(unit)) return false;
    const wordSplit = unit.split(" ");
    const relevantWord = wordSplit[wordSplit.length - 1];
    return !nonNouns.includes(relevantWord);
}