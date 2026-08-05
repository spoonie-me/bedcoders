import { Router } from 'express';
import crypto from 'crypto';
import { stripe, createCustomer, CREDENTIAL_PRICES, CREDENTIAL_PRODUCTS, CREDENTIAL_SELLABLE_TRACKS } from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { meetsCredentialBar, TRACK_DEPTH } from '../lib/credentialBar.js';

const router = Router();

// ─── EU VAT — let Stripe do the arithmetic ───────────────────────────────
//
// Added 2026-08-05. A credential is an electronically supplied service, so
// VAT is due in the *learner's* member state, not ours — from the first
// euro, across ~27 different rates. Rather than hand-roll that, Stripe Tax
// computes and records it per transaction; we register for OSS and file one
// return. What this config does:
//
//   automatic_tax      — Stripe determines the rate from the customer's
//                        location and records it on the payment.
//   customer_update    — lets Checkout save the address it collects back to
//                        the Customer (required by automatic_tax for a
//                        pre-existing customer, which ours always is).
//   tax_id_collection  — an employer or nonprofit can enter a VAT ID and get
//                        reverse-charge treatment plus a compliant invoice.
//                        Three of our four named customer segments are
//                        organisations that cannot expense a bare receipt.
//
// The €69 is VAT-INCLUSIVE: a learner promised "€69 once" pays exactly €69
// in every country, and our net varies by their rate instead. Enforced two
// places — `tax_behavior: 'inclusive'` on the price_data path below, and
// (because Stripe owns the field for fixed Prices) tax_behavior=inclusive on
// the STRIPE_PRICE_ID_* Prices in the Stripe Dashboard. Setting one without
// the other is how a learner ends up seeing €82.80 at checkout, so both are
// listed in the deploy checklist in BUSINESS_MODEL.md.
const TAX_CONFIG = {
  automatic_tax: { enabled: true },
  customer_update: { address: 'auto' },
  tax_id_collection: { enabled: true },
} as const;

// ─── Create Checkout Session — one-time Credential purchase ─────────────
//
// Replaces the old subscription checkout (2026-08-04, PRD.md §4.5). Body
// shape depends on productId:
//   { productId: 'track_credential', trackId: 'fundamentals' }
//   { productId: 'program_credential', trackIds: ['fundamentals','ai','tools'] }
//   { productId: 'code_review', trackId: 'fundamentals' }

router.post('/session', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { productId, trackId, trackIds } = req.body as {
      productId: keyof typeof CREDENTIAL_PRICES;
      trackId?: string;
      trackIds?: string[];
    };

    if (!productId || !(productId in CREDENTIAL_PRICES)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }

    const stripePriceId = CREDENTIAL_PRICES[productId];
    if (!stripePriceId) {
      console.error(`Stripe price ID not configured for: ${productId}`);
      res.status(500).json({ error: 'Payment not configured. Please try again later.' });
      return;
    }

    // Validate the track(s) being purchased are actually sellable.
    const requestedTracks: string[] = productId === 'program_credential' ? (trackIds ?? []) : [trackId ?? ''];
    if (requestedTracks.length === 0 || requestedTracks.some((t) => !t)) {
      res.status(400).json({ error: 'trackId (or trackIds for a program bundle) is required.' });
      return;
    }
    if (productId === 'program_credential' && requestedTracks.length !== 3) {
      res.status(400).json({ error: 'A Program Credential bundles exactly 3 tracks.' });
      return;
    }
    const invalidTrack = requestedTracks.find((t) => !(CREDENTIAL_SELLABLE_TRACKS as readonly string[]).includes(t));
    if (invalidTrack) {
      // A track can be missing from the sellable list for two different
      // reasons; say which, because "not yet" and "no such thing" are very
      // different messages to someone reaching for their card.
      const heldBack = !meetsCredentialBar(invalidTrack) && invalidTrack in TRACK_DEPTH;
      res.status(400).json({
        error: heldBack
          ? `The Credential for "${invalidTrack}" isn't on sale yet — the track is still growing to full depth. Every lesson in it stays free to read in the meantime.`
          : `Track "${invalidTrack}" doesn't have a Credential available yet.`,
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: authReq.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Refuse to sell a credential the user already owns.
    const alreadyOwned = await prisma.credentialPurchase.findMany({
      where: { userId: user.id, trackId: { in: requestedTracks } },
      select: { trackId: true },
    });
    if (alreadyOwned.length > 0) {
      res.status(400).json({
        error: `You already have a Credential for: ${alreadyOwned.map((c) => c.trackId).join(', ')}.`,
      });
      return;
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createCustomer(user.email, user.name ?? undefined);
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }

    const appUrl = process.env.APP_URL ?? 'https://bedcoders.com';
    const bundleId = productId === 'program_credential' ? crypto.randomUUID() : '';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment', // one-time, not subscription
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&credential=${productId}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      ...TAX_CONFIG,
      metadata: {
        userId: user.id,
        productId,
        trackIds: JSON.stringify(requestedTracks),
        bundleId,
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout session error:', err?.message ?? err);
    const detail = err?.type === 'StripeInvalidRequestError' ? err.message : undefined;
    res.status(500).json({ error: 'Failed to create checkout session', detail });
  }
});

// ─── Get Current Credentials Owned ───────────────────────────────────────

router.get('/credentials', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const purchases = await prisma.credentialPurchase.findMany({
      where: { userId: authReq.userId },
      select: { trackId: true, productType: true, purchasedAt: true },
    });

    res.json({ credentials: purchases });
  } catch (err) {
    console.error('Get credentials error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Pay-what-you-can hardship path ──────────────────────────────────────
//
// PRD.md §4.5: "pay-what-you-can down to €0, no proof required, no
// application." The €0 case grants the Credential purchase record
// directly, no Stripe session. Any amount > €0 goes through a real Stripe
// Checkout session at that custom amount via price_data (Stripe's fixed
// Price objects don't support "any amount").

router.post('/hardship', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { trackId, amountCents } = req.body as { trackId: string; amountCents: number };

    if (!trackId || !(CREDENTIAL_SELLABLE_TRACKS as readonly string[]).includes(trackId)) {
      res.status(400).json({ error: 'Invalid track.' });
      return;
    }
    if (typeof amountCents !== 'number' || amountCents < 0 || amountCents > CREDENTIAL_PRODUCTS.track_credential.priceInCents) {
      res.status(400).json({ error: 'Invalid amount.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: authReq.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existing = await prisma.credentialPurchase.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
    });
    if (existing) {
      res.status(400).json({ error: 'You already have a Credential for this track.' });
      return;
    }

    if (amountCents === 0) {
      // No payment to process — grant directly. stripeSessionId must stay
      // unique, so synthesize one that's clearly not a real Stripe id.
      await prisma.credentialPurchase.create({
        data: {
          userId: user.id,
          trackId,
          productType: 'track_credential',
          stripeSessionId: `hardship_${user.id}_${trackId}_${Date.now()}`,
          amountCents: 0,
        },
      });
      res.json({ granted: true });
      return;
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createCustomer(user.email, user.name ?? undefined);
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }

    const appUrl = process.env.APP_URL ?? 'https://bedcoders.com';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Soft Reset School - Track Credential (pay-what-you-can) - ${trackId}` },
          unit_amount: amountCents,
          // Whatever the learner chose is what they pay — VAT comes out of
          // it, never on top. Someone paying €5 because that's what they
          // have must not be billed €6.
          tax_behavior: 'inclusive' as const,
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&credential=track_credential`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      ...TAX_CONFIG,
      metadata: {
        userId: user.id,
        productId: 'track_credential',
        trackIds: JSON.stringify([trackId]),
        bundleId: '',
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Hardship checkout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
