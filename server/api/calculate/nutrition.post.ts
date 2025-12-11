import NutritionEngine from '~~/server/utils/NutritionEngine';
import type { Food } from '~/types/types';

type NutritionEngineArgs = {
  food: Food;
  useGpt: boolean;
  logToReport: boolean;
  considerProcessing: boolean;
};

type Response = {
  nutritionComputed: any;
  nutrition: any;
  fullReport?: any;
  report?: any;
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { nutritionEngineArgs } = body as {
    nutritionEngineArgs: NutritionEngineArgs;
  };
  const nutritionEngine = new NutritionEngine(
    nutritionEngineArgs.useGpt,
    nutritionEngineArgs.logToReport,
    nutritionEngineArgs.considerProcessing,
    false,
    false
  );
  const scores = await nutritionEngine.computeFood(nutritionEngineArgs.food);
  const response: Response = {
    nutritionComputed: nutritionEngine.getRecipeRow(),
    nutrition: scores,
  };

  if (nutritionEngineArgs.logToReport) {
    response.fullReport = (nutritionEngine as any).recipe.fullReport;
  }

  return response;
});
