import { serverSupabaseServiceRole } from '#supabase/server';
import { Database } from '~/types/supabase';
import { UploadableRecipe } from '~/types/types';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';
import { TAGS } from '~/utils/constants/tags';

const APPLIANCES_FOR_EMBEDDING = [
  'air fryer',
  'slow cooker',
  'instant pot',
  'pressure cooker',
  'thermomix',
  'sous vide',
  'blender',
  'food processor',
  'stand mixer',
  'waffle maker',
  'rice cooker',
  'dehydrator',
];

function buildEmbeddingText(
  recipe: UploadableRecipe & {
    source_type?: string | null;
    source?: string | null;
    video_metadata?: Record<string, any> | null;
  },
  tagIds: number[],
): string {
  const tags = tagIds
    .map((id) => TAGS.find((t) => t.id === id))
    .filter(Boolean) as typeof TAGS;
  const generalTags = tags.filter((t) => t.id < 300);
  const cuisineTags = tags.filter((t) => t.id >= 300 && t.id < 400);

  const lines: string[] = [];

  lines.push(`Recipe title: ${recipe.title}`);

  if (recipe.description) {
    lines.push(`Description: ${recipe.description}`);
  }

  const ingredientNames = [
    ...new Set(
      recipe.ingredients
        .map((i: any) => i.name_original || i.name || i.primary_name)
        .filter(Boolean),
    ),
  ];
  if (ingredientNames.length) {
    lines.push(`Ingredients: ${ingredientNames.join(', ')}`);
  }

  if (generalTags.length) {
    lines.push(`Tags: ${generalTags.map((t) => t.name).join(', ')}`);
  }

  const mediaUrl = recipe.video_metadata?.url ?? recipe.source;
  if (recipe.source_type === 'MEDIA' && mediaUrl) {
    try {
      const hostname = new URL(mediaUrl).hostname
        .replace(/^www\./, '')
        .split('.')[0];
      lines.push(`Source: From a video on ${hostname}`);
    } catch {}
  }

  if (cuisineTags.length) {
    lines.push(`Cuisine: ${cuisineTags[0]!.name} cuisine`);
  }

  if (recipe.video_metadata?.title) {
    lines.push(
      `Original title on social media: ${recipe.video_metadata.title}`,
    );
  }

  const instructionsText =
    ((recipe as any).instructions as string[] | undefined)
      ?.join(' ')
      .toLowerCase() ?? '';
  const foundAppliances = APPLIANCES_FOR_EMBEDDING.filter((a) =>
    instructionsText.includes(a),
  );
  if (foundAppliances.length) {
    lines.push(`Appliances: ${foundAppliances.join(', ')}`);
  }

  return lines.join('\n');
}

export default defineEventHandler(async (event) => {
  const input = await readBody(event);
  const {
    recipeId,
    uploadableRecipe,
    instructions,
    equipment_tag_ids,
    authCookie,
    authHeader,
  }: {
    recipeId: number;
    uploadableRecipe: UploadableRecipe;
    instructions: string[];
    equipment_tag_ids: number[];
    authCookie: string;
    authHeader: string;
  } = input;

  const supabase = serverSupabaseServiceRole<Database>(event);
  const authHeaders = { cookie: authCookie, authorization: authHeader };

  console.log(`🔍 [Phase B] Enriching recipe ${recipeId}`);

  // Step 1: Generate rich steps from Phase A instructions
  const enriched = (await $fetch('/api/create-recipe/formalize-cook-steps', {
    method: 'POST',
    body: {
      title: uploadableRecipe.title,
      instructions,
      ingredients: uploadableRecipe.ingredients,
    },
  })) as { steps: any[]; estimated_total_time: number };

  console.log(`🔍 [Phase B] Rich steps generated, updating recipe`);

  const { error: stepsError } = await supabase
    .from('recipes')
    .update({
      full_instructions: enriched.steps,
      total_time_mins: enriched.estimated_total_time,
    })
    .eq('id', recipeId);

  if (stepsError) {
    console.error('🔍 [Phase B] Failed to update steps:', stepsError);
  }

  // Step 2: Full nutrition recalculation → sets visibility PUBLIC
  console.log(`🔍 [Phase B] Running full nutrition calculation`);
  const computableRecipe = await convertUploadableToComputable(
    uploadableRecipe,
    supabase,
  );

  const nutritionResponse = await $fetch(
    '/api/create-recipe/upload-processed-recipe',
    {
      method: 'POST',
      headers: authHeaders,
      body: {
        ...computableRecipe,
        full: true,
      },
    },
  );

  if ((nutritionResponse as any).status !== 'ok') {
    console.error('🔍 [Phase B] Full nutrition upload failed');
    return { status: 'error' };
  }

  // Step 3: Re-insert equipment tags (upload-processed-recipe wipes all tags)
  if (equipment_tag_ids.length > 0) {
    const { error: tagError } = await supabase
      .from('recipe_tags')
      .insert(
        equipment_tag_ids.map((tag_id) => ({
          recipe_id: recipeId,
          tag_id,
        })) as any,
      );
    if (tagError) {
      console.error('🔍 [Phase B] Failed to insert equipment tags:', tagError);
    }
  }

  // Step 4: Generate and store embedding
  console.log(`🔍 [Phase B] Generating embedding for recipe ${recipeId}`);
  try {
    const { data: recipeTagRows } = await supabase
      .from('recipe_tags')
      .select('tag_id')
      .eq('recipe_id', recipeId);

    const tagIds = recipeTagRows?.map((r) => r.tag_id) ?? [];
    const inputText = buildEmbeddingText(uploadableRecipe as any, tagIds);

    const embedding = (await $fetch('/api/search/embed', {
      method: 'POST',
      body: { query: inputText },
    })) as number[];

    await supabase
      .from('recipes')
      .update({ embedding } as any)
      .eq('id', recipeId);
    console.log(`✅ [Phase B] Embedding stored for recipe ${recipeId}`);
  } catch (err) {
    console.error(`🔍 [Phase B] Embedding failed for recipe ${recipeId}:`, err);
  }

  console.log(`✅ [Phase B] Recipe ${recipeId} fully enriched and set PUBLIC`);
  return { status: 'ok' };
});
