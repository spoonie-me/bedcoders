// ─── Client-side gamification utilities (pure functions, no DB logic) ──────

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

// ─── Mastery Stars ─────────────────────────────────────────────────────────

/** 1-5 stars based on score ranges. Returns 0 if below 60. */
export function calculateMasteryStars(avgScore: number): number {
  if (avgScore >= 95) return 5;
  if (avgScore >= 90) return 4;
  if (avgScore >= 80) return 3;
  if (avgScore >= 70) return 2;
  if (avgScore >= 60) return 1;
  return 0;
}
