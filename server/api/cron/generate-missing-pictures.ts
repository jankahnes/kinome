import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';
import removeInstructionFormatting from '~/utils/format/removeInstructionFormatting';

const MAX_RECIPES_PER_CALL = 1;
const PROCESSING_PREFIX = 'PROCESSING:';
const LEGACY_PROCESSING_VALUE = 'PROCESSING';
const PROCESSING_STALE_AFTER_MS = 10 * 60 * 1000;

function getProcessingMarker(runId: string) {
  return `${PROCESSING_PREFIX}${runId}:${Date.now()}`;
}

function isStaleProcessingPicture(picture: string | null) {
  if (picture === LEGACY_PROCESSING_VALUE) return true;
  if (!picture?.startsWith(PROCESSING_PREFIX)) return false;

  const timestampText = picture.split(':').pop();
  const timestamp = Number(timestampText);
  if (!Number.isFinite(timestamp)) return true;

  return Date.now() - timestamp > PROCESSING_STALE_AFTER_MS;
}

function isMissingPictureForCron(picture: string | null) {
  return !picture || isStaleProcessingPicture(picture);
}

function toClientSafeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Unknown error';
}

export default defineEventHandler(async (event) => {
  // Verify this is coming from Vercel Cron (they send CRON_SECRET automatically)
  const authHeader = getHeader(event, 'authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const client = serverSupabaseServiceRole<Database>(event);
  const logs: string[] = [];
  const runId = crypto.randomUUID();
  let logRowId: number | null = null;

  const log = (msg: string) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    logs.push(entry);
  };

  const logError = (msg: string) => {
    const entry = `[${new Date().toISOString()}] ERROR: ${msg}`;
    console.error(entry);
    logs.push(entry);
  };

  const persistLogs = async () => {
    if (logRowId == null) {
      const { data, error } = await client
        .from('temp_cron_logs')
        .insert({ logs })
        .select('id')
        .single();

      if (error) throw error;
      logRowId = data.id;
      return;
    }

    const { error } = await client
      .from('temp_cron_logs')
      .update({ logs })
      .eq('id', logRowId);

    if (error) throw error;
  };

  try {
    log(`Cron job started (runId=${runId})`);
    await persistLogs();

    // Fetch top 100 recipes sorted by relevancy
    const { data: allRecipes, error } = await client
      .from('recipes')
      .select(
        'id, title, instructions, collection, picture, source_type, source',
      )
      .eq('visibility', 'PUBLIC')
      .order('relevancy', { ascending: false })
      .limit(100);

    if (error) {
      logError(`Error fetching recipes: ${JSON.stringify(error)}`);
      await persistLogs();
      throw error;
    }

    if (!allRecipes || allRecipes.length === 0) {
      log('No recipes found');
      await persistLogs();
      return {
        success: true,
        message: 'No recipes found',
        processed: 0,
        logId: logRowId,
      };
    }

    // Filter to only recipes without pictures or with stale processing markers
    const candidateRecipes = allRecipes
      .filter((recipe) => isMissingPictureForCron(recipe.picture))
      .slice(0, MAX_RECIPES_PER_CALL * 10);

    if (candidateRecipes.length === 0) {
      log('All top 100 recipes already have pictures');
      await persistLogs();
      return {
        success: true,
        message: 'All top 100 recipes already have pictures',
        processed: 0,
        logId: logRowId,
      };
    }

    log(
      `Found ${candidateRecipes.length} eligible recipes; attempting to claim 1`,
    );
    await persistLogs();

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as Array<{ recipeId: number; error: string }>,
    };

    let claimedRecipe: (typeof candidateRecipes)[number] | null = null;
    let processingMarker: string | null = null;

    for (const recipe of candidateRecipes) {
      const nextMarker = getProcessingMarker(runId);
      let claimQuery = client
        .from('recipes')
        .update({ picture: nextMarker })
        .eq('id', recipe.id);

      if (!recipe.picture) {
        claimQuery = claimQuery.is('picture', null);
      } else {
        claimQuery = claimQuery.eq('picture', recipe.picture);
      }
      const finalQuery = claimQuery.select('id');

      const { data: claimedRows, error: claimError } = await finalQuery;

      if (claimError) {
        logError(
          `Failed claiming recipe ${recipe.id} for processing: ${claimError.message}`,
        );
        await persistLogs();
        continue;
      }

      if (!claimedRows || claimedRows.length === 0) {
        log(`Recipe ${recipe.id} was claimed by another invocation`);
        await persistLogs();
        continue;
      }

      claimedRecipe = recipe;
      processingMarker = nextMarker;
      log(`Claimed recipe ${recipe.id}: ${recipe.title}`);
      await persistLogs();
      break;
    }

    if (!claimedRecipe || !processingMarker) {
      log('No recipe could be claimed in this invocation');
      await persistLogs();
      return {
        success: true,
        message: 'No recipe could be claimed',
        processed: 0,
        logId: logRowId,
      };
    }

    try {
      log(
        `Generating picture for recipe ${claimedRecipe.id}: ${claimedRecipe.title}`,
      );
      await persistLogs();

      // Generate image from recipe data
      const imageGenerationData = {
        title: claimedRecipe.title,
        instructions: removeInstructionFormatting(
          claimedRecipe.instructions || [],
        ),
        collection: claimedRecipe.collection || 'user-generated',
        video_url:
          claimedRecipe.source_type === 'MEDIA' && claimedRecipe.source != null
            ? claimedRecipe.source
            : null,
      };

      const imageResponse = await fetch(
        'https://api.kinome.app/generate-image-from-recipe-data',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageGenerationData),
        },
      );

      if (!imageResponse.ok) {
        throw new Error(
          `Image generation failed: ${imageResponse.status} ${imageResponse.statusText}`,
        );
      }

      const generatedImageBuffer = await imageResponse.arrayBuffer();
      log(
        `Image generation returned ${Math.round(
          generatedImageBuffer.byteLength / 1024,
        )} KB for recipe ${claimedRecipe.id}`,
      );
      await persistLogs();

      // Process image with sharp and upload directly to Supabase storage
      let processedBuffer: Buffer;
      let fileName: string;
      try {
        const sharp = await import('sharp').then((m) => m.default);
        processedBuffer = await sharp(Buffer.from(generatedImageBuffer))
          .webp({ quality: 75 })
          .toBuffer();
        fileName = `${claimedRecipe.id}.webp`;
      } catch (sharpError: any) {
        log(
          `Sharp processing failed for recipe ${claimedRecipe.id}, using original: ${sharpError.message}`,
        );
        processedBuffer = Buffer.from(generatedImageBuffer);
        fileName = `${claimedRecipe.id}.png`;
      }

      const contentType = fileName.endsWith('.webp')
        ? 'image/webp'
        : 'image/png';

      const { error: uploadError } = await client.storage
        .from('recipe')
        .upload(fileName, processedBuffer, {
          contentType,
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = client.storage
        .from('recipe')
        .getPublicUrl(fileName);
      log(
        `Upload response for recipe ${claimedRecipe.id}: publicUrl=${urlData.publicUrl}`,
      );

      // Update recipe with the new picture URL
      const { error: updateError } = await client
        .from('recipes')
        .update({ picture: urlData.publicUrl })
        .eq('id', claimedRecipe.id)
        .eq('picture', processingMarker);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      log(`Successfully generated picture for recipe ${claimedRecipe.id}`);
      results.processed++;
      await persistLogs();
    } catch (err) {
      const errorMessage = toClientSafeErrorMessage(err);
      logError(
        `Failed to generate picture for recipe ${claimedRecipe.id}: ${errorMessage}`,
      );
      results.failed++;
      results.errors.push({
        recipeId: claimedRecipe.id,
        error: errorMessage,
      });

      const { error: releaseError } = await client
        .from('recipes')
        .update({ picture: null })
        .eq('id', claimedRecipe.id)
        .eq('picture', processingMarker);

      if (releaseError) {
        logError(
          `Failed to clear processing lock for recipe ${claimedRecipe.id}: ${releaseError.message}`,
        );
      } else {
        log(`Cleared processing lock for recipe ${claimedRecipe.id}`);
      }
      await persistLogs();
    }

    const summary = `Processed ${results.processed} recipes, ${results.failed} failed`;
    log(summary);
    await persistLogs();

    return {
      success: true,
      message: summary,
      logId: logRowId,
      ...results,
    };
  } catch (error) {
    const errorMessage = toClientSafeErrorMessage(error);
    logError(`Cron job error: ${errorMessage}`);
    await persistLogs();
    throw createError({
      statusCode: 500,
      statusMessage: errorMessage || 'Failed to process recipes',
    });
  }
});
