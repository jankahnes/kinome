import { createClient } from '@supabase/supabase-js';

const RECIPE_LASTMOD_FLOOR = '2026-04-01';

function getMaxLastmod(createdAt?: string | null) {
  if (!createdAt) {
    return RECIPE_LASTMOD_FLOOR;
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return RECIPE_LASTMOD_FLOOR;
  }

  const createdDay = createdDate.toISOString().slice(0, 10);
  return createdDay > RECIPE_LASTMOD_FLOOR ? createdDay : RECIPE_LASTMOD_FLOOR;
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const supabase = createClient(
    config.public.supabase.url,
    config.supabase.secretKey,
  );

  const urls: any[] = [];

  // Fetch recipes in batches
  let recipeOffset = 0;
  const recipeBatchSize = 1000;
  let hasMoreRecipes = true;

  while (hasMoreRecipes) {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, picture, created_at')
      .eq('visibility', 'PUBLIC')
      .range(recipeOffset, recipeOffset + recipeBatchSize - 1);

    if (error) {
      console.error('Error fetching recipes:', error);
      hasMoreRecipes = false;
      continue;
    }

    if (recipes && recipes.length > 0) {
      recipes.forEach((recipe: any) => {
        const slug = recipe.title
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
        const urlEntry: any = {
          loc: `/recipe/${recipe.id}-${slug}`,
          lastmod: getMaxLastmod(recipe.created_at),
          changefreq: 'weekly',
          priority: 0.8,
        };

        if (recipe.picture) {
          urlEntry.images = [
            {
              loc: recipe.picture,
              title: recipe.title,
            },
          ];
        }

        urls.push(urlEntry);
      });
      recipeOffset += recipeBatchSize;
      hasMoreRecipes = recipes.length === recipeBatchSize;
    } else {
      hasMoreRecipes = false;
    }
  }

  // Fetch foods in batches
  let foodOffset = 0;
  const foodBatchSize = 1000;
  let hasMoreFoods = true;

  while (hasMoreFoods) {
    const { data: foods, error } = await supabase
      .from('food_names')
      .select('id, name')
      .eq('is_primary', true)
      .range(foodOffset, foodOffset + foodBatchSize - 1);

    if (error) {
      console.error('Error fetching foods:', error);
      hasMoreFoods = false;
      continue;
    }

    if (foods && foods.length > 0) {
      foods.forEach((food: any) => {
        const slug = food.name
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
        urls.push({
          loc: `/foods/${food.id}-${slug}`,
          lastmod: '2026-04-01',
          changefreq: 'monthly',
          priority: 0.6,
        });
      });
      foodOffset += foodBatchSize;
      hasMoreFoods = foods.length === foodBatchSize;
    } else {
      hasMoreFoods = false;
    }
  }

  urls.push(
    {
      loc: '/articles/healthiest-cuisines-ranked',
      lastmod: '2026-04-01',
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: '/articles/how-health-scores-work',
      lastmod: '2026-04-01',
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: '/articles/psychology-of-recipe-saving',
      lastmod: '2026-04-01',
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: '/articles/why-nobody-talks-about-fiber',
      lastmod: '2026-04-01',
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: '/articles/protein-is-overrated',
      lastmod: '2026-04-01',
      changefreq: 'monthly',
      priority: 0.8,
    },
  );

  return urls;
});
