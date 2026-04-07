export const XP_ACTIONS = {
  app_visit_daily: { xp: 2, dailyCap: 2 },
  recipe_created: { xp: 40 },
  rating_given: { xp: 5, dailyCap: 25 },
  bookmark_created: { xp: 3, dailyCap: 18 },
  comment_created: { xp: 8, dailyCap: 24 },
  tracking_day_logged: { xp: 20 },
  signature_set: { xp: 25 },
  save_received: { xp: 2 },
  rating_received: { xp: 3 },
} as const;

export const ACHIEVEMENTS = {
  recipe_maker: {
    kind: 'tiered',
    thresholds: [
      { tier: 1, threshold: 1, xp: 15 },
      { tier: 2, threshold: 3, xp: 35 },
      { tier: 3, threshold: 10, xp: 75 },
    ],
  },
  tastemaker: {
    kind: 'tiered',
    thresholds: [
      { tier: 1, threshold: 1, xp: 15 },
      { tier: 2, threshold: 5, xp: 35 },
      { tier: 3, threshold: 15, xp: 75 },
    ],
  },
  collector: {
    kind: 'tiered',
    thresholds: [
      { tier: 1, threshold: 1, xp: 15 },
      { tier: 2, threshold: 10, xp: 35 },
      { tier: 3, threshold: 30, xp: 75 },
    ],
  },
  sous_critic: {
    kind: 'tiered',
    thresholds: [
      { tier: 1, threshold: 1, xp: 15 },
      { tier: 2, threshold: 3, xp: 35 },
      { tier: 3, threshold: 10, xp: 75 },
    ],
  },
  tracker: {
    kind: 'tiered',
    thresholds: [
      { tier: 1, threshold: 1, xp: 15 },
      { tier: 2, threshold: 10, xp: 35 },
      { tier: 3, threshold: 50, xp: 75 },
    ],
  },
  streak_keeper: {
    kind: 'tiered',
    thresholds: [
      { tier: 1, threshold: 2, xp: 15 },
      { tier: 2, threshold: 4, xp: 35 },
      { tier: 3, threshold: 7, xp: 75 },
    ],
  },
  signature_dish: {
    kind: 'special',
    xp: 40,
  },
  passport_pantry: {
    kind: 'special',
    xp: 55,
  },
  alchemist: {
    kind: 'special',
    xp: 65,
  },
  crowd_pleaser: {
    kind: 'special',
    xp: 80,
  },
} as const;

export const ALCHEMIST_EXOTICNESS_THRESHOLD = 8;

export const PASSPORT_PANTRY_CUISINE_THRESHOLD = 10;

export const CROWD_PLEASER_THRESHOLDS = {
  relevancy: 60,
  saves: 8,
  comments: 1,
  ratings: 3,
} as const;

export const CUISINE_TAG_MIN = 300;
export const CUISINE_TAG_MAX = 399;

export type AchievementKey = keyof typeof ACHIEVEMENTS;
export type ActionEventType = keyof typeof XP_ACTIONS;
