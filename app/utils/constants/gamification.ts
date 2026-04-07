export const ACHIEVEMENT_ORDER = [
  'recipe_maker',
  'tastemaker',
  'collector',
  'sous_critic',
  'tracker',
  'streak_keeper',
  'signature_dish',
  'passport_pantry',
  'alchemist',
  'crowd_pleaser',
] as const;

export const ACHIEVEMENT_DISPLAY: Record<
  string,
  {
    name: string;
    icon: string;
    kind: 'tiered' | 'special';
    description: string;
    targetLabel?: string;
  }
> = {
  recipe_maker: {
    name: 'Creator',
    icon: '🍽️',
    kind: 'tiered',
    description: 'Create or import recipes.',
    targetLabel: 'recipes',
  },
  tastemaker: {
    name: 'Tastemaker',
    icon: '⭐',
    kind: 'tiered',
    description: 'Rate recipes from the community.',
    targetLabel: 'ratings',
  },
  collector: {
    name: 'Collector',
    icon: '🔖',
    kind: 'tiered',
    description: 'Save recipes to your cookbook.',
    targetLabel: 'saved',
  },
  sous_critic: {
    name: 'Sous-Critic',
    icon: '💬',
    kind: 'tiered',
    description: 'Write comments and join the discussion.',
    targetLabel: 'comments',
  },
  tracker: {
    name: 'Tracker',
    icon: '📈',
    kind: 'tiered',
    description: 'Log meals across distinct days.',
    targetLabel: 'days',
  },
  streak_keeper: {
    name: 'Streak Keeper',
    icon: '🔥',
    kind: 'tiered',
    description: 'Visit the app on consecutive days.',
    targetLabel: 'days',
  },
  signature_dish: {
    name: 'Signed & Sealed',
    icon: '✍️',
    kind: 'special',
    description: 'Set your signature recipe.',
  },
  passport_pantry: {
    name: 'Passport Pantry',
    icon: '🌍',
    kind: 'special',
    description: 'Save recipes from 10 different cuisines.',
  },
  alchemist: {
    name: 'Alchemist',
    icon: '🧪',
    kind: 'special',
    description: 'Create a recipe with high exoticness.',
  },
  crowd_pleaser: {
    name: 'Crowd Pleaser',
    icon: '📣',
    kind: 'special',
    description: 'Create a recipe that catches on.',
  },
};

export function tierLabel(tier: number | null | undefined) {
  if (tier === 3) return 'gold';
  if (tier === 2) return 'silver';
  if (tier === 1) return 'bronze';
  return null;
}

const LEVEL_STEPS = [
  { minLevel: 1, title: 'Curious Cook', icon: '🍳' },
  { minLevel: 5, title: 'Home Cook', icon: '🥘' },
  { minLevel: 10, title: 'Sous Chef', icon: '🍲' },
  { minLevel: 15, title: 'Expert Chef', icon: '👨‍🍳' },
  { minLevel: 20, title: 'Master Chef', icon: '🏆' },
  { minLevel: 30, title: 'Kitchen Legend', icon: '👑' },
] as const;

export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return (75 * (level - 1) * level) / 2;
}

export function getLevelMeta(level: number) {
  let current = LEVEL_STEPS[0]!;
  let next: (typeof LEVEL_STEPS)[number] | null = null;

  for (const step of LEVEL_STEPS) {
    if (step.minLevel <= level) current = step;
    if (step.minLevel > level) {
      next = step;
      break;
    }
  }

  return {
    title: current.title,
    icon: current.icon,
    nextTitle: next?.title ?? null,
  };
}

export function getLevelInfo(xp: number | null | undefined) {
  const safeXp = Math.max(0, Number(xp ?? 0));
  let level = 1;
  while (xpForLevel(level + 1) <= safeXp) {
    level += 1;
  }

  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const progressDenom = Math.max(1, nextFloor - currentFloor);
  const progressPct = Math.max(
    0,
    Math.min(100, ((safeXp - currentFloor) / progressDenom) * 100),
  );
  const meta = getLevelMeta(level);

  return {
    level,
    xp: safeXp,
    currentFloor,
    nextFloor,
    progressPct,
    title: meta.title,
    icon: meta.icon,
    nextTitle: meta.nextTitle,
  };
}
