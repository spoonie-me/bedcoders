// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { xpProgress } from '../lib/gamification.js';

const router = Router();

// Get user's XP, level, streaks, recent badges
router.get('/', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const gamification = await prisma.gamification.findUnique({
      where: { userId: authReq.userId },
    });

    if (!gamification) {
      res.json({
        totalXp: 0,
        level: 1,
        xpProgress: xpProgress(0),
        currentStreak: 0,
        bestStreak: 0,
        recentBadges: [],
      });
      return;
    }

    // Recent badges (last 10)
    const recentBadges = await prisma.userBadge.findMany({
      where: { userId: authReq.userId },
      orderBy: { earnedAt: 'desc' },
      take: 10,
      include: {
        badge: {
          select: { key: true, name: true, description: true, icon: true, tier: true, category: true },
        },
      },
    });

    res.json({
      totalXp: gamification.totalXp,
      level: gamification.level,
      xpProgress: xpProgress(gamification.totalXp),
      currentStreak: gamification.currentStreak,
      bestStreak: gamification.bestStreak,
      lastActiveDate: gamification.lastActiveDate,
      recentBadges: recentBadges.map((ub) => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
      })),
    });
  } catch (err) {
    console.error('Gamification get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's earned badges
router.get('/badges', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const userBadges = await prisma.userBadge.findMany({
      where: { userId: authReq.userId },
      orderBy: { earnedAt: 'desc' },
      include: {
        badge: true,
      },
    });

    // Also fetch all badges so the client can show locked ones
    const allBadges = await prisma.badge.findMany({
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });

    const earnedIds = new Set(userBadges.map((ub) => ub.badgeId));

    res.json({
      earned: userBadges.map((ub) => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
      })),
      all: allBadges.map((b) => ({
        ...b,
        isEarned: earnedIds.has(b.id),
      })),
    });
  } catch (err) {
    console.error('Badges get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard for a track
router.get('/leaderboard/:trackId', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { trackId } = req.params;

    const entries = await prisma.leaderboardEntry.findMany({
      where: { trackId },
      orderBy: { totalXp: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            leaderboardOptIn: true,
            profile: { select: { displayName: true, avatar: true } },
          },
        },
      },
    });

    // Filter to only users who opted in, anonymize the rest
    const leaderboard = entries
      .filter((e) => e.user.leaderboardOptIn)
      .map((e, index) => ({
        rank: index + 1,
        totalXp: e.totalXp,
        displayName: e.user.profile?.displayName ?? e.user.name ?? 'Anonymous',
        avatar: e.user.profile?.avatar ?? null,
        isCurrentUser: e.userId === authReq.userId,
      }));

    // Find current user's rank even if not in top 100
    let currentUserRank = leaderboard.find((e) => e.isCurrentUser);
    if (!currentUserRank) {
      const userEntry = await prisma.leaderboardEntry.findUnique({
        where: { userId_trackId: { userId: authReq.userId!, trackId } },
      });
      if (userEntry) {
        const higherCount = await prisma.leaderboardEntry.count({
          where: {
            trackId,
            totalXp: { gt: userEntry.totalXp },
            user: { leaderboardOptIn: true },
          },
        });
        currentUserRank = {
          rank: higherCount + 1,
          totalXp: userEntry.totalXp,
          displayName: 'You',
          avatar: null,
          isCurrentUser: true,
        };
      }
    }

    res.json({ leaderboard, currentUser: currentUserRank ?? null });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
