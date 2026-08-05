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

/** Tracks whose exam is real: backend/prisma/seed-data/tracks.json's
 * TrackExam pulls from a large enough, question-by-question verified
 * MULTIPLE_CHOICE bank to be a genuine exam. This is the exam-integrity
 * gate only — see CREDENTIAL_SELLABLE_TRACKS below for what is actually on
 * sale, which additionally requires content depth.
 *
 * STATUS UPDATE 2026-08-04 (evening): all 4 Soft Reset School career tracks
 * are now sellable. What changed since the morning note that held them back:
 * the two banks that had only been spot-checked (orchestrated-dev,
 * workflow-consulting) got the full question-by-question read-through —
 * every marked answer fact-checked, ambiguous distractors rewritten,
 * explanations aligned. Exam question counts were also cut below pool size
 * (tracks.json) so attempts vary instead of exposing the entire bank, and
 * the founder made the ship call on lesson depth: 2 lessons per taught
 * domain, exams drawing only from taught domains. If a future audit finds a
 * bank below the bar, REMOVE its track from this list first, fix second. */
export const EXAM_VERIFIED_TRACKS = [
  'fundamentals',
  'ai',
  'tools',
  'advanced',
  'ai-orchestrated-dev',
  'ai-workflow-consulting',
  'ai-oversight-health-informatics',
  'accessibility-qa-lived-experience',
] as const;
export type TrackId = (typeof EXAM_VERIFIED_TRACKS)[number];

/** Tracks a Credential can actually be sold for today.
 *
 * TWO gates, both of which must pass:
 *   1. Exam integrity — EXAM_VERIFIED_TRACKS above.
 *   2. Content depth — meetsCredentialBar(), i.e. enough published lessons
 *      and minutes to justify the flat €69 "Credential" price.
 *
 * Gate 2 was added 2026-08-05. The exam-integrity gate had proved the
 * pattern works, but nothing stopped a 3-lesson track being sold under the
 * same label and price as a 30-lesson one — the exact thing the expert
 * advisory board flagged and the comment in src/data/trackCatalog.ts had
 * been quietly noting. It's computed, not hand-maintained: growing a track's
 * curriculum past the bar puts its Credential on sale automatically, and a
 * track that loses content comes off sale the same way.
 *
 * Currently held back by gate 2: ai-orchestrated-dev (4 lessons) and
 * accessibility-qa-lived-experience (3). Their lessons stay free to read —
 * only the paid credential waits. */
export const CREDENTIAL_SELLABLE_TRACKS = EXAM_VERIFIED_TRACKS.filter((t) =>
  meetsCredentialBar(t),
) as readonly TrackId[];

// ──────────────────────────────────────────
// CHECKOUT
// ──────────────────────────────────────────

export async function createCustomer(email: string, name?: string) {
  return stripe.customers.create({ email, name: name ?? undefined });
}
