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

  // Delegate to real middleware; swallow errors so unauthenticated users pass through
  authMiddleware(req, res, (err?: unknown) => {
    // If auth fails, just continue without userId
    next();
  });
}

// List all tracks
router.get('/', async (_req, res) => {
  try {
    // Tracks are derived from CompetencyDomain.trackId (unique set)
    const domains = await prisma.competencyDomain.findMany({
      orderBy: { order: 'asc' },
      select: { trackId: true },
    });

    const trackIds = [...new Set(domains.map((d) => d.trackId))];

    // For each track, count domains
    const tracks = await Promise.all(
      trackIds.map(async (trackId) => {
        const domainCount = await prisma.competencyDomain.count({
          where: { trackId },
        });
        return { trackId, domainCount };
      }),
    );

    res.json({ tracks });
  } catch (err) {
    console.error('Tracks list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single track with domains and optional user progress
router.get('/:trackId', optionalAuth, async (req, res) => {
  try {
    const { trackId } = req.params;
    const authReq = req as AuthRequest;

    const domains = await prisma.competencyDomain.findMany({
      where: { trackId },
      orderBy: { order: 'asc' },
      include: {
        modules: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: { id: true, title: true, tier: true, order: true },
        },
      },
    });

    if (domains.length === 0) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    // Enrich with user progress if authenticated
    let domainMastery: Record<string, { score: number; stars: number; isMastered: boolean }> = {};
    if (authReq.userId) {
      const mastery = await prisma.domainMastery.findMany({
        where: { userId: authReq.userId, domain: { trackId } },
      });
      for (const m of mastery) {
        domainMastery[m.domainId] = {
          score: m.score,
          stars: m.stars,
          isMastered: m.isMastered,
        };
      }
    }

    res.json({ trackId, domains, domainMastery });
  } catch (err) {
    console.error('Track get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List domains for a track with module counts
router.get('/:trackId/domains', async (req, res) => {
  try {
    const { trackId } = req.params;

    const domains = await prisma.competencyDomain.findMany({
      where: { trackId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { modules: true } },
      },
    });

    if (domains.length === 0) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    res.json({
      trackId,
      domains: domains.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        order: d.order,
        moduleCount: d._count.modules,
      })),
    });
  } catch (err) {
    console.error('Track domains error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
