<template>
  <div>
    <h1 class="text-4xl sm:text-5xl font-headers tracking-tight mt-12">For You</h1>
    <div class="mt-4">
      <ForYouGrid :results="results" :is-loading="isLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
type RecommendationRow = RecipeOverview & {
  nearest_recipe: { id: number; title: string; set: 'own' | 'bookmarks' | 'ratings' } | null;
  matched_tags: number[];
  dominant_signal: 'taste' | 'tags' | 'trending';
};

const supabase = useSupabaseClient<Database>();
const auth = useAuthStore();

const results = ref<RecommendationRow[]>([]);
const isLoading = ref(true);

async function load() {
  if (!auth.user?.id) return;
  isLoading.value = true;
  try {
    const { data, error } = await (supabase as any).rpc('get_recommendations', {
      p_user_id: auth.user.id,
      max: 23,
      explore: true,
    });
    if (error) throw error;
    results.value = (data ?? []).map((row: any) => ({
      ...row,
      tags: row.tags ?? [],
    })) as RecommendationRow[];
  } catch (e) {
    console.error('Failed to load recommendations:', e);
  } finally {
    isLoading.value = false;
  }
}

watchEffect(() => {
  if (auth.profileFetched) load();
});
</script>
