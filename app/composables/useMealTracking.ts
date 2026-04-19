import type { TrackedMeal, EditableIngredient } from '~/types/types';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';
import { formatLogicalDate } from '~/utils/format/logicalDate';
import { getMealNutrition } from '~/utils/tracking/getMealNutrition';

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

  async function addMealFromTemplate(templateId: number) {
    const template = await $fetch<TrackedMeal>('/api/tracking/templates/add-to-day', {
      method: 'POST',
      body: {
        templateId,
        date: formatDate(selectedDate.value),
        materialize: false,
      },
    });

    trackedMeals.value.push({
      ...template,
      id: undefined,
      collapsed: true,
      is_template: false,
    });
  }

  // Helper: Format date for DB queries (YYYY-MM-DD)
  function formatDate(date: Date): string {
    return formatLogicalDate(date);
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

      let { data: mealsData, error } = await supabase
        .from('tracked_meals')
        .select(
          `
          id,
          meal_name,
          collapsed,
          uses_recipe_id,
          uses_meal_id,
          is_template,
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
        .eq('user_id', user.value.sub)
        .eq('meal_date', formatDate(date))
        .not('is_template', 'is', true)
        .order('meal_order', { ascending: true });

      if (error) throw error;

      let meals = mealsData as any[];

      if (formatDate(date) === formatDate(new Date())) {
        const materialized = await $fetch<{ inserted: number }>('/api/tracking/materialize-schedules', {
          method: 'POST',
          body: {
            date: formatDate(date),
          },
        });

        if ((materialized.inserted ?? 0) > 0) {
          const retry = await supabase
            .from('tracked_meals')
            .select(
              `
              id,
              meal_name,
              collapsed,
              uses_recipe_id,
              uses_meal_id,
              is_template,
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
            .eq('user_id', user.value.sub)
            .eq('meal_date', formatDate(date))
            .not('is_template', 'is', true)
            .order('meal_order', { ascending: true });

          if (retry.error) throw retry.error;
          meals = (retry.data ?? []) as any[];
        }
      }

      if (meals && meals.length > 0) {
        const transformedMeals: TrackedMeal[] = meals.map((meal) => {
          const sortedFoods = (meal.tracked_meal_foods || []).sort(
            (a: any, b: any) => (a.food_order ?? 0) - (b.food_order ?? 0),
          );
          return {
            id: meal.id,
            name: meal.meal_name,
            recipe_id: meal.uses_recipe_id ?? undefined,
            uses_meal_id: meal.uses_meal_id ?? undefined,
            is_template: meal.is_template ?? false,
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

  async function saveMeals() {
    if (!user.value || !hasUnsavedChanges.value) return;

    try {
      isSaving.value = true;

      // Delete all existing meals for this date
      const { error: deleteError } = await supabase
        .from('tracked_meals')
        .delete()
        .eq('user_id', user.value.sub)
        .eq('meal_date', formatDate(selectedDate.value))
        .not('is_template', 'is', true);

      if (deleteError) throw deleteError;

      // Re-insert all meals
      for (
        let mealIndex = 0;
        mealIndex < trackedMeals.value.length;
        mealIndex++
      ) {
        const meal = trackedMeals.value[mealIndex]!;

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
            user_id: user.value.sub,
            meal_name: meal.name || 'Untitled Meal',
            meal_date: formatDate(selectedDate.value),
            collapsed: meal.collapsed,
            meal_order: mealIndex,
            is_template: false,
            uses_meal_id: meal.uses_meal_id ?? null,
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
    addMealFromTemplate,
    getMealNutrition,

    // Persistence
    loadMeals,
    saveMeals,
    formatTimeAgo,

    // Setup
    setupAutoSave,
  };
}
