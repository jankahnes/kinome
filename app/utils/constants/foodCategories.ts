type FoodCategory = {
  slug: string;
  label: string;
};

type FoodCategoryGroup = {
  title: string;
  categories: FoodCategory[];
};

export const FOOD_CATEGORY_GROUPS: FoodCategoryGroup[] = [
  {
    title: 'Fruits & Vegetables',
    categories: [
      { slug: 'fruit_pome', label: 'Pome fruit' },
      { slug: 'fruit_citrus', label: 'Citrus' },
      { slug: 'fruit_stone', label: 'Stone fruit' },
      { slug: 'fruit_tropical', label: 'Tropical' },
      { slug: 'fruit_berry', label: 'Berries' },
      { slug: 'veg_leafy', label: 'Leafy greens' },
      { slug: 'veg_cruciferous', label: 'Cruciferous' },
      { slug: 'veg_root', label: 'Root veg' },
      { slug: 'veg_nightshade', label: 'Nightshade' },
      { slug: 'veg_squash', label: 'Squash' },
      { slug: 'veg_fungi', label: 'Mushroom' },
      { slug: 'veg_allium', label: 'Allium' },
      { slug: 'herb_fresh', label: 'Fresh herbs' },
    ],
  },
  {
    title: 'Grains & Starches',
    categories: [
      { slug: 'grain_rice', label: 'Rice' },
      { slug: 'grain_pasta', label: 'Pasta' },
      { slug: 'grain_bread', label: 'Bread' },
      { slug: 'grain_flatbread', label: 'Flatbread' },
      { slug: 'grain_pastry', label: 'Pastry' },
      { slug: 'grain_cereal', label: 'Cereal' },
      { slug: 'starch_potato', label: 'Potato' },
    ],
  },
  {
    title: 'Proteins',
    categories: [
      { slug: 'meat_poultry', label: 'Poultry' },
      { slug: 'meat_red_raw', label: 'Red meat' },
      { slug: 'meat_red_processed', label: 'Cured meat' },
      { slug: 'seafood_fish', label: 'Fish' },
      { slug: 'seafood_shellfish', label: 'Shellfish' },
      { slug: 'protein_egg', label: 'Eggs' },
      { slug: 'protein_plant', label: 'Plant protein' },
      { slug: 'legume_bean', label: 'Beans' },
    ],
  },
  {
    title: 'Dairy & Fats',
    categories: [
      { slug: 'dairy_milk', label: 'Milk' },
      { slug: 'dairy_cheese_hard', label: 'Hard cheese' },
      { slug: 'dairy_cheese_soft', label: 'Soft cheese' },
      { slug: 'dairy_yogurt', label: 'Yogurt' },
      { slug: 'dairy_fat', label: 'Butter & cream' },
      { slug: 'fat_oil', label: 'Cooking oils' },
      { slug: 'nut_seed', label: 'Nuts & seeds' },
    ],
  },
  {
    title: 'Pantry',
    categories: [
      { slug: 'condiment_sauce', label: 'Sauces' },
      { slug: 'condiment_spice', label: 'Spices' },
      { slug: 'baking_sweet', label: 'Sweet baking' },
      { slug: 'baking_dry', label: 'Dry baking' },
    ],
  },
  {
    title: 'Snacks & Meals',
    categories: [
      { slug: 'snack_salty', label: 'Salty snacks' },
      { slug: 'snack_sweet', label: 'Sweet snacks' },
      { slug: 'meal_soup', label: 'Soup' },
      { slug: 'meal_prepared', label: 'Prepared meals' },
    ],
  },
  {
    title: 'Drinks',
    categories: [
      { slug: 'bev_water', label: 'Water' },
      { slug: 'bev_coffee_tea', label: 'Coffee & tea' },
      { slug: 'bev_soda_juice', label: 'Soda & juice' },
      { slug: 'bev_alcohol', label: 'Alcohol' },
    ],
  },
];

export const FOOD_CATEGORY_COUNT = FOOD_CATEGORY_GROUPS.reduce(
  (sum, g) => sum + g.categories.length,
  0,
);

export const FOOD_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  FOOD_CATEGORY_GROUPS.flatMap((g) =>
    g.categories.map((c) => [c.slug, c.label]),
  ),
);
