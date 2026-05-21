import { describe, it, expect } from 'vitest';
import {
  XP_REWARDS,
  xpForLevel,
  levelFromXp,
  xpProgress,
  calculateMasteryStars,
} from '../gamification';

describe('XP_REWARDS', () => {
  it('exposes the documented reward tiers', () => {
    expect(XP_REWARDS.KNOWLEDGE_CHECK).toBe(5);
    expect(XP_REWARDS.LESSON_COMPLETE).toBe(50);
    expect(XP_REWARDS.FINAL_EXAM_PASS).toBe(500);
  });
});

describe('xpForLevel', () => {
  it('returns 500 for level 1 (base)', () => {
    expect(xpForLevel(1)).toBe(500);
  });
  it('adds 150 per subsequent level', () => {
    expect(xpForLevel(2)).toBe(650);
    expect(xpForLevel(5)).toBe(1100);
  });
  it('returns 0 for non-positive levels', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-3)).toBe(0);
  });
});

describe('levelFromXp', () => {
  it('returns 1 for zero or negative XP', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-100)).toBe(1);
  });
  it('stays at level 1 until 500 XP', () => {
    expect(levelFromXp(499)).toBe(1);
    expect(levelFromXp(500)).toBe(2);
  });
  it('advances levels cumulatively', () => {
    // L1=500, L2=650 -> level 3 starts at 1150
    expect(levelFromXp(1150)).toBe(3);
    expect(levelFromXp(1149)).toBe(2);
  });
});

describe('xpProgress', () => {
  it('returns 0 progress at zero XP', () => {
    const p = xpProgress(0);
    expect(p.level).toBe(1);
    expect(p.currentXp).toBe(0);
    expect(p.xpToNextLevel).toBe(500);
    expect(p.progressPercent).toBe(0);
  });

  it('reports 50% progress halfway through a level', () => {
    const p = xpProgress(250);
    expect(p.level).toBe(1);
    expect(p.currentXp).toBe(250);
    expect(p.progressPercent).toBe(50);
  });

  it('rolls over into next level correctly', () => {
    const p = xpProgress(500);
    expect(p.level).toBe(2);
    expect(p.currentXp).toBe(0);
    expect(p.xpToNextLevel).toBe(650);
  });
});

describe('calculateMasteryStars', () => {
  it.each([
    [100, 5],
    [95, 5],
    [94, 4],
    [90, 4],
    [80, 3],
    [70, 2],
    [60, 1],
    [59, 0],
    [0, 0],
  ])('returns %i stars for score %i', (score, stars) => {
    expect(calculateMasteryStars(score)).toBe(stars);
  });
});
