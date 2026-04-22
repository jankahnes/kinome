import { serverSupabaseServiceRole } from '#supabase/server';
import { Database } from '~/types/supabase';
import canonicalUrl from '~/utils/canonicalUrl';

// Thresholds - purely for narrowing candidates before the AI call.
// Classification itself is always done by the AI.
const MIN_SIMILARITY = 0.6; // embedding cosine similarity floor for candidates
const MIN_OVERLAP = 0.25; // food-id Jaccard-ish overlap floor
const CANDIDATE_LIMIT = 20;

type VariationOutcome =
  | { outcome: 'duplicate'; canonicalId: number; targetRecipeId: number }
  | { outcome: 'variation'; canonicalId: number }
  | { outcome: 'unrelated' };

function platformFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
    return host || null;
  } catch {
    return null;
  }
}

async function resolveCanonical(
  supabase: any,
  recipeId: number,
  // prevent infinite loops
  depth = 0,
): Promise<number> {
  if (depth > 5) return recipeId;
  const { data } = await supabase
    .from('recipes')
    .select('id, based_on')
    .eq('id', recipeId)
    .single();
  if (!data || !data.based_on) return recipeId;
  return resolveCanonical(supabase, data.based_on, depth + 1);
}

/**
 * Loads the set of canonical food IDs (food_names.food_id) for a recipe's ingredients.
 */
async function loadFoodIdSet(
  supabase: any,
  recipeId: number,
): Promise<Set<number>> {
  const { data } = await supabase
    .from('recipe_foods')
    .select('food_name:food_names(food_id)')
    .eq('recipe_id', recipeId);
  const set = new Set<number>();
  for (const row of data ?? []) {
    const fid = (row as any)?.food_name?.food_id;
    if (typeof fid === 'number') set.add(fid);
  }
  return set;
}

type IngredientDescriptor = {
  food_id: number;
  name: string;
  amount: number | null;
  unit: string | null;
  category: string | null;
  prep: string | null;
};

async function loadIngredientDescriptors(
  supabase: any,
  recipeId: number,
): Promise<IngredientDescriptor[]> {
  const { data } = await supabase
    .from('recipe_foods')
    .select(
      'amount, unit, category, preparation_description, food_name:food_names(food_id, name)',
    )
    .eq('recipe_id', recipeId);
  const out: IngredientDescriptor[] = [];
  for (const row of data ?? []) {
    const fn = (row as any)?.food_name;
    if (fn && typeof fn.food_id === 'number' && typeof fn.name === 'string') {
      out.push({
        food_id: fn.food_id,
        name: fn.name,
        amount: (row as any).amount ?? null,
        unit: (row as any).unit ?? null,
        category: (row as any).category ?? null,
        prep: (row as any).preparation_description ?? null,
      });
    }
  }
  return out;
}

function formatIngredientLine(i: IngredientDescriptor): string {
  // e.g. "chicken breast - 500 g (Protein)  [prep: diced]"
  const qty =
    i.amount != null && i.unit
      ? `${i.amount} ${i.unit}`
      : i.amount != null
        ? `${i.amount}`
        : (i.unit ?? '');
  const cat = i.category ? ` (${i.category})` : '';
  const prep = i.prep ? `  [prep: ${i.prep}]` : '';
  return `- ${i.name} - ${qty}${cat}${prep}`;
}

function buildClassificationSystemPrompt(): string {
  return `You are classifying whether a NEW recipe is a duplicate, a variation, or unrelated to an EXISTING reference recipe in our database.

The existing reference may be either a canonical recipe or one of its stored variations.

Return one of:
- "duplicate" - same dish, same approach; any differences are superficial (brand/specificity of ingredient, minor amount tweaks, optional garnishes, measurement precision). The new recipe adds no meaningful cooking signal beyond the existing reference. We will HIDE the new recipe and keep only the existing reference.
- "variation" - clearly the SAME dish concept, but with ONE or MORE meaningful changes along a recognizable axis. The variation is worth keeping as its own page because a user searching for that axis would want this version. We will link it to the canonical root via \`based_on\`.
- "unrelated" - a different dish. Don't be fooled by ingredient overlap (many dishes share chicken/onion/garlic/oil). If the titles describe different end products, it's unrelated.

## Identity test (first gate)
Ask: "If someone asked for the dish in the existing reference title, would this new recipe satisfy that request?"
- Yes, and nothing substantially different → duplicate.
- Yes, but with a recognizable twist that a searcher might specifically want or avoid → variation.
- No → unrelated.

If the existing reference is itself already a variation of a canonical recipe, judge duplicate vs. variation against that exact existing variation. Two recipes are not duplicates merely because both are variations of the same canonical recipe.

## Differences that DO NOT make a variation (treat as duplicate)
- Amount tweaks of the same ingredients (2 vs 3 cloves of garlic, 400g vs 500g pasta).
- Swapping salt types / sugar types / oil types within the same role (kosher vs sea salt; olive vs vegetable oil as neutral fat).
- Adding or removing an optional garnish (parsley, sesame seeds, a squeeze of lemon on top).
- One recipe lists an extra pinch of a spice that's already in the other.
- Different phrasing or detail in preparation description for the same ingredient.
- One version notes salt+pepper separately and the other lumps "seasoning".
- Different serves/batch size.

## Differences that DO make a variation
A variation exists when the change is on one of these **recognizable axes**:
1. **Dietary axis**: vegan / vegetarian / gluten-free / dairy-free / keto / low-carb / low-fat / halal / kosher.
2. **Protein swap**: chicken ↔ tofu, beef ↔ turkey, pork ↔ mushroom, seafood ↔ chicken.
3. **Core carb/base swap**: pasta ↔ rice ↔ potato ↔ cauliflower; wonton wrapper ↔ gyoza skin ↔ lasagna sheet.
4. **Cuisine/regional fusion**: classical Italian → Korean-inspired; Mexican → Thai fusion.
5. **Technique swap**: baked ↔ air-fried ↔ slow-cooker ↔ instant-pot ↔ grill.
6. **Form/format change**: burrito ↔ bowl ↔ wrap ↔ deconstructed salad.
7. **Notable flavor profile shift**: adding a signature sauce or spice blend that re-identifies the dish (e.g., plain carbonara vs. gochujang carbonara).

A single axis is enough. If multiple axes change at once, it's probably still a variation (summarize in \`variation_summary\`) but consider carefully whether the result is actually a different dish entirely (→ unrelated).

## variation_name rules
The \`variation_name\` is a short LABEL that appears next to the recipe in UI (on cards, above titles). It should read like a complete descriptor, not just a bare adjective.

Format: **"<Axis Descriptor> Variation"** (title-cased), OR **"<Axis Descriptor> Version"**, OR a self-contained descriptor like **"Vegan"** / **"Air Fryer"** only when the word alone clearly communicates the axis.

Prefer the "<X> Variation" form. Examples of good values:
- "Lamb Variation" (protein swap to lamb)
- "Vegan Variation" (dietary)
- "Turkey Variation" (protein swap)
- "Air Fryer Variation" (technique)
- "Gyoza Variation" (base swap)
- "Korean-Style Variation" (cuisine fusion)
- "Oatmeal Variation" (additive re-identifies)
- "Gochujang Variation" (flavor profile)
- "Bowl Variation" (form change)

Rules:
- Title Case. 1-4 words.
- Pick the SINGLE clearest axis. Nuance belongs in \`variation_summary\`.
- Null when:
  - classification is "duplicate" or "unrelated", OR
  - the difference is real but doesn't fit a clean label (multi-faceted, idiosyncratic).

## variation_summary rules
- Short prose, one sentence, describing how this version differs from the canonical. Proper sentence capitalization. E.g., "Uses gyoza skins instead of wonton wrappers and adds a chili crisp drizzle."
- Null for duplicates and unrelated.

## variation_display_name rules
Boolean. Only relevant when classification is "variation". Ask: does the \`variation_name\` add meaningful context that is NOT already communicated by the recipe title?
- **true** - the title does NOT imply the variation axis; showing the variation name as a subtitle adds real signal for the user. E.g., title "Spaghetti Bolognese", variation_name "Vegan Variation" → true.
- **false** - the title already communicates the variation axis (the label would be redundant). E.g., title "Vegan Bolognese", variation_name "Vegan Variation" → false.
- Also false for "duplicate" and "unrelated".

## Worked examples

Example A - duplicate
Canonical: "Chicken Parmesan" (chicken breast, breadcrumbs, marinara, mozzarella, parmesan, olive oil, egg, salt, pepper, basil)
New:       "Chicken Parmesan"  (chicken breast, panko, tomato sauce, mozzarella, parmesan, olive oil, egg, salt, pepper, oregano)
→ {"classification":"duplicate","variation_name":null,"variation_summary":null,"variation_display_name":false}
(panko is still breadcrumbs; marinara ~ tomato sauce; basil vs oregano = minor)

Example B - variation (dietary, title does NOT imply it)
Canonical: "Chicken Parmesan"
New:       "Vegan Chicken Parmesan"  (seitan, panko, marinara, vegan mozzarella, nutritional yeast, olive oil, flax egg)
→ {"classification":"variation","variation_name":"Vegan Variation","variation_summary":"Plant-based version using seitan and vegan cheeses.","variation_display_name":false}
(title "Vegan Chicken Parmesan" already communicates the vegan axis → false)

Example B2 - variation (dietary, title does NOT imply it)
Canonical: "Chicken Parmesan"
New:       "Chicken Parmesan" (seitan, panko, marinara, vegan mozzarella, nutritional yeast, olive oil, flax egg)
→ {"classification":"variation","variation_name":"Vegan Variation","variation_summary":"Plant-based version using seitan and vegan cheeses.","variation_display_name":true}
(title gives no hint it's vegan → true)

Example C - variation (protein swap, title implies it)
Canonical: "Beef Chili"
New:       "Turkey Chili" - same spice profile, same beans, ground turkey instead of beef
→ {"classification":"variation","variation_name":"Turkey Variation","variation_summary":"Uses ground turkey instead of beef for a leaner chili.","variation_display_name":false}
(title "Turkey Chili" already names the protein swap → false)

Example D - variation (technique, title implies it)
Canonical: "Crispy Chicken Wings" (oven-baked)
New:       "Air Fryer Chicken Wings" - same seasoning, air-fried
→ {"classification":"variation","variation_name":"Air Fryer Variation","variation_summary":"Cooked in an air fryer instead of the oven.","variation_display_name":false}
(title already says "Air Fryer" → false)

Example E - variation (base swap, title implies it)
Canonical: "Wonton Soup"
New:       "Gyoza Soup" - gyoza wrappers, same broth and filling idea
→ {"classification":"variation","variation_name":"Gyoza Variation","variation_summary":"Uses gyoza skins instead of wonton wrappers.","variation_display_name":false}
(title says "Gyoza" → false)

Example F - unrelated (shared ingredients, different dish)
Canonical: "Chicken Noodle Soup"
New:       "Chicken Alfredo Pasta"
→ {"classification":"unrelated","variation_name":null,"variation_summary":null,"variation_display_name":false}
(both have chicken + pasta/noodles but end products are entirely different)

Example G - duplicate (superficial adds)
Canonical: "Aglio e Olio" (spaghetti, garlic, olive oil, chili flakes, parsley, salt)
New:       "Aglio e Olio with Parmesan" (same + grated parmesan on top)
→ {"classification":"duplicate","variation_name":null,"variation_summary":null,"variation_display_name":false}
(parmesan on top is a common optional garnish, not a re-identified dish)

Example H - variation (flavor re-identification, title implies it)
Canonical: "Carbonara" (spaghetti, guanciale, egg, pecorino, black pepper)
New:       "Gochujang Carbonara" (spaghetti, bacon, egg, parmesan, black pepper, gochujang)
→ {"classification":"variation","variation_name":"Gochujang Variation","variation_summary":"Korean fusion twist using gochujang for heat and umami.","variation_display_name":false}
(title "Gochujang Carbonara" already names the flavor twist → false)

Example I - duplicate (amount-only differences)
Canonical: "Chocolate Chip Cookies" (flour 250g, butter 200g, sugar 150g, brown sugar 100g, eggs 2, vanilla, baking soda, salt, chocolate chips 200g)
New:       "Chocolate Chip Cookies" (flour 240g, butter 220g, sugar 120g, brown sugar 130g, eggs 2, vanilla, baking powder, salt, chocolate chips 250g)
→ {"classification":"duplicate","variation_name":null,"variation_summary":null,"variation_display_name":false}
(baking powder vs soda is a minor leavener swap; ratios are within noise)

Example J - variation (additive re-identifies, title implies it)
Canonical: "Chocolate Chip Cookies"
New:       "Oatmeal Chocolate Chip Cookies" (adds rolled oats as a substantial ingredient)
→ {"classification":"variation","variation_name":"Oatmeal Variation","variation_summary":"Adds rolled oats for a chewier oatmeal cookie base.","variation_display_name":false}
(title "Oatmeal Chocolate Chip Cookies" already signals the oat addition → false)

Example K - variation (technique, title does NOT imply it)
Canonical: "Chicken Wings"
New:       "Chicken Wings" - same seasoning but cooked in air fryer
→ {"classification":"variation","variation_name":"Air Fryer Variation","variation_summary":"Cooked in an air fryer instead of the oven.","variation_display_name":true}
(generic title gives no hint about technique → true)

## Output format
Return ONLY the JSON object matching the schema: \`classification\`, \`variation_name\` (string or null), \`variation_summary\` (string or null), \`variation_display_name\` (boolean). No extra keys, no commentary.`;
}

function buildClassificationUserMessage(input: {
  newRecipe: {
    title: string;
    collection: string | null;
    ingredients: IngredientDescriptor[];
  };
  existingRecipe: {
    title: string;
    collection: string | null;
    ingredients: IngredientDescriptor[];
    variationName: string | null;
    canonicalTitle: string | null;
  };
}): string {
  const { newRecipe, existingRecipe } = input;
  const lines: string[] = [];
  lines.push('### EXISTING REFERENCE recipe');
  lines.push(`Title: ${existingRecipe.title}`);
  if (existingRecipe.collection)
    lines.push(`Collection: ${existingRecipe.collection}`);
  if (existingRecipe.canonicalTitle) {
    lines.push(`Stored as variation of: ${existingRecipe.canonicalTitle}`);
  }
  if (existingRecipe.variationName) {
    lines.push(`Existing variation label: ${existingRecipe.variationName}`);
  }
  lines.push('Ingredients:');
  for (const i of existingRecipe.ingredients)
    lines.push(formatIngredientLine(i));
  lines.push('');
  lines.push('### NEW (recipe to classify)');
  lines.push(`Title: ${newRecipe.title}`);
  if (newRecipe.collection) lines.push(`Collection: ${newRecipe.collection}`);
  lines.push('Ingredients:');
  for (const i of newRecipe.ingredients) lines.push(formatIngredientLine(i));
  lines.push('');
  lines.push('Classify using the rules and examples in the system prompt.');
  return lines.join('\n');
}

function overlapRatio(a: Set<number>, b: Set<number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / Math.max(a.size, b.size);
}

export default defineEventHandler(async (event) => {
  const { recipeId, jobId }: { recipeId: number; jobId?: number } =
    await readBody(event);
  const supabase = serverSupabaseServiceRole<Database>(event);

  // 1. Load recipe + ingredients
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (!recipe) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Recipe not found',
    });
  }

  const ownIngredients = await loadIngredientDescriptors(supabase, recipeId);
  if (ownIngredients.length === 0) {
    return { outcome: 'unrelated' } as VariationOutcome;
  }
  const ownFoodIds = new Set(ownIngredients.map((i) => i.food_id));

  // 2. Build lightweight embedding text for search
  const lines = [
    `Recipe title: ${recipe.title}`,
    `Ingredients: ${ownIngredients.map((i) => i.name).join(', ')}`,
  ];
  if (recipe.collection) lines.push(`Collection: ${recipe.collection}`);
  const embeddingText = lines.join('\n');

  // 3. Get candidates via vector search
  let embedding: number[];
  try {
    embedding = (await $fetch('/api/search/embed', {
      method: 'POST',
      body: { query: embeddingText },
    })) as number[];
  } catch (err) {
    console.error('🔍 [detect-variation] Embedding failed:', err);
    return { outcome: 'unrelated' } as VariationOutcome;
  }

  const { data: vectorResults, error: vectorError } = await supabase.rpc(
    'search_recipes_ai',
    { query: embedding as any, max: CANDIDATE_LIMIT },
  );
  if (vectorError) {
    console.error('🔍 [detect-variation] Vector search failed:', vectorError);
    return { outcome: 'unrelated' } as VariationOutcome;
  }

  const candidates = (vectorResults ?? [])
    .filter((c: any) => c.id !== recipeId)
    .slice(0, CANDIDATE_LIMIT) as { id: number; similarity: number }[];

  if (candidates.length === 0) {
    return { outcome: 'unrelated' } as VariationOutcome;
  }

  // 4. Score each candidate by food-id overlap + embedding similarity
  type Scored = {
    candidateId: number;
    canonicalId: number;
    similarity: number;
    overlap: number;
    candidateIngredients: IngredientDescriptor[];
    candidateTitle: string;
    candidateCollection: string | null;
    candidateVariationName: string | null;
    canonicalTitle: string | null;
  };

  const scored: Scored[] = [];
  for (const cand of candidates) {
    // Resolve to the canonical root for based_on assignment, but compare
    // against the actual candidate row so existing variations can absorb
    // duplicates of themselves.
    const canonicalId = await resolveCanonical(supabase, cand.id);
    if (canonicalId === recipeId) continue;

    const candidateFoodIds = await loadFoodIdSet(supabase, cand.id);
    const overlap = overlapRatio(ownFoodIds, candidateFoodIds);
    // Require either decent embedding similarity OR ingredient overlap
    if (cand.similarity < MIN_SIMILARITY && overlap < MIN_OVERLAP) continue;

    const { data: candidateRow } = await supabase
      .from('recipes')
      .select('title, collection, variation_name, based_on')
      .eq('id', cand.id)
      .single();
    if (!candidateRow) continue;

    const candidateIngredients = await loadIngredientDescriptors(
      supabase,
      cand.id,
    );

    let canonicalTitle: string | null = null;
    if ((candidateRow as any).based_on) {
      const { data: canonicalRow } = await supabase
        .from('recipes')
        .select('title')
        .eq('id', canonicalId)
        .single();
      canonicalTitle = (canonicalRow as any)?.title ?? null;
    }

    scored.push({
      candidateId: cand.id,
      canonicalId,
      similarity: cand.similarity,
      overlap,
      candidateIngredients,
      candidateTitle: (candidateRow as any).title,
      candidateCollection: (candidateRow as any).collection ?? null,
      candidateVariationName: (candidateRow as any).variation_name ?? null,
      canonicalTitle,
    });
  }

  if (scored.length === 0) {
    return { outcome: 'unrelated' } as VariationOutcome;
  }

  // Pick the strongest candidate (rank by overlap, then similarity)
  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    return b.similarity - a.similarity;
  });
  const best = scored[0];

  // 5. Classify - always use the AI. Heuristics are only for candidate narrowing.
  let classification: 'duplicate' | 'variation' | 'unrelated';
  let variation_name: string | null = null;
  let variation_summary: string | null = null;
  let variation_display_name: boolean = false;

  try {
    const systemPrompt = buildClassificationSystemPrompt();
    const userMessage = buildClassificationUserMessage({
      newRecipe: {
        title: recipe.title,
        collection: recipe.collection ?? null,
        ingredients: ownIngredients,
      },
      existingRecipe: {
        title: best.candidateTitle,
        collection: best.candidateCollection,
        ingredients: best.candidateIngredients,
        variationName: best.candidateVariationName,
        canonicalTitle: best.canonicalTitle,
      },
    });

    const raw = (await $fetch('/api/gpt/response', {
      method: 'POST',
      body: {
        external: true,
        systemPrompt,
        message: userMessage,
        schemaKey: 'recipeVariationClassification',
      },
    })) as string;

    const parsed = JSON.parse(raw) as {
      classification: 'duplicate' | 'variation' | 'unrelated';
      variation_name: string | null;
      variation_summary: string | null;
      variation_display_name: boolean;
    };
    classification = parsed.classification;
    variation_name = parsed.variation_name;
    variation_summary = parsed.variation_summary;
    variation_display_name = parsed.variation_display_name ?? false;
  } catch (err) {
    console.error('🔍 [detect-variation] AI classify failed:', err);
    return { outcome: 'unrelated' } as VariationOutcome;
  }

  // 6. Apply outcome
  if (classification === 'duplicate') {
    // Preserve source attribution before deletion.
    const vm = (recipe.video_metadata ?? {}) as Record<string, any>;
    const sourceUrl = canonicalUrl(recipe.source ?? vm.url ?? null);
    await supabase.from('recipe_sources' as any).insert({
      recipe_id: best.candidateId,
      source_url: sourceUrl,
      platform: platformFromUrl(sourceUrl),
      channel_name:
        (recipe as any).original_creator_channel_name ?? vm.channel ?? null,
      channel_id:
        (recipe as any).original_creator_channel_id ?? vm.channel_id ?? null,
    } as any);

    // Signal the in-flight client (which is polling the job) to navigate to
    // the existing recipe that absorbed this duplicate. That may be either
    // the root canonical recipe or an existing variation.
    if (jobId) {
      await supabase
        .from('jobs')
        .update({ redirect_recipe_id: best.candidateId } as any)
        .eq('id', jobId);
    }

    // Clean up dependent rows then delete the recipe row itself.
    // (If FKs cascade, these explicit deletes are no-ops but safe.)
    await supabase.from('recipe_foods').delete().eq('recipe_id', recipeId);
    await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId);
    await supabase.from('recipes').delete().eq('id', recipeId);

    console.log(
      `🔍 [detect-variation] Recipe ${recipeId} absorbed into existing recipe ${best.candidateId} (canonical root ${best.canonicalId}) and deleted`,
    );
    return {
      outcome: 'duplicate',
      canonicalId: best.canonicalId,
      targetRecipeId: best.candidateId,
    } as VariationOutcome;
  }

  if (classification === 'variation') {
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        based_on: best.canonicalId,
        variation_name,
        variation_summary,
        variation_display_name,
      } as any)
      .eq('id', recipeId);

    if (updateError) {
      console.error(
        `🔍 [detect-variation] Failed to update recipe ${recipeId} with based_on=${best.canonicalId}:`,
        updateError,
      );
    } else {
      console.log(
        `🔍 [detect-variation] Recipe ${recipeId} - based_on set to ${best.canonicalId}`,
      );
    }

    console.log(
      `🔍 [detect-variation] Recipe ${recipeId} marked as variation of ${best.canonicalId} (${variation_name ?? 'unnamed'}, subtitle=${variation_display_name})`,
    );
    return {
      outcome: 'variation',
      canonicalId: best.canonicalId,
    } as VariationOutcome;
  }

  return { outcome: 'unrelated' } as VariationOutcome;
});
