import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/supabase';
import { getRecipeOverviews } from '~/utils/db/getters/getRecipes';

/**
 * Fetches the canonical recipe and all variations pointing to it.
 * If `canonicalId` is the id of a variation, pass its `based_on` instead.
 */
export async function getVariationsOf(
  client: SupabaseClient<Database>,
  canonicalId: number,
): Promise<RecipeOverview[]> {
  return getRecipeOverviews(client, {
    or: `id.eq.${canonicalId},based_on.eq.${canonicalId}`,
  });
}
