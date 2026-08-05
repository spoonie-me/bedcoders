import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_TRACKS, credentialAvailable } from '../trackCatalog';
import { CREDENTIAL_MINIMUMS, meetsCredentialBar } from '../credentialBar';
import {
  CREDENTIAL_MINIMUMS as BACKEND_MINIMUMS,
  TRACK_DEPTH,
  meetsCredentialBar as backendMeetsBar,
} from '../../../backend/src/lib/credentialBar';

// These tests exist to make one business rule impossible to break by
// accident: a €69 "Credential" is only ever sold for a track that actually
// has the content behind it. Three things have to agree — the seeded
// lessons, the public catalog a learner reads before paying, and the gate
// the checkout API enforces. If any two drift, the suite fails and the
// build stops. Policy that lives only in a document is policy that erodes.

const SEED_DOMAINS = path.resolve(__dirname, '../../../backend/prisma/seed-data/domains');

interface SeedLesson {
  duration?: number;
}

/** Sum published lessons and minutes for a track straight from the seed
 * data — the same numbers the platform actually serves. */
function depthFromSeedData(slug: string): { lessonCount: number; totalMinutes: number } {
  const trackDir = path.join(SEED_DOMAINS, slug);
  if (!fs.existsSync(trackDir)) return { lessonCount: 0, totalMinutes: 0 };

  let lessonCount = 0;
  let totalMinutes = 0;
  for (const entry of fs.readdirSync(trackDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const lessonsFile = path.join(trackDir, entry.name, 'lessons.json');
    if (!fs.existsSync(lessonsFile)) continue;
    const parsed = JSON.parse(fs.readFileSync(lessonsFile, 'utf8'));
    const lessons: SeedLesson[] = Array.isArray(parsed) ? parsed : (parsed.lessons ?? []);
    lessonCount += lessons.length;
    totalMinutes += lessons.reduce((sum, lesson) => sum + (lesson.duration ?? 0), 0);
  }
  return { lessonCount, totalMinutes };
}

describe('credential depth bar', () => {
  it('uses the same minimums on the frontend and the backend', () => {
    expect(CREDENTIAL_MINIMUMS.lessons).toBe(BACKEND_MINIMUMS.lessons);
    expect(CREDENTIAL_MINIMUMS.minutes).toBe(BACKEND_MINIMUMS.minutes);
  });

  it.each(CATALOG_TRACKS.map((t) => [t.slug, t] as const))(
    'the public catalog for %s matches the seeded lessons',
    (slug, track) => {
      const seeded = depthFromSeedData(slug);
      // The learner is told this number next to a price. It has to be true.
      expect(seeded.lessonCount).toBe(track.lessonCount);
      expect(seeded.totalMinutes).toBe(track.totalMinutes);
    },
  );

  it.each(Object.keys(TRACK_DEPTH))('the backend depth table for %s matches the seeded lessons', (slug) => {
    expect(depthFromSeedData(slug)).toEqual(TRACK_DEPTH[slug]);
  });

  it('covers every catalog track in the backend depth table', () => {
    // A track missing from the table fails closed (unsellable), which is
    // safe but silent — catch it here instead of in a support email.
    for (const track of CATALOG_TRACKS) {
      expect(TRACK_DEPTH[track.slug], `${track.slug} missing from TRACK_DEPTH`).toBeDefined();
    }
  });

  it('agrees with the backend on which tracks are sellable', () => {
    for (const track of CATALOG_TRACKS) {
      expect(credentialAvailable(track), track.slug).toBe(backendMeetsBar(track.slug));
    }
  });

  it('never offers a credential for a track below the bar', () => {
    for (const track of CATALOG_TRACKS.filter(credentialAvailable)) {
      expect(track.lessonCount, track.slug).toBeGreaterThanOrEqual(CREDENTIAL_MINIMUMS.lessons);
      expect(track.totalMinutes, track.slug).toBeGreaterThanOrEqual(CREDENTIAL_MINIMUMS.minutes);
    }
  });

  it('holds back a track that is too thin, whichever track that currently is', () => {
    // The regression that started this: a 3-lesson track priced identically
    // to a 30-lesson one. Asserted against the rule rather than against a
    // named track, because the whole point of computing the gate is that
    // which tracks are on sale changes as curriculum lands.
    expect(meetsCredentialBar({ lessonCount: 3, totalMinutes: 65 })).toBe(false);
    expect(meetsCredentialBar({ lessonCount: 4, totalMinutes: 100 })).toBe(false);
    // Deep enough on lessons but not on minutes, and vice versa: both fail.
    expect(meetsCredentialBar({ lessonCount: 20, totalMinutes: 100 })).toBe(false);
    expect(meetsCredentialBar({ lessonCount: 5, totalMinutes: 400 })).toBe(false);

    for (const track of CATALOG_TRACKS) {
      const shouldSell =
        track.lessonCount >= CREDENTIAL_MINIMUMS.lessons &&
        track.totalMinutes >= CREDENTIAL_MINIMUMS.minutes;
      expect(backendMeetsBar(track.slug), track.slug).toBe(shouldSell);
    }
  });

  it('refuses to sell a credential for a track it has never heard of', () => {
    expect(backendMeetsBar('not-a-real-track')).toBe(false);
  });
});
