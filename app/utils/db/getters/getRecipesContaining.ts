import type { SupabaseClient } from '@supabase/supabase-js';
import { getRecipeOverviews } from './getRecipes';

export async function getRecipesContaining(
  client: SupabaseClient<Database>,
  foodNameIds: number[]
): Promise<RecipeOverview[]> {
  if (foodNameIds.length === 0) {
    return [];
  }

  // Step 1: Get the food_id for each food_name_id (to form food groups)
  const { data: foodNames, error: foodNamesError } = await client
    .from('food_names')
    .select('id, food_id')
    .in('id', foodNameIds);

  if (foodNamesError) throw foodNamesError;
  if (!foodNames || foodNames.length === 0) return [];

  // Group food_name_ids by their food_id (food groups)
  const foodGroups: Map<number, number[]> = new Map();
  for (const foodName of foodNames) {
    if (!foodGroups.has(foodName.food_id)) {
      foodGroups.set(foodName.food_id, []);
    }
    foodGroups.get(foodName.food_id)!.push(foodName.id);
  }

  // Step 2: For each food group, get all food_name_ids in that group
  const foodIds = Array.from(foodGroups.keys());
  const { data: allFoodNamesInGroups, error: allFoodNamesError } = await client
    .from('food_names')
    .select('id, food_id')
    .in('food_id', foodIds);

  if (allFoodNamesError) throw allFoodNamesError;
  if (!allFoodNamesInGroups) return [];

  // Rebuild food groups with all food_name_ids
  const completeFoodGroups: Map<number, number[]> = new Map();
  for (const foodName of allFoodNamesInGroups) {
    if (!completeFoodGroups.has(foodName.food_id)) {
      completeFoodGroups.set(foodName.food_id, []);
    }
    completeFoodGroups.get(foodName.food_id)!.push(foodName.id);
  }

  // Step 3: Find recipes that have at least one food_name from each food group
  // For each food group, find all recipes that contain any food_name in that group
  const recipeIdSets: Set<number>[] = [];

  for (const [foodId, foodNameIdsInGroup] of completeFoodGroups.entries()) {
    const { data: recipeFoods, error: recipeFoodsError } = await client
      .from('recipe_foods')
      .select('recipe_id')
      .in('food_name_id', foodNameIdsInGroup);

    if (recipeFoodsError) throw recipeFoodsError;

    if (recipeFoods && recipeFoods.length > 0) {
      const recipeIds = new Set(recipeFoods.map((rf) => rf.recipe_id));
      recipeIdSets.push(recipeIds);
    }
  }

  // If any food group has no recipes, return empty
  if (recipeIdSets.length !== completeFoodGroups.size) {
    return [];
  }

  // Intersect all sets (recipes must contain food from ALL groups)
  if (recipeIdSets.length === 0) {
    return [];
  }

  let matchingRecipeIds = recipeIdSets[0];
  for (let i = 1; i < recipeIdSets.length; i++) {
    matchingRecipeIds = new Set(
      [...matchingRecipeIds].filter((id) => recipeIdSets[i].has(id))
    );
  }

  // If no recipes match all groups, return empty
  if (matchingRecipeIds.size === 0) {
    return [];
  }

  // Step 4: Get the full recipe overviews for the matching recipe IDs
  const recipes = await getRecipeOverviews(client, {
    in: { id: Array.from(matchingRecipeIds) },
    limit: 5,
    orderBy: { column: 'relevancy', ascending: false },
    not: { picture: null },
  });

  return recipes;
}
