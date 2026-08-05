// Backend copy of the minimum-depth bar for selling a Credential.
// Mirrors src/data/credentialBar.ts (frontend) and the published lesson
// counts in backend/prisma/seed-data/domains/<slug>/*\/lessons.json.
//
// All three are checked against each other by
// src/data/__tests__/credentialBar.test.ts — if seed data, the public
// catalog, and this table disagree, the test suite fails. That's the point:
// the price a learner sees, the content that actually exists, and the gate
// that decides whether checkout is allowed can never quietly drift apart.
//
// Kept as a plain table rather than read from the seed JSON at runtime so
// the serverless functions never touch the filesystem to decide whether
// something is sellable.

export const CREDENTIAL_MINIMUMS = {
  lessons: 8,
  minutes: 150,
} as const;

export interface TrackDepth {
  lessonCount: number;
  totalMinutes: number;
}

/** Published content per track, summed from the seed data. */
export const TRACK_DEPTH: Record<string, TrackDepth> = {
  // Career tracks
  'ai-orchestrated-dev': { lessonCount: 31, totalMinutes: 749 },
  'ai-workflow-consulting': { lessonCount: 8, totalMinutes: 200 },
  'ai-oversight-health-informatics': { lessonCount: 8, totalMinutes: 180 },
  'accessibility-qa-lived-experience': { lessonCount: 36, totalMinutes: 857 },
  // Foundation tracks
  fundamentals: { lessonCount: 23, totalMinutes: 345 },
  ai: { lessonCount: 14, totalMinutes: 210 },
  tools: { lessonCount: 30, totalMinutes: 460 },
  advanced: { lessonCount: 30, totalMinutes: 455 },
};

export function meetsCredentialBar(trackId: string): boolean {
  const depth = TRACK_DEPTH[trackId];
  // Unknown track → not sellable. Fail closed, always.
  if (!depth) return false;
  return (
    depth.lessonCount >= CREDENTIAL_MINIMUMS.lessons &&
    depth.totalMinutes >= CREDENTIAL_MINIMUMS.minutes
  );
}
