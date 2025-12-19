import NutritionEngine from '~~/server/utils/NutritionEngine';
import type {
  ComputableRecipe,
  InsertableRecipe,
  InsertableRecipeFood,
  InsertableRecipeTag,
} from '~/types/types';

type NutritionEngineArgs = {
  recipe: ComputableRecipe;
  useGpt: boolean;
  logToReport: boolean;
  considerProcessing: boolean;
  nutritionLabelOnly: boolean;
  disableSatiety: boolean;
  isDiet: boolean;
  fullReport: boolean;
};

type Response = {
  recipeRow: InsertableRecipe | null;
  recipeFoodRows: Omit<InsertableRecipeFood, 'recipe_id'>[] | null;
  recipeTagRows: Omit<InsertableRecipeTag, 'recipe_id'>[] | null;
  fullReport?: any;
};

export default defineEventHandler(async (event): Promise<Response> => {
  const body = await readBody(event);
  const { nutritionEngineArgs } = body as {
    nutritionEngineArgs: NutritionEngineArgs;
  };

  const nutritionEngine = new NutritionEngine(
    nutritionEngineArgs.useGpt,
    nutritionEngineArgs.logToReport,
    nutritionEngineArgs.considerProcessing,
    nutritionEngineArgs.nutritionLabelOnly,
    nutritionEngineArgs.disableSatiety,
    nutritionEngineArgs.isDiet,
  );
  await nutritionEngine.computeRecipe(nutritionEngineArgs.recipe);

  if (nutritionEngineArgs.nutritionLabelOnly) {
    return {
      recipeRow: nutritionEngine.getRecipeRow(),
      recipeFoodRows: null,
      recipeTagRows: null,
    };
  }

  if (
    nutritionEngine?.recipe?.scores?.hidx === undefined ||
    isNaN(nutritionEngine?.recipe?.scores?.hidx)
  ) {
    return {
      recipeRow: null,
      recipeFoodRows: null,
      recipeTagRows: null,
    };
  }
  const recipeRow = nutritionEngine.getRecipeRow();
  if (nutritionEngineArgs.isDiet) {
    (recipeRow as any).report.dailyTotals = nutritionEngine.report.dailyTotals;
  }

  const response: Response = {
    recipeRow: recipeRow,
    recipeFoodRows: nutritionEngine.getRecipeFoodRows(),
    recipeTagRows: nutritionEngine.getRecipeTagRows(),
  };
  if (nutritionEngineArgs.fullReport) {
    response.fullReport = nutritionEngine.recipe.fullReport;
  }
  return response as Response;
});
