import { serverSupabaseServiceRole } from '#supabase/server';
import { Database } from '~/types/supabase';
import { RecipeRow, UploadableRecipe } from '~/types/types';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';

const FULL_PROCESSING_SOURCES = ['MEDIA', 'WEBSITE'];

async function enqueuePhaseB(event: any, body: Record<string, any>) {
  const qstashUrl = process.env.NUXT_PUBLIC_QSTASH_URL?.replace(/\/$/, '');
  const qstashToken = process.env.NUXT_PRIVATE_QSTASH_TOKEN;

  if (!qstashUrl || !qstashToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'QStash is not configured',
    });
  }

  const origin = "https://kinome.app"
  const destinationUrl = `${origin}/api/create-recipe/postprocess-enrich-recipe`;
  const publishUrl = `${qstashUrl}/v2/publish/${destinationUrl}`;
  let response: Response;

  try {
    response = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        'Content-Type': 'application/json',
        'Upstash-Delay': '15s',
        'Upstash-Retries': '1',
      },
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    console.error('Failed to reach QStash while enqueueing Phase B', {
      publishUrl,
      destinationUrl,
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
    });
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to enqueue Phase B: ${error?.message || 'network error'}`,
    });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('QStash rejected Phase B enqueue', {
      publishUrl,
      destinationUrl,
      status: response.status,
      statusText: response.statusText,
      body: text,
    });
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to enqueue Phase B: ${response.status} ${text}`,
    });
  }

  return await response.json().catch(() => ({}));
}

export default defineEventHandler(async (event) => {
  const input = await readBody(event);
  const { recipeId, jobId }: { recipeId: number; jobId?: number } = input;
  const supabase = serverSupabaseServiceRole<Database>(event);
  const headers = getRequestHeaders(event);
  const config = useRuntimeConfig();
  const bypassAuthorization = config.bypassAuth
    ? `Bearer ${config.bypassAuth}`
    : undefined;

  const { data: baseRecipe }: { data: RecipeRow | null } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (!baseRecipe || !baseRecipe.base_ingredients_serves) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Recipe not found or missing required field: serves',
    });
  }

  // Mark PUBLISH_PENDING immediately for full-processing sources so the UI
  // shows "processing" during Phase A, not the wrong "unlisted" checklist.
  if (FULL_PROCESSING_SOURCES.includes(baseRecipe.source_type ?? '')) {
    await supabase
      .from('recipes')
      .update({ visibility: 'PUBLISH_PENDING' as any })
      .eq('id', recipeId);
  }

  // ── Phase A: Step 1 - Formalize ingredients ──────────────────────────────
  console.log('🔍 [Phase A] Formalizing ingredients');
  if (jobId) {
    await supabase
      .from('jobs')
      .update({
        step: 'formalizing_ingredients',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }

  const { ingredients, notes } = await $fetch(
    '/api/create-recipe/formalize-ingredients',
    {
      method: 'POST',
      body: {
        base_ingredients: baseRecipe.base_ingredients?.join('\n'),
        recipe_context_string: baseRecipe.title,
        jobId,
      },
    },
  );

  if (
    !ingredients?.length ||
    ingredients.some(
      (ingredient: any) =>
        ingredient.id === null || ingredient.id === undefined,
    )
  ) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to formalize ingredients.',
    });
  }

  // ── Phase A: Step 2 - Basic nutrition (UNLISTED) ─────────────────────────
  console.log('🔍 [Phase A] Calculating basic nutrition');
  const uploadableRecipe: UploadableRecipe = {
    ...baseRecipe,
    serves: baseRecipe.base_ingredients_serves,
    ingredients,
    notes,
  };

  const computableRecipe = await convertUploadableToComputable(
    uploadableRecipe,
    supabase,
  );

  const nutritionResponse = await $fetch(
    '/api/create-recipe/upload-processed-recipe',
    {
      method: 'POST',
      headers: {
        cookie: headers.cookie || '',
        authorization: bypassAuthorization || headers.authorization || '',
      },
      body: { ...computableRecipe, full: false },
    },
  );

  if ((nutritionResponse as any).status !== 'ok') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload recipe nutrition',
    });
  }

  // ── Phase A: Step 3 - Formalize instructions + extract equipment ──────────
  console.log('🔍 [Phase A] Formalizing instructions');
  if (jobId) {
    await supabase
      .from('jobs')
      .update({
        step: 'formalizing_instructions',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }

  const { description, instructions, equipment_tag_ids } = (await $fetch(
    '/api/create-recipe/formalize-instructions',
    {
      method: 'POST',
      body: { ...uploadableRecipe },
    },
  )) as {
    description: string;
    instructions: string[];
    equipment_tag_ids: number[];
  };

  // Carry Phase A outputs into uploadableRecipe so Phase B has fresh data for embedding
  uploadableRecipe.description = description;
  (uploadableRecipe as any).instructions = instructions;

  const { error: updateError } = await supabase
    .from('recipes')
    .update({ description, instructions })
    .eq('id', recipeId);

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update recipe description and instructions',
    });
  }

  // ── Phase A: Step 4 - Insert equipment tags ───────────────────────────────
  if (equipment_tag_ids.length > 0) {
    console.log(`🔍 [Phase A] Inserting equipment tags: ${equipment_tag_ids}`);
    const { error: tagError } = await supabase.from('recipe_tags').insert(
      equipment_tag_ids.map((tag_id) => ({
        recipe_id: recipeId,
        tag_id,
      })) as any,
    );
    if (tagError) {
      console.error('🔍 [Phase A] Failed to insert equipment tags:', tagError);
    }
  }

  // ── Phase A complete ──────────────────────────────────────────────────────
  console.log('✅ [Phase A] Complete');

  // ── Variation detection (MEDIA/WEBSITE only) ──────────────────────────────
  const isFullProcessing = FULL_PROCESSING_SOURCES.includes(
    baseRecipe.source_type ?? '',
  );

  if (isFullProcessing) {
    try {
      const detection = (await $fetch('/api/create-recipe/detect-variation', {
        method: 'POST',
        body: { recipeId, jobId },
      })) as
        | { outcome: 'duplicate'; canonicalId: number; targetRecipeId?: number }
        | { outcome: 'variation'; canonicalId: number }
        | { outcome: 'unrelated' };

      if (detection.outcome === 'duplicate') {
        const targetRecipeId =
          detection.targetRecipeId ?? detection.canonicalId;
        console.log(
          `🔍 Recipe ${recipeId} absorbed as duplicate into ${targetRecipeId}; recipe deleted, skipping Phase B`,
        );
        return {
          status: 'ok',
          outcome: 'duplicate',
          canonicalId: detection.canonicalId,
          targetRecipeId,
        };
      }
      if (detection.outcome === 'variation') {
        console.log(
          `🔍 Recipe ${recipeId} flagged as variation of ${detection.canonicalId}`,
        );
      }
    } catch (err) {
      console.error('🔍 [Phase A] Variation detection failed:', err);
      // Continue with Phase B even if detection fails
    }
  }

  if (jobId) {
    await supabase.from('jobs').delete().eq('id', jobId);
  }

  // ── Fire Phase B for full-processing sources (no await) ───────────────────
  if (isFullProcessing) {
    console.log(
      `🔍 Enqueueing Phase B for recipe ${recipeId} (${baseRecipe.source_type})`,
    );
    await enqueuePhaseB(event, {
      recipeId,
      uploadableRecipe,
      instructions,
      equipment_tag_ids,
      authCookie: headers.cookie || '',
      authHeader: headers.authorization || '',
    });
  }

  return { status: 'ok' };
});
