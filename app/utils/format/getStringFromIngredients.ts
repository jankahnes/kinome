import groupIngredients from './groupIngredients';
import { getStringFromIngredient } from './getStringFromIngredient';

export default function getStringFromIngredients(
  ingredients: any,
  serves?: number
) {
  const servesN = serves || 1;
  const groupedIngredients = groupIngredients(ingredients);

  const getIngredientsString = (ingredients: any[]) => {
    return (
      ingredients
        ?.map((ingredient) => getStringFromIngredient(ingredient, servesN))
        .join('\n') ?? ''
    );
  };
  let ingredientsString = '';
  for (const [category, group] of Object.entries(groupedIngredients)) {
    if (category === 'uncategorized') {
      ingredientsString += getIngredientsString(group) + '\n';
    } else {
      ingredientsString += `\n${category}:\n`;
      ingredientsString += getIngredientsString(group) + '\n';
    }
  }
  return ingredientsString;
}
