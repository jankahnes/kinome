// All archetype definitions in one table. Each entry knows how to compute
// its raw S-score (0..100) from a user's WeightedRecipe[] and any extra
// global context (cuisine 95th percentile, prolific 95th percentile, raw
// rating count for the Critic gate). The endpoint glue lives elsewhere.
//
// To add an archetype: append an entry. Nothing else needs to change.

import type { ArchetypeKey, WeightedRecipe } from './types';
import { wAvg, wFrac, wSum, interp, clamp01_100 } from './aggregations';

// Tag IDs from app/utils/constants/tags.ts
const TAG_VEGETARIAN = 103;
const TAG_VEGAN = 102;
const TAG_MEAL_PREP = 5;
const TAG_KID_FRIEND = 6;
const TAG_DESSERT = 204;
const TAG_PASTA_NOODLES = 213;
const TAG_SWEET_BAKED = 219;
const TAG_SAVORY_BAKED = 218;
const CUISINE_TAG_MIN = 300;
const CUISINE_TAG_MAX = 399;

const isVegetarian = (r: WeightedRecipe['recipe']) =>
  r.tag_ids.includes(TAG_VEGETARIAN) || r.tag_ids.includes(TAG_VEGAN);

// Minimum total grams (per recipe) before a recipe counts as "containing"
// the given category. Stops the algorithm from flagging a Caesar salad as a
// fish dish because it has 5g of anchovy paste.
const PASTA_GRAMS_MIN = 50; // includes uncooked
const RICE_GRAMS_MIN = 50; // includes uncooked
const FISH_GRAMS_MIN = 100;
const POULTRY_GRAMS_MIN = 100;

const isPasta = (r: WeightedRecipe['recipe']) =>
  r.tag_ids.includes(TAG_PASTA_NOODLES) ||
  r.category_grams.pasta >= PASTA_GRAMS_MIN;
const isRice = (r: WeightedRecipe['recipe']) =>
  r.category_grams.rice >= RICE_GRAMS_MIN;
const isFish = (r: WeightedRecipe['recipe']) =>
  r.category_grams.fish >= FISH_GRAMS_MIN;
const isPoultry = (r: WeightedRecipe['recipe']) =>
  r.category_grams.poultry >= POULTRY_GRAMS_MIN;
const isBaked = (r: WeightedRecipe['recipe']) =>
  r.tag_ids.includes(TAG_SWEET_BAKED) || r.tag_ids.includes(TAG_SAVORY_BAKED);

// Floors for percentile-anchored archetypes. Without these, a small test
// population collapses the p95 to a tiny number and everyone clamps to S=100.
// Once the user base is large enough that p95 exceeds the floor, the anchor
// becomes pure-percentile (matching the original spec).
const GLOBAL_EXPLORER_FLOOR = 16; // ~half the cuisine tag set
const PROLIFIC_CREATOR_FLOOR = 30; // "power author" baseline

export type ArchetypeContext = {
  // Whole-population stats, supplied by the cron / endpoint after fetching.
  globalExplorerP95: number; // 95th percentile of |cuisine set| across users
  prolificCreatorP95: number; // 95th percentile of |created| across users
  // Per-user extras
  userRatingCount: number; // total ratings the user has given
  userCuisineSetSize: number; // |distinct cuisine tags in T|
  userCreatedCount: number; // |recipes the user authored|
};

export type ArchetypeDef = {
  key: ArchetypeKey;
  label: string;
  /** Returns S in [0,100], or null if not computable for this user. */
  computeS: (T: WeightedRecipe[], ctx: ArchetypeContext) => number | null;
  /** Below this S the archetype is filtered out before ranking. */
  threshold: number;
  /** Optional gate (e.g. Critic needs >=10 ratings). Falsy → disqualified. */
  gate?: (T: WeightedRecipe[], ctx: ArchetypeContext) => boolean;
  /** Subtitle for the profile page. */
  subtitle: (T: WeightedRecipe[], ctx: ArchetypeContext) => string;
};

const pct = (x: number) => `${Math.round(x)}%`;

export const ARCHETYPES: ArchetypeDef[] = [
  // ── Diet & Macros ────────────────────────────────────────────────────────
  {
    key: 'herbivore',
    label: 'The Herbivore',
    threshold: 75,
    computeS: (T) => 100 * wFrac(T, isVegetarian),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, isVegetarian))} of your taste mix is plant-based.`,
  },
  {
    key: 'carnivore',
    label: 'The Carnivore',
    threshold: 85,
    computeS: (T) => 100 * wFrac(T, (r) => !isVegetarian(r)),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, (r) => !isVegetarian(r)))} of your recipes feature meat.`,
  },
  {
    key: 'protein_chaser',
    label: 'The Protein Chaser',
    threshold: 50,
    computeS: (T) => {
      const proteinKcal = 4 * wSum(T, (r) => r.protein);
      const totalKcal = wSum(T, (r) => r.kcal);
      if (totalKcal <= 0) return null;
      return clamp01_100((proteinKcal / totalKcal) * 200);
    },
    subtitle: (T) => {
      const p = 4 * wSum(T, (r) => r.protein);
      const k = wSum(T, (r) => r.kcal);
      return k > 0
        ? `~${Math.round((p / k) * 100)}% of your calories come from protein.`
        : 'Protein-forward cooking.';
    },
  },
  {
    key: 'keto_loyalist',
    label: 'The Keto Loyalist',
    threshold: 80,
    computeS: (T) => {
      const carbKcal = 4 * wSum(T, (r) => r.carbohydrates);
      const totalKcal = wSum(T, (r) => r.kcal);
      if (totalKcal <= 0) return null;
      return clamp01_100(100 - (carbKcal / totalKcal) * 100);
    },
    subtitle: (T) => {
      const c = 4 * wSum(T, (r) => r.carbohydrates);
      const k = wSum(T, (r) => r.kcal);
      return k > 0
        ? `Only ${Math.round((c / k) * 100)}% of your calories come from carbs.`
        : 'Low-carb leaning.';
    },
  },

  // ── Flavors ──────────────────────────────────────────────────────────────
  {
    key: 'spice_alchemist',
    label: 'The Spice Alchemist',
    threshold: 50,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.flavor_spicy);
      return a == null ? null : clamp01_100(a * 10);
    },
    subtitle: (T) =>
      `Average heat: ${(wAvg(T, (r) => r.flavor_spicy) ?? 0).toFixed(1)}/10.`,
  },
  {
    key: 'sweet_tooth',
    label: 'The Sweet Tooth',
    threshold: 50,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.flavor_sweet);
      return a == null ? null : clamp01_100(a * 10);
    },
    subtitle: (T) =>
      `Average sweetness: ${(wAvg(T, (r) => r.flavor_sweet) ?? 0).toFixed(1)}/10.`,
  },
  {
    key: 'umami_fiend',
    label: 'The Umami Fiend',
    threshold: 60,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.flavor_umami);
      return a == null ? null : clamp01_100(a * 10);
    },
    subtitle: (T) =>
      `Deep, savory, slow-cooked vibes (${(wAvg(T, (r) => r.flavor_umami) ?? 0).toFixed(1)}/10).`,
  },
  {
    key: 'fresh_forager',
    label: 'The Fresh Forager',
    threshold: 50,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.flavor_fresh);
      return a == null ? null : clamp01_100(a * 10);
    },
    subtitle: (T) =>
      `Bright, raw, seasonal (${(wAvg(T, (r) => r.flavor_fresh) ?? 0).toFixed(1)}/10).`,
  },

  // ── Time & Technique ─────────────────────────────────────────────────────
  {
    key: 'speed_chef',
    label: 'The Speed Chef',
    threshold: 60,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.total_time_mins);
      return a == null ? null : interp(a, 0, 100, 60, 0);
    },
    subtitle: (T) =>
      `Avg cook time ~${Math.round(wAvg(T, (r) => r.total_time_mins) ?? 0)} min.`,
  },
  {
    key: 'slow_roaster',
    label: 'The Slow Roaster',
    threshold: 30,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.total_time_mins);
      return a == null ? null : interp(a, 20, 0, 180, 100);
    },
    subtitle: (T) =>
      `Patient cooking - avg ~${Math.round(wAvg(T, (r) => r.total_time_mins) ?? 0)} min.`,
  },
  {
    key: 'minimalist',
    label: 'The Minimalist',
    threshold: 30,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.ingredient_count);
      return a == null ? null : interp(a, 0, 100, 20, 0);
    },
    subtitle: (T) =>
      `Avg ${Math.round(wAvg(T, (r) => r.ingredient_count) ?? 0)} ingredients per recipe.`,
  },
  {
    key: 'master_baker',
    label: 'The Master Baker',
    threshold: 30,
    computeS: (T) => {
      const frac = wFrac(T, isBaked);
      const bakedT = T.filter(({ recipe }) => isBaked(recipe));
      const cx = wAvg(bakedT, (r) => r.complexity);
      if (cx == null) return frac > 0 ? 0 : null;
      return clamp01_100(frac * cx * 10);
    },
    subtitle: (T) =>
      `${pct(100 * wFrac(T, isBaked))} of your recipes are baked.`,
  },
  {
    key: 'meal_prepper',
    label: 'The Meal Prepper',
    threshold: 50,
    computeS: (T) => 100 * wFrac(T, (r) => r.tag_ids.includes(TAG_MEAL_PREP)),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, (r) => r.tag_ids.includes(TAG_MEAL_PREP)))} of your recipes are meal-prep friendly.`,
  },

  // ── Cuisine & Diversity ──────────────────────────────────────────────────
  {
    key: 'adventurous_cook',
    label: 'The Adventurous Cook',
    threshold: 50,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.exoticness);
      return a == null ? null : clamp01_100(a * 10);
    },
    subtitle: (T) =>
      `Fusion & non-traditional pairings (${(wAvg(T, (r) => r.exoticness) ?? 0).toFixed(1)}/10).`,
  },
  {
    key: 'global_explorer',
    label: 'The Global Explorer',
    threshold: 0,
    computeS: (_T, ctx) => {
      const anchor = Math.max(ctx.globalExplorerP95, GLOBAL_EXPLORER_FLOOR);
      return clamp01_100((ctx.userCuisineSetSize / anchor) * 100);
    },
    subtitle: (_T, ctx) =>
      `${ctx.userCuisineSetSize} distinct cuisines on your plate.`,
  },

  // ── Community & App Habits ───────────────────────────────────────────────
  {
    key: 'critic',
    label: 'The Critic',
    threshold: 25,
    gate: (_T, ctx) => ctx.userRatingCount >= 10,
    // We can't compute "avg user rating" from T alone - the cron/endpoint
    // injects a synthetic recipe with `complexity` field reused as a carrier
    // for the avg rating. Cleaner: pass via ctx. We'll piggy-back on ctx by
    // extending it inline below (see scores.ts where this is filled in).
    // For now: critic S is computed in scores.ts and stashed in a local var.
    // To keep this table self-contained, we read avg rating off ctx (added).
    computeS: (_T, ctx) => {
      const avg = (ctx as any).userAvgRating as number | undefined;
      if (avg == null) return null;
      return clamp01_100(100 - avg * 20);
    },
    subtitle: (_T, ctx) =>
      `Avg rating you give: ${((ctx as any).userAvgRating ?? 0).toFixed(1)} ★.`,
  },
  {
    key: 'prolific_creator',
    label: 'The Prolific Creator',
    threshold: 0,
    computeS: (_T, ctx) => {
      const anchor = Math.max(ctx.prolificCreatorP95, PROLIFIC_CREATOR_FLOOR);
      return clamp01_100((ctx.userCreatedCount / anchor) * 100);
    },
    subtitle: (_T, ctx) => `${ctx.userCreatedCount} recipes authored.`,
  },

  // ── Health & Processing ──────────────────────────────────────────────────
  {
    key: 'health_nut',
    label: 'The Health Nut',
    threshold: 70,
    computeS: (T) => wAvg(T, (r) => r.hidx),
    subtitle: (T) =>
      `Avg health index: ${Math.round(wAvg(T, (r) => r.hidx) ?? 0)}/100.`,
  },
  {
    key: 'comfort_seeker',
    label: 'The Comfort Seeker',
    threshold: 55,
    computeS: (T) => {
      const sweet = wAvg(T, (r) => r.flavor_sweet);
      const umami = wAvg(T, (r) => r.flavor_umami);
      const hidx = wAvg(T, (r) => r.hidx);
      if (sweet == null || umami == null || hidx == null) return null;
      return clamp01_100((sweet * 10 + umami * 10 + (100 - hidx)) / 3);
    },
    subtitle: () => 'Indulgent, hearty, soul-warming.',
  },
  {
    key: 'clean_eater',
    label: 'The Clean Eater',
    threshold: 65,
    computeS: (T) => wAvg(T, (r) => r.processing_level_score),
    subtitle: (T) =>
      `Whole-food focus (${Math.round(wAvg(T, (r) => r.processing_level_score) ?? 0)}/100).`,
  },

  // ── Budget ───────────────────────────────────────────────────────────────
  {
    key: 'thrifty_chef',
    label: 'The Thrifty Chef',
    threshold: 50,
    computeS: (T) => {
      const a = wAvg(T, (r) => r.price);
      return a == null ? null : interp(a, 0, 100, 10, 0);
    },
    subtitle: (T) =>
      `Avg ~€${(wAvg(T, (r) => r.price) ?? 0).toFixed(2)} per serving.`,
  },

  // ── Family ───────────────────────────────────────────────────────────────
  {
    key: 'family_cook',
    label: 'The Family Cook',
    threshold: 50,
    computeS: (T) => 100 * wFrac(T, (r) => r.tag_ids.includes(TAG_KID_FRIEND)),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, (r) => r.tag_ids.includes(TAG_KID_FRIEND)))} of your recipes are kid-friendly.`,
  },

  // ── Ingredient-centric ───────────────────────────────────────────────────
  {
    key: 'pasta_master',
    label: 'The Pasta Master',
    threshold: 40,
    computeS: (T) => 100 * wFrac(T, isPasta),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, isPasta))} of your recipes are pasta or noodles.`,
  },
  {
    key: 'rice_artisan',
    label: 'The Rice Artisan',
    threshold: 40,
    computeS: (T) => 100 * wFrac(T, isRice),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, isRice))} of your recipes feature rice.`,
  },
  {
    key: 'catch_of_the_day',
    label: 'The Catch of the Day',
    threshold: 35,
    computeS: (T) => 100 * wFrac(T, isFish),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, isFish))} of your recipes feature fish or seafood.`,
  },
  {
    key: 'poultry_pro',
    label: 'The Poultry Pro',
    threshold: 40,
    computeS: (T) => 100 * wFrac(T, isPoultry),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, isPoultry))} of your recipes feature chicken or poultry.`,
  },
  {
    key: 'dessert_artisan',
    label: 'The Dessert Artisan',
    threshold: 40,
    computeS: (T) => 100 * wFrac(T, (r) => r.tag_ids.includes(TAG_DESSERT)),
    subtitle: (T) =>
      `${pct(100 * wFrac(T, (r) => r.tag_ids.includes(TAG_DESSERT)))} of your recipes are desserts.`,
  },
];

export const ARCHETYPES_BY_KEY: Record<string, ArchetypeDef> =
  Object.fromEntries(ARCHETYPES.map((a) => [a.key, a]));

/** Distinct cuisine tag count for a user's T. Used for global_explorer. */
export function cuisineSetSize(T: WeightedRecipe[]): number {
  const seen = new Set<number>();
  for (const { recipe } of T) {
    for (const t of recipe.tag_ids) {
      if (t >= CUISINE_TAG_MIN && t <= CUISINE_TAG_MAX) seen.add(t);
    }
  }
  return seen.size;
}
