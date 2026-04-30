import { evaluateCrowdPleaserForRecipe, handleCommentCreated } from '../gamification/service';


export default async function handleComment(
  client: any,
  personaUserId: string,
  payload: any,
) {
  const { recipe_id, content, replying_to = null } = payload;
  if (!recipe_id) throw new Error('recipe_id required');
  if (!content?.trim()) throw new Error('content required');

  const { data, error } = await client
    .from('comments')
    .insert({
      user_id: personaUserId,
      recipe_id,
      content: content.trim(),
      replying_to,
    })
    .select('id')
    .single();

  if (error || !data?.id) throw new Error('Failed to insert comment');

  await handleCommentCreated(client, personaUserId, data.id);
  await evaluateCrowdPleaserForRecipe(client, recipe_id);

  return { ok: true, comment_id: data.id };
}
