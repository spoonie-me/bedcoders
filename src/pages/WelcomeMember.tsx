import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

const TRACK_NAMES: Record<string, string> = {
  fundamentals: '🛏️ Code from Bed',
  ai: '🤖 AI Literacy for Humans',
  tools: '⚡ Build Cool Tools Fast',
  advanced: '🚀 AI Agents that Work',
};

const TRACK_START: Record<string, string> = {
  fundamentals: '/track/fundamentals',
  ai: '/track/ai',
  tools: '/track/tools',
  advanced: '/track/advanced',
};

export function WelcomeMember() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('track') ?? 'fundamentals';
  const trackName = TRACK_NAMES[trackId] ?? 'your track';
  const trackStart = TRACK_START[trackId] ?? '/dashboard';

  useEffect(() => {
    const g = (window as any).gtag;
    if (typeof g !== 'function') return;

    // Only fire conversion if this page was reached via a real Stripe success redirect
    // (Stripe appends ?session_id=cs_live_... to the success URL)
    const sessionId = searchParams.get('session_id');
    if (!sessionId || !sessionId.startsWith('cs_')) return;

    // Single transaction_id shared across both events for consistent deduplication
    const transaction_id = `${trackId}_${Date.now()}`;

    g('event', 'conversion', {
      send_to: 'AW-18029452931/UiPjCJWPqowcEIO9jpVD',
      value: 149.0,
      currency: 'EUR',
      transaction_id,
    });

    g('event', 'purchase', {
      currency: 'EUR',
      value: 149.0,
      transaction_id,
      items: [{
        item_id: trackId,
        item_name: TRACK_NAMES[trackId] ?? trackId,
        item_category: 'track',
        price: 149.0,
        quantity: 1,
      }],
    });
  }, [trackId]);

  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>✓</div>
        <h1 style={{ marginBottom: 'var(--space-lg)', color: 'var(--success)' }}>You're in</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 600, margin: '0 auto' }}>
          Lifetime access to <strong>{trackName}</strong> — every lesson, every exercise, AI feedback, and the certification exam. Yours to keep, forever.
        </p>
      </div>

      {/* What you get */}
      <Card style={{ marginBottom: 'var(--space-3xl)', padding: 'var(--space-2xl)' }}>
        <h3 style={{ marginBottom: 'var(--space-lg)' }}>What's included</h3>
        <ul style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {[
            { icon: '📚', label: '50+ lessons', desc: `Work through the full ${trackName} curriculum at your own pace` },
            { icon: '✍️', label: '200+ AI-graded exercises', desc: 'Real-time feedback on every submission — not just correct/incorrect' },
            { icon: '🎓', label: 'Certification exam', desc: 'Sit it when you feel ready — no deadline, no pressure, no re-purchase needed' },
            { icon: '🏅', label: 'Certificate, forever', desc: 'Once earned, your certificate is yours to keep. Public verification code included.' },
          ].map((item) => (
            <li key={item.label} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>{item.label}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Auth gate — shown ABOVE CTAs so user sees it before clicking */}
      {!user && (
        <div style={{ marginBottom: 'var(--space-2xl)', padding: 'var(--space-2xl)', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Almost there — sign in or create your free account to access your track.
          </p>
          <Link to={`/login?redirect=${encodeURIComponent(trackStart)}`} style={{ textDecoration: 'none' }}>
            <Button variant="primary">Sign in to start learning</Button>
          </Link>
        </div>
      )}

      {/* CTA — only shown when logged in */}
      {user && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-3xl)' }}>
          <Link to={trackStart} style={{ textDecoration: 'none' }}>
            <Button variant="primary" style={{ width: '100%' }}>Start {trackName}</Button>
          </Link>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" style={{ width: '100%' }}>Go to dashboard</Button>
          </Link>
        </div>
      )}

      {/* Reassurance */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
          This is a one-time purchase — no subscription, no renewals. Your access and your certificate never expire.
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Questions? Contact <a href="mailto:hello@bedcoders.com" style={{ color: 'var(--signal)' }}>hello@bedcoders.com</a>
        </p>
      </div>
    </div>
  );
}
