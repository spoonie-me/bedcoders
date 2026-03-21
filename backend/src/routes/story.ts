// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();

// POST /api/story — submit a career testimonial
router.post('/', async (req, res) => {
  try {
    const { name, role, track, outcome, quote, email } = req.body;

    if (!name || !role || !track || !outcome || !quote) {
      res.status(400).json({ error: 'Missing required fields: name, role, track, outcome, quote' });
      return;
    }

    // Store via AuditLog (userId nullable, no migration needed)
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'testimonial_submitted',
        resource: 'story',
        resourceId: track,
        status: 'pending_review',
        changes: JSON.stringify({ name, role, track, outcome, quote, email: email ?? null }),
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Story submit error:', err);
    res.status(500).json({ error: 'Failed to submit story' });
  }
});

export default router;
