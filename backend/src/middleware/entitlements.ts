// @ts-nocheck
import type { Response, NextFunction } from 'express';
import { prisma } from '../lib/db.js';
import { getTrackAccess } from '../lib/stripe.js';
import type { AuthRequest } from './auth.js';

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────

export interface EntitledRequest extends AuthRequest {
  /** Track IDs the current user can access (full content). */
  trackAccess: string[];
}

// ──────────────────────────────────────────
// GENERAL ENTITLEMENTS MIDDLEWARE
// ──────────────────────────────────────────

/**
 * Reads the user's subscription/purchase from the database and sets
 * `req.trackAccess` with the list of accessible track IDs.
 *
 * Free tier: every user gets the first module of any track for free.
 * That logic is handled at the route level — `trackAccess` only lists
 * tracks with full (paid) access.
 *
 * Must be mounted after `authMiddleware`.
 */
export async function entitlementsMiddleware(
  req: EntitledRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      req.trackAccess = [];
      next();
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      req.trackAccess = [];
      next();
      return;
    }

    req.trackAccess = getTrackAccess(subscription);
    next();
  } catch (error) {
    console.error('Entitlements middleware error:', error);
    // Fail open with no access rather than crashing the request
    req.trackAccess = [];
    next();
  }
}

// ──────────────────────────────────────────
// PER-TRACK GATE
// ──────────────────────────────────────────

/**
 * Returns middleware that blocks access unless the user has the given
 * track unlocked, **or** the requested content is in the first module
 * of that track (free tier preview).
 *
 * Usage:
 * ```ts
 * router.get('/tracks/:trackId/lessons/:lessonId',
 *   authMiddleware,
 *   entitlementsMiddleware,
 *   requireTrackAccess('params.trackId'),  // reads trackId from req.params
 *   handler,
 * );
 * ```
 *
 * Pass a literal track ID string or `'params.<name>'` to read it from
 * `req.params` at runtime.
 */
export function requireTrackAccess(trackIdOrParam: string) {
  return async (req: EntitledRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Resolve track ID — either literal or from route params
      const trackId = trackIdOrParam.startsWith('params.')
        ? req.params[trackIdOrParam.slice(7)]
        : trackIdOrParam;

      if (!trackId) {
        res.status(400).json({ error: 'Track ID is required' });
        return;
      }

      // Full paid access — allow through
      if (req.trackAccess?.includes(trackId)) {
        next();
        return;
      }

      // Free tier: allow access to the first module of any track.
      // Check if the requested lesson/module belongs to order=1 within its domain.
      const moduleId = req.params.moduleId;
      const lessonId = req.params.lessonId ?? req.params.id;

      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: lessonId },
          include: {
            module: {
              include: { domain: true },
            },
          },
        });

        if (lesson?.module?.domain?.trackId === trackId && lesson.module.order === 1) {
          next();
          return;
        }
      } else if (moduleId) {
        const mod = await prisma.module.findUnique({
          where: { id: moduleId },
          include: { domain: true },
        });

        if (mod?.domain?.trackId === trackId && mod.order === 1) {
          next();
          return;
        }
      }

      res.status(403).json({
        error: 'Track access required',
        message: 'Upgrade your plan to access this content.',
        trackId,
      });
    } catch (error) {
      console.error('requireTrackAccess error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
