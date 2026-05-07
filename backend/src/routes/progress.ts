// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user's full progress
router.get('/', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: authReq.userId },
      include: { lesson: { select: { id: true, title: true, moduleId: true, module: true } } },
    });

    const gamification = await prisma.gamification.findUnique({
      where: { userId: authReq.userId },
    });

    res.json({ progress, gamification });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lesson progress
router.post('/:lessonId', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { status, progress: pct } = req.body;

    const updated = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: authReq.userId!, lessonId: req.params.lessonId },
      },
      create: {
        userId: authReq.userId!,
        lessonId: req.params.lessonId,
        status: status ?? 'in-progress',
        progress: pct ?? 0,
      },
      update: {
        status: status ?? undefined,
        progress: pct ?? undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });

    // Award XP if completed
    if (status === 'completed' && updated.xpEarned === 0) {
      const xp = 100;
      await prisma.lessonProgress.update({
        where: { id: updated.id },
        data: { xpEarned: xp },
      });

      const gam = await prisma.gamification.upsert({
        where: { userId: authReq.userId },
        create: { userId: authReq.userId, totalXp: xp },
        update: { totalXp: { increment: xp } },
      });

      // Update streak (use UTC dates to avoid timezone drift)
      if (gam) {
        const today = new Date().toISOString().slice(0, 10);
        const lastActive = gam.lastActiveDate?.toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        let newStreak = gam.currentStreak;
        if (lastActive === yesterday) {
          newStreak += 1;
        } else if (lastActive !== today) {
          newStreak = 1;
        }

        await prisma.gamification.update({
          where: { userId: authReq.userId },
          data: {
            currentStreak: newStreak,
            bestStreak: Math.max(newStreak, gam.bestStreak),
            lastActiveDate: new Date(),
          },
        });
      }
    }

    res.json({ progress: updated });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
