import { serverSupabaseServiceRole } from '#supabase/server';
import extractJson from '~/utils/format/extractJson';
import pluralizeWord from '~/utils/format/pluralizeWord';
import singularizeWord from '~/utils/format/singularizeWord';
import type { Database } from '~/types/supabase';

// ── Wiki-fields enrichment ────────────────────────────────────────────────────

const MICRONUTRIENT_REFS: Record<string, number> = {
  calcium_mg: 1000,
  choline_mg: 550,
  copper_mg: 0.9,
  folate_ug_dfe: 400,
  iodine_ug: 150,
  iron_mg: 18,
  magnesium_mg: 400,
  manganese_mg: 2.3,
  mufas_total_mg: 25000,
  niacin_b3_mg: 16,
  omega3_total_mg: 800,
  potassium_mg: 4700,
  riboflavin_b2_mg: 1.3,
  selenium_ug: 55,
  thiamine_b1_mg: 1.2,
  vitamin_a_ug_rae: 900,
  vitamin_b12_ug: 2.4,
  vitamin_b6_mg: 1.7,
  vitamin_c_mg: 90,
  vitamin_d_ug: 20,
  vitamin_e_mg_alpha_te: 15,
  vitamin_k_ug: 120,
  zinc_mg: 11,
};

function getTopThreeMicros(food: Record<string, any>): Record<string, number> {
  const relevances: [string, number, number][] = [];
  for (const [nutrient, refValue] of Object.entries(MICRONUTRIENT_REFS)) {
    if (food[nutrient] != null && food[nutrient] > 0) {
      relevances.push([nutrient, food[nutrient] / refValue, food[nutrient]]);
    }
  }
  relevances.sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(relevances.slice(0, 3).map(([k, , v]) => [k, v]));
}

async function enrichFoodWithWikiFields(
  client: any,
  foodId: number,
  foodObject: Record<string, any>,
  foodNames: string[],
  nutritionResponse: any
) {
  const assets = useStorage('assets:server');
  const wikiPrompt = (await assets.getItem('food-create/wiki-fields.txt')) as string;

  const nutritionLabel = {
    kcal: foodObject.kcal,
    carbohydrates: foodObject.carbohydrates,
    sugar: foodObject.sugar,
    fiber: foodObject.fiber,
    protein: foodObject.protein,
    fat: foodObject.fat,
    saturated_fat: foodObject.saturated_fat,
    salt: foodObject.salt,
    nova: foodObject.nova,
    ...getTopThreeMicros(foodObject),
  };

  const proteinQualityScore = Math.round(
    nutritionResponse?.fullReport?.protein?.proteinQualityScore ??
    nutritionResponse?.nutritionComputed?.report?.protein?.proteinQualityScore ??
    0
  );
  const healthReport = {
    overall_score: foodObject.hidx,
    fiber_score: foodObject.fiber_score,
    protein_score: foodObject.protein_score,
    satiety_score: foodObject.satiety,
    micronutrient_score: foodObject.mnidx,
    fat_profile_score: foodObject.fat_profile_score,
    protein_quality_score: proteinQualityScore,
    polyphenol_score: foodObject.polyphenols,
    carotenoid_score: foodObject.carotenoids,
    glucosinolates_score: foodObject.glucosinolates,
  };

  const message = wikiPrompt
    .replace('{primary_name}', foodObject.primary_name)
    .replace('{nutrition_label}', JSON.stringify(nutritionLabel))
    .replace('{referencing_foods}', JSON.stringify(foodNames))
    .replace('{health_report}', JSON.stringify(healthReport));

  const response = await $fetch('/api/gpt/response', {
    method: 'POST',
    body: { message, type: 'default' },
  }) as string;

  if (!response) return;
  const result = JSON.parse(extractJson(response) ?? '{}');
  if (!result?.visual_category) return;

  await client
    .from('foods')
    .update({ visual_category: result.visual_category, description: result.description } as any)
    .eq('id', foodId);

  if (result.suggested_healthier_swaps?.length) {
    const swaps: { food_id: number; swap_id: number }[] = [];
    const baseHidx = foodObject.hidx ?? 0;

    for (const swapName of result.suggested_healthier_swaps as string[]) {
      try {
        const swapResponse = (await $fetch('/api/db/request-food', {
          method: 'POST',
          body: { query: swapName, from_user: false },
        })) as { status: string; data: { id: number | null } };

        const swapNameId = swapResponse.data?.id;
        if (!swapNameId) continue;

        const { data: swapFoodName } = await client
          .from('food_names')
          .select('food_id')
          .eq('id', swapNameId)
          .single();
        if (!swapFoodName) continue;

        const { data: swapFood } = await client
          .from('foods')
          .select('hidx')
          .eq('id', swapFoodName.food_id)
          .single();
        if (!swapFood || swapFood.hidx == null) continue;

        if (swapFood.hidx > baseHidx + 5) {
          swaps.push({ food_id: foodId, swap_id: swapNameId });
        }
      } catch {
        continue;
      }
    }

    if (swaps.length) {
      await client.from('foods_healthier_swap_suggestions').insert(swaps as any);
    }
  }
}

/**
 * Input: {
 * query: String
 * from_user: Boolean
 * }
 *
 * Output: {
 * action_taken: "found" | "insert_as_new" | "insert_as_alias" | "reject"
 * id: Int | null
 * }
 */
export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let checkpointTime = startTime;

  const logCheckpoint = (label: string) => {
    const now = Date.now();
    const elapsed = now - checkpointTime;
    const total = now - startTime;
    console.log(`⏱️ ${label}: +${elapsed}ms (total: ${total}ms)`);
    checkpointTime = now;
  };

  const client = serverSupabaseServiceRole<Database>(event);

  const assets = useStorage('assets:server');

  const matchSimilarityThreshold = 0.9;

  const searchPrompt = (await assets.getItem(
    'food-match/search_related.txt'
  )) as string;
  const judgePrompt = (await assets.getItem(
    'food-match/judge_results.txt'
  )) as string;

  const input = await readBody(event);
  let { query, from_user } = input;
  let request_id = null;

  try {
    if (from_user) {
      const { data: request, error: requestError } = await client
        .from('food_requests')
        .insert({ food_name: query, status: 'PROCESSING' })
        .select();
      if (requestError) {
        console.error('Error inserting request: ', requestError);
        throw new Error('Error inserting request');
      }
      request_id = request[0].id;
      logCheckpoint('Request inserted to DB');
    }

    //step 1: use search rpc to find if there is an exact match
    //first try singular form (either original query singularized, or original if already singular)
    const singularQuery = singularizeWord(query);
    const exactMatchSingular = (await client.rpc('search_foods', {
      query: singularQuery,
      max: 1,
    })) as {
      data: {
        name: string;
        best_similarity: number;
        id: number;
        food_id: number;
        food: { primary_name: string; kcal: number } | null;
      }[];
    };
    const matchingFoodSingular = exactMatchSingular.data?.[0];
    //if there is an exact match with singular, return the id
    if (matchingFoodSingular?.best_similarity > matchSimilarityThreshold) {
      logCheckpoint('Exact match found (singular)');
      if (from_user) {
        await client
          .from('food_requests')
          .update({
            status: 'CLOSED_NOT_INSERTED',
            status_info: 'Exact match found',
            food_name_id: matchingFoodSingular?.id,
          })
          .eq('id', request_id ?? 0);
      }
      console.log(`🎉 Total execution time: ${Date.now() - startTime}ms`);
      return {
        status: 'ok',
        data: { action_taken: 'found', id: matchingFoodSingular?.id },
      };
    }

    //if no singular match, try plural form
    const pluralQuery = pluralizeWord(query);
    const exactMatchPlural = (await client.rpc('search_foods', {
      query: pluralQuery,
      max: 1,
    })) as {
      data: {
        name: string;
        best_similarity: number;
        id: number;
        food_id: number;
        food: { primary_name: string; kcal: number } | null;
      }[];
    };
    const matchingFoodPlural = exactMatchPlural.data?.[0];
    //if there is an exact match with plural, return the id
    if (matchingFoodPlural?.best_similarity > matchSimilarityThreshold) {
      logCheckpoint('Exact match found (plural)');
      if (from_user) {
        await client
          .from('food_requests')
          .update({
            status: 'CLOSED_NOT_INSERTED',
            status_info: 'Exact match found',
            food_name_id: matchingFoodPlural?.id,
          })
          .eq('id', request_id ?? 0);
      }
      console.log(`🎉 Total execution time: ${Date.now() - startTime}ms`);
      return {
        status: 'ok',
        data: { action_taken: 'found', id: matchingFoodPlural?.id },
      };
    }
    //if there is no exact match, call GPT to generate alternative search queries
    logCheckpoint('Generating alternative search queries');
    const response = await $fetch('/api/gpt/response', {
      method: 'POST',
      body: {
        message: searchPrompt.replace('{query}', query),
        type: 'quick',
      },
    });
    if (!response)
      throw new Error('No content returned from search GPT response');
    logCheckpoint('Search GPT call completed');
    const searchResults = JSON.parse(extractJson(response) ?? '{}') as {
      search_terms: string[];
    };
    if (!searchResults)
      throw new Error('No content returned from search GPT response');
    let relevantFoods = [];
    if (matchingFoodSingular) {
      relevantFoods.push(matchingFoodSingular);
    }
    if (matchingFoodPlural) {
      relevantFoods.push(matchingFoodPlural);
    }
    for (const searchTerm of searchResults.search_terms) {
      const similarFoods = (await client.rpc('search_foods_deduplicated', {
        query: searchTerm,
        max: 4,
      })) as {
        data: {
          name: string;
          best_similarity: number;
          id: number;
          food_id: number;
          food: { primary_name: string; kcal: number } | null;
        }[];
      };
      relevantFoods.push(...similarFoods.data);
    }
    logCheckpoint('Similar foods search completed');
    //deduplicate by ID, sort by similarity, cut off at 10 results
    relevantFoods.sort((a, b) => b.best_similarity - a.best_similarity);
    relevantFoods = relevantFoods.filter(
      (food, index, self) =>
        index === self.findIndex((t) => t.food_id === food.food_id)
    );
    relevantFoods = relevantFoods.slice(0, 10);
    const relevantFoodsNames = relevantFoods
      .map(
        (food) =>
          `"Name: ${food.food?.primary_name} / ID: ${food.food_id} / Kcal/100g: ${food.food?.kcal}"`
      )
      .join(' ;\n ');

    //after getting potentially relevant foods, call GPT to judge what to do with the food
    const judgeResponse = await $fetch('/api/gpt/response', {
      method: 'POST',
      body: {
        message: judgePrompt
          .replace('{query}', query)
          .replace('{results}', relevantFoodsNames),
        type: 'default',
      },
    });
    logCheckpoint('Judge GPT call completed');
    if (!judgeResponse)
      throw new Error('No content returned from judge GPT response');
    const judgeResults = JSON.parse(extractJson(judgeResponse) ?? '{}') as {
      query_name: string;
      judgement: 'add_as_alias' | 'add_as_new' | 'reject';
      matching_id: number | null;
      primary_name: string | null;
      other_names: string[] | null;
    };

    if (judgeResults.judgement === 'reject') {
      logCheckpoint('Reject judgement');
      console.log(`🎉 Total execution time: ${Date.now() - startTime}ms`);
      return { status: 'ok', data: { action_taken: 'reject', id: null } };
    }

    // Helper function to build and deduplicate alias list
    const buildAliasList = (names: (string | null | undefined)[]) => {
      const allNames = names.filter((name): name is string => !!name);
      // Deduplicate (case-sensitive)
      const uniqueNames = [...new Set(allNames)];
      // Filter out names that match existing food names in the database results
      const existingNames = relevantFoods.map(
        (food) => food.food?.primary_name
      );
      return uniqueNames.filter((name) => !existingNames.includes(name));
    };

    if (judgeResults.judgement === 'add_as_alias') {
      // Build list of all aliases to insert
      const aliasesToInsert = buildAliasList([
        judgeResults.query_name,
        judgeResults.primary_name,
        ...(judgeResults.other_names || []),
      ]);

      if (aliasesToInsert.length === 0) {
        throw new Error('No valid aliases to insert after deduplication');
      }

      // Insert all aliases
      const aliasInserts = aliasesToInsert
        .map((alias) => ({
          food_id: judgeResults.matching_id,
          name: alias,
          is_primary: false,
        }))
        .filter((alias) => alias.food_id != null) as {
        food_id: number;
        name: string;
        is_primary: boolean;
      }[];

      const { data: foodNameData, error: foodNameError } = await client
        .from('food_names')
        .insert(aliasInserts)
        .select();
      if (foodNameError)
        throw new Error(
          'Error inserting food names into food_names table: ' +
            foodNameError.message
        );

      // Find the ID that corresponds to the query_name specifically
      const queryNameEntry = foodNameData?.find(
        (entry) => entry.name === judgeResults.query_name
      );
      const returnedId = queryNameEntry?.id ?? foodNameData?.[0]?.id;

      if (from_user) {
        await client
          .from('food_requests')
          .update({
            status: 'ALIAS_INSERTED',
            status_info: `Accepted as alias (${aliasesToInsert.length} name(s))`,
            food_name_id: returnedId,
          })
          .eq('id', request_id ?? 0);
      } else {
        await client.from('food_requests').insert({
          status: 'ALIAS_INSERTED',
          status_info: `Accepted as alias (${aliasesToInsert.length} name(s))`,
          food_name_id: returnedId,
          food_name: judgeResults.query_name,
        });
      }

      logCheckpoint(
        `${
          aliasesToInsert.length
        } alias(es) inserted to database: ${aliasesToInsert.join(', ')}`
      );
      console.log(`🎉 Total execution time: ${Date.now() - startTime}ms`);
      return {
        status: 'ok',
        data: { action_taken: 'insert_as_alias', id: returnedId },
      };
    }

    //Else, we need to insert the food as a new food
    const primaryName = judgeResults.primary_name ?? judgeResults.query_name;
    const contextPrompt = (await assets.getItem(
      'food-create/context.txt'
    )) as string;
    const generalAminoPrompt = (await assets.getItem(
      'food-create/general-amino.txt'
    )) as string;
    const micronutrientsPrompt = (await assets.getItem(
      'food-create/micronutrients.txt'
    )) as string;
    const unitsPrompt = (await assets.getItem(
      'food-create/units_and_aisle.txt'
    )) as string;
    //step 3: use GPT to fill in fields from food name
    const [
      generalAminoResponse,
      contextResponse,
      micronutrientsResponse,
      unitsResponse,
    ] = await Promise.all([
      $fetch('/api/gpt/response', {
        method: 'POST',
        body: {
          systemPrompt: generalAminoPrompt,
          message: `Food: ${primaryName}`,
          type: 'accurate',
        },
      }),
      $fetch('/api/gpt/response', {
        method: 'POST',
        body: {
          systemPrompt: contextPrompt,
          message: `Food: ${primaryName}`,
          type: 'accurate',
        },
      }),
      $fetch('/api/gpt/response', {
        method: 'POST',
        body: {
          systemPrompt: micronutrientsPrompt,
          message: `Food: ${primaryName}`,
          type: 'accurate',
        },
      }),
      $fetch('/api/gpt/response', {
        method: 'POST',
        body: {
          systemPrompt: unitsPrompt,
          message: `Food: ${primaryName}`,
          type: 'accurate',
        },
      }),
    ]);
    logCheckpoint('All 4 parallel GPT calls completed');

    if (!generalAminoResponse || !contextResponse || !micronutrientsResponse)
      throw new Error('No content returned from a GPT response');
    const generalAmino = JSON.parse(extractJson(generalAminoResponse) ?? '{}');
    const context = JSON.parse(extractJson(contextResponse) ?? '{}');
    const micronutrients = JSON.parse(
      extractJson(micronutrientsResponse) ?? '{}'
    );
    const units = JSON.parse(extractJson(unitsResponse) ?? '{}');

    const foodObject = {
      name: primaryName,
      ...generalAmino,
      ...context,
      ...micronutrients,
      ...units,
    };

    const nutritionEngineArgs = {
      food: { food: foodObject, name: primaryName },
      useGpt: false,
      logToReport: true,
      considerProcessing: false,
    };
    const nutritionResponse = (await $fetch('/api/calculate/nutrition', {
      method: 'POST',
      body: {
        nutritionEngineArgs: nutritionEngineArgs,
      },
    })) as {
      nutrition: any;
      nutritionComputed: {
        report: any;
      };
    };
    const healthMetrics = nutritionResponse.nutrition;

    Object.assign(foodObject, healthMetrics);
    foodObject.primary_name = foodObject.name;
    foodObject.report = nutritionResponse.nutritionComputed.report;
    delete foodObject.name;
    delete foodObject.processing_level_score;
    delete foodObject.water;

    //step 5: insert food object into foods table
    let newFoodNameId = null;

    const { data: foodData, error: foodError } = await client
      .from('foods')
      .insert(foodObject)
      .select();
    if (foodError)
      throw new Error(
        'Error inserting food into foods table: ' + foodError.message
      );

    // Insert primary name
    const { data: primaryFoodNameData, error: primaryFoodNameError } =
      await client
        .from('food_names')
        .insert({
          food_id: foodData?.[0]?.id,
          name: primaryName,
          is_primary: true,
        })
        .select();
    if (primaryFoodNameError)
      throw new Error(
        'Error inserting primary food name into food_names table: ' +
          primaryFoodNameError.message
      );
    newFoodNameId = primaryFoodNameData?.[0]?.id;

    // Build list of all aliases (excluding the primary name)
    const allAliasNames = [
      judgeResults.query_name,
      judgeResults.primary_name,
      ...(judgeResults.other_names || []),
    ];
    const aliasesToInsert = buildAliasList(allAliasNames).filter(
      (name) => name !== primaryName
    ); // Don't duplicate the primary name

    // Insert all aliases if any exist
    if (aliasesToInsert.length > 0) {
      const aliasInserts = aliasesToInsert.map((alias) => ({
        food_id: foodData?.[0]?.id,
        name: alias,
        is_primary: false,
      }));

      const { data: aliasData, error: aliasError } = await client
        .from('food_names')
        .insert(aliasInserts)
        .select();
      if (aliasError)
        throw new Error(
          'Error inserting alias food names into food_names table: ' +
            aliasError.message
        );

      // Update newFoodNameId to point to the query_name alias if it exists
      const queryNameAlias = aliasData?.find(
        (alias) => alias.name === judgeResults.query_name
      );
      if (queryNameAlias) {
        newFoodNameId = queryNameAlias.id;
      }
    }

    logCheckpoint(
      `Food inserted to database with ${aliasesToInsert.length} alias(es)`
    );

    if (from_user) {
      await client
        .from('food_requests')
        .update({ status: 'CLOSED_INSERTED', food_name_id: newFoodNameId })
        .eq('id', request_id ?? 0);
    } else {
      await client.from('food_requests').insert({
        status: 'CLOSED_INSERTED',
        food_name_id: newFoodNameId,
        food_name: query,
      });
    }
    logCheckpoint('Request status updated');

    enrichFoodWithWikiFields(
      client,
      foodData[0].id,
      foodObject,
      [primaryName, ...aliasesToInsert],
      nutritionResponse
    ).catch((err) =>
      console.error(`wiki-fields enrichment failed for food ${foodData[0].id}:`, err)
    );

    console.log(`🎉 Total execution time: ${Date.now() - startTime}ms`);

    return {
      status: 'ok',
      data: { id: newFoodNameId, action_taken: 'insert_as_new' },
    };
  } catch (error) {
    console.log(`❌ Error after ${Date.now() - startTime}ms:`, error);
    await client
      .from('food_requests')
      .update({
        status: 'CLOSED_NOT_INSERTED',
        status_info: (error as Error).message,
      })
      .eq('id', request_id ?? 0);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error in on-request-insert',
      data: {
        status: 'CLOSED_NOT_INSERTED',
        status_info: (error as Error).message,
      },
    });
  }
});
