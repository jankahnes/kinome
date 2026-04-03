import type { BaseRecipe } from '~/types/types';

//Returns a BaseRecipe object from a video
export default defineEventHandler(async (event) => {
  const input = await readBody(event);
  const { url, args } = input;

  const responseBase = (await $fetch(
    'https://jk-api.onrender.com/extract-recipe-from-video',
    {
      method: 'POST',
      body: {
        url: url,
      },
    }
  )) as any;
  if (!responseBase)
    throw new Error('No valid content returned from video extraction response');
  if (
    !responseBase.ingredients_string ||
    !responseBase.serves ||
    !responseBase.title
  ) {
    console.error(
      'No valid content returned from video extraction response, missing required fields:'
    );
    console.error(JSON.stringify(responseBase, null, 2));
    throw new Error(
      'No valid content returned from video extraction response, missing required fields'
    );
  }
  Object.assign(responseBase, args);
  responseBase.video_metadata = {
    url: responseBase.url ?? null,
    title: responseBase.original_title ?? null,
    channel: responseBase.channel ?? null,
    channel_handle: responseBase.channel_handle ?? null,
    channel_id: responseBase.channel_id ?? null,
    view_count: responseBase.view_count ?? null,
    like_count: responseBase.like_count ?? null,
    tags: responseBase.tags ?? null,
    upload_date: responseBase.upload_date ?? null,
    duration: responseBase.duration ?? null,
  };
  responseBase.base_ingredients = responseBase.ingredients_string
    .split('\n')
    .map((ingredient: string) => ingredient.trim())
    .filter((ingredient: string) => ingredient.length > 3);

  return responseBase as BaseRecipe;
});
