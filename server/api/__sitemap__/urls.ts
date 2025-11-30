import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const supabase = createClient(
    config.public.supabase.url,
    config.supabase.serviceKey
  );

  const urls: any[] = [];

  // Fetch recipes in batches
  let recipeOffset = 0;
  const recipeBatchSize = 1000;
  let hasMoreRecipes = true;

  while (hasMoreRecipes) {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, created_at, picture')
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
          lastmod: recipe.created_at,
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
      .select('id, name, created_at')
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
          lastmod: food.created_at,
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

  // Fetch profiles in batches
  let profileOffset = 0;
  const profileBatchSize = 1000;
  let hasMoreProfiles = true;

  while (hasMoreProfiles) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .not('username', 'is', null)
      .range(profileOffset, profileOffset + profileBatchSize - 1);

    if (error) {
      console.error('Error fetching profiles:', error);
      hasMoreProfiles = false;
      continue;
    }

    if (profiles && profiles.length > 0) {
      profiles.forEach((profile: any) => {
        const slug = profile.username
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
        urls.push({
          loc: `/profile/${profile.id}-${slug}`,
          lastmod: profile.created_at,
          changefreq: 'weekly',
          priority: 0.5,
        });
      });
      profileOffset += profileBatchSize;
      hasMoreProfiles = profiles.length === profileBatchSize;
    } else {
      hasMoreProfiles = false;
    }
  }

  return urls;
});
