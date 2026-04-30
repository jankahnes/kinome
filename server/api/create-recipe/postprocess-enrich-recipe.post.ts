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

type EnrichRecipeBody = {
  recipeId: number;
  uploadableRecipe: UploadableRecipe;
  instructions: string[];
  equipment_tag_ids: number[];
  authCookie: string;
  authHeader: string;
};

function isPhaseBQualified(recipe: {
  source_type: string | null;
  visibility: string | null;
  embedding: string | null;
  full_instructions: any;
  total_time_mins: number | null;
  full_nutritional_processing: boolean | null;
  picture: string | null;
  instructions: string[] | null;
}) {
  if (recipe.visibility === 'PUBLIC') {
    return { qualified: false, reason: 'already_public' };
  }

  const isMediaOrWebsite =
    recipe.source_type === 'MEDIA' || recipe.source_type === 'WEBSITE';
  if (isMediaOrWebsite) {
    const isMissingPhaseBField =
      !recipe.embedding ||
      !recipe.full_instructions ||
      recipe.full_nutritional_processing !== true;
    return {
      qualified: isMissingPhaseBField,
      reason: isMissingPhaseBField
        ? 'missing_phase_b_fields'
        : 'already_enriched',
    };
  }

  const hasInstructions =
    Array.isArray(recipe.instructions) && recipe.instructions.length > 0;
  const qualified = Boolean(recipe.picture && hasInstructions);
  return {
    qualified,
    reason: qualified ? 'picture_with_instructions' : 'not_qualified',
  };
}

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
  const input = (await readBody(event)) as EnrichRecipeBody;
  const {
    recipeId,
    uploadableRecipe,
    instructions,
    equipment_tag_ids,
    authCookie,
    authHeader,
  } = input;

  const supabase = serverSupabaseServiceRole<Database>(event);
  const config = useRuntimeConfig();
  const authHeaders = {
    cookie: authCookie,
    authorization: config.bypassAuth
      ? `Bearer ${config.bypassAuth}`
      : authHeader,
  };

  const { data: recipeState, error: recipeStateError } = await supabase
    .from('recipes')
    .select(
      'source_type, visibility, embedding, full_instructions, full_nutritional_processing, picture, instructions, total_time_mins',
    )
    .eq('id', recipeId)
    .single();

  if (recipeStateError || !recipeState) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Recipe not found',
    });
  }

  const qualification = isPhaseBQualified(recipeState as any);
  if (!qualification.qualified) {
    console.log(
      `🔍 [Phase B] Skipping recipe ${recipeId}: ${qualification.reason}`,
    );
    return { status: 'skipped', reason: qualification.reason };
  }

  // Confirm PUBLISH_PENDING + stamp start time at the beginning of each run.
  // publish_start is used client-side to detect a stuck Phase B (> 5 mins).
  await supabase
    .from('recipes')
    .update({ visibility: 'PUBLISH_PENDING' as any, publish_start: new Date().toISOString() } as any)
    .eq('id', recipeId);

  console.log(`🔍 [Phase B] Enriching recipe ${recipeId}`);

  // Step 1: Generate rich steps from Phase A instructions
  let enriched: { steps: any[]; estimated_total_time: number };
  if (recipeState.full_instructions && recipeState.total_time_mins != null) {
    console.log(`🔍 [Phase B] Rich steps already exist, skipping`);
    enriched = {
      steps: recipeState.full_instructions as any[],
      estimated_total_time: recipeState.total_time_mins,
    };
  } else {
    enriched = (await $fetch('/api/create-recipe/formalize-cook-steps', {
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
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update recipe steps',
      });
    }
  }
  const enrichedUploadableRecipe = uploadableRecipe as UploadableRecipe & {
    full_instructions?: any[];
    total_time_mins?: number | null;
  };
  enrichedUploadableRecipe.full_instructions = enriched.steps;
  enrichedUploadableRecipe.total_time_mins = enriched.estimated_total_time;

  // Step 2: Generate and store embedding before the final PUBLIC upload
  if (recipeState.embedding) {
    console.log(`🔍 [Phase B] Embedding already exists, skipping`);
  } else {
    console.log(`🔍 [Phase B] Generating embedding for recipe ${recipeId}`);
    const { data: recipeTagRows } = await supabase
      .from('recipe_tags')
      .select('tag_id')
      .eq('recipe_id', recipeId);

    const tagIds = recipeTagRows?.map((r) => r.tag_id) ?? [];
    const inputText = buildEmbeddingText(enrichedUploadableRecipe as any, tagIds);

    const embedding = (await $fetch('/api/search/embed', {
      method: 'POST',
      body: { query: inputText },
    })) as number[];

    const { error: embeddingError } = await supabase
      .from('recipes')
      .update({ embedding } as any)
      .eq('id', recipeId);

    if (embeddingError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update recipe embedding',
      });
    }
    console.log(`✅ [Phase B] Embedding stored for recipe ${recipeId}`);
  }

  // Step 3: Full nutrition recalculation → sets visibility PUBLIC
  console.log(`🔍 [Phase B] Running full nutrition calculation`);
  const computableRecipe = await convertUploadableToComputable(
    enrichedUploadableRecipe,
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
        mode: 'update',
      },
    },
  );

  if ((nutritionResponse as any).status !== 'ok') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Full nutrition upload failed',
    });
  }

  // Step 4: Re-insert equipment tags (upload-processed-recipe wipes all tags)
  if (equipment_tag_ids.length > 0) {
    const { error: tagError } = await supabase
      .from('recipe_tags')
      .upsert(
        equipment_tag_ids.map((tag_id) => ({
          recipe_id: recipeId,
          tag_id,
        })) as any,
        { ignoreDuplicates: true },
      );
    if (tagError) {
      console.error('🔍 [Phase B] Failed to upsert equipment tags:', tagError);
    }
  }

  console.log(`✅ [Phase B] Recipe ${recipeId} fully enriched and set PUBLIC`);
  return { status: 'ok' };
});
