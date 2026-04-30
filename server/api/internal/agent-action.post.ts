import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/supabase';

import handleRecipeDetails from '~~/server/utils/agents/handleRecipeDetails';
import handleWorldState from '~~/server/utils/agents/handleWorldState';
import handleActivityFeed from '~~/server/utils/agents/handleActivityFeed';
import handleRate from '~~/server/utils/agents/handleRate';
import handleSave from '~~/server/utils/agents/handleSave';
import handleCreateRecipe from '~~/server/utils/agents/handleCreateRecipe';
import handleComment from '~~/server/utils/agents/handleComment';
import handleDailyVisitAction from '~~/server/utils/agents/handleDailyVisitAction';
import handleImportUrl from '~~/server/utils/agents/handleImportUrl';
import handleCheckUrlExists from '~~/server/utils/agents/handleCheckUrlExists';
import handleRecipeActionCount from '~~/server/utils/agents/handleRecipeActionCount';
import handleSearch from '~~/server/utils/agents/handleSearch';
import handleFeedback from '~~/server/utils/agents/handleFeedback';
import handleActivityOnOwn from '~~/server/utils/agents/handleActivityOnOwn';

export default defineEventHandler(async (event) => {
  const reqHeaders = getRequestHeaders(event);
  const config = useRuntimeConfig();

  if (
    !config.agentInternalSecret ||
    reqHeaders['x-agent-secret'] !== config.agentInternalSecret
  ) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{
    action: string;
    personaUserId: string;
    payload: Record<string, any>;
    dryRun?: boolean;
  }>(event);
  const { action, personaUserId, payload = {}, dryRun = false } = body;
  const uuidShort = personaUserId?.slice(0, 8) ?? 'unknown';

  console.log(
    `[agent-action] start  action=${action} persona=${uuidShort} payload=${JSON.stringify(payload)}`,
  );

  const client = serverSupabaseServiceRole<Database>(event) as any;
  const pileOnCap = parseInt(String(config.agentPileOnCap ?? '2'), 10);

  try {
    let result: any;

    switch (action) {
      case 'world_state':
        result = await handleWorldState(
          client,
          personaUserId,
          payload,
          pileOnCap,
        );
        break;
      case 'recipe_details':
        result = await handleRecipeDetails(
          client,
          personaUserId,
          payload,
          dryRun,
        );
        break;
      case 'activity_feed':
        result = await handleActivityFeed(client, payload);
        break;
      case 'rate':
        result = await handleRate(client, personaUserId, payload);
        break;
      case 'save':
        result = await handleSave(client, personaUserId, payload);
        break;
      case 'comment':
      case 'reply':
        result = await handleComment(client, personaUserId, payload);
        break;
      case 'daily_visit':
        result = await handleDailyVisitAction(client, personaUserId, payload);
        break;
      case 'import_url':
        result = await handleImportUrl(client, personaUserId, payload, config);
        break;
      case 'create_recipe':
        result = await handleCreateRecipe(
          client,
          personaUserId,
          payload,
          config,
        );
        break;
      case 'check_url_exists':
        result = await handleCheckUrlExists(client, payload);
        break;
      case 'recipe_action_count':
        result = await handleRecipeActionCount(client, payload, pileOnCap);
        break;
      case 'search':
        result = await handleSearch(client, personaUserId, payload, config);
        break;
      case 'feedback':
        result = await handleFeedback(client, personaUserId, payload);
        break;
      case 'activity_on_own':
        result = await handleActivityOnOwn(client, personaUserId, payload);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(
      `[agent-action] end    action=${action} persona=${uuidShort} ok=true result=${JSON.stringify(result)}`,
    );
    return { ok: true, ...result };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error(
      `[agent-action] error  action=${action} persona=${uuidShort} error=${message}`,
    );
    return { ok: false, error: message };
  }
});
