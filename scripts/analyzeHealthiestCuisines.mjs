import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const CUISINES = {
  'traditional-american': 'American',
  'traditional-basque': 'Basque',
  'traditional-brazilian': 'Brazilian',
  'traditional-british': 'British',
  'traditional-chinese': 'Chinese',
  'traditional-eastern-european': 'Eastern European',
  'traditional-egyptian': 'Egyptian',
  'traditional-ethiopian': 'Ethiopian',
  'traditional-french': 'French',
  'traditional-german': 'German',
  'traditional-greek': 'Greek',
  'traditional-indian': 'Indian',
  'traditional-italian': 'Italian',
  'traditional-japanese': 'Japanese',
  'traditional-korean': 'Korean',
  'traditional-malaysian': 'Malaysian',
  'traditional-mexican': 'Mexican',
  'traditional-middle-eastern': 'Middle Eastern',
  'traditional-moroccan-maghreb': 'Moroccan/Maghreb',
  'traditional-portuguese': 'Portuguese',
  'traditional-russian': 'Russian',
  'traditional-scandinavian': 'Scandinavian',
  'traditional-south-african': 'South African',
  'traditional-spanish': 'Spanish',
  'traditional-thai': 'Thai',
  'traditional-turkish': 'Turkish',
  'traditional-vietnamese': 'Vietnamese',
  'traditional-west-african': 'West African',
};

// Keep clearly meal-like type tags, while excluding desserts, drinks, sauces,
// condiments, breakfasts, snacks, and other non-main categories.
const INCLUDED_MAIN_TAGS = new Set([
  200, // main/dinner
  205, // lunch
  207, // soup
  208, // salad
  210, // wrap
  211, // bowl
  212, // stir fry
  213, // pasta/noodles
  214, // sandwich
  216, // casserole
  222, // curry
  223, // pizza
  228, // burger
]);

const EXCLUDED_NON_MAIN_TAGS = new Set([
  201, // breakfast
  202, // side
  203, // snack
  204, // dessert
  206, // appetizer
  209, // drink
  215, // dip
  218, // savory baked good / bread
  219, // sweet baked good
  220, // sauce
  221, // marinade
  224, // smoothie
  225, // broth/stock
  226, // seasoning/spice blend
  227, // jam/preserve
]);

const METRICS = [
  'hidx',
  'mnidx',
  'fiber_score',
  'sugar_score',
  'fat_profile_score',
  'salt_score',
  'sidx',
  'protein_score',
  'protective_score',
  'processing_level_score',
  'kcal',
  'fiber',
  'sugar',
  'salt',
  'protein',
  'fat',
  'saturated_fat',
];

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.NUXT_PRIVATE_SERVICE_ROLE_KEY,
);

function hasAny(tags, set) {
  return tags.some((tag) => set.has(tag));
}

async function fetchAllRecipes() {
  const collections = Object.keys(CUISINES);
  const rows = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        'id,title,collection,local_relevancy,hidx,mnidx,fiber_score,sugar_score,fat_profile_score,salt_score,sidx,protein_score,protective_score,processing_level_score,kcal,fiber,sugar,salt,protein,fat,saturated_fat',
      )
      .in('collection', collections)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }

  return rows;
}

async function fetchTags(recipeIds) {
  const rows = [];
  const chunkSize = 100;

  for (let i = 0; i < recipeIds.length; i += chunkSize) {
    const chunk = recipeIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('recipe_tags')
      .select('recipe_id,tag_id')
      .in('recipe_id', chunk);

    if (error) throw error;
    rows.push(...data);
  }

  return rows;
}

function buildCuisineTable(recipes, tagsByRecipe) {
  const filtered = recipes.filter((recipe) => {
    const typeTags = (tagsByRecipe.get(recipe.id) ?? []).filter(
      (tag) => tag >= 200 && tag < 300,
    );

    return (
      hasAny(typeTags, INCLUDED_MAIN_TAGS) &&
      !hasAny(typeTags, EXCLUDED_NON_MAIN_TAGS)
    );
  });

  const groups = new Map();
  for (const recipe of filtered) {
    const weight = Math.max(0, recipe.local_relevancy ?? 0);
    if (!groups.has(recipe.collection)) {
      groups.set(recipe.collection, {
        count: 0,
        weight: 0,
        sums: Object.fromEntries(METRICS.map((metric) => [metric, 0])),
      });
    }

    const group = groups.get(recipe.collection);
    group.count += 1;
    group.weight += weight;
    for (const metric of METRICS) {
      group.sums[metric] += (recipe[metric] ?? 0) * weight;
    }
  }

  return {
    filteredCount: filtered.length,
    table: [...groups.entries()]
      .map(([collection, group]) => {
        const averages = {};
        for (const metric of METRICS) {
          averages[metric] = group.sums[metric] / group.weight;
        }

        return {
          cuisine: CUISINES[collection],
          count: group.count,
          ...averages,
        };
      })
      .sort((a, b) => b.hidx - a.hidx),
  };
}

async function main() {
  const recipes = await fetchAllRecipes();
  const tags = await fetchTags(recipes.map((recipe) => recipe.id));
  const tagsByRecipe = new Map();

  for (const tag of tags) {
    if (!tagsByRecipe.has(tag.recipe_id)) tagsByRecipe.set(tag.recipe_id, []);
    tagsByRecipe.get(tag.recipe_id).push(tag.tag_id);
  }

  const { filteredCount, table } = buildCuisineTable(recipes, tagsByRecipe);

  console.log(`Traditional recipes: ${recipes.length}`);
  console.log(`Main dishes after filtering: ${filteredCount}`);
  console.log('');
  console.log(
    [
      'rank',
      'cuisine',
      'count',
      'hidx',
      'fiber_g',
      'sugar_g',
      'salt_g',
      'fat_g',
      'sat_fat_g',
      'kcal',
      'processing_score',
      'fiber_score',
      'sugar_score',
      'salt_score',
      'fat_score',
      'protein_score',
      'mnidx',
      'protective_score',
      'satiety',
    ].join('\t'),
  );

  table.forEach((row, index) => {
    console.log(
      [
        index + 1,
        row.cuisine,
        row.count,
        row.hidx.toFixed(1),
        row.fiber.toFixed(1),
        row.sugar.toFixed(1),
        row.salt.toFixed(2),
        row.fat.toFixed(1),
        row.saturated_fat.toFixed(1),
        row.kcal.toFixed(0),
        row.processing_level_score.toFixed(1),
        row.fiber_score.toFixed(1),
        row.sugar_score.toFixed(1),
        row.salt_score.toFixed(1),
        row.fat_profile_score.toFixed(1),
        row.protein_score.toFixed(1),
        row.mnidx.toFixed(1),
        row.protective_score.toFixed(1),
        row.sidx.toFixed(1),
      ].join('\t'),
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
