import { timingSafeEqual } from 'crypto';
import formidable from 'formidable';
import {
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '#supabase/server';
import fs from 'fs/promises';
import type { Database } from '~/types/supabase';

function verifyBypassBearer(
  secret: string | undefined,
  authorization: string | undefined,
): boolean {
  if (!secret || !authorization) return false;
  const m = /^Bearer\s+(\S+)/i.exec(authorization.trim());
  if (!m?.[1]) return false;
  const token = m[1];
  const a = Buffer.from(token, 'utf8');
  const b = Buffer.from(secret, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseBase64Image(base64String: string): {
  buffer: Buffer;
  mimeType: string;
} {
  const dataUrlMatch = base64String.match(/^data:([^;]+);base64,(.+)$/);

  if (dataUrlMatch) {
    const [, mimeType, base64Data] = dataUrlMatch;
    if (!mimeType || !base64Data) {
      throw new Error('Invalid data URL');
    }
    return {
      buffer: Buffer.from(base64Data, 'base64'),
      mimeType: mimeType,
    };
  }
  return {
    buffer: Buffer.from(base64String, 'base64'),
    mimeType: 'image/jpeg',
  };
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const authBypassed = verifyBypassBearer(
    runtimeConfig.bypassAuth as string | undefined,
    getHeader(event, 'authorization'),
  );

  let userId: string | null = null;
  try {
    const user = await serverSupabaseUser(event);
    userId = user?.sub || null;
  } catch {
    // No auth session - userId stays null unless bypass below
  }

  if (authBypassed) {
    userId = (runtimeConfig.adminUuid as string) || userId;
  }

  // Check if this is a JSON request (base64 image) or form data (file upload)
  const contentType = getHeader(event, 'content-type') || '';

  let fileBuffer: Buffer;
  let bucket: string;
  let id: string;
  let originalMimetype: string | null = null;
  let shouldUpsert: boolean = false;

  if (contentType.includes('application/json')) {
    // Handle base64 image case
    const body = await readBody(event);

    if (!body.image || !body.bucket || !body.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing fields (image, bucket, id)',
      });
    }

    bucket = body.bucket;
    id = body.id;
    shouldUpsert = body.shouldUpsert === true || body.shouldUpsert === 'true';

    try {
      const { buffer, mimeType } = parseBase64Image(body.image);
      fileBuffer = buffer;
      originalMimetype = mimeType;
    } catch (error: any) {
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to parse base64 image: ${error.message}`,
      });
    }
  } else {
    // Handle file upload case (existing functionality)
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(event.node.req);

    const file = files.image?.[0];
    const bucketField = fields.bucket?.[0];
    const idField = fields.id?.[0];
    const shouldUpsertField = fields.shouldUpsert?.[0];

    if (!file || !bucketField || !idField) {
      throw createError({ statusCode: 400, statusMessage: 'Missing fields' });
    }

    bucket = bucketField;
    id = idField;
    shouldUpsert = shouldUpsertField === 'true';
    fileBuffer = await fs.readFile(file.filepath);
    originalMimetype = file.mimetype || null;
  }

  let processedBuffer;
  let fileName;

  try {
    const sharp = await import('sharp').then((m) => m.default);
    processedBuffer = await sharp(fileBuffer).webp({ quality: 75 }).toBuffer();
    fileName = `${id}.webp`;
  } catch (error: any) {
    console.warn(
      'Sharp processing failed, using original file:',
      error.message,
    );
    processedBuffer = fileBuffer;
    fileName = `${id}.${originalMimetype?.split('/')[1] || 'jpg'}`;
  }

  // Use service role for storage operations (with manual auth checks)
  const client = serverSupabaseServiceRole<Database>(event);

  if (bucket === 'signature') {
    if (!userId && !authBypassed) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const isAdmin = userId === runtimeConfig.adminUuid;
    if (!authBypassed && !isAdmin && id !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Not authorized to update this signature image',
      });
    }
  }

  if (shouldUpsert) {
    // Check ownership before allowing upsert (only for recipe bucket)
    if (bucket === 'recipe') {
      const recipeId = parseInt(id);
      if (isNaN(recipeId)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid recipe ID',
        });
      }

      const { data: existingRecipe, error: fetchError } = await client
        .from('recipes')
        .select('user_id')
        .eq('id', recipeId)
        .single();

      if (fetchError || !existingRecipe) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Recipe not found',
        });
      }
      const adminUuid = runtimeConfig.adminUuid;
      if (userId && userId === adminUuid) {
        console.log('Overriding user check for admin');
      } else if (authBypassed) {
        // internal caller - same as admin for ownership
      } else if (existingRecipe.user_id !== userId) {
        console.error(
          `Unauthorized image upsert attempt: recipe ${recipeId} belongs to ${existingRecipe.user_id}, user is ${userId}`,
        );
        throw createError({
          statusCode: 403,
          statusMessage: 'Not authorized to update this recipe image',
        });
      }
    }

    const { data: updateData, error: updateError } = await client.storage
      .from(bucket)
      .update(fileName, processedBuffer, {
        contentType: fileName.endsWith('.webp')
          ? 'image/webp'
          : originalMimetype || 'image/jpeg',
        cacheControl: bucket === 'signature' ? '0' : '3600',
      });
    if (updateError) {
      console.error('Update error:', updateError);
      console.error('Trying normal upload');
    } else {
      const { data } = client.storage.from(bucket).getPublicUrl(fileName);
      return { success: true, publicUrl: data.publicUrl };
    }
  }

  const { error } = await client.storage
    .from(bucket)
    .upload(fileName, processedBuffer, {
      contentType: fileName.endsWith('.webp')
        ? 'image/webp'
        : originalMimetype || 'image/jpeg',
      cacheControl: bucket === 'signature' ? '0' : '3600',
    });

  if (error) {
    console.error('Supabase upload error:', error.message);
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase upload failed',
    });
  }
  const { data } = client.storage.from(bucket).getPublicUrl(fileName);
  return { success: true, publicUrl: data.publicUrl };
});
