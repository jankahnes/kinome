// Shared types for the user-metrics backend.
//
// MetricsRecipe is the narrow projection we actually need to compute every
// archetype S-score and every radar axis. Keep this list in sync with the
// SELECT in fetchMetricsRecipes() and with the columns added by the
// "user-metrics AI fields" migration.

export type MetricsRecipe = {
  id: number;
  user_id: string | null;
  source_type: string | null;

  // nutrition
  hidx: number | null;
  kcal: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  processing_level_score: number | null;

  // surface
  price: number | null;
  total_time_mins: number | null;

  // AI flavor / vibe fields (added by migration; not yet in supabase.ts)
  flavor_spicy: number | null;
  flavor_umami: number | null;
  flavor_fresh: number | null;
  flavor_sweet: number | null;
  exoticness: number | null;
  complexity: number | null;

  // 256-dim taste embedding (parsed from pgvector string). Null when the
  // AI hasn't embedded the recipe yet.
  embedding: number[] | null;

  // joined
  tag_ids: number[];
  ingredient_count: number;
  // Total grams (per-recipe sums) for the ingredient categories that drive
  // the ingredient-centric archetypes. Computed via convertToGrams() at
  // projection time so archetype predicates can just compare against a
  // threshold instead of re-walking ingredient rows.
  category_grams: {
    pasta: number;   // grain_pasta
    rice: number;    // grain_rice
    fish: number;    // seafood_fish + seafood_shellfish
    poultry: number; // meat_poultry
  };
};

export type WeightedRecipe = { recipe: MetricsRecipe; weight: number };

export type ArchetypeKey =
  | 'herbivore' | 'carnivore' | 'protein_chaser' | 'keto_loyalist'
  | 'spice_alchemist' | 'sweet_tooth' | 'umami_fiend' | 'fresh_forager'
  | 'speed_chef' | 'slow_roaster' | 'minimalist' | 'master_baker' | 'meal_prepper'
  | 'adventurous_cook' | 'global_explorer'
  | 'critic' | 'prolific_creator'
  | 'health_nut' | 'comfort_seeker' | 'clean_eater'
  | 'thrifty_chef' | 'family_cook'
  | 'pasta_master' | 'rice_artisan' | 'catch_of_the_day' | 'poultry_pro' | 'dessert_artisan';

export type ArchetypeScores = Partial<Record<ArchetypeKey, number>>;

export type RadarAxes = {
  complexity: number;
  spiciness: number;
  comfort: number;
  freshness: number;
  plantBased: number;
  healthiness: number;
  exoticness: number;
};

// jsonb shape stored in global_cache.archetype_percentiles
// Each entry: a[i] = S score at the i-th percentile (0..100, length 101).
export type PercentileTable = Partial<Record<ArchetypeKey, number[]>>;
