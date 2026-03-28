// @ts-nocheck
import { Router, Request, Response } from 'express';
import { addSubscriber, processEmailQueue } from '../lib/email-sender.js';
import prisma from '../lib/db.js';

const router = Router();

// POST /api/subscribe — add subscriber to a sequence
router.post('/', async (req: Request, res: Response) => {
  const { email, sequence, name, source } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const sequenceId = sequence ?? 'spooniversity_launch';

  try {
    const subscriber = await addSubscriber(email, sequenceId, { name, source });
    res.json({ success: true, id: subscriber.id });
  } catch (err: any) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// GET /api/unsubscribe?email=xxx — one-click unsubscribe
router.get('/unsubscribe', async (req: Request, res: Response) => {
  const email = decodeURIComponent(String(req.query.email ?? ''));
  if (!email) return res.status(400).send('Missing email');

  await prisma.emailSubscriber.updateMany({
    where: { email },
    data: { status: 'unsubscribed', unsubscribedAt: new Date(), nextSendAt: null },
  });

  res.send(`
    <html><body style="font-family:Georgia,serif;max-width:500px;margin:80px auto;text-align:center;color:#333;">
      <h2>You're unsubscribed.</h2>
      <p>You won't hear from us again.</p>
    </body></html>
  `);
});

// POST /api/subscribe/process — cron endpoint to process email queue
router.post('/process', async (req: Request, res: Response) => {
  const secret = req.headers['x-cron-secret'] ?? req.body.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const count = await processEmailQueue();
  res.json({ success: true, processed: count });
});

// GET /api/subscribe/stats — quick stats
router.get('/stats', async (req: Request, res: Response) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [total, active, bySource] = await Promise.all([
    prisma.emailSubscriber.count(),
    prisma.emailSubscriber.count({ where: { status: 'active' } }),
    prisma.emailSubscriber.groupBy({ by: ['source'], _count: true }),
  ]);

  res.json({ total, active, bySource });
});

export default router;
