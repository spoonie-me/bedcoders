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

      // Count this as a day learned — cumulative, never reset.
      //
      // This used to be a consecutive-day streak that reset to 1 whenever a day
      // was missed, with the best-ever figure kept alongside it forever. On a
      // platform for people whose conditions routinely take days away from them,
      // that meant the dashboard displayed a permanent monument to the last time
      // someone's body cooperated — and the landing page, the track catalog and
      // the "streak myth" blog post all explicitly promise "no streaks to break".
      // Now a gap of any length costs nothing: the number simply doesn't move on
      // days you're not here.
      if (gam) {
        const today = new Date().toISOString().slice(0, 10);
        const lastActive = gam.lastActiveDate?.toISOString().slice(0, 10);

        if (lastActive !== today) {
          await prisma.gamification.update({
            where: { userId: authReq.userId },
            data: {
              daysLearned: { increment: 1 },
              lastActiveDate: new Date(),
            },
          });
        }
      }
    }

    res.json({ progress: updated });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
