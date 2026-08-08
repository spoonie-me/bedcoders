// The minimum-depth bar a track must clear before a Credential can be sold
// for it. Frontend copy; backend/src/lib/credentialBar.ts holds the same
// numbers and src/data/__tests__/credentialBar.test.ts fails the build if the
// two ever drift apart, or if either drifts from trackCatalog.ts's declared
// lessonCount/totalMinutes.
//
// Why this exists (2026-08-08, business review): until now the only gate on
// selling a €69 "Career Credential" was exam integrity — does the track have
// a real, verified question bank. That let `ai-orchestrated-dev` (4 lessons,
// ~100 min — two of its four advertised domains still `inDevelopment`) carry
// the same price and the same "Career Credential" word as tracks with 3-4x
// the content. Disclosure alone wasn't enough: the fix is that a track below
// the bar cannot be checked out at all, enforced in code rather than
// remembered in a policy doc.
//
// Changing these numbers changes what is legally on sale. Update
// BUSINESS_MODEL.md in the same commit.

export const CREDENTIAL_MINIMUMS = {
  /** Published lessons required before a Credential goes on sale. */
  lessons: 8,
  /** Estimated total minutes of published content required. */
  minutes: 150,
} as const;

export interface TrackDepth {
  lessonCount: number;
  totalMinutes: number;
}

/** True when a track has enough published content to be sold at the flat
 * €69 credential price. Deliberately has nothing to say about exam quality —
 * that's a separate gate (see backend/src/lib/stripe.ts). A track must pass
 * BOTH to be sellable. */
export function meetsCredentialBar(track: TrackDepth): boolean {
  return (
    track.lessonCount >= CREDENTIAL_MINIMUMS.lessons &&
    track.totalMinutes >= CREDENTIAL_MINIMUMS.minutes
  );
}

/** How many more lessons this track needs before its Credential opens.
 * Shown to learners verbatim — we say what's missing rather than hiding the
 * absence of a buy button. */
export function lessonsUntilCredential(track: TrackDepth): number {
  return Math.max(0, CREDENTIAL_MINIMUMS.lessons - track.lessonCount);
}
