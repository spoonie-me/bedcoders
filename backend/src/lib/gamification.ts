// @ts-nocheck
// ─── XP Reward Constants ───────────────────────────────────────────────────

export const XP_REWARDS = {
  KNOWLEDGE_CHECK: 5,
  GRADED_EXERCISE_CORRECT: 15,
  GRADED_EXERCISE_INCORRECT: 5,
  LESSON_COMPLETE: 50,
  MODULE_ASSESSMENT_PASS: 100,
  DOMAIN_MASTERY: 200,
  FINAL_EXAM_PASS: 500,
  STREAK_7_DAY: 50,
  STREAK_30_DAY: 200,
} as const;

export type XpRewardKey = keyof typeof XP_REWARDS;

// ─── XP & Leveling ────────────────────────────────────────────────────────

/** XP required to complete a given level (1-indexed). */
export function xpForLevel(n: number): number {
  if (n < 1) return 0;
  return 500 + (n - 1) * 150;
}

/** Determine the current level from total accumulated XP. */
export function levelFromXp(totalXp: number): number {
  if (totalXp <= 0) return 1;

  let remaining = totalXp;
  let level = 1;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }

  return level;
}

export interface XpProgress {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercent: number;
}

/** Full progress breakdown for current level. */
export function xpProgress(totalXp: number): XpProgress {
  if (totalXp <= 0) {
    const needed = xpForLevel(1);
    return { level: 1, currentXp: 0, xpToNextLevel: needed, progressPercent: 0 };
  }

  let remaining = totalXp;
  let level = 1;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }

  const needed = xpForLevel(level);
  const progressPercent = Math.round((remaining / needed) * 100);

  return {
    level,
    currentXp: remaining,
    xpToNextLevel: needed,
    progressPercent,
  };
}

// ─── Mastery ───────────────────────────────────────────────────────────────

export interface ExerciseResult {
  score: number;
  weight: number;
}

/** Weighted average across exercises in a domain. */
export function calculateDomainMastery(exercises: ExerciseResult[]): number {
  if (exercises.length === 0) return 0;

  const totalWeight = exercises.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = exercises.reduce((sum, e) => sum + e.score * e.weight, 0);
  return weightedSum / totalWeight;
}

export type Tier = 'foundation' | 'application' | 'mastery';

/** Check whether a tier is unlocked based on the previous tier's score. */
export function isTierUnlocked(tier: Tier, prevTierScore: number): boolean {
  switch (tier) {
    case 'foundation':
      return true;
    case 'application':
      return prevTierScore >= 70;
    case 'mastery':
      return prevTierScore >= 75;
    default:
      return false;
  }
}

/** A domain is mastered when the weighted average is >= 80%. */
export function isDomainMastered(avgScore: number): boolean {
  return avgScore >= 80;
}

/** 1-5 stars based on score ranges. Returns 0 if below 60. */
export function calculateMasteryStars(avgScore: number): number {
  if (avgScore >= 95) return 5;
  if (avgScore >= 90) return 4;
  if (avgScore >= 80) return 3;
  if (avgScore >= 70) return 2;
  if (avgScore >= 60) return 1;
  return 0;
}

// ─── Streaks ───────────────────────────────────────────────────────────────

/**
 * Count consecutive days of activity going backwards from today.
 * Expects an array of Date objects representing activity days.
 * Duplicate dates are collapsed; order does not matter.
 */
export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Normalise to YYYY-MM-DD strings and deduplicate
  const dayStrings = new Set(
    dates.map((d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }),
  );

  const today = new Date();
  let streak = 0;
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!dayStrings.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
