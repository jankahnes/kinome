import type { SupabaseClient } from '@supabase/supabase-js';
import type { InsertableComment } from '~/types/types';

export default async function (
  _supabase: SupabaseClient,
  comment: InsertableComment
): Promise<number> {
  if (!comment.user_id) {
    throw new Error("Can't create a comment without being logged in.");
  }

  const data = await $fetch<{ id: number }>('/api/db/comment', {
    method: 'POST',
    body: {
      recipe_id: comment.recipe_id,
      content: comment.content,
      replying_to: comment.replying_to ?? null,
      picture: comment.picture ?? null,
    },
  });

  return data.id;
}
