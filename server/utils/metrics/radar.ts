// Radar axis computation. All axes returned on a 0..10 scale to match the
// ApexCharts setup on the profile page.

import type { RadarAxes, WeightedRecipe } from './types';
import { wAvg, wFrac } from './aggregations';

const TAG_VEGETARIAN = 103;
const TAG_VEGAN      = 102;

const isVegetarian = (r: WeightedRecipe['recipe']) =>
  r.tag_ids.includes(TAG_VEGETARIAN) || r.tag_ids.includes(TAG_VEGAN);

const orZero = (v: number | null) => (v == null ? 0 : v);
const clamp10 = (v: number) => Math.max(0, Math.min(10, v));

export function computeRadar(T: WeightedRecipe[]): RadarAxes {
  const complexity = clamp10(orZero(wAvg(T, (r) => r.complexity)));
  const spiciness  = clamp10(orZero(wAvg(T, (r) => r.flavor_spicy)));
  const freshness  = clamp10(orZero(wAvg(T, (r) => r.flavor_fresh)));
  const exoticness = clamp10(orZero(wAvg(T, (r) => r.exoticness)));

  // Comfort: combine umami + sweet + inverse-healthiness, then rescale 0..10.
  const sweet = orZero(wAvg(T, (r) => r.flavor_sweet));
  const umami = orZero(wAvg(T, (r) => r.flavor_umami));
  const hidx  = orZero(wAvg(T, (r) => r.hidx));
  const comfort100 = (sweet * 10 + umami * 10 + (100 - hidx)) / 3;
  const comfort = clamp10(comfort100 / 10);

  // Plant-Based: weighted % vegetarian, scaled to 0..10.
  const plantBased = clamp10(wFrac(T, isVegetarian) * 10);

  // Healthiness: hidx is 0..100, scale to 0..10.
  const healthiness = clamp10(hidx / 10);

  return { complexity, spiciness, comfort, freshness, plantBased, healthiness, exoticness };
}
