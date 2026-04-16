export const getPublishingRequirements = (
  recipe: { instructions?: string[] | null; picture?: string | null } | null
) => {
  if (!recipe) return { hasInstructions: false, hasPicture: false };

  const hasInstructions = Boolean(
    recipe.instructions?.length &&
    recipe.instructions.some((i) => i.trim() !== '') &&
    recipe.instructions.some((i) => i.trim().split(' ').length > 2)
  );

  return {
    hasInstructions,
    hasPicture: Boolean(recipe.picture),
  };
};
