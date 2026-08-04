import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Field, Notice, PageHeading, inputStyle } from '@/components/hiring/HiringUI';
import { useEmployerAuth } from '@/lib/EmployerAuthContext';

/**
 * The employer entry point. The pitch is deliberately not charity — it is
 * that this pool is pre-assessed, that the work is verifiable, and that
 * people who have had to build around real constraints tend to be good at
 * building around real constraints.
 */
export function ForCompanies() {
  const { employer, loading } = useEmployerAuth();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  if (!loading && employer) return <Navigate to="/employers" replace />;

  return (
    <div className="page-padded" style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <PageHeading
        title="Hire from Soft Reset School"
        subtitle="Graduates who have been assessed, not just enrolled. Every profile is built from graded coursework you can verify, and every one of them chose to be here."
      />

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <Card>
            <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>What you actually get</h2>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Verified work, not claims.</strong>{' '}
                Portfolio items built from graded modules carry a badge we stand behind. Self-added
                projects are labelled as such. You can tell the difference at a glance.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Certificates you can check.</strong>{' '}
                Every certificate has a public verification code. No trust required.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Filters that match reality.</strong>{' '}
                Search by skill, and by the shape of work someone wants — async, part time, flexible
                hours. Nobody is surprised at offer stage.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>No recruiter subscription.</strong>{' '}
                Create a company profile, search, post roles, request intros.
              </li>
            </ul>
          </Card>

          <Card>
            <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>House rules</h2>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Pay ranges are mandatory.</strong>{' '}
                A role without a stated range cannot be published here.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Contact details come from consent.</strong>{' '}
                Search never returns names or emails. You request an intro; if they accept, you get
                their details. If they decline, that is final for your company.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>You will not see health information.</strong>{' '}
                We do not collect it and could not show it if we wanted to. What you see is the
                working pattern someone asked for — that is the relevant part.
              </li>
            </ul>
          </Card>
        </div>

        <Card>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
            {(['signup', 'login'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: 'var(--space-sm) var(--space-lg)',
                  minHeight: 44,
                  borderBottom: mode === m ? '2px solid var(--signal)' : '2px solid transparent',
                  color: mode === m ? 'var(--signal)' : 'var(--text-tertiary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.875rem',
                }}
              >
                {m === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>
          {mode === 'signup' ? <SignupForm /> : <LoginForm />}
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 'var(--space-xl)' }}>
            Employer accounts are separate from learner accounts. If you are here to learn,{' '}
            <Link to="/signup">start here</Link> instead.
          </p>
        </Card>
      </div>
    </div>
  );
}

function SignupForm() {
  const { signup, error, clearError } = useEmployerAuth();
  const [form, setForm] = useState({ name: '', jobTitle: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setBusy(true);
    try {
      await signup(form);
    } catch {
      /* error surfaces through context */
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Your name" htmlFor="emp-name">
        <input id="emp-name" style={inputStyle} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Job title" htmlFor="emp-title">
        <input id="emp-title" style={inputStyle} value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
      </Field>
      <Field label="Work email" htmlFor="emp-email">
        <input id="emp-email" type="email" style={inputStyle} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label="Password" htmlFor="emp-pw" hint="At least 12 characters, with an uppercase letter and a number.">
        <input id="emp-pw" type="password" style={inputStyle} required minLength={12} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </Field>
      <Button variant="primary" type="submit" disabled={busy}>
        {busy ? 'Creating…' : 'Create account'}
      </Button>
    </form>
  );
}

function LoginForm() {
  const { login, error, clearError } = useEmployerAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch {
      /* error surfaces through context */
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Work email" htmlFor="emp-login-email">
        <input id="emp-login-email" type="email" style={inputStyle} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label="Password" htmlFor="emp-login-pw">
        <input id="emp-login-pw" type="password" style={inputStyle} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </Field>
      <Button variant="primary" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
