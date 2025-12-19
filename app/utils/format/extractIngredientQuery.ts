import { unitToDBMap } from './parseIngredientString';

const ignoreWords = new Set(['a', 'an', 'the', 'of']);

const numericWords = new Set([
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'half', 'quarter', 'three-quarters', 'dozen',
  '½', '¼', '¾', '⅓', '⅔', '⅛', '⅜', '⅝', '⅞',
]);

function isNumericToken(word: string): boolean {
  if (word !== '' && !isNaN(Number(word))) return true;
  if (numericWords.has(word.toLowerCase())) return true;
  if (/^\d+\/\d+$/.test(word)) return true;
  return false;
}

function isUnitToken(word: string): boolean {
  return word.toLowerCase() in unitToDBMap;
}

// Handles combined tokens like "100g", "1/2tsp", "2.5ml"
function isNumberUnitToken(word: string): boolean {
  const match = word.match(/^[\d./]+(.+)/);
  if (!match) return false;
  return match[1].toLowerCase() in unitToDBMap;
}

/**
 * Strips leading amount/unit/filler tokens from a raw ingredient string and
 * returns the ingredient portion suitable for autocomplete search.
 *
 * "1 cup of chick"      → { ingredientQuery: "chick", ingredientStartIndex: 9 }
 * "100g salmon"         → { ingredientQuery: "salmon", ingredientStartIndex: 5 }
 * "1 1/2 tbsp olive"    → { ingredientQuery: "olive", ingredientStartIndex: 11 }
 * "chicken breast"      → { ingredientQuery: "chicken breast", ingredientStartIndex: 0 }
 */
export function extractIngredientQuery(rawText: string): {
  ingredientQuery: string;
  ingredientStartIndex: number;
} {
  const trimmed = rawText.trimStart();
  const tokens = trimmed.split(/\s+/);

  let i = 0;
  let seenAmountOrUnit = false;

  while (i < tokens.length) {
    const token = tokens[i];
    if (!token) { i++; continue; }

    if (isNumericToken(token) || isNumberUnitToken(token)) {
      seenAmountOrUnit = true;
      i++;
      continue;
    }

    if (isUnitToken(token)) {
      seenAmountOrUnit = true;
      i++;
      continue;
    }

    // Only skip ignore words if we've already seen an amount or unit
    if (seenAmountOrUnit && ignoreWords.has(token.toLowerCase())) {
      i++;
      continue;
    }

    break;
  }

  const prefixStr = tokens.slice(0, i).join(' ');
  const ingredientQuery = tokens.slice(i).join(' ');
  const ingredientStartIndex = prefixStr.length > 0 ? prefixStr.length + 1 : 0;

  return { ingredientQuery, ingredientStartIndex };
}
