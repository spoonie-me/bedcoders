// @ts-nocheck
import Stripe from 'stripe';
import { prisma } from './db.js';

export const stripe = new Stripe((process.env.STRIPE_SECRET_KEY ?? '').trim(), {
  apiVersion: '2025-02-24.acacia',
});

// ──────────────────────────────────────────
// PRICING TIERS — Subscription model
// ──────────────────────────────────────────

export const PLANS = {
  pro_monthly: {
    priceInCents: 1200, // €12/month
    currency: 'eur',
    mode: 'subscription' as const,
    interval: 'month' as const,
    label: 'Pro (Monthly)',
    description: 'All 4 tracks + unlimited lessons. Cancel anytime.',
  },
  pro_annual: {
    priceInCents: 12000, // €120/year
    currency: 'eur',
    mode: 'subscription' as const,
    interval: 'year' as const,
    label: 'Pro (Annual)',
    description: 'All 4 tracks + unlimited lessons. Save €24/year.',
  },
  team_seat: {
    priceInCents: 1500, // €15/user/month
    currency: 'eur',
    mode: 'subscription' as const,
    interval: 'month' as const,
    label: 'Team (Per Seat)',
    description: 'All tracks + admin dashboard. Min 5 seats.',
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Price IDs from env — set in Vercel (.trim() guards against Vercel's trailing \n on env pull)
export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY?.trim(),
  pro_annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL?.trim(),
  team_seat: process.env.STRIPE_PRICE_ID_TEAM_SEAT?.trim(),
} as const;

/** All known track IDs in the platform. */
export const ALL_TRACKS = ['fundamentals', 'ai', 'tools', 'advanced'] as const;
export type TrackId = (typeof ALL_TRACKS)[number];

// ──────────────────────────────────────────
// CHECKOUT
// ──────────────────────────────────────────

export async function createCustomer(email: string, name?: string) {
  return stripe.customers.create({ email, name: name ?? undefined });
}

// ──────────────────────────────────────────
// TRACK ACCESS HELPERS
// ──────────────────────────────────────────

/**
 * Determine which tracks a purchase/subscription grants access to.
 * Reads tracksUnlocked from the subscription record.
 */
export function getTrackAccess(subscription: {
  plan: string;
  status: string;
  tracksUnlocked: string[] | string;
}): string[] {
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return [];
  }

  // Parse tracksUnlocked (stored as JSON string in DB)
  let tracks: string[] = [];
  if (Array.isArray(subscription.tracksUnlocked)) {
    tracks = subscription.tracksUnlocked;
  } else if (typeof subscription.tracksUnlocked === 'string') {
    try {
      tracks = JSON.parse(subscription.tracksUnlocked);
    } catch {
      tracks = [];
    }
  }

  return tracks;
}

/**
 * Check whether a specific user has access to a specific track.
 */
export async function hasTrackAccess(userId: string, trackId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return false;

  const accessibleTracks = getTrackAccess(subscription);
  return accessibleTracks.includes(trackId);
}
