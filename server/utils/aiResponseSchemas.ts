import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const nullableNumber = z.number().nullable();
const nullableInteger = z.number().int().nullable();
const nullableString = z.string().nullable();
const countableUnitsSchema = z.array(
  z.object({
    unit_name: z.string(),
    weight_grams: z.number().positive(),
  }),
);

const aisleValues = [
  'Produce',
  'Bakery',
  'Dairy',
  'Meat',
  'Seafood',
  'Deli / Prepared Foods & Cheeses',
  'Other Refrigerated',
  'Condiments & Sauces',
  'Canned Goods',
  'Spices',
  'Baking',
  'Pasta, Rice & Grains',
  'Cereal & Breakfast',
  'Candy & Snacks',
  'Other Dry Goods & Pantry',
  'Frozen',
  'International',
  'Special Diets/Health',
  'Beverages',
  'Other',
] as const;

const visualCategoryValues = [
  'fruit_pome',
  'fruit_citrus',
  'fruit_stone',
  'fruit_tropical',
  'fruit_berry',
  'veg_leafy',
  'veg_cruciferous',
  'veg_root',
  'veg_nightshade',
  'veg_squash',
  'veg_fungi',
  'veg_allium',
  'herb_fresh',
  'grain_rice',
  'grain_pasta',
  'grain_bread',
  'grain_flatbread',
  'grain_pastry',
  'grain_cereal',
  'starch_potato',
  'meat_poultry',
  'meat_red_raw',
  'meat_red_processed',
  'seafood_fish',
  'seafood_shellfish',
  'protein_egg',
  'protein_plant',
  'legume_bean',
  'dairy_milk',
  'dairy_cheese_hard',
  'dairy_cheese_soft',
  'dairy_yogurt',
  'dairy_fat',
  'fat_oil',
  'nut_seed',
  'condiment_sauce',
  'condiment_spice',
  'baking_sweet',
  'baking_dry',
  'snack_salty',
  'snack_sweet',
  'meal_soup',
  'meal_prepared',
  'bev_water',
  'bev_coffee_tea',
  'bev_soda_juice',
  'bev_alcohol',
  'other',
] as const;

const recipeStepTypeValues = [
  'prep',
  'preheat_pan',
  'preheat_oven',
  'wash',
  'knifework',
  'marinate',
  'immersion-blender',
  'jug-blender',
  'season',
  'sear',
  'cook-sauce',
  'pan-fry',
  'stir-fry',
  'deep-fry',
  'boil/simmer',
  'bake/roast/broil',
  'grill',
  'steam',
  'mix/whisk',
  'wait/rest/proof',
  'chill/freeze',
  'drain',
  'deglaze',
  'reduce',
  'serve/garnish/assemble',
] as const;

export const brandedFoodNutritionLabelSchema = z.object({
  kcal: nullableNumber,
  fat: nullableNumber,
  saturated_fat: nullableNumber,
  carbohydrates: nullableNumber,
  sugar: nullableNumber,
  protein: nullableNumber,
  fiber: nullableNumber,
  salt: nullableNumber,
  error: nullableString,
});

export const brandedFoodGenericMatchSchema = z.object({
  generic_name: z.string(),
  confidence: z.number(),
});

export const foodContextSchema = z.object({
  vegan: z.boolean(),
  vegetarian: z.boolean(),
  gluten_free: z.boolean(),
  lactose_free: z.boolean(),
  density: z.number(),
  nova: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  price: z.number(),
  gi: z.number().int(),
});

export const foodGeneralAminoSchema = z.object({
  kcal: z.number(),
  protein: z.number(),
  carbohydrates: z.number(),
  sugar: z.number(),
  fat: z.number(),
  saturated_fat: z.number(),
  fiber: z.number(),
  salt: z.number(),
  histidine_mg: z.number(),
  isoleucine_mg: z.number(),
  leucine_mg: z.number(),
  lysine_mg: z.number(),
  methionine_mg: z.number(),
  phenylalanine_mg: z.number(),
  threonine_mg: z.number(),
  tryptophan_mg: z.number(),
  valine_mg: z.number(),
  tyrosine_mg: z.number(),
  cysteine_mg: z.number(),
  polyphenols: z.number(),
  glucosinolates: z.number(),
  carotenoids: z.number(),
});

export const foodMicronutrientsSchema = z.object({
  iron_mg: z.number(),
  magnesium_mg: z.number(),
  zinc_mg: z.number(),
  calcium_mg: z.number(),
  potassium_mg: z.number(),
  selenium_ug: z.number(),
  iodine_ug: z.number(),
  copper_mg: z.number(),
  manganese_mg: z.number(),
  vitamin_a_ug_rae: z.number(),
  thiamine_b1_mg: z.number(),
  riboflavin_b2_mg: z.number(),
  niacin_b3_mg: z.number(),
  vitamin_b6_mg: z.number(),
  folate_ug_dfe: z.number(),
  vitamin_b12_ug: z.number(),
  vitamin_c_mg: z.number(),
  vitamin_d_ug: z.number(),
  vitamin_e_mg_alpha_te: z.number(),
  vitamin_k_ug: z.number(),
  choline_mg: z.number(),
  mufas_total_mg: z.number(),
  omega6_total_mg: z.number(),
  omega3_total_mg: z.number(),
  trans_fats_mg: z.number(),
});

export const foodUnitsAndAisleSchema = z.object({
  countable_units: countableUnitsSchema,
  aisle: z.enum(aisleValues),
});

export const foodWikiFieldsSchema = z.object({
  visual_category: z.enum(visualCategoryValues),
  suggested_healthier_swaps: z.array(z.string()),
  description: z.string(),
});

export const foodMatchSearchRelatedSchema = z.object({
  search_terms: z.array(z.string()),
});

export const foodMatchJudgeResultsSchema = z.object({
  judgement: z.enum(['add_as_alias', 'add_as_new', 'reject']),
  matching_id: nullableInteger,
  query_name: z.string(),
  primary_name: nullableString,
  other_names: z.array(z.string()).nullable(),
});

export const recipeFormattedInstructionsSchema = z.object({
  estimated_total_time: z.number().int(),
  steps: z.array(
    z.object({
      title: z.string(),
      formatted_text: z.string(),
      type: z.enum(recipeStepTypeValues),
      step_time: z.number().int(),
      timers: z.array(z.number().int()).nullable(),
      tip: nullableString,
    }),
  ),
});

export const recipeDescriptionInstructionsSchema = z.object({
  description: z.string(),
  instructions: z.array(z.string()),
  equipment_tag_ids: z.array(z.number().int()),
});

export const recipeIngredientFormalizationSchema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string(),
      extra: nullableString,
      unit: z.string(),
      amount: z.number(),
      category: nullableString,
    }),
  ),
});

export const recipeIngredientsFromTitleSchema = z.object({
  ingredients: z.string(),
  serves: z.number().int(),
});

export const recipePictureParsingSchema = z.object({
  title: z.string(),
  base_ingredients: z.string(),
  instructions: z.array(z.string()).nullable(),
  description: nullableString,
  serves: z.number().int(),
  use_as_image: z.boolean().nullable(),
  error: nullableString,
});

export const recipeUnitReconciliationSchema = z.object({
  action: z.enum(['match', 'create']),
  unit_name: z.string(),
  weight_grams: nullableNumber,
});

export const recipeHydrationConsumptionSchema = z.object({
  overall_yield_multiplier: z.number(),
  ingredients_not_fully_consumed: z.array(
    z.object({
      ingredient_id: z.number().int(),
      consumption_factor: z.number(),
    }),
  ),
});

export const recipeProcessingSchema = z.object({
  processing_info: z.array(
    z.object({
      ingredient_name: z.string(),
      ingredient_id: z.number().int(),
      thermal_intensity: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
      heat_medium: z.enum(['WET', 'DRY', 'FAT', 'RADIATION']).nullable(),
      mechanical_disruption: z.union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
      ]),
    }),
  ),
});

export const recipeSaltFatSchema = z.object({
  saltiness: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  added_fat: z.number(),
});

export const recipeTagsSchema = z.object({
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  effort: z.enum(['LIGHT', 'MODERATE', 'HEAVY']),
  tags: z.array(z.number().int()),
});

export const recipeVariationClassificationSchema = z.object({
  classification: z.enum(['duplicate', 'variation', 'unrelated']),
  variation_name: nullableString,
  variation_summary: nullableString,
  variation_display_name: z.boolean(),
});

export const recipeFlavorProfileSchema = z.object({
  flavor_spicy: z.number().int().min(0).max(10),
  flavor_sweet: z.number().int().min(0).max(10),
  flavor_umami: z.number().int().min(0).max(10),
  flavor_fresh: z.number().int().min(0).max(10),
  exoticness: z.number().int().min(0).max(10),
  complexity: z.number().int().min(0).max(10),
});

export const aiResponseSchemas = {
  brandedFoodNutritionLabel: zodTextFormat(
    brandedFoodNutritionLabelSchema,
    'branded_food_nutrition_label',
  ),
  brandedFoodGenericMatch: zodTextFormat(
    brandedFoodGenericMatchSchema,
    'branded_food_generic_match',
  ),
  foodContext: zodTextFormat(foodContextSchema, 'food_context'),
  foodGeneralAmino: zodTextFormat(foodGeneralAminoSchema, 'food_general_amino'),
  foodMicronutrients: zodTextFormat(
    foodMicronutrientsSchema,
    'food_micronutrients',
  ),
  foodUnitsAndAisle: zodTextFormat(
    foodUnitsAndAisleSchema,
    'food_units_and_aisle',
  ),
  foodWikiFields: zodTextFormat(foodWikiFieldsSchema, 'food_wiki_fields'),
  foodMatchSearchRelated: zodTextFormat(
    foodMatchSearchRelatedSchema,
    'food_match_search_related',
  ),
  foodMatchJudgeResults: zodTextFormat(
    foodMatchJudgeResultsSchema,
    'food_match_judge_results',
  ),
  recipeFormattedInstructions: zodTextFormat(
    recipeFormattedInstructionsSchema,
    'recipe_formatted_instructions',
  ),
  recipeDescriptionInstructions: zodTextFormat(
    recipeDescriptionInstructionsSchema,
    'recipe_description_instructions',
  ),
  recipeIngredientFormalization: zodTextFormat(
    recipeIngredientFormalizationSchema,
    'recipe_ingredient_formalization',
  ),
  recipeIngredientsFromTitle: zodTextFormat(
    recipeIngredientsFromTitleSchema,
    'recipe_ingredients_from_title',
  ),
  recipePictureParsing: zodTextFormat(
    recipePictureParsingSchema,
    'recipe_picture_parsing',
  ),
  recipeUnitReconciliation: zodTextFormat(
    recipeUnitReconciliationSchema,
    'recipe_unit_reconciliation',
  ),
  recipeHydrationConsumption: zodTextFormat(
    recipeHydrationConsumptionSchema,
    'recipe_hydration_consumption',
  ),
  recipeProcessing: zodTextFormat(recipeProcessingSchema, 'recipe_processing'),
  recipeFlavorProfile: zodTextFormat(
    recipeFlavorProfileSchema,
    'recipe_flavor_profile',
  ),
  recipeSaltFat: zodTextFormat(recipeSaltFatSchema, 'recipe_salt_fat'),
  recipeTags: zodTextFormat(recipeTagsSchema, 'recipe_tags'),
  recipeVariationClassification: zodTextFormat(
    recipeVariationClassificationSchema,
    'recipe_variation_classification',
  ),
} as const;

export type AiResponseSchemaKey = keyof typeof aiResponseSchemas;

export function getAiResponseSchema(schemaKey?: AiResponseSchemaKey) {
  if (!schemaKey) {
    throw new Error('schemaKey is required for AI response calls');
  }

  const schema = aiResponseSchemas[schemaKey];
  if (!schema) {
    throw new Error(`Unknown AI response schema key: ${schemaKey}`);
  }

  return schema;
}
