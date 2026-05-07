// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

/** Optional auth — sets userId if token present, but does not reject. */
function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  authMiddleware(req, res, () => {
    next();
  });
}

// Get domain with modules
router.get('/:domainId', async (req, res) => {
  try {
    const domain = await prisma.competencyDomain.findUnique({
      where: { id: req.params.domainId },
      include: {
        modules: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            tier: true,
            bloomLevel: true,
            order: true,
          },
        },
      },
    });

    if (!domain) {
      res.status(404).json({ error: 'Domain not found' });
      return;
    }

    res.json({ domain });
  } catch (err) {
    console.error('Domain get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List modules for a domain with lesson counts and user progress
router.get('/:domainId/modules', optionalAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const domain = await prisma.competencyDomain.findUnique({
      where: { id: req.params.domainId },
    });

    if (!domain) {
      res.status(404).json({ error: 'Domain not found' });
      return;
    }

    const modules = await prisma.module.findMany({
      where: { domainId: req.params.domainId, isPublished: true },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { lessons: true } },
        assessment: { select: { id: true, title: true } },
      },
    });

    // Get user progress per module if authenticated
    let moduleProgress: Record<string, { completedLessons: number; totalLessons: number }> = {};
    if (authReq.userId) {
      for (const mod of modules) {
        const totalLessons = await prisma.lesson.count({
          where: { moduleId: mod.id, isPublished: true },
        });
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId: authReq.userId,
            lesson: { moduleId: mod.id },
            status: 'completed',
          },
        });
        moduleProgress[mod.id] = { completedLessons, totalLessons };
      }
    }

    res.json({
      domain: { id: domain.id, name: domain.name, trackId: domain.trackId },
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        tier: m.tier,
        bloomLevel: m.bloomLevel,
        order: m.order,
        lessonCount: m._count.lessons,
        hasAssessment: !!m.assessment,
        assessmentId: m.assessment?.id ?? null,
        progress: moduleProgress[m.id] ?? null,
      })),
    });
  } catch (err) {
    console.error('Domain modules error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
