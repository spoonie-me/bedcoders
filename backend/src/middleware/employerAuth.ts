import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Employers authenticate on a separate identity from learners: a different
 * cookie (`bc_emp`), a different JWT claim (`employerId`, not `userId`), and
 * no shared middleware. That separation is deliberate — a bug that confuses
 * the two audiences is exactly the bug that leaks a learner's data into an
 * employer session, so the two paths never touch the same token shape.
 *
 * A learner token presented here fails: it carries `userId`, and we require
 * `employerId`. The reverse holds in authMiddleware.
 */
export interface EmployerRequest extends Request {
  employerId?: string;
  employerCompanyId?: string | null;
}

export const EMPLOYER_COOKIE_NAME = 'bc_emp';

interface EmployerTokenPayload {
  employerId: string;
  companyId?: string | null;
}

export function signEmployerToken(payload: EmployerTokenPayload, expiresInSeconds: number): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required.');
  // `aud` pins the token to the employer surface. Even if a token of the
  // other kind were ever signed with matching claims, it would not verify.
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds, audience: 'employer' });
}

export function employerAuthMiddleware(req: EmployerRequest, res: Response, next: NextFunction) {
  const cookieToken = (req.cookies as Record<string, string | undefined> | undefined)?.[
    EMPLOYER_COOKIE_NAME
  ];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = cookieToken ?? headerToken;
  if (!token) {
    res.status(401).json({ error: 'Missing employer authentication token' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      audience: 'employer',
    }) as EmployerTokenPayload;

    if (!decoded.employerId) {
      res.status(401).json({ error: 'Invalid employer token' });
      return;
    }

    req.employerId = decoded.employerId;
    req.employerCompanyId = decoded.companyId ?? null;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * For routes that act on behalf of a company (posting jobs, browsing the
 * directory, requesting intros). An employer account with no company yet is
 * authenticated but cannot reach learners — company setup comes first, so
 * every intro request a learner receives has an accountable company behind it.
 */
export function requireCompany(req: EmployerRequest, res: Response, next: NextFunction) {
  if (!req.employerCompanyId) {
    res.status(403).json({
      error: 'Complete your company profile before using this feature',
      code: 'COMPANY_REQUIRED',
    });
    return;
  }
  next();
}
