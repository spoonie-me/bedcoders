// @ts-nocheck
import Stripe from 'stripe';
import { meetsCredentialBar } from './credentialBar.js';

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

/** Tracks with a real, defensible TrackExam — i.e. tracks whose question
 * bank has been verified, question by question, as a real exam rather than
 * an unchecked pool. This is NOT the same as "sellable" — see
 * CREDENTIAL_SELLABLE_TRACKS below, which additionally requires enough
 * published content to justify the price. Keep this a hand-maintained list:
 * exam-bank verification is a one-time human audit, not something derivable
 * from a lesson count.
 *
 * STATUS UPDATE 2026-08-04 (evening): all 4 Soft Reset School career tracks
 * passed verification. The two banks that had only been spot-checked
 * (orchestrated-dev, workflow-consulting) got the full question-by-question
 * read-through — every marked answer fact-checked, ambiguous distractors
 * rewritten, explanations aligned. Exam question counts were also cut below
 * pool size (tracks.json) so attempts vary instead of exposing the entire
 * bank. If a future audit finds a bank below the bar, REMOVE its track from
 * this list first, fix second. */
const VERIFIED_EXAM_BANK_TRACKS = [
  'fundamentals',
  'ai',
  'tools',
  'advanced',
  'ai-orchestrated-dev',
  'ai-workflow-consulting',
  'ai-oversight-health-informatics',
  'accessibility-qa-lived-experience',
] as const;

/** Tracks a Credential can honestly be sold for. A track must clear BOTH
 * gates: a verified exam bank (above) AND enough published content
 * (meetsCredentialBar — backend/src/lib/credentialBar.ts, mirrored in
 * src/data/credentialBar.ts for the frontend).
 *
 * ADDED 2026-08-08 (business review): the exam-bank gate alone let a
 * 4-lesson track sell the same €69 "Career Credential," under the same
 * wording, as a 30-lesson one. A track that's held back stays free to read
 * and re-opens on its own once its lesson count clears the bar — no code
 * change needed here. */
export const CREDENTIAL_SELLABLE_TRACKS = VERIFIED_EXAM_BANK_TRACKS.filter(meetsCredentialBar);
export type TrackId = (typeof VERIFIED_EXAM_BANK_TRACKS)[number];

// ──────────────────────────────────────────
// CHECKOUT
// ──────────────────────────────────────────

export async function createCustomer(email: string, name?: string) {
  return stripe.customers.create({ email, name: name ?? undefined });
}
