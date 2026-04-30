import type { BaseRecipe } from '~/types/types';

type AnyInput = {
  source_type: 'TITLE' | 'WEBSITE' | 'MEDIA';
  source: string;
  collection?: string | null;
  internal_user_id?: string;
};

function isVideoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'vimeo.com'].some(
      (h) => host === h || host.endsWith('.' + h),
    );
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const reqHeaders = getRequestHeaders(event);
  const config = useRuntimeConfig();
  const isInternalAgent =
    !!config.agentInternalSecret &&
    reqHeaders['x-agent-secret'] === config.agentInternalSecret;

  const input = await readBody(event);
  let { source_type, source, collection, internal_user_id }: AnyInput = input;

  if (isInternalAgent && source_type === 'WEBSITE' && isVideoUrl(source)) {
    source_type = 'MEDIA';
  }

  let baseRecipe: BaseRecipe;
  switch (source_type) {
    case 'TITLE':
      baseRecipe = await $fetch('/api/create-recipe/base-from-title', {
        method: 'POST',
        body: { title: source, args: { source_type, args: { collection } } },
      });
      break;
    case 'WEBSITE':
      baseRecipe = await $fetch('/api/create-recipe/base-from-link', {
        method: 'POST',
        body: { link: source, args: { source_type, source, args: { collection } } },
      });
      break;
    case 'MEDIA':
      baseRecipe = await $fetch('/api/create-recipe/base-from-video', {
        method: 'POST',
        body: { url: source, args: { source_type, source, args: { collection } } },
      });
      break;
    default:
      throw createError({ statusCode: 400, statusMessage: 'Unsupported source_type' });
  }

  const uploadHeaders: Record<string, string> = {};
  const uploadBody: Record<string, any> = { baseRecipe };
  if (isInternalAgent && internal_user_id) {
    uploadHeaders['x-agent-secret'] = config.agentInternalSecret as string;
    uploadBody.internal_user_id = internal_user_id;
  }

  const { id } = await $fetch('/api/create-recipe/upload-base-recipe', {
    method: 'POST',
    headers: uploadHeaders,
    body: uploadBody,
  }) as any;

  // Phase B fires automatically for WEBSITE/MEDIA source_type
  await $fetch('/api/create-recipe/postprocess-base-recipe', {
    method: 'POST',
    body: { recipeId: id },
  });

  return { status: 'ok', id, title: baseRecipe.title };
});
