import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  // `cookies` comes from cookie-parser middleware (mounted in server.ts) —
  // we use the Express-default `Record<string, any>` type for compatibility.
}

/**
 * Accepts the JWT from either:
 *   1. `bc_token` httpOnly cookie (preferred — not readable by JS, so XSS
 *      can't exfiltrate it)
 *   2. `Authorization: Bearer <token>` header (legacy — kept while the
 *      AuthContext still keeps the token in localStorage)
 *
 * Cookie wins if both are present. Frontends should migrate to relying on
 * the cookie (with `credentials: 'include'` on fetch) and stop holding
 * the token in localStorage. Until that migration ships, both paths work.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const cookieToken = (req.cookies as Record<string, string | undefined> | undefined)?.bc_token;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = cookieToken ?? headerToken;
  if (!token) {
    res.status(401).json({ error: 'Missing authentication token' });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as {
      userId?: string;
      aud?: string;
    };

    // Employer tokens are signed with the same secret (see
    // middleware/employerAuth.ts). They carry `employerId` and an `employer`
    // audience, never `userId` — so without these two checks a valid employer
    // token would pass verification here, leave `req.userId` undefined, and
    // reach a route that queries on it. Reject both shapes explicitly rather
    // than relying on the downstream query to fail.
    if (decoded.aud === 'employer' || typeof decoded.userId !== 'string') {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
