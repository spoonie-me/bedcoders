import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-md) var(--space-lg)',
  background: 'var(--bg-void)',
  border: '1px solid var(--bg-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  outline: 'none',
};

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ width: 48, height: 4, background: 'var(--signal)', borderRadius: 2, margin: '0 auto var(--space-md)' }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>Reset Password</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {sent ? 'Check your email for reset instructions.' : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      {sent ? (
        <Card style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-lg)' }}>&#9993;</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-xl)' }}>
            If an account with that email exists, you will receive a password reset link shortly.
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">&larr; Back to Login</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {error && (
              <div style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(196,107,58,0.1)',
                border: '1px solid var(--rust)',
                color: 'var(--rust)',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <Button variant="primary" type="submit" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                &larr; Back to Login
              </Link>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
