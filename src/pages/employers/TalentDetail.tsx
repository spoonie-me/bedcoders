import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import {
  Chip,
  DraftRestoredNotice,
  EmptyState,
  Notice,
  PageHeading,
  inputStyle,
  labelStyle,
} from '@/components/hiring/HiringUI';
import { useEmployerAuth } from '@/lib/EmployerAuthContext';
import { useDraft } from '@/lib/useDraft';
import {
  employerApi,
  formatHours,
  workShapeTags,
  type EmployerJob,
  type EmployerTalentView,
} from '@/lib/hiring';

const MIN_MESSAGE_LENGTH = 40;

export function TalentDetail() {
  const { handle } = useParams<{ handle: string }>();
  const { employer, company, loading: authLoading } = useEmployerAuth();

  const [talent, setTalent] = useState<EmployerTalentView | null>(null);
  const [contact, setContact] = useState<{ name: string; email: string; releasedAt: string } | null>(null);
  const [introStatus, setIntroStatus] = useState<'pending' | 'accepted' | null>(null);
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!handle) return;
    try {
      const res = await employerApi.getTalent(handle);
      setTalent(res.talent);
      setContact(res.contact);
      setIntroStatus(res.introStatus);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    // Fetch on mount; the loading flags it sets are this component's own.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    employerApi
      .jobs()
      .then((res) => setJobs(res.jobs.filter((j) => j.status === 'published')))
      .catch(() => {});
  }, [load]);

  if (!authLoading && !employer) return <Navigate to="/for-companies" replace />;
  if (!authLoading && employer && !company) return <Navigate to="/employers" replace />;

  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !talent) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <EmptyState
          title="Profile not available"
          body="This profile is not in the directory. Graduates can switch their visibility off at any time, and we do not confirm whether a given person is on the platform."
          action={
            <Link to="/employers">
              <Button variant="secondary" size="sm">Back to search</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const hours = formatHours(talent.workShape.hoursPerWeekMin, talent.workShape.hoursPerWeekMax);

  return (
    <div className="page-padded" style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Link to="/employers" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', display: 'inline-block', marginBottom: 'var(--space-xl)' }}>
        &larr; Back to search
      </Link>

      <PageHeading
        title={talent.displayName}
        subtitle={talent.headline}
      >
        {talent.pronouns && (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{talent.pronouns}</p>
        )}
      </PageHeading>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {workShapeTags(talent.workShape).map((t) => <Chip key={t} tone="signal">{t}</Chip>)}
          {hours && <Chip>{hours}</Chip>}
          {!talent.workShape.openToWork && <Chip>Not currently looking</Chip>}
          {talent.country && <Chip>{talent.country}</Chip>}
          {talent.timeZone && <Chip>{talent.timeZone}</Chip>}
        </div>

        {talent.workShape.earliestStart && (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            Available from {new Date(talent.workShape.earliestStart).toLocaleDateString()}
          </p>
        )}

        {talent.summary && (
          <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{talent.summary}</p>
        )}

        {talent.links && talent.links.length > 0 && (
          <div>
            <p style={labelStyle}>Links</p>
            <ul style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
              {talent.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer nofollow">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {contact ? (
        <Card style={{ marginBottom: 'var(--space-2xl)', borderColor: 'var(--signal-muted)' }}>
          <p style={labelStyle}>Contact — shared with your consent</p>
          <p style={{ fontSize: '1rem' }}>{contact.name}</p>
          <p>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-sm)' }}>
            Released {new Date(contact.releasedAt).toLocaleDateString()} when they accepted your
            introduction request.
          </p>
        </Card>
      ) : (
        <IntroForm
          handle={talent.handle}
          jobs={jobs}
          introStatus={introStatus}
          onSent={load}
        />
      )}

      {talent.projects && talent.projects.length > 0 && (
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-lg)' }}>Work</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {talent.projects.map((p) => (
              <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1rem' }}>{p.title}</h3>
                  <Chip tone={p.provenance === 'curriculum' ? 'signal' : 'neutral'}>
                    {p.provenance === 'curriculum' ? 'Verified coursework' : 'Self-reported'}
                  </Chip>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{p.description}</p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                  {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ fontSize: '0.875rem' }}>Repo</a>}
                  {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ fontSize: '0.875rem' }}>Live</a>}
                  {p.skills.map((s) => <Chip key={s}>{s}</Chip>)}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {talent.certificates && talent.certificates.length > 0 && (
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-lg)' }}>Certificates</h2>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {talent.certificates.map((c) => (
              <div key={c.verifyCode} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9375rem' }}>
                  {c.trackId} — {Math.round(c.examScore)}%
                </span>
                {/* Public verification: an employer can confirm this without
                    taking either the candidate's or our word for it. */}
                <Link to={`/verify/${c.verifyCode}`} style={{ fontSize: '0.8125rem' }}>
                  Verify independently
                </Link>
              </div>
            ))}
          </Card>
        </section>
      )}

      {talent.mastery && talent.mastery.length > 0 && (
        <section>
          <h2 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-lg)' }}>Assessed domains</h2>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {talent.mastery.map((m) => (
              <div key={m.domainId} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)' }}>
                <span style={{ fontSize: '0.9375rem' }}>{m.domainName}</span>
                <span style={{ color: 'var(--gold)' }} aria-label={`${m.stars} of 5 stars`}>
                  {'★'.repeat(m.stars)}
                  <span style={{ color: 'var(--bg-border)' }}>{'★'.repeat(5 - m.stars)}</span>
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function IntroForm({
  handle,
  jobs,
  introStatus,
  onSent,
}: {
  handle: string;
  jobs: EmployerJob[];
  introStatus: 'pending' | 'accepted' | null;
  onSent: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft, clearDraft, restored] = useDraft(`intro_${handle}`, {
    message: '',
    jobPostingId: '',
  });

  if (introStatus === 'pending') {
    return (
      <Notice tone="info">
        Your introduction request is with them. They have two weeks to answer, and letting it lapse
        is a valid answer — please do not follow up elsewhere.
      </Notice>
    );
  }

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await employerApi.requestIntro(handle, draft.message, draft.jobPostingId || undefined);
      clearDraft();
      await onSent();
    } catch (err) {
      const body = (err as { body?: { error?: string } }).body;
      setError(body?.error ?? 'Could not send the request.');
    } finally {
      setBusy(false);
    }
  };

  const tooShort = draft.message.trim().length < MIN_MESSAGE_LENGTH;

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
      <div>
        <h2 style={{ fontSize: '1rem' }}>Request an introduction</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
          They see your company profile and this message. If they accept, you get their name and
          email. If they decline, that is final for your company — so make this one count.
        </p>
      </div>

      {restored && <DraftRestoredNotice onDiscard={clearDraft} />}
      {error && <Notice tone="error">{error}</Notice>}

      {jobs.length > 0 && (
        <div>
          <label style={labelStyle} htmlFor="intro-job">Role (optional)</label>
          <select
            id="intro-job"
            style={{ ...inputStyle, maxWidth: 320 }}
            value={draft.jobPostingId}
            onChange={(e) => setDraft({ jobPostingId: e.target.value })}
          >
            <option value="">General enquiry</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="intro-message">Message</label>
        <textarea
          id="intro-message"
          style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
          maxLength={2000}
          value={draft.message}
          onChange={(e) => setDraft({ message: e.target.value })}
          placeholder="What the role is, what caught your eye in their work, and what happens next if they say yes."
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)', display: 'block' }}>
          {tooShort
            ? `${MIN_MESSAGE_LENGTH - draft.message.trim().length} more characters. A generic one-liner costs you nothing and costs them a decision.`
            : `${draft.message.length}/2000`}
        </span>
      </div>

      <Button variant="primary" onClick={send} disabled={busy || tooShort}>
        {busy ? 'Sending…' : 'Send request'}
      </Button>
    </Card>
  );
}
