import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';
import { api } from '@/lib/api';

// Tracks with a real Credential available — must match
// backend/src/lib/stripe.ts's CREDENTIAL_SELLABLE_TRACKS exactly.
// Career tracks are the reintegration path: each one maps to a role a
// bed- or home-bound person can actually be hired (or bill clients) for.
const CAREER_TRACKS = [
  { id: 'ai-orchestrated-dev', name: '🧭 AI-Assisted Software Development', color: 'var(--signal)', outcome: 'Ship real software by directing and reviewing AI — a hireable dev skill that doesn\'t bill by the hour of typing.' },
  { id: 'ai-workflow-consulting', name: '⚙️ AI Automation Consulting', color: 'var(--gold)', outcome: 'Bill clients for knowing where AI belongs in their process — and where it doesn\'t.' },
  { id: 'ai-oversight-health-informatics', name: '🩺 AI-Augmented Medical Coding', color: 'var(--crystal)', outcome: 'The expert-review layer AI routes complex clinical cases to — not the layer it automates away.' },
  { id: 'accessibility-qa-lived-experience', name: '♿ Digital Accessibility QA', color: 'var(--rust)', outcome: 'Audit work employers must buy under the European Accessibility Act — grounded in lived assistive-tech experience.' },
];

const FOUNDATION_TRACKS = [
  { id: 'fundamentals', name: '🛏️ Code from Bed', color: 'var(--signal)' },
  { id: 'ai', name: '🤖 AI Literacy for Humans', color: 'var(--gold)' },
  { id: 'tools', name: '⚡ Build Cool Tools Fast', color: 'var(--crystal)' },
  { id: 'advanced', name: '🚀 AI Agents that Work', color: 'var(--rust)' },
];

const CREDENTIAL_TRACKS = [...CAREER_TRACKS, ...FOUNDATION_TRACKS];

type PendingCheckout =
  | { productId: 'track_credential' | 'code_review'; trackId: string }
  | { productId: 'program_credential'; trackIds: string[] };

export function Pricing() {
  const [pending, setPending] = useState<PendingCheckout | null>(null);
  const [withdrawalAck, setWithdrawalAck] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [bundleSelection, setBundleSelection] = useState<string[]>([]);
  // Pay-what-you-can. `pwycTrack` non-null means the dialog is open.
  const [pwycTrack, setPwycTrack] = useState<string | null>(null);
  const [pwycAmount, setPwycAmount] = useState('0');
  const [pwycBusy, setPwycBusy] = useState(false);
  const [pwycError, setPwycError] = useState('');
  const [pwycDone, setPwycDone] = useState(false);

  async function submitPwyc() {
    if (!pwycTrack || pwycBusy) return;
    const euros = Number(pwycAmount);
    if (!Number.isFinite(euros) || euros < 0 || euros > 69) {
      setPwycError('Enter any amount from 0 to 69.');
      return;
    }
    setPwycBusy(true);
    setPwycError('');
    try {
      const res = await api.post<{ granted?: boolean; url?: string }>('/checkout/hardship', {
        trackId: pwycTrack,
        amountCents: Math.round(euros * 100),
      });
      if (res.url) {
        window.location.href = res.url; // paid amount → Stripe
        return;
      }
      setPwycDone(true); // €0 → granted immediately, no payment step
    } catch (err: unknown) {
      const e = err as { body?: { error?: string }; message?: string };
      setPwycError(e?.body?.error ?? e?.message ?? 'Something went wrong. Please try again.');
    }
    setPwycBusy(false);
  }

  function toggleBundleTrack(trackId: string) {
    setBundleSelection((prev) => {
      if (prev.includes(trackId)) return prev.filter((t) => t !== trackId);
      if (prev.length >= 3) return prev; // exactly 3 for a Program Credential
      return [...prev, trackId];
    });
  }

  function startCheckout(next: PendingCheckout) {
    setWithdrawalAck(false);
    setCheckoutError('');
    setPending(next);
  }

  async function confirmCheckout() {
    if (!pending || !withdrawalAck || checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      if (typeof window !== 'undefined' && (window as any).trackEvent) {
        (window as any).trackEvent('checkout_start', { productId: pending.productId });
      }
      const body =
        pending.productId === 'program_credential'
          ? { productId: pending.productId, trackIds: pending.trackIds }
          : { productId: pending.productId, trackId: pending.trackId };
      const { url } = await api.post<{ url: string }>('/checkout/session', body);
      if (url) window.location.href = url;
    } catch (err: unknown) {
      const e = err as { body?: { error?: string }; message?: string };
      setCheckoutError(e?.body?.error ?? e?.message ?? 'Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
    }
    setPending(null);
    setWithdrawalAck(false);
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('pricing_view');
    }
  }, []);

  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 1000, margin: '0 auto' }}>
      <SEO
        title="Pricing — Soft Reset School"
        description="Every lesson is free to read, forever. Pay once, €69, only when you're ready to sit a certification exam and get a permanent, publicly verifiable credential."
        canonical="/pricing"
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <h1 style={{ marginBottom: 'var(--space-lg)' }}>All content is free. Pay once, only for the credential.</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 640, margin: '0 auto var(--space-md)' }}>
          No subscription. Nothing bills you on a bad month. Read every lesson in every track for free, forever — pay €69 only when you're ready to sit the certification exam and get a permanent, publicly verifiable credential.
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', maxWidth: 600, margin: '0 auto' }}>
          €69 is the standard price, not a requirement — you can choose what you pay, down to €0, no proof and no application.
        </p>
      </div>

      {/* Free content */}
      <Card style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
        <div style={{ width: 40, height: 4, background: 'var(--crystal)', borderRadius: 2, margin: '0 auto var(--space-lg)' }} />
        <h3 style={{ marginBottom: 'var(--space-xs)' }}>Every lesson, every track</h3>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>Free, forever, no card required</p>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <span style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>€0</span>
        </div>
        <Link to="/signup">
          <Button variant="secondary">Start free</Button>
        </Link>
      </Card>

      {/* Career credentials — the reintegration path */}
      <h2 style={{ marginBottom: 'var(--space-sm)' }}>Career Credential — €69, one-time</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: 680 }}>
        The four reintegration tracks. Each one ends in a certification exam and a permanent, publicly
        verifiable certificate for a role you can actually be hired — or bill clients — for. No renewal, ever.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-3xl)' }}>
        {CAREER_TRACKS.map((track) => (
          <Card key={track.id}>
            <div style={{ width: 40, height: 4, background: track.color, borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
            <h3 style={{ marginBottom: 'var(--space-xs)', fontSize: '1.0625rem' }}>
              <Link to={`/tracks/${track.id}`} style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'var(--bg-border)', textUnderlineOffset: '3px' }}>{track.name}</Link>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>{track.outcome}</p>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>€69</span>
            </div>
            <Button variant="primary" style={{ width: '100%' }} onClick={() => startCheckout({ productId: 'track_credential', trackId: track.id })}>
              Get certified
            </Button>
          </Card>
        ))}
      </div>

      {/* Foundation credentials */}
      <h2 style={{ marginBottom: 'var(--space-sm)' }}>Foundation Credential — €69, one-time</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
        The original coding-and-AI curriculum. Same exam, same permanent verifiable certificate.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-3xl)' }}>
        {FOUNDATION_TRACKS.map((track) => (
          <Card key={track.id}>
            <div style={{ width: 40, height: 4, background: track.color, borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
            <h3 style={{ marginBottom: 'var(--space-xs)', fontSize: '1.0625rem' }}>
              <Link to={`/tracks/${track.id}`} style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'var(--bg-border)', textUnderlineOffset: '3px' }}>{track.name}</Link>
            </h3>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>€69</span>
            </div>
            <Button variant="primary" style={{ width: '100%' }} onClick={() => startCheckout({ productId: 'track_credential', trackId: track.id })}>
              Get certified
            </Button>
          </Card>
        ))}
      </div>

      {/* Program bundle */}
      <h2 style={{ marginBottom: 'var(--space-sm)' }}>Program Credential — €149, any 3 tracks</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
        Pick any 3 of the 8 tracks — career, foundation, or a mix — and save €58 versus buying them one at a time.
      </p>
      <Card style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          {CREDENTIAL_TRACKS.map((track) => (
            <label
              key={track.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)',
                border: `1px solid ${bundleSelection.includes(track.id) ? track.color : 'var(--bg-border)'}`,
                cursor: 'pointer', fontSize: '0.875rem',
              }}
            >
              <input
                type="checkbox"
                checked={bundleSelection.includes(track.id)}
                onChange={() => toggleBundleTrack(track.id)}
                disabled={!bundleSelection.includes(track.id) && bundleSelection.length >= 3}
                style={{ accentColor: track.color }}
              />
              {track.name}
            </label>
          ))}
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>
          {bundleSelection.length}/3 selected
        </p>
        <Button
          variant="primary"
          disabled={bundleSelection.length !== 3}
          onClick={() => startCheckout({ productId: 'program_credential', trackIds: bundleSelection })}
        >
          Get 3 tracks certified — €149
        </Button>
      </Card>

      {/* Code review add-on */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-2xl)', marginBottom: 'var(--space-2xl)' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Human code review — €25 add-on</h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', maxWidth: 500, margin: '0 auto var(--space-lg)' }}>
          A human reads your submitted project and gives written feedback — a smaller way to get real feedback before you're ready for a full Credential exam.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
          Contact <a href="mailto:hello@bedcoders.com" style={{ color: 'var(--signal)' }}>hello@bedcoders.com</a> to arrange a review.
        </p>
      </div>

      {/* Choose your own price — wired to POST /checkout/hardship.
       *
       * This used to say "Can't afford €69?" and then ask people to email a
       * stranger naming the most they could afford. That is an application, and
       * a harder one than a form: it named the reader by what they lacked, and
       * asked them to compose a plea. The backend has always granted €0
       * instantly with no human in the loop — the button was simply never
       * built. It is built now. */}
      <div id="choose-your-price" style={{ textAlign: 'center', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-2xl)' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Choose what you pay</h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', maxWidth: 540, margin: '0 auto var(--space-lg)' }}>
          €69 is the standard price, not a requirement. Pick any amount that works
          for you — down to €0. No proof, no application, no email, no judgment.
          You get exactly the same exam and the same certificate either way.
        </p>
        <Button variant="secondary" onClick={() => { setPwycTrack(CREDENTIAL_TRACKS[0].id); setPwycAmount('0'); setPwycError(''); setPwycDone(false); }}>
          Set your own price
        </Button>
      </div>

      {/* Teams & organizations */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-2xl)', marginTop: 'var(--space-2xl)' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Nonprofits & vocational rehab agencies</h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', maxWidth: 500, margin: '0 auto var(--space-lg)' }}>
          Pre-buy Credential vouchers for the people you serve, at the same flat €69/track. No separate pricing.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
          Contact <a href="mailto:hello@bedcoders.com" style={{ color: 'var(--signal)' }}>hello@bedcoders.com</a>
        </p>
      </div>

      {/* Pay-what-you-can dialog */}
      {pwycTrack && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose what you pay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-xl)' }}
        >
          <Card style={{ maxWidth: 460, width: '100%', padding: 'var(--space-2xl)' }}>
            {pwycDone ? (
              <>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Done — it's yours.</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-xl)' }}>
                  Your credential for this track is unlocked. Sit the exam whenever
                  you're ready — there's no deadline, and nothing else to pay.
                </p>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setPwycTrack(null)}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Choose what you pay</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>
                  Any amount from €0 to €69. You don't need to explain, and nobody
                  reviews this.
                </p>

                <label htmlFor="pwyc-track" style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: 'var(--space-xs)' }}>
                  Which track?
                </label>
                <select
                  id="pwyc-track"
                  value={pwycTrack}
                  onChange={(e) => setPwycTrack(e.target.value)}
                  style={{ width: '100%', minHeight: 48, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)', color: 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'inherit', marginBottom: 'var(--space-lg)', boxSizing: 'border-box' }}
                >
                  {CREDENTIAL_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <label htmlFor="pwyc-amount" style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: 'var(--space-xs)' }}>
                  What you'll pay (€)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                  {['0', '10', '20', '35', '69'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPwycAmount(v)}
                      aria-pressed={pwycAmount === v}
                      style={{ minHeight: 48, minWidth: 60, borderRadius: 'var(--radius-sm)', border: `1px solid ${pwycAmount === v ? 'var(--signal)' : 'var(--bg-border)'}`, background: pwycAmount === v ? 'var(--signal)' : 'var(--bg-elevated)', color: pwycAmount === v ? 'var(--bg-void)' : 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      €{v}
                    </button>
                  ))}
                </div>
                <input
                  id="pwyc-amount"
                  type="number"
                  min={0}
                  max={69}
                  step="1"
                  inputMode="decimal"
                  value={pwycAmount}
                  onChange={(e) => setPwycAmount(e.target.value)}
                  style={{ width: '100%', minHeight: 48, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)', color: 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'inherit', marginBottom: 'var(--space-lg)', boxSizing: 'border-box' }}
                />

                {pwycError && (
                  <p role="alert" style={{ color: 'var(--rust)', fontSize: '0.875rem', marginBottom: 'var(--space-md)' }}>{pwycError}</p>
                )}

                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  <Button variant="primary" onClick={submitPwyc} disabled={pwycBusy}>
                    {pwycBusy ? 'Working…' : Number(pwycAmount) > 0 ? `Continue — €${Number(pwycAmount)}` : 'Unlock for €0'}
                  </Button>
                  <Button variant="secondary" onClick={() => setPwycTrack(null)} disabled={pwycBusy}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Withdrawal right modal — shown before Stripe checkout */}
      {pending && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-xl)' }}
          onClick={() => setPending(null)}
        >
          <Card style={{ maxWidth: 480, width: '100%', padding: 'var(--space-2xl)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>Before you continue</h3>
            <label style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', cursor: 'pointer', marginBottom: 'var(--space-xl)', padding: 'var(--space-md)', background: 'var(--bg-void)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)' }}>
              <input
                type="checkbox"
                checked={withdrawalAck}
                onChange={(e) => setWithdrawalAck(e.target.checked)}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: 'var(--signal)', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                I understand that by purchasing this Credential I consent to immediate access to digital content, and
                that my <strong style={{ color: 'var(--text-primary)' }}>14-day withdrawal right</strong> expires upon
                first access (EU Consumer Rights Directive 2011/83/EU, §11 KSchG).
                I have read the <a href="/terms#withdrawal" style={{ color: 'var(--signal)' }} target="_blank" rel="noopener noreferrer">Terms of Service</a>.
              </span>
            </label>
            {checkoutError && (
              <p role="alert" style={{ color: 'var(--rust)', fontSize: '0.875rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                {checkoutError}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <Button variant="secondary" onClick={() => { setPending(null); setWithdrawalAck(false); setCheckoutError(''); }}>Cancel</Button>
              <Button variant="primary" onClick={confirmCheckout} disabled={!withdrawalAck || checkoutLoading}>
                {checkoutLoading ? 'Starting…' : 'Continue to checkout →'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
