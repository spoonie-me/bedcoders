import { describe, it, expect } from 'vitest';
import { CATALOG_TRACKS, credentialAvailable } from '../trackCatalog';
import { CREDENTIAL_MINIMUMS, meetsCredentialBar } from '../credentialBar';
import {
  CREDENTIAL_MINIMUMS as BACKEND_MINIMUMS,
  TRACK_DEPTH,
  meetsCredentialBar as backendMeetsBar,
} from '../../../backend/src/lib/credentialBar';

// These tests exist to make one business rule impossible to break by
// accident: a €69 "Credential" is only ever sold for a track that actually
// has the content behind it. Two things have to agree — the public catalog
// a learner reads before paying (src/data/trackCatalog.ts, itself checked
// against the seed data by src/lib/__tests__/curriculum.test.ts) and the
// gate the checkout API enforces (backend/src/lib/stripe.ts). If the two
// drift, this suite fails and the build stops. Policy that lives only in a
// document is policy that erodes.

describe('credential depth bar', () => {
  it('uses the same minimums on the frontend and the backend', () => {
    expect(CREDENTIAL_MINIMUMS.lessons).toBe(BACKEND_MINIMUMS.lessons);
    expect(CREDENTIAL_MINIMUMS.minutes).toBe(BACKEND_MINIMUMS.minutes);
  });

  it.each(CATALOG_TRACKS.map((t) => [t.slug, t] as const))(
    'the backend depth table for %s matches the public catalog',
    (slug, track) => {
      expect(TRACK_DEPTH[slug], `${slug} missing from backend TRACK_DEPTH`).toBeDefined();
      expect(TRACK_DEPTH[slug]).toEqual({ lessonCount: track.lessonCount, totalMinutes: track.totalMinutes });
    },
  );

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
    // The regression this exists to prevent: a 4-lesson track priced
    // identically to a 30-lesson one. Asserted against the rule rather than
    // a named track, because the whole point of computing the gate is that
    // which tracks are on sale changes as curriculum lands — the gate
    // should never need a code change to reopen a track.
    expect(meetsCredentialBar({ lessonCount: 3, totalMinutes: 65 })).toBe(false);
    expect(meetsCredentialBar({ lessonCount: 4, totalMinutes: 100 })).toBe(false);
    // Deep enough on lessons but not on minutes, and vice versa: both fail.
    expect(meetsCredentialBar({ lessonCount: 20, totalMinutes: 100 })).toBe(false);
    expect(meetsCredentialBar({ lessonCount: 5, totalMinutes: 400 })).toBe(false);
    // Clears both.
    expect(meetsCredentialBar({ lessonCount: 8, totalMinutes: 150 })).toBe(true);

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
