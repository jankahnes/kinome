import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Food,
  FoodNameRow,
  FoodRow,
  FoodRowNullable,
} from '~/types/types';
import buildQuery from '~/utils/db/getters/buildQuery';
import { expectSingle } from '~/utils/db/getters/expectSingle';
import type { GetterOpts } from '~/types/types';
import type { NonNullableProps } from '~/types/types';
import pluralizeWord from '~/utils/format/pluralizeWord';
import singularizeWord from '~/utils/format/singularizeWord';

function fillNullNumbers<T extends Record<string, any>>(
  obj: T
): NonNullableProps<T> {
  const result = { ...obj } as NonNullableProps<T>;
  for (const key in result) {
    if (key === 'report') continue;
    if (result[key] === null) {
      result[key] = 0 as any;
    }
  }
  return result;
}

export async function getFoods(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<FoodRow[]> {
  let query = client.from('foods').select(`*`);
  query = buildQuery(query, opts);
  const { data, error } = await query;
  if (error) throw error;

  const foods = data as FoodRowNullable[];
  const foodsNonNull: FoodRow[] = foods.map((food) => {
    food.countable_units = food.countable_units as Record<string, number>;
    return fillNullNumbers(food) as FoodRow;
  });

  return foodsNonNull satisfies FoodRow[];
}

export async function getFood(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<FoodRow> {
  return expectSingle(await getFoods(client, opts));
}

const formatDescription = (
  rawDescription: string | null,
  foodData: FoodRowNullable,
  currentName: string
): string => {
  if (!rawDescription) return '';

  // Check the second word of the description to determine if we should pluralize/singularize
  const words = rawDescription.trim().split(/\s+/);
  let nameToUse = currentName;

  if (words.length >= 2) {
    const secondWord = words[1].toLowerCase();
    if (secondWord === 'are') {
      nameToUse = pluralizeWord(currentName);
    } else if (secondWord === 'is') {
      nameToUse = singularizeWord(currentName);
    }
  }

  let processed = rawDescription.replace(/\[name\]/g, nameToUse);

  processed = processed
    .replace(/\[(.*?)\]/g, (match, key) => {
      const val = foodData[key as keyof FoodRowNullable];
      if (val !== undefined && val !== null) {
        return val;
      }
      return match;
    })
    .replace(/[\[\]]/g, '');

  return processed;
};

export async function getFoodNames(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<Food[]> {
  // Corrected Query: Fetches food -> joins swaps table -> joins food_names of swap -> joins food data of swap
  let query = client.from('food_names').select(`
    *,
    food:foods(
      *,
      swaps:foods_healthier_swap_suggestions(
          swap_food:food_names(*,
          food:foods(
            id,
            hidx,
            mnidx,
            fiber_score,
            protective_score,
            protein_score,
            fat_profile_score,
            salt_score,
            sugar_score,
            satiety
          )
        )
      )
    )
  `);

  query = buildQuery(query, opts);

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  // Type assertion for the complex join structure
  const foodNames = data as (FoodNameRow & {
    food: FoodRowNullable & {
      swaps?: {
        swap_food: FoodNameRow & {
          food: {
            id: number;
            hidx: number;
            mnidx: number;
            fiber_score: number;
            protective_score: number;
            protein_score: number;
            fat_profile_score: number;
            salt_score: number;
            sugar_score: number;
            satiety: number;
          };
        };
      }[];
    };
  })[];

  const foodNamesNonNull: Food[] = foodNames.map((foodName) => {
    const food = foodName.food;

    food.countable_units = food.countable_units as Record<string, number>;

    if (food.description) {
      food.description = formatDescription(
        food.description,
        food,
        foodName.name
      );
    }

    const processedSwaps =
      food.swaps
        ?.map((joinRow) => {
          const swapFoodName = joinRow.swap_food;
          if (!swapFoodName || !swapFoodName.food) return null;

          const swapFood = swapFoodName.food;

          return {
            id: swapFoodName.id,
            name: swapFoodName.name,
            hidx: swapFood.hidx,
            mnidx: swapFood.mnidx,
            fiber_score: swapFood.fiber_score,
            protective_score: swapFood.protective_score,
            protein_score: swapFood.protein_score,
            fat_profile_score: swapFood.fat_profile_score,
            salt_score: swapFood.salt_score,
            sugar_score: swapFood.sugar_score,
            satiety: swapFood.satiety,
          };
        })
        .filter(Boolean) || [];

    (food as any).suggested_swaps = processedSwaps;
    delete (food as any).swaps;

    return fillNullNumbers(foodName) as Food;
  });

  return foodNamesNonNull satisfies Food[];
}

export async function getFoodName(
  client: SupabaseClient,
  opts: GetterOpts = {}
): Promise<Food> {
  return expectSingle(await getFoodNames(client, opts));
}

export function postprocessBrandedFood(brandedFood: BrandedFood): BrandedFood {
  if (!brandedFood.food_name) {
    return brandedFood;
  }
  const overwritingFields = [
    'kcal',
    'protein',
    'fat',
    'carbohydrates',
    'fiber',
    'sugar',
    'saturated_fat',
    'salt',
    'nova',
  ];
  const brandedFoodNonNull: BrandedFood = {
    ...brandedFood,
    food_name: brandedFood.food_name
      ? {
          ...brandedFood.food_name,
          food: {
            ...brandedFood.food_name.food,
            id: brandedFood.food_name.id,
            countable_units: brandedFood.food_name.food
              .countable_units as Record<string, number>,
          },
        }
      : undefined,
  } as BrandedFood;
  if (brandedFood.food_name?.food.aisle == 'Produce') {
    // we can assume that these wont have a nutrition label
    const food = brandedFoodNonNull.food_name!.food;
    for (const field of overwritingFields) {
      const value = food[field as keyof FullFoodRow];
      (brandedFoodNonNull as Record<string, any>)[field] = value;
    }
  } else if (brandedFoodNonNull?.food_name) {
    const food = brandedFoodNonNull.food_name.food;
    for (const field of overwritingFields) {
      const value = brandedFood[field as keyof BrandedFood];
      if (value !== null && value !== undefined) {
        (food as Record<string, any>)[field] = value;
      }
    }
  }
  return brandedFoodNonNull;
}

export async function getBrandedFood(
  client: SupabaseClient,
  barcode: string
): Promise<BrandedFood | null> {
  const response = await client
    .from('branded_foods')
    .select(
      `
    *,
    food_name:food_names(
      id,
      name,
      food:foods(
        *
      )
    )
  `
    )
    .eq('barcode', barcode);
  if (response.error || !response.data) throw response.error;
  const brandedFood = response.data[0] as BrandedFood;
  if (!brandedFood) {
    return null;
  }

  return postprocessBrandedFood(brandedFood) as BrandedFood;
}
