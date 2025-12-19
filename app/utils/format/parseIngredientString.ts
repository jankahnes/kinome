import type { SupabaseClient } from '@supabase/supabase-js';
import type { BrandedFoodState, FullFoodRow } from '~/types/types';
import singularizeWord from './singularizeWord';
import pluralizeWord from './pluralizeWord';

const ignoreWords = ['a', 'an', 'the', 'of'];

const numeric: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
  quarter: 0.25,
  'three-quarters': 0.75,
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
  dozen: 12,
};

export const unitToDBMap: Record<string, string> = {
  g: 'G',
  gram: 'G',
  grams: 'G',
  ml: 'ML',
  milliliter: 'ML',
  milliliters: 'ML',
  tsp: 'TSP',
  teaspoon: 'TSP',
  teaspoons: 'TSP',
  tbsp: 'TBSP',
  tablespoon: 'TBSP',
  tablespoons: 'TBSP',
  cup: 'CUP',
  cups: 'CUP',
  oz: 'OZ',
  ounce: 'OZ',
  ounces: 'OZ',
  lb: 'LB',
  lbs: 'LB',
  pound: 'LB',
  pounds: 'LB',
  l: 'L',
  liter: 'L',
  liters: 'L',
  kg: 'KG',
  kilogram: 'KG',
  kilograms: 'KG',
  free: 'FREE',
};

function parseNumeric(word: string): number | null {
  const cleanWord = word.trim();

  // Handle regular numbers
  if (!isNaN(Number(cleanWord)) && cleanWord !== '') {
    return Number(cleanWord);
  }

  // Handle text numbers and fractions (case-insensitive)
  const lowerWord = cleanWord.toLowerCase();
  if (numeric[lowerWord as keyof typeof numeric]) {
    return numeric[lowerWord as keyof typeof numeric];
  }

  // Handle fraction strings like "1/2"
  if (cleanWord.includes('/')) {
    const [numerator, denominator] = cleanWord.split('/');
    const num = Number(numerator);
    const den = Number(denominator);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }

  return null;
}

function parseNumberUnit(word: string): {
  number: number;
  unit: string;
  originalText: string;
  numberPart: string;
  unitPart: string;
} | null {
  const cleanWord = word.trim();

  // Try to find a number at the beginning of the word
  let numericPart = '';
  let unitPart = '';

  // First try decimal numbers (e.g., "1.5ml", "2.25g")
  const decimalMatch = cleanWord.match(/^(\d+\.?\d*)(.*)/);
  if (decimalMatch) {
    const [, numStr, rest] = decimalMatch;
    const num = Number(numStr);
    if (!isNaN(num)) {
      numericPart = numStr;
      unitPart = rest.trim();
    }
  }

  // If no decimal match, try fraction match (e.g., "1/2tsp")
  if (!numericPart) {
    const fractionMatch = cleanWord.match(/^(\d+\/\d+)(.*)/);
    if (fractionMatch) {
      const [, fracStr, rest] = fractionMatch;
      const [numerator, denominator] = fracStr.split('/');
      const num = Number(numerator) / Number(denominator);
      if (!isNaN(num)) {
        numericPart = fracStr;
        unitPart = rest.trim();
      }
    }
  }

  // If we found a numeric part, check if the remaining part is a valid unit
  if (numericPart && unitPart) {
    const lowerUnit = unitPart.toLowerCase();
    if (unitToDBMap[lowerUnit as keyof typeof unitToDBMap]) {
      let numberValue: number;
      if (numericPart.includes('/')) {
        const [num, den] = numericPart.split('/');
        numberValue = Number(num) / Number(den);
      } else {
        numberValue = Number(numericPart);
      }

      return {
        number: numberValue,
        unit: unitToDBMap[lowerUnit as keyof typeof unitToDBMap],
        originalText: cleanWord,
        numberPart: numericPart,
        unitPart: unitPart,
      };
    }
  }

  return null;
}

export type ParseResult = {
  // Extracted data
  amount: number | null;
  unit: string;
  preparationDescription: string | null;

  // Display text (raw text with ingredient autocompleted, [barcode] replaced with product name)
  displayText: string;

  // Resolved food
  foodNameId?: number;
  ingredientName?: string;
  foodData?: FullFoodRow;

  // Branded food
  brandedFoodState?: BrandedFoodState;
  brandedFood?: any;
};

export async function parseIngredientString(
  client: SupabaseClient<Database>,
  ingredientString: string,
  hasIngredient: boolean = true
): Promise<ParseResult> {
  let amount: number | null = null;
  let unit = '';
  let preparationDescription: string | null = null;
  let foodNameId: number | undefined;
  let ingredientName: string | undefined;
  let foodData: FullFoodRow | undefined;
  let brandedFoodState: BrandedFoodState | undefined;
  let brandedFood: any;

  const tokens = ingredientString
    .split(' ')
    .filter((word) => word.trim() !== '')
    .map((word) => word.trim());
  const displayTextParts: string[] = [];

  for (const [i, word] of tokens.entries()) {

    // Skip ignore words (case-insensitive)
    if (ignoreWords.includes(word.toLowerCase())) {
      displayTextParts.push(word);
      continue;
    }

    // Try to parse as combined number+unit first (e.g., "100g", "2tbsp")
    const numberUnit = parseNumberUnit(word);
    if (numberUnit) {
      amount = numberUnit.number;
      unit = numberUnit.unit;
      displayTextParts.push(word);
      continue;
    }

    // Try to parse as standalone number
    const numericValue = parseNumeric(word);
    if (numericValue != null) {
      amount = numericValue;
      displayTextParts.push(word);
      continue;
    }

    // Try to parse as standalone unit (case-insensitive)
    const lowerWord = word.toLowerCase();
    if (unitToDBMap[lowerWord as keyof typeof unitToDBMap]) {
      unit = unitToDBMap[lowerWord as keyof typeof unitToDBMap];
      displayTextParts.push(word);
      continue;
    }

    // Try to look for product code
    const productCodeMatch = word.match(/\[(\d+)\]/);
    if (productCodeMatch) {
      const barcode = productCodeMatch[1];
      const fetchedBrandedFood = await getBrandedFood(client, barcode);

      // Determine the state based on what's missing
      if (!fetchedBrandedFood) {
        brandedFoodState = 'needs_basic_info';
        displayTextParts.push(`Product ${barcode}`);
      } else {
        const requirements = getBrandedFoodRequirements(fetchedBrandedFood);

        if (!requirements.hasName) {
          brandedFoodState = 'needs_basic_info';
        } else if (!requirements.hasFullNutritionLabel) {
          brandedFoodState = 'needs_nutrition';
        } else if (!requirements.hasMatchedFood) {
          brandedFoodState = 'matching';
        } else {
          brandedFoodState = 'complete';
        }

        brandedFood = fetchedBrandedFood;
        foodData = fetchedBrandedFood.food_name?.food;
        foodNameId = fetchedBrandedFood.food_name?.id;
        ingredientName = fetchedBrandedFood.product_name || undefined;

        // Add product name to display text
        const productDisplayName = fetchedBrandedFood.product_name
          ? `${fetchedBrandedFood.brand ?? ''} ${
              fetchedBrandedFood.product_name
            }`.trim()
          : `Product ${barcode}`;
        displayTextParts.push(productDisplayName);
      }

      // Add remaining tokens to display text
      const rest = await parseIngredientString(
        client,
        tokens.slice(i + 1).join(' '),
        false
      );
      displayTextParts.push(rest.displayText);

      return {
        amount,
        unit,
        preparationDescription,
        displayText: displayTextParts.join(' ').trim(),
        foodNameId,
        ingredientName,
        foodData,
        brandedFoodState,
        brandedFood,
      };
    }

    const remainingWords = tokens.slice(i).join(' ');

    const ingredientRegex = /^(.+?)(?:\s*\(|,\s*)(.+?)(?:\))?$/;
    const match = remainingWords.match(ingredientRegex);

    let searchTerm = '';
    let extra = '';

    if (match) {
      searchTerm = match[1].trim();
      extra = match[2].trim();
    } else {
      searchTerm = remainingWords.trim();
    }

    if (searchTerm && hasIngredient) {
      try {
        const searchWords = searchTerm.split(' ');
        const candidates = [];

        if (searchWords.length > 1) {
          for (let i = 0; i < searchWords.length; i++) {
            candidates.push(searchWords.slice(i).join(' '));
          }
        } else {
          candidates.push(searchTerm);
        }

        let bestResult: any = null;
        let bestSimilarity = -1;

        let bestCandidateIndex = 0;
        for (let j = 0; j < candidates.length; j++) {
          const candidate = candidates[j];
          const { data, error } = await client.rpc('search_foods', {
            query: candidate,
            max: 1,
          });
          if (data?.[0] && data[0].best_similarity > bestSimilarity) {
            bestResult = data[0];
            bestSimilarity = data[0].best_similarity;
            bestCandidateIndex = j;
            if (j == 0 && bestSimilarity > 0.8) {
              break;
            }
          }
        }

        if (bestResult) {
          // Add any excluded words to display text
          if (bestCandidateIndex > 0) {
            const excludedWords = searchWords
              .slice(0, bestCandidateIndex)
              .join(' ');
            displayTextParts.push(excludedWords);
          }

          foodNameId = bestResult.id;
          ingredientName = bestResult.name;
          foodData = bestResult.food;

          // Check if any previously added words match countable_units
          if (unit === '' && bestResult.food.countable_units) {
            const countableUnits = bestResult.food.countable_units as Record<
              string,
              number
            >;
            // Check the last few words added to display text
            for (let idx = displayTextParts.length - 1; idx >= 0; idx--) {
              const prevWord = displayTextParts[idx];
              const lowerPrevWord = prevWord.toLowerCase();
              let matchedUnit: string | null = null;

              // Check exact match
              if (countableUnits[lowerPrevWord]) {
                matchedUnit = lowerPrevWord;
              }
              // Check singular version
              else if (countableUnits[singularizeWord(lowerPrevWord)]) {
                matchedUnit = singularizeWord(lowerPrevWord);
              }
              // Check plural version
              else if (countableUnits[pluralizeWord(lowerPrevWord)]) {
                matchedUnit = pluralizeWord(lowerPrevWord);
              }

              if (matchedUnit) {
                unit = matchedUnit;
                break;
              }
            }
          }

          // Pluralize ingredient name if needed
          let finalIngredientName = bestResult.name;
          if (
            unit == '' &&
            amount &&
            amount > 1 &&
            !displayTextParts.some((p) => p.toLowerCase() == 'of')
          ) {
            finalIngredientName = pluralizeWord(bestResult.name);
          }

          displayTextParts.push(finalIngredientName);

          if (extra) {
            extra = extra.replace(/^,/, '').trim();
            preparationDescription = extra;
            displayTextParts.push(extra);
          }
          break;
        }
      } catch (error) {
        console.error('Error searching for ingredient:', error);
      }
    }

    displayTextParts.push(word);
  }

  return {
    amount,
    unit,
    preparationDescription,
    displayText: displayTextParts.join(' ').trim(),
    foodNameId,
    ingredientName,
    foodData,
    brandedFoodState,
    brandedFood,
  };
}
