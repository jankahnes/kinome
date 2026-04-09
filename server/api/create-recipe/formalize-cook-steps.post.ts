import extractJson from '~/utils/format/extractJson';

interface CookStepRequestBody {
  title: string;
  instructions?: string[] | null;
  ingredients: {
    id: number;
    name?: string | null;
    name_original?: string | null;
    primary_name?: string | null;
    preparation_description?: string | null;
  }[];
}

const BASE_INSTRUCTIONS_BLOCK = `
Phase A instructions — use these as a guide for step order and technique, but write the rich formatted steps in your own detailed style:

{instructions}
`;

export default defineEventHandler(async (event) => {
  const assets = useStorage('assets:server');
  const body = (await readBody(event)) as CookStepRequestBody;

  const ingredientsString = body.ingredients
    .map((ingredient) => {
      const name =
        ingredient.name_original || ingredient.name || ingredient.primary_name;
      const prep = ingredient.preparation_description
        ? ` (${ingredient.preparation_description})`
        : '';
      return `${name}${prep}, ID ${ingredient.id}`;
    })
    .join(';\n');

  const hasInstructions = body.instructions && body.instructions.length > 0;

  const baseInstructionsBlock = hasInstructions
    ? BASE_INSTRUCTIONS_BLOCK.replace(
        '{instructions}',
        body.instructions!.join('\n')
      )
    : '';

  const prompt = (await assets.getItem(
    'recipe-create/desc-and-formatted-instructions-from-ingredients.txt'
  )) as string;

  const message = prompt
    .replace('{title_info}', body.title)
    .replace('{ingredient_list}', ingredientsString)
    .replace('{base_instructions}', baseInstructionsBlock);

  const response = await $fetch('/api/gpt/response', {
    method: 'POST',
    body: {
      message,
      type: 'accurate',
      schemaKey: 'recipeFormattedInstructions',
    },
  });

  if (!response) {
    throw new Error('No response from GPT');
  }

  const jsonString = extractJson(response as string);
  if (!jsonString) {
    throw new Error('No JSON found in cook steps response');
  }

  const result = JSON.parse(jsonString);
  return {
    steps: result.steps.map((step: any) => {
      const { timers, tip, ...rest } = step;
      return {
        ...rest,
        ...(timers == null ? {} : { timers }),
        ...(tip == null ? {} : { tip }),
      };
    }),
    estimated_total_time: result.estimated_total_time as number,
  };
});
