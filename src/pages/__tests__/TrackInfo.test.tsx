import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TrackInfo } from '../TrackInfo';

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

describe('TrackInfo credential block', () => {
  it('prices a track that clears the depth bar', () => {
    renderTrack('fundamentals');
    expect(screen.getByText(/no subscription, no renewal, ever/i)).toBeInTheDocument();
    expect(screen.queryByText(/not on sale yet/i)).not.toBeInTheDocument();
  });

  it('shows no price at all for a track held back for depth', () => {
    renderTrack('accessibility-qa-lived-experience');
    expect(screen.getByText(/Credential not on sale yet/i)).toBeInTheDocument();
    // No price is attached to *this* track: the headline price line and the
    // pay-what-you-can offer that goes with it are both gone. (The
    // explanation still says what other tracks charge — that's the point of
    // it.)
    expect(screen.queryByText(/no subscription, no renewal, ever/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pay what you can/i)).not.toBeInTheDocument();
  });

  it('tells the learner what is missing rather than just hiding the button', () => {
    renderTrack('ai-orchestrated-dev');
    // 4 published lessons against a bar of 8.
    expect(screen.getByText(/4 more lessons/)).toBeInTheDocument();
    expect(screen.getByText(/free to read now/i)).toBeInTheDocument();
  });
});
