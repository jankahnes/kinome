import { evaluateCrowdPleaserForRecipe, handleFirstRatingGiven, maybeAwardRatingReceived } from '../gamification/service';

export default async function handleRate(client: any, personaUserId: string, payload: any) {
    const { recipe_id, rating } = payload;
    if (!recipe_id) throw new Error('recipe_id required');
    if (rating == null || rating < 1 || rating > 5)
      throw new Error('rating must be 1-5');
  
    const [{ data: existing }, { data: recipe, error: recipeError }] =
      await Promise.all([
        client
          .from('ratings')
          .select('id')
          .eq('user_id', personaUserId)
          .eq('recipe_id', recipe_id)
          .maybeSingle(),
        client
          .from('recipes')
          .select('id, user_id')
          .eq('id', recipe_id)
          .maybeSingle(),
      ]);
  
    if (recipeError || !recipe) throw new Error('Recipe not found');
  
    const { error } = await client
      .from('ratings')
      .upsert(
        { user_id: personaUserId, recipe_id, rating },
        { onConflict: 'user_id,recipe_id' },
      );
  
    if (error) throw new Error('Failed to upsert rating');
  
    const firstRating = !existing?.id;
    if (firstRating) {
      await handleFirstRatingGiven(client, personaUserId, recipe_id);
      await maybeAwardRatingReceived(
        client,
        recipe.user_id,
        personaUserId,
        recipe_id,
      );
    }
  
    await evaluateCrowdPleaserForRecipe(client, recipe_id);
  
    return { ok: true, firstRating };
  }