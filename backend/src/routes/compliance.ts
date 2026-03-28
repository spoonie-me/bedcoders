// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/consent/gdpr', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { consentStatus } = req.body;

    await prisma.user.update({
      where: { id: authReq.userId },
      data: { gdprConsentedAt: new Date() },
    });

    await prisma.consentLog.create({
      data: {
        userId: authReq.userId,
        consentType: 'gdpr',
        consentStatus,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('GDPR consent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/consent/analytics', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { consentStatus } = req.body;

    await prisma.user.update({
      where: { id: authReq.userId },
      data: { analyticsOptIn: consentStatus },
    });

    await prisma.consentLog.create({
      data: {
        userId: authReq.userId,
        consentType: 'analytics',
        consentStatus,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Analytics consent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/data-export', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const request = await prisma.dataExportRequest.create({
      data: { userId: authReq.userId!, status: 'pending' },
    });

    res.json({ success: true, requestId: request.id });
  } catch (err) {
    console.error('Data export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/data-deletion', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    await prisma.dataDeletionRequest.create({
      data: {
        userId: authReq.userId!,
        scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
    });

    res.json({ success: true, message: 'Deletion scheduled for 30 days from now' });
  } catch (err) {
    console.error('Data deletion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
