import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to dashboard after a short delay on success
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [status, navigate]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ maxWidth: '440px', textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</p>
            <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Verifying your email…</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>Just a second.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p>
            <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Email verified!</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>
              Taking you to your dashboard…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</p>
            <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Link expired or invalid</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', marginBottom: '24px' }}>
              Verification links expire after 24 hours. Try signing up again or log in directly.
            </p>
            <Link
              to="/signup"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'var(--signal)',
                color: '#0a0e0f',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              Back to sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
