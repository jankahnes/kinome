import { serverSupabaseServiceRole } from '#supabase/server';
import { Database } from '~/types/supabase';
import { RecipeRow, UploadableRecipe } from '~/types/types';
import convertUploadableToComputable from '~~/server/utils/convertUploadableToComputable';

// WEBSITE: uncomment to auto-enrich and publish website imports (same pipeline as MEDIA)
const FULL_PROCESSING_SOURCES = ['MEDIA' /*, 'WEBSITE'*/];

export default defineEventHandler(async (event) => {
  const input = await readBody(event);
  const { recipeId, jobId }: { recipeId: number; jobId?: number } = input;
  const supabase = serverSupabaseServiceRole<Database>(event);
  const headers = getRequestHeaders(event);

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

  // ── Phase A: Step 1 — Formalize ingredients ──────────────────────────────
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

  // ── Phase A: Step 2 — Basic nutrition (UNLISTED) ─────────────────────────
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
        authorization: headers.authorization || '',
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

  // ── Phase A: Step 3 — Formalize instructions + extract equipment ──────────
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

  // ── Phase A: Step 4 — Insert equipment tags ───────────────────────────────
  if (equipment_tag_ids.length > 0) {
    console.log(`🔍 [Phase A] Inserting equipment tags: ${equipment_tag_ids}`);
    const { error: tagError } = await supabase
      .from('recipe_tags')
      .insert(
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
        | { outcome: 'duplicate'; canonicalId: number }
        | { outcome: 'variation'; canonicalId: number }
        | { outcome: 'unrelated' };

      if (detection.outcome === 'duplicate') {
        console.log(
          `🔍 Recipe ${recipeId} absorbed as duplicate into ${detection.canonicalId}; recipe deleted, skipping Phase B`,
        );
        return {
          status: 'ok',
          outcome: 'duplicate',
          canonicalId: detection.canonicalId,
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
      `🔍 Firing Phase B for recipe ${recipeId} (${baseRecipe.source_type})`,
    );
    $fetch('/api/create-recipe/postprocess-enrich-recipe', {
      method: 'POST',
      body: {
        recipeId,
        uploadableRecipe,
        instructions,
        equipment_tag_ids,
        authCookie: headers.cookie || '',
        authHeader: headers.authorization || '',
      },
    }).catch((err) => {
      console.error(`🔍 [Phase B] Failed for recipe ${recipeId}:`, err);
    });
  }

  return { status: 'ok' };
});
