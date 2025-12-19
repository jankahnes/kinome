import type { TrackedMeal, EditableTrackingItem } from '~/types/types';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';

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

  // Input ref management
  const inputRefs = ref<Map<string, any>>(new Map());

  function setInputRef(mealIndex: number, ingredientIndex: number, el: any) {
    if (el) {
      inputRefs.value.set(`${mealIndex}-${ingredientIndex}`, el);
    }
  }

  function focusNextInput(
    currentMealIndex: number,
    currentIngredientIndex: number
  ) {
    nextTick(() => {
      // Try next ingredient in same meal
      const nextIngredientIndex = currentIngredientIndex + 1;
      if (
        trackedMeals.value[currentMealIndex]?.editableIngredients[
          nextIngredientIndex
        ]
      ) {
        const ref = inputRefs.value.get(
          `${currentMealIndex}-${nextIngredientIndex}`
        );
        ref?.focus();
        return;
      }

      // Try first ingredient in next meal
      const nextMealIndex = currentMealIndex + 1;
      if (
        trackedMeals.value[nextMealIndex] &&
        !trackedMeals.value[nextMealIndex].collapsed &&
        trackedMeals.value[nextMealIndex].editableIngredients.length > 0
      ) {
        const ref = inputRefs.value.get(`${nextMealIndex}-0`);
        ref?.focus();
        return;
      }

      // If no next input, ensure there's an empty one and focus it
      if (trackedMeals.value[currentMealIndex]) {
        const meal = trackedMeals.value[currentMealIndex];
        const emptyInputs = meal.editableIngredients.filter(
          (ing) => !ing.rawText.trim()
        );
        if (emptyInputs.length === 0) {
          meal.editableIngredients.push({
            rawText: '',
            displayText: '',
          });
          nextTick(() => {
            const newIndex = meal.editableIngredients.length - 1;
            const ref = inputRefs.value.get(`${currentMealIndex}-${newIndex}`);
            ref?.focus();
          });
        }
      }
    });
  }

  // Meal operations
  function addMeal(mealName: string) {
    trackedMeals.value.push({
      mealName,
      editableIngredients: [],
      collapsed: false,
    });
  }

  async function addMealFromRecipe(recipeId: number) {
    const recipe = await getRecipe(supabase, { eq: { id: recipeId } });
    const computableRecipe = await convertUploadableToComputable(
      recipe,
      supabase,
      true,
      1
    );

    const editableTrackingItems: EditableTrackingItem[] =
      computableRecipe.fullIngredients.map((ingredient) => {
        const displayText = `${ingredient.amount}${
          ingredient.unit?.toLowerCase() || ''
        } ${ingredient.name}`;
        return {
          rawText: displayText,
          displayText,
          amount: ingredient.amount,
          unit: ingredient.unit,
          foodNameId: ingredient.id,
          ingredientName: ingredient.name,
          foodData: ingredient as any,
        };
      });

    trackedMeals.value.push({
      mealName: recipe.title,
      recipe_id: recipeId,
      editableIngredients: editableTrackingItems,
      collapsed: true,
    });
  }

  function removeMeal(index: number) {
    trackedMeals.value.splice(index, 1);
  }

  function deleteIngredient(mealIndex: number, ingredientIndex: number) {
    trackedMeals.value[mealIndex].editableIngredients.splice(
      ingredientIndex,
      1
    );
  }

  function ensureOneEmptyInput() {
    for (const meal of trackedMeals.value) {
      const emptyInputs = meal.editableIngredients.filter(
        (ingredient) => ingredient.rawText.trim() === ''
      );
      if (emptyInputs.length === 0) {
        meal.editableIngredients.push({
          rawText: '',
          displayText: '',
        });
      }
    }
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

  // Helper: Transform DB food to EditableTrackingItem
  function dbFoodToEditableItem(food: any): EditableTrackingItem {
    const processedBrandedFood = food.branded_food
      ? postprocessBrandedFood(food.branded_food)
      : null;

    let unitName = food.unit?.toLowerCase() || '';
    if (isCountable(food.unit) && food.amount != 1 && food.unit) {
      unitName = pluralizeWord(unitName);
    }

    const ingredientName = processedBrandedFood?.product_name
      ? `${processedBrandedFood.brand ?? ''} ${
          processedBrandedFood.product_name
        }`.trim()
      : food.food_name?.name || '';

    const displayText = `${food.amount}${unitName} ${ingredientName}`;

    return {
      rawText: food.raw_text || '',
      displayText,
      amount: food.amount || undefined,
      unit: food.unit || undefined,
      foodNameId: processedBrandedFood?.food_name?.id || food.food_name?.id,
      ingredientName,
      foodData: processedBrandedFood?.food_name?.food || food.food_name?.food,
      brandedFood: processedBrandedFood || undefined,
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
            food_name:food_names(*, food:foods(*)),
            branded_food:branded_foods(*, food_name:food_names(id, name, food:foods(*))),
            amount,
            unit,
            raw_text,
            food_order
          )
        `
        )
        .eq('user_id', user.value.id)
        .eq('meal_date', formatDate(date))
        .order('meal_order', { ascending: true });

      if (error) throw error;

      // Type assertion to avoid deep type instantiation
      const meals = mealsData as any[];

      if (meals && meals.length > 0) {
        // Transform DB data to TrackedMeal format
        const transformedMeals: TrackedMeal[] = [];

        for (const meal of meals) {
          const foods = meal.tracked_meal_foods || [];
          const sortedFoods = foods.sort(
            (a: any, b: any) => (a.food_order ?? 0) - (b.food_order ?? 0)
          );

          const editableIngredients: EditableTrackingItem[] =
            sortedFoods.map(dbFoodToEditableItem);

          transformedMeals.push({
            id: meal.id,
            mealName: meal.meal_name,
            collapsed: meal.collapsed ?? false,
            editableIngredients,
          });
        }

        trackedMeals.value = transformedMeals;
      } else {
        // No meals for this date, start with empty "Other" meal
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
          (ing) => ing.rawText?.trim() && ing.foodNameId
        );

        if (validIngredients.length === 0 && !meal.mealName.trim()) {
          continue; // Skip completely empty meals
        }

        // Insert meal
        const { data: insertedMeal, error: mealError } = await supabase
          .from('tracked_meals')
          .insert({
            user_id: user.value.id,
            meal_name: meal.mealName || 'Untitled Meal',
            meal_date: formatDate(selectedDate.value),
            collapsed: meal.collapsed,
            meal_order: mealIndex,
          })
          .select()
          .single();

        if (mealError) throw mealError;

        // Update local id
        meal.id = insertedMeal.id;

        // Insert foods for this meal
        if (validIngredients.length > 0) {
          const foodsToInsert = validIngredients.map(
            (ing, foodIndex: number) => ({
              tracked_meal_id: insertedMeal.id,
              food_id: ing.foodNameId || null,
              branded_food_barcode: ing.brandedFood?.barcode || null,
              amount: ing.amount,
              unit: ing.unit,
              raw_text: ing.rawText,
              food_order: foodIndex,
            })
          );

          const { error: foodsError } = await supabase
            .from('tracked_meal_foods')
            .insert(foodsToInsert);

          if (foodsError) throw foodsError;
        }
      }

      hasUnsavedChanges.value = false;
      lastSavedAt.value = new Date();
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
      { deep: true }
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

    // Input refs
    inputRefs,
    setInputRef,
    focusNextInput,

    // Meal operations
    addMeal,
    addMealFromRecipe,
    removeMeal,
    deleteIngredient,
    ensureOneEmptyInput,

    // Persistence
    loadMeals,
    saveMeals,
    formatTimeAgo,

    // Setup
    setupAutoSave,
  };
}
