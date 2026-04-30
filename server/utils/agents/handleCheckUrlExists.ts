import findExistingRecipeByUrl from '~/utils/findExistingRecipeByUrl';

export default async function handleCheckUrlExists(client: any, payload: any) {
  const { url } = payload;
  if (!url) throw new Error('url required');

  const found = await findExistingRecipeByUrl(client, url, {
    resolveShortUrls: true,
  });
  return found
    ? { exists: true, recipe_id: found.id }
    : { exists: false };
}
