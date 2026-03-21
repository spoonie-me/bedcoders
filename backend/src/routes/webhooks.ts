// @ts-nocheck
import { Router } from 'express';
import type { Request, Response } from 'express';
import { stripe, ALL_TRACKS } from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
import { sendPurchaseConfirmation } from '../lib/email.js';

const router = Router();

// Stripe webhook — must use raw body
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      (req as Request & { rawBody?: Buffer }).rawBody ?? req.body,
      sig,
      webhookSecret,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  const TRACK_NAMES: Record<string, string> = {
    fundamentals: '🛏️ Code from Bed',
    ai: '🤖 AI Literacy for Humans',
    tools: '⚡ Build Cool Tools Fast',
    advanced: '🚀 AI Agents that Work',
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const sessionId = session.id;

        // Idempotency: skip if we've already processed this Stripe session
        const alreadyProcessed = await prisma.subscription.findFirst({
          where: { stripeSessionId: sessionId },
        });
        if (alreadyProcessed) {
          console.log(`Webhook: session ${sessionId} already processed, skipping.`);
          break;
        }

        const customerId = session.customer as string;
        const priceId = session.metadata?.priceId;

        if (!priceId) {
          console.warn(`Webhook: checkout.session.completed missing priceId in metadata, sessionId ${sessionId}`);
          break;
        }

        // Map priceId to plan name and determine tracks
        // Pro Monthly, Pro Annual, and Team Seat all unlock all 4 tracks
        const tracksToUnlock = ['fundamentals', 'ai', 'tools', 'advanced'];

        // Find user by Stripe customer ID, fall back to userId in session metadata
        const metadataUserId = session.metadata?.userId;
        let user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user && metadataUserId) {
          user = await prisma.user.findUnique({ where: { id: metadataUserId } });
        }
        if (!user) {
          console.error(`Webhook: user not found for customer ${customerId}, sessionId ${sessionId} — acknowledging to prevent infinite retries`);
          res.json({ received: true, warning: 'User not found' });
          return;
        }

        // Use the subscription ID for recurring subscriptions
        const subscriptionId = session.subscription as string | undefined;

        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            plan: priceId,
            status: 'active',
            stripeId: subscriptionId,
            stripeSessionId: sessionId,
            tracksUnlocked: JSON.stringify(tracksToUnlock),
          },
          update: {
            plan: priceId,
            status: 'active',
            stripeId: subscriptionId,
            stripeSessionId: sessionId,
            tracksUnlocked: JSON.stringify(tracksToUnlock),
          },
        });
        console.log(`Subscription activated for user ${user.id}, plan: ${priceId}, tracks: all 4`);

        // Send purchase confirmation email (non-blocking)
        try {
          const planLabel = {
            pro_monthly: 'Pro (Monthly)',
            pro_annual: 'Pro (Annual)',
            team_seat: 'Team Seat',
          }[priceId] || priceId;

          await sendPurchaseConfirmation(user.email, {
            name: user.name ?? undefined,
            plan: planLabel,
            tracks: tracksToUnlock.map(t => TRACK_NAMES[t] ?? t),
            amount: priceId === 'pro_annual' ? '€120/year' : priceId === 'team_seat' ? '€15/user/month' : '€12/month',
          });
        } catch (emailErr) {
          console.error('Failed to send purchase confirmation email:', emailErr);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer as string;
        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        await prisma.subscription.updateMany({
          where: { userId: user.id },
          data: {
            status: sub.status, // active, past_due, unpaid, etc.
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelledAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
          },
        });
        console.log(`Subscription updated for user ${user.id}: status=${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer as string;
        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user) break;

        // Revoke access when subscription is deleted/cancelled
        await prisma.subscription.updateMany({
          where: { userId: user.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            tracksUnlocked: JSON.stringify([]),
          },
        });
        console.log(`Subscription cancelled for user ${user.id}`);
        break;
      }

      default:
        // No-op for unhandled events
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    res.status(500).json({ error: 'Webhook processing failed' });
    return;
  }

  res.json({ received: true });
});

export default router;
