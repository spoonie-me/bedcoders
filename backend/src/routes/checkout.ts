// @ts-nocheck
import { Router } from 'express';
import { stripe, createCustomer, STRIPE_PRICES, PLANS } from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const VALID_PRICE_IDS = Object.keys(STRIPE_PRICES) as (keyof typeof STRIPE_PRICES)[];

// ─── Create Checkout Session ─────────────────────────────────────────────

router.post('/session', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { priceId } = req.body as { priceId: string };

    // Validate priceId is a known plan
    if (!priceId || !VALID_PRICE_IDS.includes(priceId as any)) {
      res.status(400).json({ error: 'Invalid price ID.' });
      return;
    }

    // Get the Stripe price ID from env
    const stripePriceId = STRIPE_PRICES[priceId as keyof typeof STRIPE_PRICES];
    if (!stripePriceId) {
      console.error(`Stripe price ID not configured for: ${priceId}`);
      res.status(500).json({ error: 'Payment not configured. Please try again later.' });
      return;
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({ where: { id: authReq.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createCustomer(user.email, user.name ?? undefined);
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }

    const appUrl = process.env.APP_URL ?? 'https://bedcoders.com';

    // Create subscription checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${priceId}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        priceId,
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout session error:', err?.message ?? err);
    const detail = err?.type === 'StripeInvalidRequestError' ? err.message : undefined;
    res.status(500).json({ error: 'Failed to create checkout session', detail });
  }
});

// ─── Get Current Purchase / Access ──────────────────────────────────────

router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: authReq.userId },
    });

    if (!subscription) {
      // User has not purchased — return free tier info
      res.json({ subscription: null, plan: 'free' });
      return;
    }

    let tracksUnlocked: string[] = [];
    try {
      tracksUnlocked = typeof subscription.tracksUnlocked === 'string'
        ? JSON.parse(subscription.tracksUnlocked)
        : subscription.tracksUnlocked ?? [];
    } catch { /* empty */ }

    res.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        tracksUnlocked,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Billing Portal ──────────────────────────────────────────────────────

router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const user = await prisma.user.findUnique({ where: { id: authReq.userId } });

    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: 'No billing account found' });
      return;
    }

    const appUrl = process.env.APP_URL ?? 'https://bedcoders.com';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

export default router;
