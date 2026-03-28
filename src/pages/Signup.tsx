import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useAuth } from '@/lib/AuthContext';
import { SEO } from '@/components/SEO';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const { signup, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!gdprConsent) return;
    try {
      await signup({ email, password, name, gdprConsent, marketingConsent });
      navigate('/signup-success', { replace: true });
    } catch {
      // Error is already set in AuthContext
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <SEO title="Sign Up — Start Building with AI" description="Create your free Bedcoders account. Learn Claude API, prompt engineering, and AI agents. First lesson free, no credit card required." canonical="/signup" />
      <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>Create your account</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
        Start building with AI. Free to begin.
      </p>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}
      >
        <div>
          <label
            htmlFor="signup-name"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Name
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
            minLength={1}
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label
            htmlFor="signup-email"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label
            htmlFor="signup-password"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>

        {/* GDPR Consent */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            marginTop: 'var(--space-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
            <input
              id="gdpr-consent"
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              required
              disabled={loading}
              style={{ marginTop: 4, accentColor: 'var(--signal)', cursor: 'pointer' }}
            />
            <label
              htmlFor="gdpr-consent"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                cursor: 'pointer',
              }}
            >
              I agree to the{' '}
              <Link
                to="/terms"
                style={{ color: 'var(--signal)' }}
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                style={{ color: 'var(--signal)' }}
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
              . I understand how my data is processed per GDPR.{' '}
              <span style={{ color: 'var(--rust)' }}>*</span>
            </label>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-md)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              disabled={loading}
              style={{ marginTop: 4, accentColor: 'var(--signal)' }}
            />
            <span
              style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5 }}
            >
              I'd like to receive updates about new modules and features (optional).
            </span>
          </label>
        </div>

        <Button
          variant="primary"
          style={{ width: '100%', marginTop: 'var(--space-sm)' }}
          disabled={!gdprConsent || loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p
        style={{
          color: 'var(--text-tertiary)',
          fontSize: '0.875rem',
          marginTop: 'var(--space-xl)',
          textAlign: 'center',
        }}
      >
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--signal)' }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
