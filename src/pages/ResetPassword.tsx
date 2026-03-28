import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <Card style={{ padding: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>Invalid Link</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Request New Link</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch {
      setError('This reset link has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <Card style={{ padding: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-lg)' }}>&#10003;</div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>Password Reset</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Your password has been changed. You can now log in.
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ width: 48, height: 4, background: 'var(--signal)', borderRadius: 2, margin: '0 auto var(--space-md)' }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>Set New Password</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Choose a new password for your account.</p>
      </div>

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
              htmlFor="password"
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
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
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
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <Button variant="primary" type="submit" disabled={loading || !password || !confirmPassword}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
