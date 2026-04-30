export default async function handleCreateRecipe(
    client: any,
    personaUserId: string,
    payload: any,
    config: any,
  ) {
    const { title, description, ingredients, instructions, serves } = payload;
    if (!title) throw new Error('title required');
    if (!Array.isArray(ingredients) || ingredients.length === 0)
      throw new Error('ingredients required');
    if (!serves || serves < 1) throw new Error('serves required');
  
    const baseRecipe = {
      title,
      description: description ?? '',
      base_ingredients: ingredients,
      instructions: instructions ?? null,
      serves,
      source_type: 'TITLE',
      source: null,
      picture: null,
    };
  
    const uploadResult = (await $fetch('/api/create-recipe/upload-base-recipe', {
      method: 'POST',
      headers: { 'x-agent-secret': config.agentInternalSecret },
      body: { baseRecipe, internal_user_id: personaUserId },
    })) as any;
  
    const recipeId = uploadResult.id;
  
    await $fetch('/api/create-recipe/postprocess-base-recipe', {
      method: 'POST',
      body: { recipeId },
    }).catch((err) => console.error('[agent-action] postprocess error:', err));
  
    return { recipe_id: recipeId, title };
  }