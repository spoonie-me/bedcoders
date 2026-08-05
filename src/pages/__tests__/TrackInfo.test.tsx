import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TrackInfo } from '../TrackInfo';
import { CATALOG_TRACKS, credentialAvailable } from '@/data/trackCatalog';
import { CREDENTIAL_MINIMUMS } from '@/data/credentialBar';

// The gate in backend/src/lib/stripe.ts stops a thin track being *bought*.
// This is the other half: making sure the page never advertises a price for
// one either. A learner who reads "€69" and then hits a 400 has been misled
// even though no money moved.

function renderTrack(slug: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/tracks/${slug}`]}>
        <Routes>
          <Route path="/tracks/:slug" element={<TrackInfo />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

// Which tracks are on sale changes as curriculum lands, so pick them by the
// rule rather than by name — otherwise these tests fail every time a track
// grows, which is the one thing we want to happen freely.
const sellable = CATALOG_TRACKS.filter(credentialAvailable);
const heldBack = CATALOG_TRACKS.filter((t) => !credentialAvailable(t));

describe('TrackInfo credential block', () => {
  it('prices a track that clears the depth bar', () => {
    expect(sellable.length).toBeGreaterThan(0);
    renderTrack(sellable[0].slug);
    expect(screen.getByText(/no subscription, no renewal, ever/i)).toBeInTheDocument();
    expect(screen.queryByText(/not on sale yet/i)).not.toBeInTheDocument();
  });

  // Skips itself once every track is deep enough to sell — the goal state.
  it.skipIf(heldBack.length === 0)('shows no price at all for a track held back for depth', () => {
    renderTrack(heldBack[0].slug);
    expect(screen.getByText(/Credential not on sale yet/i)).toBeInTheDocument();
    // No price is attached to *this* track: the headline price line and the
    // pay-what-you-can offer that goes with it are both gone. (The
    // explanation still says what other tracks charge — that's the point of
    // it.)
    expect(screen.queryByText(/no subscription, no renewal, ever/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pay what you can/i)).not.toBeInTheDocument();
  });

  it.skipIf(heldBack.length === 0)(
    'tells the learner what is missing rather than just hiding the button',
    () => {
      const track = heldBack[0];
      renderTrack(track.slug);
      const remaining = CREDENTIAL_MINIMUMS.lessons - track.lessonCount;
      expect(
        screen.getByText(remaining === 1 ? /One more lesson/ : new RegExp(`${remaining} more lessons`)),
      ).toBeInTheDocument();
      expect(screen.getByText(/free to read now/i)).toBeInTheDocument();
    },
  );
});
