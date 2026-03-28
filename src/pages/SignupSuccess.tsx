import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * /signup-success — Post-signup conversion page.
 *
 * This is the URL you paste into LinkedIn Campaign Manager → Conversions
 * as your "URL-based conversion" trigger.
 *
 * URL: https://bedcoders.com/signup-success
 */

export function SignupSuccess() {
  useEffect(() => {
    // Fire LinkedIn conversion event (if Insight Tag is loaded)
    if (typeof window !== 'undefined' && (window as any).lintrk) {
      (window as any).lintrk('track', { conversion_id: 'signup' });
    }
  }, []);

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: 'var(--space-2xl) var(--space-lg)',
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>🎉</div>
      <h1 style={{ marginBottom: 'var(--space-md)' }}>Welcome to Bedcoders!</h1>
      <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
        Your account is set up. Start your first lesson now — the first module
        in every track is completely free.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to="/dashboard"
          className="btn btn-primary btn-lg"
          style={{ fontSize: '1.1rem', padding: '16px 40px' }}
        >
          Go to Dashboard
        </Link>
        <Link
          to="/pricing"
          className="btn btn-secondary btn-lg"
          style={{ fontSize: '1.1rem', padding: '16px 40px' }}
        >
          Explore Plans
        </Link>
      </div>
    </div>
  );
}
