import type { TrackedMeal } from '~/types/types';
import convertToGrams from '~/utils/format/convertToGrams';

export function getMealNutrition(meal: TrackedMeal) {
  let total_weight = 0;
  let kcal = 0;
  let protein = 0;
  let fat = 0;
  let saturated_fat = 0;
  let carbohydrates = 0;
  let fiber = 0;
  let sugar = 0;
  let salt = 0;

  for (const ing of meal.editableIngredients) {
    if (!ing.foodNameId || !ing.amount || !ing.foodData) continue;
    const grams = convertToGrams(
      ing.amount,
      ing.unit ?? '',
      ing.foodData.density ?? 1,
      ing.foodData.countable_units?.[ing.unit ?? ''] ?? 0,
    );
    const factor = grams / 100;
    total_weight += grams;
    kcal += (ing.foodData.kcal ?? 0) * factor;
    protein += (ing.foodData.protein ?? 0) * factor;
    fat += (ing.foodData.fat ?? 0) * factor;
    saturated_fat += (ing.foodData.saturated_fat ?? 0) * factor;
    carbohydrates += (ing.foodData.carbohydrates ?? 0) * factor;
    fiber += (ing.foodData.fiber ?? 0) * factor;
    sugar += (ing.foodData.sugar ?? 0) * factor;
    salt += (ing.foodData.salt ?? 0) * factor;
  }

  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    total_weight: Math.round(total_weight),
    kcal: Math.round(kcal),
    protein: round1(protein),
    fat: round1(fat),
    saturated_fat: round1(saturated_fat),
    carbohydrates: round1(carbohydrates),
    fiber: round1(fiber),
    sugar: round1(sugar),
    salt: round1(salt),
  };
}
