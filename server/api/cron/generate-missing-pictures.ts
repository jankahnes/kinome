import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';
import removeInstructionFormatting from '~/utils/format/removeInstructionFormatting';

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

  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  const logError = (msg: string) => {
    console.error(msg);
    logs.push(`ERROR: ${msg}`);
  };

  const persistLogs = async () => {
    await client.from('temp_cron_logs').insert({ logs });
  };

  try {
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
      return { success: true, message: 'No recipes found', processed: 0 };
    }

    // Filter to only recipes without pictures, cap at 10
    const recipes = allRecipes.filter((recipe) => !recipe.picture).slice(0, 10);

    if (recipes.length === 0) {
      log('All top 100 recipes already have pictures');
      await persistLogs();
      return {
        success: true,
        message: 'All top 100 recipes already have pictures',
        processed: 0,
      };
    }

    log(
      `Processing ${recipes.length} recipes without pictures (from top 100 by relevancy)`,
    );

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as Array<{ recipeId: number; error: string }>,
    };

    // Process recipes sequentially to avoid overwhelming the external API
    for (const recipe of recipes) {
      try {
        log(`Generating picture for recipe ${recipe.id}: ${recipe.title}`);

        // Generate image from recipe data
        const imageGenerationData = {
          title: recipe.title,
          instructions: removeInstructionFormatting(recipe.instructions || []),
          collection: recipe.collection || 'user-generated',
          video_url:
            recipe.source_type === 'MEDIA' && recipe.source != null
              ? recipe.source
              : null,
        };

        const imageResponse = await fetch(
          'https://jk-api.onrender.com/generate-image-from-recipe-data',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imageGenerationData),
          },
        );

        if (!imageResponse.ok) {
          throw new Error(
            `Image generation failed: ${imageResponse.statusText}`,
          );
        }

        const generatedImageBuffer = await imageResponse.arrayBuffer();

        // Process image with sharp and upload directly to Supabase storage
        let processedBuffer: Buffer;
        let fileName: string;
        try {
          const sharp = await import('sharp').then((m) => m.default);
          processedBuffer = await sharp(Buffer.from(generatedImageBuffer))
            .webp({ quality: 75 })
            .toBuffer();
          fileName = `${recipe.id}.webp`;
        } catch (sharpError: any) {
          log(
            `Sharp processing failed for recipe ${recipe.id}, using original: ${sharpError.message}`,
          );
          processedBuffer = Buffer.from(generatedImageBuffer);
          fileName = `${recipe.id}.png`;
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
          `Upload response for recipe ${recipe.id}: publicUrl=${urlData.publicUrl}`,
        );

        // Update recipe with the new picture URL
        const { error: updateError } = await client
          .from('recipes')
          .update({ picture: urlData.publicUrl })
          .eq('id', recipe.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        log(`Successfully generated picture for recipe ${recipe.id}`);
        results.processed++;

        // Add a small delay between requests to be respectful to the external API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err: any) {
        logError(
          `Failed to generate picture for recipe ${recipe.id}: ${err.message}`,
        );
        results.failed++;
        results.errors.push({
          recipeId: recipe.id,
          error: err.message || 'Unknown error',
        });
        // Continue with next recipe even if this one failed
      }
    }

    const summary = `Processed ${results.processed} recipes, ${results.failed} failed`;
    log(summary);
    await persistLogs();

    return {
      success: true,
      message: summary,
      ...results,
    };
  } catch (error: any) {
    logError(`Cron job error: ${error.message}`);
    await persistLogs();
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to process recipes',
    });
  }
});
