import { evaluateCrowdPleaserForRecipe, handleFirstBookmarkCreated, maybeAwardSaveReceived } from '../gamification/service';

export default async function handleSave(client: any, personaUserId: string, payload: any) {
    const { recipe_id, bookmarked = true } = payload;
    if (!recipe_id) throw new Error('recipe_id required');
  
    const { data: recipe, error: recipeError } = await client
      .from('recipes')
      .select('id, user_id')
      .eq('id', recipe_id)
      .maybeSingle();
  
    if (recipeError || !recipe) throw new Error('Recipe not found');
  
    if (!bookmarked) {
      await client
        .from('bookmarks')
        .delete()
        .eq('user_id', personaUserId)
        .eq('recipe_id', recipe_id);
      return { ok: true, bookmarked: false };
    }
  
    const { data: existing } = await client
      .from('bookmarks')
      .select('id')
      .eq('user_id', personaUserId)
      .eq('recipe_id', recipe_id)
      .maybeSingle();
  
    if (!existing?.id) {
      const { error } = await client
        .from('bookmarks')
        .insert({ user_id: personaUserId, recipe_id });
      if (error) throw new Error('Failed to insert bookmark');
      await handleFirstBookmarkCreated(client, personaUserId, recipe_id);
      await maybeAwardSaveReceived(
        client,
        recipe.user_id,
        personaUserId,
        recipe_id,
      );
    }
  
    await evaluateCrowdPleaserForRecipe(client, recipe_id);
  
    return { ok: true, bookmarked: true };
  }