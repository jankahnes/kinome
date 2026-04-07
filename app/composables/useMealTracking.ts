import type { TrackedMeal, EditableIngredient } from '~/types/types';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';
import convertToGrams from '~/utils/format/convertToGrams';

export function useMealTracking() {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  // State
  const trackedMeals = ref<TrackedMeal[]>([]);
  const selectedDate = ref(new Date());
  const isSaving = ref(false);
  const isLoading = ref(false);
  const lastSavedAt = ref<Date | null>(null);
  const hasUnsavedChanges = ref(false);

  const {
    ensureOneEmptyInput,
    addGroup: addMeal,
    removeGroup: removeMeal,
  } = useIngredientGroupEditor(trackedMeals);

  async function addMealFromRecipe(recipeId: number) {
    const recipe = await getRecipe(supabase, { eq: { id: recipeId } });
    const computableRecipe = await convertUploadableToComputable(
      recipe,
      supabase,
    );

    const editableTrackingItems: EditableIngredient[] =
      computableRecipe.fullIngredients.map((ingredient) => {
        const displayTextContext = getStringFromAmountInfo(
          [ingredient.amount, ingredient.unit ?? 'G'],
          1,
        ).trim();
        const displayTextIngredient = ingredient.name;
        const displayText =
          `${displayTextContext} ${displayTextIngredient}`.trim();
        return {
          rawText: displayText,
          displayText,
          displayTextContext,
          displayTextIngredient,
          displayTextExtra: '',
          amount: ingredient.amount,
          unit: ingredient.unit,
          foodNameId: ingredient.id,
          ingredientName: ingredient.name,
          foodData: ingredient as any,
        };
      });

    trackedMeals.value.push({
      name: recipe.title,
      recipe_id: recipeId,
      editableIngredients: editableTrackingItems,
      collapsed: true,
    });
  }

  // Helper: Format date for DB queries (YYYY-MM-DD)
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Helper: Format time ago for UI
  function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'today';
  }

  // Helpers for load reconstruction
  function stripReport(food: any): any {
    if (!food) return food;
    const { report: _r, ...rest } = food;
    return rest;
  }

  function dbFoodToEditableItem(food: any): EditableIngredient {
    const processedBrandedFood = food.branded_food
      ? postprocessBrandedFood(food.branded_food)
      : null;

    const rawFoodData =
      processedBrandedFood?.food_name?.food || food.food_name?.food;

    const ingredientName = processedBrandedFood?.product_name
      ? `${processedBrandedFood.brand ?? ''} ${processedBrandedFood.product_name}`.trim()
      : food.food_name?.name || '';

    // Reconstruct context from stored amount+unit using the fraction formatter —
    // no parsing needed, and matches how addMealFromRecipe formats it.
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
      displayTextExtra: '',   // re-populated on first edit+blur
      amount: food.amount ?? undefined,
      unit: food.unit ?? undefined,
      foodNameId: processedBrandedFood?.food_name?.id || food.food_name?.id,
      ingredientName,
      foodData: stripReport(rawFoodData),
      // foodVariants intentionally omitted — populated on first edit+blur
      brandedFood: processedBrandedFood ?? undefined,
      brandedFoodState: processedBrandedFood ? 'complete' : undefined,
    };
  }

  // Persistence
  async function loadMeals(date: Date) {
    if (!user.value) return;

    try {
      isLoading.value = true;

      const { data: mealsData, error } = await supabase
        .from('tracked_meals')
        .select(
          `
          id,
          meal_name,
          collapsed,
          meal_order,
          tracked_meal_foods (
            id,
            food_name:food_names(id, name, food:foods(*)),
            branded_food:branded_foods(*, food_name:food_names(id, name, food:foods(*))),
            amount,
            unit,
            raw_text,
            food_order
          )
        `,
        )
        .eq('user_id', user.value.id)
        .eq('meal_date', formatDate(date))
        .order('meal_order', { ascending: true });

      if (error) throw error;

      const meals = mealsData as any[];

      if (meals && meals.length > 0) {
        const transformedMeals: TrackedMeal[] = meals.map((meal) => {
          const sortedFoods = (meal.tracked_meal_foods || []).sort(
            (a: any, b: any) => (a.food_order ?? 0) - (b.food_order ?? 0),
          );
          return {
            id: meal.id,
            name: meal.meal_name,
            collapsed: meal.collapsed ?? false,
            editableIngredients: sortedFoods.map(dbFoodToEditableItem),
          };
        });

        trackedMeals.value = transformedMeals;
      } else {
        trackedMeals.value = [];
        addMeal('Other');
      }

      hasUnsavedChanges.value = false;
    } catch (error) {
      console.error('Error loading meals:', error);
      alert('Failed to load meals. Please refresh the page.');
    } finally {
      isLoading.value = false;
    }
  }

  function getMealNutrition(meal: TrackedMeal) {
    let total_weight = 0, kcal = 0, protein = 0, fat = 0, saturated_fat = 0,
        carbohydrates = 0, fiber = 0, sugar = 0, salt = 0;

    for (const ing of meal.editableIngredients) {
      if (!ing.foodNameId || !ing.amount || !ing.foodData) continue;
      const grams = convertToGrams(
        ing.amount,
        ing.unit ?? '',
        ing.foodData.density ?? 1,
        ing.foodData.countable_units?.[ing.unit ?? ''] ?? 0,
      );
      const f = grams / 100;
      total_weight  += grams;
      kcal          += (ing.foodData.kcal          ?? 0) * f;
      protein       += (ing.foodData.protein        ?? 0) * f;
      fat           += (ing.foodData.fat            ?? 0) * f;
      saturated_fat += (ing.foodData.saturated_fat  ?? 0) * f;
      carbohydrates += (ing.foodData.carbohydrates  ?? 0) * f;
      fiber         += (ing.foodData.fiber          ?? 0) * f;
      sugar         += (ing.foodData.sugar          ?? 0) * f;
      salt          += (ing.foodData.salt           ?? 0) * f;
    }

    const r1 = (n: number) => Math.round(n * 10) / 10;
    return {
      total_weight:  Math.round(total_weight),
      kcal:          Math.round(kcal),
      protein:       r1(protein),
      fat:           r1(fat),
      saturated_fat: r1(saturated_fat),
      carbohydrates: r1(carbohydrates),
      fiber:         r1(fiber),
      sugar:         r1(sugar),
      salt:          r1(salt),
    };
  }

  async function saveMeals() {
    if (!user.value || !hasUnsavedChanges.value) return;

    try {
      isSaving.value = true;

      // Delete all existing meals for this date
      const { error: deleteError } = await supabase
        .from('tracked_meals')
        .delete()
        .eq('user_id', user.value.id)
        .eq('meal_date', formatDate(selectedDate.value));

      if (deleteError) throw deleteError;

      // Re-insert all meals
      for (
        let mealIndex = 0;
        mealIndex < trackedMeals.value.length;
        mealIndex++
      ) {
        const meal = trackedMeals.value[mealIndex];

        // Skip meals with no valid ingredients
        const validIngredients = meal.editableIngredients.filter(
          (ing) => ing.rawText?.trim() && ing.foodNameId,
        );

        if (validIngredients.length === 0 && !meal.name.trim()) {
          continue; // Skip completely empty meals
        }

        // Insert meal
        const { data: insertedMeal, error: mealError } = await supabase
          .from('tracked_meals')
          .insert({
            user_id: user.value.id,
            meal_name: meal.name || 'Untitled Meal',
            meal_date: formatDate(selectedDate.value),
            collapsed: meal.collapsed,
            meal_order: mealIndex,
            uses_recipe_id: meal.recipe_id ?? null,
            ...getMealNutrition(meal!),
          })
          .select()
          .single();

        if (mealError) throw mealError;

        // Update local id
        meal.id = insertedMeal.id;

        // Insert foods for this meal
        const foodsToInsert = validIngredients.map(
          (ing, foodIndex: number) => ({
            tracked_meal_id: insertedMeal.id,
            food_id: ing.foodNameId || null,
            branded_food_barcode: ing.brandedFood?.barcode || null,
            amount: ing.amount,
            unit: ing.unit,
            raw_text: ing.rawText,
            food_order: foodIndex,
          }),
        );

        const { error: foodsError } = await supabase
          .from('tracked_meal_foods')
          .insert(foodsToInsert);

        if (foodsError) throw foodsError;
      }

      hasUnsavedChanges.value = false;
      lastSavedAt.value = new Date();

      await $fetch('/api/db/tracking-gamification', {
        method: 'POST',
        body: {
          date: formatDate(selectedDate.value),
        },
      });
    } catch (error) {
      console.error('Error saving meals:', error);
      alert('Failed to save meals. Please try again.');
    } finally {
      isSaving.value = false;
    }
  }

  // Auto-save watcher setup
  function setupAutoSave() {
    watch(
      trackedMeals,
      () => {
        ensureOneEmptyInput();
        hasUnsavedChanges.value = true;
      },
      { deep: true },
    );
  }

  return {
    // State
    trackedMeals,
    selectedDate,
    isSaving,
    isLoading,
    lastSavedAt,
    hasUnsavedChanges,

    // Meal operations
    addMeal,
    addMealFromRecipe,

    // Persistence
    loadMeals,
    saveMeals,
    formatTimeAgo,

    // Setup
    setupAutoSave,
  };
}
