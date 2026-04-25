import type { EditableIngredient } from '~/types/types';

export function dbFoodToEditableItem(food: any): EditableIngredient {
  const processedBrandedFood = food.branded_food
    ? postprocessBrandedFood(food.branded_food)
    : null;

  const rawFoodData =
    processedBrandedFood?.food_name?.food || food.food_name?.food;

  const ingredientName = processedBrandedFood?.product_name
    ? `${processedBrandedFood.brand ?? ''} ${processedBrandedFood.product_name}`.trim()
    : food.food_name?.name || '';

  const displayTextContext =
    food.amount != null
      ? getStringFromAmountInfo([food.amount, food.unit ?? 'G'], 1).trim()
      : '';
  const displayText = [displayTextContext, ingredientName]
    .filter(Boolean)
    .join(' ');

  return {
    rawText: food.raw_text || '',
    displayText,
    displayTextContext,
    displayTextIngredient: ingredientName,
    displayTextExtra: '',
    amount: food.amount ?? undefined,
    unit: food.unit ?? undefined,
    foodNameId: processedBrandedFood?.food_name?.id || food.food_name?.id,
    ingredientName,
    foodData: stripReport(rawFoodData),
    brandedFood: processedBrandedFood ?? undefined,
    brandedFoodState: processedBrandedFood ? 'complete' : undefined,
  };
}
