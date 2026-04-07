import type { SupabaseClient } from '@supabase/supabase-js';

export default async function upsertRating(
  _supabase: SupabaseClient,
  rating: number,
  userId: string,
  recipeId: number
) {
  if (!userId) {
    throw new Error("Can't create a rating without being logged in.");
  }
  if (rating < 0 || rating > 5) {
    throw new Error('Rating has to be between 0 and 5.');
  }

  await $fetch('/api/db/rating', {
    method: 'POST',
    body: {
      recipeId,
      rating,
    },
  });
}
