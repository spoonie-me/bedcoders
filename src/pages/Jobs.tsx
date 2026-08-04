import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { Chip, DraftRestoredNotice, EmptyState, Notice, PageHeading, Toggle, inputStyle, labelStyle } from '@/components/hiring/HiringUI';
import { useAuth } from '@/lib/AuthContext';
import { useDraft } from '@/lib/useDraft';
import {
  jobsApi,
  talentApi,
  formatHours,
  formatSalary,
  jobTags,
  EMPLOYMENT_TYPE_LABELS,
  type Job,
  type JobFilters,
} from '@/lib/hiring';

/**
 * The board. Open to anyone — someone deciding whether this platform leads
 * anywhere should be able to look at the roles before signing up.
 */
export function Jobs() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Reset before the fetch — same idiom as useApi in this codebase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    jobsApi
      .list(filters)
      .then((res) => {
        if (cancelled) return;
        setJobs(res.jobs);
        setTotal(res.total);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const patch = (p: Partial<JobFilters>) => setFilters((f) => ({ ...f, ...p, page: 1 }));

  return (
    <div className="page-padded" style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <PageHeading
        title="Roles"
        subtitle="Every role here states its pay range up front, and says plainly whether it is remote, async, or part time. If a company will not say what it pays, it does not get posted."
      />

      <Card style={{ marginBottom: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <p style={labelStyle}>Filter</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Toggle id="f-remote" checked={filters.remote ?? false} onChange={(v) => patch({ remote: v })} label="Remote" />
          <Toggle id="f-async" checked={filters.async ?? false} onChange={(v) => patch({ async: v })} label="Async friendly" />
          <Toggle id="f-flex" checked={filters.flexHours ?? false} onChange={(v) => patch({ flexHours: v })} label="Flexible hours" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="f-type">Employment type</label>
          <select
            id="f-type"
            style={{ ...inputStyle, maxWidth: 240 }}
            value={filters.employmentType ?? ''}
            onChange={(e) => patch({ employmentType: e.target.value || undefined })}
          >
            <option value="">Any</option>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </Card>

      {error && <Notice tone="error">Could not load roles. Reload to try again.</Notice>}

      {loading ? (
        <LoadingSpinner />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Nothing matches that yet"
          body="The board is young. Clear a filter or two, or check back — roles are added as companies come through."
        />
      ) : (
        <>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>
            {total} open {total === 1 ? 'role' : 'roles'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const hours = formatHours(job.hoursPerWeekMin, job.hoursPerWeekMax);
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <h2 style={{ fontSize: '1.125rem' }}>
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
            {job.company?.name}
            {job.location && ` · ${job.location}`}
          </p>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--signal)', fontSize: '0.9375rem' }}>
          {formatSalary(job.salary)}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <Chip tone="gold">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Chip>
        {jobTags(job).map((t) => (
          <Chip key={t} tone="signal">{t}</Chip>
        ))}
        {hours && <Chip>{hours}</Chip>}
        {job.company?.isVerified && <Chip tone="signal">Verified company</Chip>}
      </div>
    </Card>
  );
}

/* ─── Detail ─────────────────────────────────────────────────────────── */

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [draft, setDraft, clearDraft, restored] = useDraft(`apply_${id}`, { coverNote: '' });

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await jobsApi.get(id);
      setJob(res.job);
      setHasApplied(res.hasApplied);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Fetch on mount; the loading flags it sets are this component's own.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <Notice tone="error">This role is no longer open.</Notice>
        <Link to="/jobs">
          <Button variant="secondary" size="sm">Back to roles</Button>
        </Link>
      </div>
    );
  }

  const apply = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } });
      return;
    }
    setSubmitting(true);
    try {
      await talentApi.apply(job.id, draft.coverNote || undefined);
      clearDraft();
      setHasApplied(true);
      setMessage({ tone: 'success', text: 'Applied. You can track this under Hiring → Applications.' });
    } catch (err) {
      const already = (err as { status?: number })?.status === 409;
      setMessage({
        tone: already ? 'success' : 'error',
        text: already ? 'You already applied to this role.' : 'Could not send your application. Your note is still here.',
      });
      if (already) setHasApplied(true);
    } finally {
      setSubmitting(false);
    }
  };

  const hours = formatHours(job.hoursPerWeekMin, job.hoursPerWeekMax);

  return (
    <div className="page-padded" style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Link to="/jobs" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', display: 'inline-block', marginBottom: 'var(--space-xl)' }}>
        &larr; All roles
      </Link>

      <PageHeading title={job.title} subtitle={job.company?.name} />

      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <Chip tone="gold">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Chip>
          {jobTags(job).map((t) => (
            <Chip key={t} tone="signal">{t}</Chip>
          ))}
          {hours && <Chip>{hours}</Chip>}
          {job.location && <Chip>{job.location}</Chip>}
        </div>

        <div>
          <p style={labelStyle}>Pay</p>
          <p style={{ fontFamily: 'var(--font-display)', color: 'var(--signal)', fontSize: '1.125rem' }}>
            {formatSalary(job.salary)}
          </p>
        </div>

        {job.skills.length > 0 && (
          <div>
            <p style={labelStyle}>Skills</p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {job.skills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 'var(--space-2xl)' }}>
        <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{job.description}</p>
      </Card>

      {job.company?.accommodationsStatement && (
        <Card style={{ marginBottom: 'var(--space-2xl)' }}>
          <p style={labelStyle}>How this company works</p>
          <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {job.company.accommodationsStatement}
          </p>
        </Card>
      )}

      {hasApplied ? (
        <Notice tone="info">
          You have applied to this role. Track it under <Link to="/hiring">Hiring → Applications</Link>.
        </Notice>
      ) : (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1rem' }}>Apply</h2>
          {restored && <DraftRestoredNotice onDiscard={clearDraft} />}
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            Applying shares your profile handle and this note with {job.company?.name} only. It does
            not put you in the public directory, and it does not send them your email address.
          </p>
          <div>
            <label style={labelStyle} htmlFor="cover-note">Note (optional)</label>
            <textarea
              id="cover-note"
              style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
              maxLength={3000}
              value={draft.coverNote}
              onChange={(e) => setDraft({ coverNote: e.target.value })}
              placeholder="Anything you want them to know. Saved as you type — you can come back to it."
            />
          </div>
          <Button variant="primary" onClick={apply} disabled={submitting}>
            {submitting ? 'Sending…' : user ? 'Apply' : 'Sign in to apply'}
          </Button>
        </Card>
      )}
    </div>
  );
}
