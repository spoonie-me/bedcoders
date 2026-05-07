import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';
import { api } from '@/lib/api';

async function initiateCheckout(priceId: string) {
  try {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('checkout_start', { priceId });
    }

    const { url } = await api.post<{ url: string }>('/checkout/session', {
      priceId,
    });
    if (url) window.location.href = url;
  } catch (err: any) {
    console.error('Checkout error:', err);
    const msg = err?.body?.error ?? err?.message ?? 'Failed to start checkout. Please try again.';
    alert(`Error: ${msg}`);
  }
}

export function Pricing() {
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const [withdrawalAck, setWithdrawalAck] = useState(false);

  function handleCheckout(priceId: string) {
    setWithdrawalAck(false);
    setPendingPriceId(priceId);
  }

  function confirmCheckout() {
    if (pendingPriceId && withdrawalAck) {
      initiateCheckout(pendingPriceId);
      setPendingPriceId(null);
      setWithdrawalAck(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('pricing_view');
    }
  }, []);

  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 1000, margin: '0 auto' }}>
      <SEO
        title="Pricing — Bedcoders"
        description="Learn to code and build with AI from bed. Free first lesson, then €12/month. All 4 tracks, AI feedback, verifiable certificate."
        canonical="/pricing"
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <h1 style={{ marginBottom: 'var(--space-lg)' }}>€12/month. Try free first.</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 600, margin: '0 auto' }}>
          Free tier unlocks one full lesson. No card, no catch. Pro unlocks all 4 tracks + unlimited lessons. Cancel anytime.
        </p>
      </div>

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-3xl)', maxWidth: 1000 }}>

        {/* Free */}
        <Card>
          <div style={{ width: 40, height: 4, background: 'var(--crystal)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
          <h3 style={{ marginBottom: 'var(--space-xs)' }}>Free</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>Try before you commit</p>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <span style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>€0</span>
          </div>
          <ul style={{ marginBottom: 'var(--space-lg)' }}>
            {[
              'One full lesson (any track)',
              'All exercise types',
              'No credit card required',
              'Access your lesson forever',
            ].map((f) => (
              <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: 'var(--space-xs) 0', display: 'flex', gap: 'var(--space-sm)', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <Link to="/signup">
            <Button variant="secondary" style={{ width: '100%' }}>Start free</Button>
          </Link>
        </Card>

        {/* Pro Monthly */}
        <Card style={{ position: 'relative', borderColor: 'var(--signal)', borderWidth: '2px' }}>
          <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--signal)', color: 'var(--bg-void)', padding: '2px 14px', borderRadius: '999px', fontSize: '0.7rem', fontFamily: 'var(--font-display)', fontWeight: 500, whiteSpace: 'nowrap' }}>Most popular</span>
          <div style={{ width: 40, height: 4, background: 'var(--signal)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
          <h3 style={{ marginBottom: 'var(--space-xs)' }}>Pro Monthly</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>Cancel anytime</p>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <span style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>€12</span>
            <span style={{ color: 'var(--text-tertiary)', marginLeft: 'var(--space-sm)', fontSize: '0.875rem' }}>per month</span>
          </div>
          <ul style={{ marginBottom: 'var(--space-lg)' }}>
            {[
              'All 4 tracks unlocked',
              '68+ lessons',
              '60+ exercises',
              'Cancel anytime',
            ].map((f) => (
              <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: 'var(--space-xs) 0', display: 'flex', gap: 'var(--space-sm)', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <Button variant="primary" style={{ width: '100%' }} onClick={() => handleCheckout('pro_monthly')}>
            Start pro
          </Button>
        </Card>

        {/* Pro Annual */}
        <Card>
          <div style={{ width: 40, height: 4, background: 'var(--gold)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
          <h3 style={{ marginBottom: 'var(--space-xs)' }}>Pro Annual</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>Save 2 months</p>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <span style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>€120</span>
            <span style={{ color: 'var(--text-tertiary)', marginLeft: 'var(--space-sm)', fontSize: '0.875rem' }}>per year</span>
          </div>
          <ul style={{ marginBottom: 'var(--space-lg)' }}>
            {[
              'All 4 tracks unlocked',
              '68+ lessons',
              '60+ exercises',
              '1 month free (save €12)',
            ].map((f) => (
              <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: 'var(--space-xs) 0', display: 'flex', gap: 'var(--space-sm)', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => handleCheckout('pro_annual')}>
            Save with annual
          </Button>
        </Card>
      </div>

      {/* Team info */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-2xl)' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Teams & organizations</h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', maxWidth: 500, margin: '0 auto var(--space-lg)' }}>
          €15/user/month (min 5 seats, billed annually). Team admin dashboard included.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
          Contact{' '}<a href="mailto:hello@bedcoders.com" style={{ color: 'var(--signal)' }}>hello@bedcoders.com</a>
        </p>
      </div>
      {/* Withdrawal right modal — shown before Stripe checkout */}
      {pendingPriceId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-xl)' }}
          onClick={() => setPendingPriceId(null)}
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
                I understand that by starting a course I consent to immediate access to digital content, and
                that my <strong style={{ color: 'var(--text-primary)' }}>14-day withdrawal right</strong> expires upon
                first access (EU Consumer Rights Directive 2011/83/EU, §11 KSchG).
                I have read the <a href="/terms#withdrawal" style={{ color: 'var(--signal)' }} target="_blank" rel="noopener noreferrer">Terms of Service</a>.
              </span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <Button variant="secondary" onClick={() => { setPendingPriceId(null); setWithdrawalAck(false); }}>Cancel</Button>
              <Button variant="primary" onClick={confirmCheckout} disabled={!withdrawalAck}>
                Continue to checkout →
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
