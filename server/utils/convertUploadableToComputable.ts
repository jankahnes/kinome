import { getFoodNames } from '~/utils/db/getters/getFoods';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unitToDBMap } from '~/utils/format/parseIngredientString';
import type {
  ComputableRecipe,
  FullIngredient,
  UploadableRecipe,
  Recipe,
} from '~/types/types';

function convertUnitToDB(unit: string) {
  if (unitToDBMap[unit as keyof typeof unitToDBMap]) {
    return unitToDBMap[unit as keyof typeof unitToDBMap];
  } else {
    return unit;
  }
}

export default async function convertUploadableToComputable(
  recipe: UploadableRecipe | Recipe,
  supabase: SupabaseClient
): Promise<ComputableRecipe> {
  if (!recipe || !supabase) {
    throw new Error('Recipe and supabase are required');
  }
  for (const ingredient of recipe.ingredients) {
    if (!ingredient.category) {
      ingredient.category = 'uncategorized';
    }
  }
  const fullIngredients: FullIngredient[] = [];
  const ingredientIds = recipe.ingredients.map(
    (ingredient: { id: number }) => ingredient.id
  );
  const foodsFromDb = await getFoodNames(supabase, {
    in: { id: ingredientIds },
  });
  for (const ingredient of recipe.ingredients) {
    const matchingFood = foodsFromDb.find((food) => food.id === ingredient.id);
    if (!matchingFood) {
      throw new Error(
        'Matching food not found for ingredient: ' + ingredient.id
      );
    }
    const mergedIngredient: FullIngredient = {
      ...matchingFood,
      ...matchingFood.food,
      ...ingredient,
      name: matchingFood.name,
      unit: convertUnitToDB(ingredient.unit),
    };
    fullIngredients.push(mergedIngredient);
  }
  return {
    serves: 1,
    ...recipe,
    fullIngredients: fullIngredients,
  };
}
