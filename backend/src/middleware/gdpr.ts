// @ts-nocheck
import type { Request, Response, NextFunction } from 'express';
import { logAuditAction } from '../lib/compliance.js';
import type { AuthRequest } from './auth.js';

export function gdprLogger(req: Request, _res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (authReq.userId) {
    logAuditAction(authReq.userId, `${req.method} ${req.path}`, undefined, req).catch(() => {
      // Non-blocking audit log
    });
  }
  next();
}
