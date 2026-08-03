// @ts-nocheck
import Stripe from 'stripe';

export const stripe = new Stripe((process.env.STRIPE_SECRET_KEY ?? '').trim(), {
  apiVersion: '2025-02-24.acacia',
});

// ──────────────────────────────────────────
// PRICING — one-time Credential purchases
// (retired the subscription model 2026-08-04 — see PRD.md §4.5 in the
// soft-reset-school repo for the full reasoning: a recurring charge bills
// a fixed clock to a population that can't control its own clock, and the
// old subscription was already quietly failing — it unlocked zero extra
// content in 4 of 8 tracks because every lesson sat in the free tier.)
//
// All lesson content is free to read for every logged-in user, forever —
// see backend/src/middleware/entitlements.ts. The ONLY paid thing is a
// Credential: a real certification-exam attempt + a permanent, publicly
// verifiable certificate for a specific track. See CREDENTIAL_SELLABLE_TRACKS
// below for which tracks currently have real exam content behind them.
// ──────────────────────────────────────────

export const CREDENTIAL_PRODUCTS = {
  track_credential: {
    priceInCents: 6900, // €69, one-time
    label: 'Track Credential',
    description: 'Certification exam + permanent, publicly verifiable certificate for one track.',
  },
  program_credential: {
    priceInCents: 14900, // €149, one-time
    label: 'Program Credential',
    description: 'Certification exams + certificates for 3 tracks, bundled.',
  },
  code_review: {
    priceInCents: 2500, // €25, one-time
    label: 'Human Code Review',
    description: 'A human reviews your submitted project and gives written feedback.',
  },
} as const;

export type CredentialProductId = keyof typeof CREDENTIAL_PRODUCTS;

// Price IDs from env — set in Vercel (.trim() guards against Vercel's trailing \n on env pull)
export const CREDENTIAL_PRICES = {
  track_credential: process.env.STRIPE_PRICE_ID_TRACK_CREDENTIAL?.trim(),
  program_credential: process.env.STRIPE_PRICE_ID_PROGRAM_CREDENTIAL?.trim(),
  code_review: process.env.STRIPE_PRICE_ID_CODE_REVIEW?.trim(),
} as const;

/** Tracks with a real, defensible TrackExam + substantial seeded content —
 * i.e. tracks a Credential can honestly be sold for under the new model.
 * This is a STRICTER bar than the old ALL_TRACKS list: it's not "does this
 * track exist," it's "does backend/prisma/seed-data/tracks.json's TrackExam
 * for this track pull from a real, large enough MULTIPLE_CHOICE question
 * bank to be a real exam."
 *
 * STATUS UPDATE 2026-08-04: the 4 newer Soft Reset School tracks
 * (ai-orchestrated-dev, ai-workflow-consulting, ai-oversight-health-informatics,
 * accessibility-qa-lived-experience) now DO have real TrackExam records with
 * 21-30 MULTIPLE_CHOICE questions each (DGX-drafted, then hand-verified —
 * several factually wrong questions were caught and removed in the process,
 * e.g. a backwards clinical dosing claim, a self-contradicting ISO 8601
 * example). Structurally they clear the bar this comment describes. NOT
 * added here anyway, deliberately: only 2 of the 4 new question banks got a
 * full read-through (health-informatics, accessibility-qa); the other two
 * (orchestrated-dev, workflow-consulting) only got a spot-check sample. More
 * importantly, exam breadth for all 4 now exceeds actual lesson depth
 * (1-2 lessons per domain) — meaning a learner could be examined on material
 * the lessons never taught. That's a real product-integrity call, not a
 * "does the exam exist" call — leave this decision to a human, don't flip it
 * automatically because the mechanical bar (TrackExam + question count) is
 * now met. */
export const CREDENTIAL_SELLABLE_TRACKS = [
  'fundamentals',
  'ai',
  'tools',
  'advanced',
] as const;
export type TrackId = (typeof CREDENTIAL_SELLABLE_TRACKS)[number];

// ──────────────────────────────────────────
// CHECKOUT
// ──────────────────────────────────────────

export async function createCustomer(email: string, name?: string) {
  return stripe.customers.create({ email, name: name ?? undefined });
}
