import extractJson from '~/utils/format/extractJson';
import { UploadableRecipe } from '~/types/types';

const BASE_INSTRUCTIONS_BLOCK = `The recipe source includes these instructions. Use them as a guide for technique and step order, but write the instructions entirely in your own words. Do not copy phrases or sentence structure.

Source instructions:
{instructions}
`;

export default defineEventHandler(async (event) => {
  const assets = useStorage('assets:server');
  const recipe: UploadableRecipe = await readBody(event);

  const ingredientsString = recipe.ingredients
    .map((ingredient: any) => {
      const name = ingredient.name_original || ingredient.name || ingredient.primary_name;
      const prep = ingredient.preparation_description ? ` (${ingredient.preparation_description})` : '';
      return `${name}${prep}`;
    })
    .join(';\n');

  const baseInstructionsBlock =
    recipe.instructions?.length
      ? BASE_INSTRUCTIONS_BLOCK.replace('{instructions}', recipe.instructions.join('\n'))
      : '';

  const prompt = (await assets.getItem(
    'recipe-create/desc-and-instructions-from-ingredients.txt'
  )) as string;

  const message = prompt
    .replace('{title_info}', recipe.title ?? '')
    .replace('{ingredient_list}', ingredientsString)
    .replace('{base_instructions}', baseInstructionsBlock);

  const response = await $fetch('/api/gpt/response', {
    method: 'POST',
    body: {
      message,
      type: 'default',
      schemaKey: 'recipeDescriptionInstructions',
    },
  });

  if (!response) {
    throw new Error('No response from GPT for formalize-instructions');
  }

  const jsonString = extractJson(response as string);
  if (!jsonString) {
    throw new Error('No JSON found in formalize-instructions response');
  }

  const result = JSON.parse(jsonString);
  return {
    description: result.description as string,
    instructions: result.instructions as string[],
    equipment_tag_ids: (result.equipment_tag_ids ?? []) as number[],
  };
});
