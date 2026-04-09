import type { SupabaseClient } from '@supabase/supabase-js';
type AnyClient = SupabaseClient<any, any, any>;

type LoadedMealRow = {
  id: number;
  meal_name: string;
  collapsed: boolean | null;
  uses_recipe_id: number | null;
  uses_meal_id: number | null;
  is_template: boolean | null;
  active: boolean | null;
  schedule_until: string | null;
  last_materialized_on: string | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrates: number | null;
  fiber: number | null;
  total_weight?: number | null;
  saturated_fat?: number | null;
  sugar?: number | null;
  salt?: number | null;
  tracked_meal_foods?: any[];
};

function buildIngredientName(food: any) {
  const branded = food.branded_food;
  if (branded?.product_name) {
    return `${branded.brand ?? ''} ${branded.product_name}`.trim();
  }
  return food.food_name?.name ?? '';
}

function buildDisplayText(food: any) {
  return food.raw_text || [food.amount, food.unit, buildIngredientName(food)].filter(Boolean).join(' ');
}

function toLogicalDateValue(value?: string | null) {
  return value?.slice(0, 10) ?? null;
}

function toClientMeal(meal: LoadedMealRow) {
  const foods = [...(meal.tracked_meal_foods ?? [])].sort(
    (a, b) => (a.food_order ?? 0) - (b.food_order ?? 0),
  );

  return {
    id: meal.id,
    name: meal.meal_name,
    recipe_id: meal.uses_recipe_id ?? undefined,
    uses_meal_id: meal.uses_meal_id ?? undefined,
    is_template: Boolean(meal.is_template),
    collapsed: meal.collapsed ?? false,
    summary: {
      kcal: meal.kcal,
      protein: meal.protein,
      fat: meal.fat,
      carbohydrates: meal.carbohydrates,
      fiber: meal.fiber,
    },
    dailySchedule: meal.is_template
      ? {
          id: meal.id,
          active: Boolean(meal.active),
          schedule_until: meal.schedule_until,
          last_materialized_on: meal.last_materialized_on,
        }
      : null,
    editableIngredients: foods.map((food) => {
      const branded = food.branded_food ?? null;
      const foodName = branded?.food_name ?? food.food_name ?? null;
      const foodData = foodName?.food ?? null;
      const displayText = buildDisplayText(food);
      return {
        rawText: food.raw_text || displayText,
        displayText,
        amount: food.amount ?? undefined,
        unit: food.unit ?? undefined,
        foodNameId: foodName?.id ?? undefined,
        ingredientName: buildIngredientName(food),
        foodData: foodData ?? undefined,
        brandedFood: branded ?? undefined,
        brandedFoodState: branded ? 'complete' : undefined,
      };
    }),
  };
}

async function loadMealRow(client: AnyClient, userId: string, mealId: number, requireTemplate?: boolean) {
  let query = client
    .from('tracked_meals')
    .select(`
      id,
      meal_name,
      collapsed,
      uses_recipe_id,
      uses_meal_id,
      is_template,
      active,
      schedule_until,
      last_materialized_on,
      kcal,
      protein,
      fat,
      carbohydrates,
      fiber,
      total_weight,
      saturated_fat,
      sugar,
      salt,
      tracked_meal_foods (
        id,
        amount,
        unit,
        raw_text,
        food_order,
        food_name:food_names(id, name, food:foods(*)),
        branded_food:branded_foods(*, food_name:food_names(id, name, food:foods(*)))
      )
    `)
    .eq('user_id', userId)
    .eq('id', mealId);

  if (requireTemplate === true) query = query.eq('is_template', true);
  if (requireTemplate === false) query = query.not('is_template', 'is', true);

  const { data, error } = await query.single();
  if (error) throw error;
  return data as LoadedMealRow;
}

async function insertMealFoods(client: AnyClient, targetMealId: number, foods: any[]) {
  if (!foods.length) return;
  const { error } = await client
    .from('tracked_meal_foods')
    .insert(
      foods.map((food, index) => ({
        tracked_meal_id: targetMealId,
        food_id: food.food_name?.id ?? food.food_id ?? food.foodNameId ?? null,
        branded_food_barcode: food.branded_food?.barcode ?? food.branded_food_barcode ?? food.brandedFood?.barcode ?? null,
        amount: food.amount ?? null,
        unit: food.unit ?? null,
        raw_text: food.raw_text ?? food.rawText ?? buildDisplayText(food),
        food_order: food.food_order ?? index,
      })),
    );

  if (error) throw error;
}

export async function listTemplateMeals(client: AnyClient, userId: string) {
  const { data: meals, error } = await client
    .from('tracked_meals')
    .select(`
      id,
      meal_name,
      collapsed,
      uses_recipe_id,
      uses_meal_id,
      is_template,
      active,
      schedule_until,
      last_materialized_on,
      kcal,
      protein,
      fat,
      carbohydrates,
      fiber,
      tracked_meal_foods (
        id,
        amount,
        unit,
        raw_text,
        food_order,
        food_name:food_names(id, name, food:foods(*)),
        branded_food:branded_foods(*, food_name:food_names(id, name, food:foods(*)))
      )
    `)
    .eq('user_id', userId)
    .eq('is_template', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (meals ?? []).map((meal: LoadedMealRow) => toClientMeal(meal));
}

export async function createTemplateFromMeal(client: AnyClient, userId: string, mealId: number) {
  const meal = await loadMealRow(client, userId, mealId, false);

  const { data: insertedMeal, error } = await client
    .from('tracked_meals')
    .insert({
      user_id: userId,
      meal_name: meal.meal_name,
      meal_date: null,
      collapsed: true,
      meal_order: null,
      is_template: true,
      active: false,
      schedule_until: null,
      last_materialized_on: null,
      uses_meal_id: null,
      uses_recipe_id: meal.uses_recipe_id ?? null,
      kcal: meal.kcal ?? null,
      protein: meal.protein ?? null,
      fat: meal.fat ?? null,
      carbohydrates: meal.carbohydrates ?? null,
      fiber: meal.fiber ?? null,
      total_weight: meal.total_weight ?? null,
      saturated_fat: meal.saturated_fat ?? null,
      sugar: meal.sugar ?? null,
      salt: meal.salt ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;

  await insertMealFoods(client, insertedMeal.id, meal.tracked_meal_foods ?? []);
  return listSingleTemplateMeal(client, userId, insertedMeal.id);
}

export async function createTemplateFromPayload(client: AnyClient, userId: string, meal: any) {
  const { data: insertedMeal, error } = await client
    .from('tracked_meals')
    .insert({
      user_id: userId,
      meal_name: meal.name || 'Untitled Meal',
      meal_date: null,
      collapsed: true,
      meal_order: null,
      is_template: true,
      active: false,
      schedule_until: null,
      last_materialized_on: null,
      uses_meal_id: null,
      uses_recipe_id: meal.recipe_id ?? null,
      kcal: meal.summary?.kcal ?? null,
      protein: meal.summary?.protein ?? null,
      fat: meal.summary?.fat ?? null,
      carbohydrates: meal.summary?.carbohydrates ?? null,
      fiber: meal.summary?.fiber ?? null,
      total_weight: meal.summary?.total_weight ?? null,
      saturated_fat: meal.summary?.saturated_fat ?? null,
      sugar: meal.summary?.sugar ?? null,
      salt: meal.summary?.salt ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;

  await insertMealFoods(
    client,
    insertedMeal.id,
    (meal.editableIngredients ?? []).map((ingredient: any, index: number) => ({
      foodNameId: ingredient.foodNameId,
      brandedFood: ingredient.brandedFood ?? null,
      amount: ingredient.amount ?? null,
      unit: ingredient.unit ?? null,
      rawText: ingredient.rawText ?? ingredient.displayText ?? '',
      food_order: index,
    })),
  );

  return listSingleTemplateMeal(client, userId, insertedMeal.id);
}

async function listSingleTemplateMeal(client: AnyClient, userId: string, templateId: number) {
  const templates = await listTemplateMeals(client, userId);
  const match = templates.find((template) => template.id === templateId);
  if (!match) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' });
  }
  return match;
}

export async function buildTemplateForDay(client: AnyClient, userId: string, templateId: number) {
  const template = await loadMealRow(client, userId, templateId, true);
  return {
    ...toClientMeal(template),
    id: undefined,
    is_template: false,
    uses_meal_id: template.id,
    dailySchedule: null,
  };
}

export async function upsertTemplates(
  client: AnyClient,
  userId: string,
  templates: Array<any>,
) {
  for (const template of templates) {
    if (!template.id) continue;

    const validIngredients = (template.editableIngredients ?? []).filter(
      (ingredient: any) => ingredient.rawText?.trim() && ingredient.foodNameId,
    );

    const { error: updateError } = await client
      .from('tracked_meals')
      .update({
        meal_name: template.name || 'Untitled Meal',
        collapsed: template.collapsed ?? false,
        uses_recipe_id: template.recipe_id ?? null,
        kcal: template.summary?.kcal ?? null,
        protein: template.summary?.protein ?? null,
        fat: template.summary?.fat ?? null,
        carbohydrates: template.summary?.carbohydrates ?? null,
        fiber: template.summary?.fiber ?? null,
        total_weight: template.summary?.total_weight ?? null,
        saturated_fat: template.summary?.saturated_fat ?? null,
        sugar: template.summary?.sugar ?? null,
        salt: template.summary?.salt ?? null,
      })
      .eq('id', template.id)
      .eq('user_id', userId)
      .eq('is_template', true);

    if (updateError) throw updateError;

    const { error: deleteFoodsError } = await client
      .from('tracked_meal_foods')
      .delete()
      .eq('tracked_meal_id', template.id);

    if (deleteFoodsError) throw deleteFoodsError;

    if (validIngredients.length > 0) {
      const { error: foodsError } = await client
        .from('tracked_meal_foods')
        .insert(
          validIngredients.map((ingredient: any, index: number) => ({
            tracked_meal_id: template.id,
            food_id: ingredient.foodNameId ?? null,
            branded_food_barcode: ingredient.brandedFood?.barcode ?? null,
            amount: ingredient.amount ?? null,
            unit: ingredient.unit ?? null,
            raw_text: ingredient.rawText ?? ingredient.displayText ?? '',
            food_order: index,
          })),
        );

      if (foodsError) throw foodsError;
    }
  }
}

export async function deleteTemplateMeal(client: AnyClient, userId: string, templateId: number) {
  const { error: foodsError } = await client
    .from('tracked_meal_foods')
    .delete()
    .eq('tracked_meal_id', templateId);

  if (foodsError) throw foodsError;

  const { error } = await client
    .from('tracked_meals')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId)
    .eq('is_template', true);

  if (error) throw error;
}

export async function updateTemplateSchedule(
  client: AnyClient,
  userId: string,
  templateId: number,
  schedule: {
    active?: boolean;
    scheduleUntil?: string | null;
  },
) {
  const nextActive = schedule.active ?? false;
  const { error } = await client
    .from('tracked_meals')
    .update({
      active: nextActive,
      schedule_until: schedule.scheduleUntil ?? null,
      // Resetting here lets an explicit reschedule materialize again today if the user wants that.
      last_materialized_on: null,
    })
    .eq('id', templateId)
    .eq('user_id', userId)
    .eq('is_template', true);

  if (error) throw error;
}

export async function materializeDailySchedules(
  client: AnyClient,
  userId: string,
  logicalDate: string,
) {
  const { data: templates, error } = await client
    .from('tracked_meals')
    .select(`
      id,
      meal_name,
      collapsed,
      uses_recipe_id,
      uses_meal_id,
      is_template,
      active,
      schedule_until,
      last_materialized_on,
      kcal,
      protein,
      fat,
      carbohydrates,
      fiber,
      total_weight,
      saturated_fat,
      sugar,
      salt,
      tracked_meal_foods (
        id,
        amount,
        unit,
        raw_text,
        food_order,
        food_name:food_names(id, name, food:foods(*)),
        branded_food:branded_foods(*, food_name:food_names(id, name, food:foods(*)))
      )
    `)
    .eq('user_id', userId)
    .eq('is_template', true)
    .eq('active', true);

  if (error) throw error;
  if (!templates?.length) return { inserted: 0 };

  let inserted = 0;
  for (const template of templates as LoadedMealRow[]) {
    if (toLogicalDateValue(template.schedule_until) && toLogicalDateValue(template.schedule_until)! < logicalDate) {
      continue;
    }

    if (toLogicalDateValue(template.last_materialized_on) === logicalDate) {
      continue;
    }

    const { count, error: existingError } = await client
      .from('tracked_meals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('meal_date', logicalDate)
      .eq('uses_meal_id', template.id)
      .not('is_template', 'is', true);

    if (existingError) throw existingError;
    if ((count ?? 0) > 0) {
      const { error: markExistingMaterializedError } = await client
        .from('tracked_meals')
        .update({ last_materialized_on: logicalDate })
        .eq('id', template.id)
        .eq('user_id', userId)
        .eq('is_template', true);

      if (markExistingMaterializedError) throw markExistingMaterializedError;
      continue;
    }

    const { data: newMeal, error: insertError } = await client
      .from('tracked_meals')
      .insert({
        user_id: userId,
        meal_name: template.meal_name,
        meal_date: logicalDate,
        collapsed: template.collapsed,
        meal_order: null,
        is_template: false,
        active: null,
        schedule_until: null,
        last_materialized_on: null,
        uses_meal_id: template.id,
        uses_recipe_id: template.uses_recipe_id ?? null,
        kcal: template.kcal ?? null,
        protein: template.protein ?? null,
        fat: template.fat ?? null,
        carbohydrates: template.carbohydrates ?? null,
        fiber: template.fiber ?? null,
        total_weight: template.total_weight ?? null,
        saturated_fat: template.saturated_fat ?? null,
        sugar: template.sugar ?? null,
        salt: template.salt ?? null,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    await insertMealFoods(client, newMeal.id, template.tracked_meal_foods ?? []);

    const { error: markMaterializedError } = await client
      .from('tracked_meals')
      .update({ last_materialized_on: logicalDate })
      .eq('id', template.id)
      .eq('user_id', userId)
      .eq('is_template', true);

    if (markMaterializedError) throw markMaterializedError;
    inserted += 1;
  }

  return { inserted };
}

