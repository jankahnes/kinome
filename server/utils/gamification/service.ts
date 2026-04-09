import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACHIEVEMENTS,
  ALCHEMIST_EXOTICNESS_THRESHOLD,
  type AchievementKey,
  CROWD_PLEASER_THRESHOLDS,
  CUISINE_TAG_MAX,
  CUISINE_TAG_MIN,
  PASSPORT_PANTRY_CUISINE_THRESHOLD,
  XP_ACTIONS,
  type ActionEventType,
} from './config';
import { getLevelInfo } from '~~/app/utils/constants/gamification';

type AnyClient = SupabaseClient<any, any, any>;

type EventInsert = {
  userId: string;
  eventType: string;
  kind: 'action' | 'achievement';
  xpDelta: number;
  refType?: string | null;
  refId?: number | null;
  tier?: number | null;
  logicalDate?: string | null;
  dailyCap?: number;
  oncePerDay?: boolean;
};

type AwardResult = {
  inserted: boolean;
  xpDelta: number;
};

type AchievementEventRow = {
  event_type: string;
  tier: number | null;
};

function isoForLogicalDate(day: string) {
  return `${day}T12:00:00.000Z`;
}

function dayRange(day: string) {
  const start = `${day}T00:00:00.000Z`;
  const next = new Date(`${day}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return {
    start,
    end: next.toISOString(),
  };
}

function normalizeDay(value: string) {
  return value.slice(0, 10);
}

async function existingEvent(
  client: AnyClient,
  {
    userId,
    eventType,
    refType,
    refId,
    tier,
    logicalDate,
    oncePerDay,
  }: Pick<EventInsert, 'userId' | 'eventType' | 'refType' | 'refId' | 'tier' | 'logicalDate' | 'oncePerDay'>,
) {
  let query = client
    .from('profile_xp_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', eventType);

  if (tier != null) query = query.eq('tier', tier);
  if (refType != null) query = query.eq('ref_type', refType);
  if (refId != null) query = query.eq('ref_id', refId);

  if (oncePerDay && logicalDate) {
    const { start, end } = dayRange(normalizeDay(logicalDate));
    query = query.gte('created_at', start).lt('created_at', end);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function getTodayXpForEvent(
  client: AnyClient,
  userId: string,
  eventType: string,
  logicalDate: string,
) {
  const { start, end } = dayRange(normalizeDay(logicalDate));
  const { data, error } = await client
    .from('profile_xp_events')
    .select('xp_delta')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .gte('created_at', start)
    .lt('created_at', end);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.xp_delta ?? 0), 0);
}

export async function insertXpEvent(
  client: AnyClient,
  input: EventInsert,
): Promise<AwardResult> {
  const logicalDate = input.logicalDate ? normalizeDay(input.logicalDate) : null;

  const alreadyExists = await existingEvent(client, {
    userId: input.userId,
    eventType: input.eventType,
    refType: input.refType ?? null,
    refId: input.refId ?? null,
    tier: input.tier ?? null,
    logicalDate,
    oncePerDay: input.oncePerDay ?? false,
  });

  if (alreadyExists) {
    return { inserted: false, xpDelta: 0 };
  }

  let xpDelta = input.xpDelta;
  if (input.dailyCap != null && logicalDate) {
    const current = await getTodayXpForEvent(
      client,
      input.userId,
      input.eventType,
      logicalDate,
    );
    const remaining = input.dailyCap - current;
    if (remaining <= 0) {
      return { inserted: false, xpDelta: 0 };
    }
    xpDelta = Math.min(xpDelta, remaining);
  }

  const payload = {
    user_id: input.userId,
    event_type: input.eventType,
    kind: input.kind,
    xp_delta: xpDelta,
    ref_type: input.refType ?? null,
    ref_id: input.refId ?? null,
    tier: input.tier ?? null,
    created_at: logicalDate ? isoForLogicalDate(logicalDate) : undefined,
  };

  const { error } = await client
    .from('profile_xp_events')
    .insert(payload as any);

  if (error) {
    const msg = String(error.message ?? '');
    if (msg.includes('duplicate key')) {
      return { inserted: false, xpDelta: 0 };
    }
    throw error;
  }

  return { inserted: true, xpDelta };
}

export async function awardActionXp(
  client: AnyClient,
  userId: string,
  eventType: ActionEventType,
  options: {
    refType?: string | null;
    refId?: number | null;
    logicalDate?: string | null;
    oncePerDay?: boolean;
  } = {},
) {
  const conf = XP_ACTIONS[eventType];
  const dailyCap = 'dailyCap' in conf ? conf.dailyCap : undefined;
  return insertXpEvent(client, {
    userId,
    eventType,
    kind: 'action',
    xpDelta: conf.xp,
    dailyCap,
    refType: options.refType ?? null,
    refId: options.refId ?? null,
    logicalDate: options.logicalDate ?? null,
    oncePerDay: options.oncePerDay ?? false,
  });
}

export async function awardAchievement(
  client: AnyClient,
  userId: string,
  key: AchievementKey,
  options: { tier?: number | null; refType?: string | null; refId?: number | null } = {},
) {
  const conf = ACHIEVEMENTS[key];
  const tier = options.tier ?? null;
  const xpDelta = conf.kind === 'special'
    ? conf.xp
    : conf.thresholds.find((entry) => entry.tier === tier)?.xp ?? 0;

  if (!xpDelta) {
    return { inserted: false, xpDelta: 0 };
  }

  return insertXpEvent(client, {
    userId,
    eventType: key,
    kind: 'achievement',
    xpDelta,
    refType: options.refType ?? key,
    refId: options.refId ?? null,
    tier,
  });
}

async function countRecipesByUser(client: AnyClient, userId: string) {
  const { count, error } = await client
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('visibility', 'HIDDEN');
  if (error) throw error;
  return count ?? 0;
}

async function countRatingsByUser(client: AnyClient, userId: string) {
  const { count, error } = await client
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function countBookmarksByUser(client: AnyClient, userId: string) {
  const { count, error } = await client
    .from('bookmarks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function countCommentsByUser(client: AnyClient, userId: string) {
  const { count, error } = await client
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function trackedDatesByUser(client: AnyClient, userId: string) {
  const { data, error } = await client
    .from('tracked_meals')
    .select('meal_date')
    .eq('user_id', userId)
    .not('is_template', 'is', true)
    .not('meal_date', 'is', null);

  if (error) throw error;
  return [...new Set((data ?? []).map((row) => String(row.meal_date)).filter(Boolean))].sort();
}

function longestStreak(dates: string[]) {
  if (dates.length === 0) return 0;
  const normalized = [...new Set(dates.map(normalizeDay))].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < normalized.length; i++) {
    const prev = new Date(`${normalized[i - 1]}T00:00:00.000Z`);
    const next = new Date(`${normalized[i]}T00:00:00.000Z`);
    const diff = Math.round((next.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

async function visitDatesByUser(client: AnyClient, userId: string) {
  const { data, error } = await client
    .from('profile_xp_events')
    .select('created_at')
    .eq('user_id', userId)
    .eq('event_type', 'app_visit_daily');

  if (error) throw error;
  return (data ?? []).map((row) => normalizeDay(row.created_at));
}

async function distinctBookmarkedCuisineCount(client: AnyClient, userId: string) {
  const { data: bookmarks, error: bookmarksError } = await client
    .from('bookmarks')
    .select('recipe_id')
    .eq('user_id', userId);
  if (bookmarksError) throw bookmarksError;

  const recipeIds = [...new Set((bookmarks ?? []).map((row) => row.recipe_id).filter((id) => id != null))];
  if (recipeIds.length === 0) return 0;

  const { data: tags, error: tagsError } = await client
    .from('recipe_tags')
    .select('tag_id')
    .in('recipe_id', recipeIds);
  if (tagsError) throw tagsError;

  return new Set(
    (tags ?? [])
      .map((row) => row.tag_id)
      .filter((tagId) => tagId >= CUISINE_TAG_MIN && tagId <= CUISINE_TAG_MAX),
  ).size;
}

async function achievementEventsByUser(client: AnyClient, userId: string) {
  const { data, error } = await client
    .from('profile_xp_events')
    .select('event_type, tier')
    .eq('user_id', userId)
    .eq('kind', 'achievement');

  if (error) throw error;
  return (data ?? []) as AchievementEventRow[];
}

async function profileSnapshot(client: AnyClient, userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('xp, signature_recipe')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function ownedRecipeSnapshots(client: AnyClient, userId: string) {
  const { data, error } = await client
    .from('recipes')
    .select('id, relevancy, rating_count, exoticness')
    .eq('user_id', userId)
    .neq('visibility', 'HIDDEN');

  if (error) throw error;
  return data ?? [];
}

async function recipeSnapshot(client: AnyClient, recipeId: number) {
  const { data, error } = await client
    .from('recipes')
    .select('id, user_id, relevancy, rating_count, exoticness')
    .eq('id', recipeId)
    .single();
  if (error) throw error;
  return data;
}

async function bookmarkCountForRecipe(client: AnyClient, recipeId: number) {
  const { count, error } = await client
    .from('bookmarks')
    .select('id', { count: 'exact', head: true })
    .eq('recipe_id', recipeId);
  if (error) throw error;
  return count ?? 0;
}

async function commentCountForRecipe(client: AnyClient, recipeId: number) {
  const { count, error } = await client
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('recipe_id', recipeId);
  if (error) throw error;
  return count ?? 0;
}

async function maybeUnlockTieredAchievement(
  client: AnyClient,
  userId: string,
  key: Extract<AchievementKey, 'recipe_maker' | 'tastemaker' | 'collector' | 'sous_critic' | 'tracker' | 'streak_keeper'>,
  value: number,
) {
  const conf = ACHIEVEMENTS[key];
  if (conf.kind !== 'tiered') return;
  for (const entry of conf.thresholds) {
    if (value >= entry.threshold) {
      await awardAchievement(client, userId, key, {
        tier: entry.tier,
        refType: key,
      });
    }
  }
}

function derivedTier(
  key: Extract<AchievementKey, 'recipe_maker' | 'tastemaker' | 'collector' | 'sous_critic' | 'tracker' | 'streak_keeper'>,
  value: number,
) {
  const conf = ACHIEVEMENTS[key];
  if (conf.kind !== 'tiered') return 0;
  let tier = 0;
  for (const entry of conf.thresholds) {
    if (value >= entry.threshold) tier = entry.tier;
  }
  return tier;
}

function eventTier(events: AchievementEventRow[], key: string) {
  return events
    .filter((row) => row.event_type === key)
    .reduce((max, row) => Math.max(max, row.tier ?? 0), 0);
}

function hasAchievementEvent(events: AchievementEventRow[], key: string) {
  return events.some((row) => row.event_type === key);
}

export async function buildProfileGamificationSummary(client: AnyClient, userId: string) {
  const [
    profile,
    achievementEvents,
    ratingCount,
    bookmarkCount,
    commentCount,
    trackedDates,
    visitDates,
    cuisineCount,
    ownedRecipes,
  ] = await Promise.all([
    profileSnapshot(client, userId),
    achievementEventsByUser(client, userId),
    countRatingsByUser(client, userId),
    countBookmarksByUser(client, userId),
    countCommentsByUser(client, userId),
    trackedDatesByUser(client, userId),
    visitDatesByUser(client, userId),
    distinctBookmarkedCuisineCount(client, userId),
    ownedRecipeSnapshots(client, userId),
  ]);

  const maxOwnedExoticness = ownedRecipes.reduce(
    (max, recipe) => Math.max(max, Number(recipe.exoticness ?? 0)),
    0,
  );

  const ownRecipeIds = ownedRecipes.map((recipe) => recipe.id);
  const [bookmarkRows, commentRows] = ownRecipeIds.length > 0
    ? await Promise.all([
        client.from('bookmarks').select('recipe_id').in('recipe_id', ownRecipeIds),
        client.from('comments').select('recipe_id').in('recipe_id', ownRecipeIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (bookmarkRows.error) throw bookmarkRows.error;
  if (commentRows.error) throw commentRows.error;

  const bookmarkCounts = new Map<number, number>();
  for (const row of bookmarkRows.data ?? []) {
    bookmarkCounts.set(row.recipe_id, (bookmarkCounts.get(row.recipe_id) ?? 0) + 1);
  }
  const commentCounts = new Map<number, number>();
  for (const row of commentRows.data ?? []) {
    commentCounts.set(row.recipe_id, (commentCounts.get(row.recipe_id) ?? 0) + 1);
  }

  const crowdPleaserLive = ownedRecipes.some((recipe) =>
    Number(recipe.relevancy ?? 0) >= CROWD_PLEASER_THRESHOLDS.relevancy &&
    (bookmarkCounts.get(recipe.id) ?? 0) >= CROWD_PLEASER_THRESHOLDS.saves &&
    (commentCounts.get(recipe.id) ?? 0) >= CROWD_PLEASER_THRESHOLDS.comments &&
    Number(recipe.rating_count ?? 0) >= CROWD_PLEASER_THRESHOLDS.ratings,
  );

  const currentValues = {
    recipe_maker: ownedRecipes.length,
    tastemaker: ratingCount,
    collector: bookmarkCount,
    sous_critic: commentCount,
    tracker: trackedDates.length,
    streak_keeper: longestStreak(visitDates),
    passport_pantry: cuisineCount,
    alchemist: Number(maxOwnedExoticness.toFixed(1)),
  };

  const achievements = [
    (() => {
      const key = 'recipe_maker' as const;
      const tier = Math.max(eventTier(achievementEvents, key), derivedTier(key, currentValues[key]));
      return {
        key,
        unlocked: tier > 0,
        currentTier: tier,
        currentValue: currentValues[key],
        nextThreshold: ACHIEVEMENTS[key].thresholds.find((entry) => entry.tier > tier)?.threshold ?? null,
      };
    })(),
    (() => {
      const key = 'tastemaker' as const;
      const tier = Math.max(eventTier(achievementEvents, key), derivedTier(key, currentValues[key]));
      return {
        key,
        unlocked: tier > 0,
        currentTier: tier,
        currentValue: currentValues[key],
        nextThreshold: ACHIEVEMENTS[key].thresholds.find((entry) => entry.tier > tier)?.threshold ?? null,
      };
    })(),
    (() => {
      const key = 'collector' as const;
      const tier = Math.max(eventTier(achievementEvents, key), derivedTier(key, currentValues[key]));
      return {
        key,
        unlocked: tier > 0,
        currentTier: tier,
        currentValue: currentValues[key],
        nextThreshold: ACHIEVEMENTS[key].thresholds.find((entry) => entry.tier > tier)?.threshold ?? null,
      };
    })(),
    (() => {
      const key = 'sous_critic' as const;
      const tier = Math.max(eventTier(achievementEvents, key), derivedTier(key, currentValues[key]));
      return {
        key,
        unlocked: tier > 0,
        currentTier: tier,
        currentValue: currentValues[key],
        nextThreshold: ACHIEVEMENTS[key].thresholds.find((entry) => entry.tier > tier)?.threshold ?? null,
      };
    })(),
    (() => {
      const key = 'tracker' as const;
      const tier = Math.max(eventTier(achievementEvents, key), derivedTier(key, currentValues[key]));
      return {
        key,
        unlocked: tier > 0,
        currentTier: tier,
        currentValue: currentValues[key],
        nextThreshold: ACHIEVEMENTS[key].thresholds.find((entry) => entry.tier > tier)?.threshold ?? null,
      };
    })(),
    (() => {
      const key = 'streak_keeper' as const;
      const tier = Math.max(eventTier(achievementEvents, key), derivedTier(key, currentValues[key]));
      return {
        key,
        unlocked: tier > 0,
        currentTier: tier,
        currentValue: currentValues[key],
        nextThreshold: ACHIEVEMENTS[key].thresholds.find((entry) => entry.tier > tier)?.threshold ?? null,
      };
    })(),
    {
      key: 'signature_dish' as const,
      unlocked: hasAchievementEvent(achievementEvents, 'signature_dish') || profile.signature_recipe != null,
      currentTier: null,
      currentValue: profile.signature_recipe != null ? 1 : 0,
      nextThreshold: 1,
    },
    {
      key: 'passport_pantry' as const,
      unlocked: hasAchievementEvent(achievementEvents, 'passport_pantry') || cuisineCount >= PASSPORT_PANTRY_CUISINE_THRESHOLD,
      currentTier: null,
      currentValue: cuisineCount,
      nextThreshold: PASSPORT_PANTRY_CUISINE_THRESHOLD,
    },
    {
      key: 'alchemist' as const,
      unlocked: hasAchievementEvent(achievementEvents, 'alchemist') || maxOwnedExoticness >= ALCHEMIST_EXOTICNESS_THRESHOLD,
      currentTier: null,
      currentValue: Number(maxOwnedExoticness.toFixed(1)),
      nextThreshold: ALCHEMIST_EXOTICNESS_THRESHOLD,
    },
    {
      key: 'crowd_pleaser' as const,
      unlocked: hasAchievementEvent(achievementEvents, 'crowd_pleaser') || crowdPleaserLive,
      currentTier: null,
      currentValue: null,
      nextThreshold: null,
    },
  ];

  return {
    xp: Number(profile.xp ?? 0),
    level: getLevelInfo(profile.xp ?? 0),
    counts: {
      commented: commentCount,
      trackedDays: trackedDates.length,
      visitStreak: currentValues.streak_keeper,
      cuisineCount,
    },
    achievements,
  };
}

export async function handleRecipeCreated(client: AnyClient, userId: string, recipeId: number) {
  await awardActionXp(client, userId, 'recipe_created', {
    refType: 'recipe',
    refId: recipeId,
  });

  const createdCount = await countRecipesByUser(client, userId);
  await maybeUnlockTieredAchievement(client, userId, 'recipe_maker', createdCount);
  await evaluateAlchemistForRecipe(client, recipeId);
}

export async function handleFirstRatingGiven(
  client: AnyClient,
  userId: string,
  recipeId: number,
) {
  await awardActionXp(client, userId, 'rating_given', {
    refType: 'recipe',
    refId: recipeId,
    logicalDate: new Date().toISOString(),
  });

  const ratingCount = await countRatingsByUser(client, userId);
  await maybeUnlockTieredAchievement(client, userId, 'tastemaker', ratingCount);
}

export async function handleFirstBookmarkCreated(
  client: AnyClient,
  userId: string,
  recipeId: number,
) {
  await awardActionXp(client, userId, 'bookmark_created', {
    refType: 'recipe',
    refId: recipeId,
    logicalDate: new Date().toISOString(),
  });

  const bookmarkCount = await countBookmarksByUser(client, userId);
  await maybeUnlockTieredAchievement(client, userId, 'collector', bookmarkCount);

  const cuisineCount = await distinctBookmarkedCuisineCount(client, userId);
  if (cuisineCount >= PASSPORT_PANTRY_CUISINE_THRESHOLD) {
    await awardAchievement(client, userId, 'passport_pantry');
  }
}

export async function handleCommentCreated(
  client: AnyClient,
  userId: string,
  commentId: number,
) {
  await awardActionXp(client, userId, 'comment_created', {
    refType: 'comment',
    refId: commentId,
    logicalDate: new Date().toISOString(),
  });

  const commentCount = await countCommentsByUser(client, userId);
  await maybeUnlockTieredAchievement(client, userId, 'sous_critic', commentCount);
}

export async function handleSignatureSet(client: AnyClient, userId: string, recipeId: number) {
  await awardActionXp(client, userId, 'signature_set', {
    refType: 'recipe',
    refId: recipeId,
  });
  await awardAchievement(client, userId, 'signature_dish');
}

export async function handleTrackingSaved(
  client: AnyClient,
  userId: string,
  logicalDate: string,
) {
  await awardActionXp(client, userId, 'tracking_day_logged', {
    refType: 'tracking_day',
    refId: null,
    logicalDate,
    oncePerDay: true,
  });

  const trackedDays = await trackedDatesByUser(client, userId);
  await maybeUnlockTieredAchievement(client, userId, 'tracker', trackedDays.length);
}

export async function handleDailyVisit(client: AnyClient, userId: string, logicalDate: string) {
  await awardActionXp(client, userId, 'app_visit_daily', {
    refType: 'visit_day',
    logicalDate,
    oncePerDay: true,
  });

  const dates = await visitDatesByUser(client, userId);
  await maybeUnlockTieredAchievement(client, userId, 'streak_keeper', longestStreak(dates));
}

export async function maybeAwardSaveReceived(
  client: AnyClient,
  ownerUserId: string | null,
  actorUserId: string,
  recipeId: number,
) {
  if (!ownerUserId || ownerUserId === actorUserId) return;
  await awardActionXp(client, ownerUserId, 'save_received', {
    refType: `recipe:${recipeId}:actor:${actorUserId}`,
    refId: recipeId,
  });
}

export async function maybeAwardRatingReceived(
  client: AnyClient,
  ownerUserId: string | null,
  actorUserId: string,
  recipeId: number,
) {
  if (!ownerUserId || ownerUserId === actorUserId) return;
  await awardActionXp(client, ownerUserId, 'rating_received', {
    refType: `recipe:${recipeId}:actor:${actorUserId}`,
    refId: recipeId,
  });
}

export async function evaluateAlchemistForRecipe(client: AnyClient, recipeId: number) {
  const recipe = await recipeSnapshot(client, recipeId);
  if (!recipe?.user_id) return;
  if ((recipe.exoticness ?? 0) >= ALCHEMIST_EXOTICNESS_THRESHOLD) {
    await awardAchievement(client, recipe.user_id, 'alchemist', {
      refType: 'recipe',
      refId: recipeId,
    });
  }
}

export async function evaluateCrowdPleaserForRecipe(client: AnyClient, recipeId: number) {
  const recipe = await recipeSnapshot(client, recipeId);
  if (!recipe?.user_id) return;

  const [bookmarkCount, commentCount] = await Promise.all([
    bookmarkCountForRecipe(client, recipeId),
    commentCountForRecipe(client, recipeId),
  ]);

  const qualifies =
    (recipe.relevancy ?? 0) >= CROWD_PLEASER_THRESHOLDS.relevancy &&
    bookmarkCount >= CROWD_PLEASER_THRESHOLDS.saves &&
    commentCount >= CROWD_PLEASER_THRESHOLDS.comments &&
    (recipe.rating_count ?? 0) >= CROWD_PLEASER_THRESHOLDS.ratings;

  if (!qualifies) return;

  await awardAchievement(client, recipe.user_id, 'crowd_pleaser', {
    refType: 'recipe',
    refId: recipeId,
  });
}
