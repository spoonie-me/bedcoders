import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import {
  Chip,
  DraftRestoredNotice,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  TabBar,
  Toggle,
  inputStyle,
  labelStyle,
} from '@/components/hiring/HiringUI';
import { useEmployerAuth } from '@/lib/EmployerAuthContext';
import { useDraft } from '@/lib/useDraft';
import {
  employerApi,
  EMPLOYER_TOKEN_KEY,
  formatHours,
  formatSalary,
  workShapeTags,
  APPLICATION_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  type ApplicationStatus,
  type Company,
  type EmployerApplication,
  type EmployerIntro,
  type EmployerJob,
  type EmployerTalentCard,
  type TalentFilters,
} from '@/lib/hiring';

type Tab = 'talent' | 'jobs' | 'requests' | 'company';

export function EmployerHome() {
  const { employer, company, loading, logout } = useEmployerAuth();
  const [tab, setTab] = useState<Tab>(company ? 'talent' : 'company');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!employer) return <Navigate to="/for-companies" replace />;

  return (
    <div className="page-padded" style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <PageHeading title={company?.name ?? 'Set up your company'} subtitle={employer.email} />
        <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
      </div>

      {!company ? (
        <>
          <Notice tone="info">
            Add your company before you can search or post. Every intro request a graduate receives
            needs an accountable company behind it — that is the whole reason this step exists.
          </Notice>
          <CompanyTab />
        </>
      ) : (
        <>
          <TabBar<Tab>
            active={tab}
            onChange={setTab}
            tabs={[
              { key: 'talent', label: 'Find talent' },
              { key: 'jobs', label: 'Roles' },
              { key: 'requests', label: 'Requests' },
              { key: 'company', label: 'Company' },
            ]}
          />
          {tab === 'talent' && <TalentSearchTab />}
          {tab === 'jobs' && <JobsTab />}
          {tab === 'requests' && <RequestsTab />}
          {tab === 'company' && <CompanyTab existing={company} />}
        </>
      )}
    </div>
  );
}

/* ─── Company profile ────────────────────────────────────────────────── */

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const REMOTE_POLICIES = [
  { value: 'remote_first', label: 'Remote first' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On site' },
];

function CompanyTab({ existing }: { existing?: Company }) {
  const { setCompany } = useEmployerAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    websiteUrl: existing?.websiteUrl ?? '',
    description: existing?.description ?? '',
    size: existing?.size ?? '',
    location: existing?.location ?? '',
    remotePolicy: existing?.remotePolicy ?? '',
    asyncFriendly: existing?.asyncFriendly ?? false,
    flexibleHours: existing?.flexibleHours ?? false,
    partTimeOpen: existing?.partTimeOpen ?? false,
    accommodationsStatement: existing?.accommodationsStatement ?? '',
  });

  const save = async () => {
    setBusy(true);
    try {
      const res = existing
        ? await employerApi.updateCompany(form)
        : await employerApi.createCompany(form);
      // Creating a company reissues the employer token (it carries the
      // company id), so the stored one has to be replaced or every
      // company-gated call keeps failing until the session expires.
      const reissued = (res as { token?: string }).token;
      if (reissued) localStorage.setItem(EMPLOYER_TOKEN_KEY, reissued);
      setCompany(res.company);
      setMessage({ tone: 'success', text: 'Saved.' });
    } catch {
      setMessage({ tone: 'error', text: 'Could not save. Your details are still here.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <Field label="Company name" htmlFor="co-name">
          <input id="co-name" style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Website" htmlFor="co-url">
          <input id="co-url" style={inputStyle} placeholder="https://" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
        </Field>
        <Field label="About" htmlFor="co-desc">
          <textarea id="co-desc" style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle} htmlFor="co-size">Size</label>
            <select id="co-size" style={inputStyle} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
              <option value="">—</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle} htmlFor="co-loc">Location</label>
            <input id="co-loc" style={inputStyle} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle} htmlFor="co-remote">Remote policy</label>
            <select id="co-remote" style={inputStyle} value={form.remotePolicy} onChange={(e) => setForm({ ...form, remotePolicy: e.target.value })}>
              <option value="">—</option>
              {REMOTE_POLICIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1rem' }}>What you can offer</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
            Graduates see these before deciding whether to answer you. Claiming what you cannot
            deliver wastes their energy and costs you the intro.
          </p>
        </div>
        <Toggle id="co-async" checked={form.asyncFriendly} onChange={(v) => setForm({ ...form, asyncFriendly: v })} label="Async friendly" description="Written-first, few mandatory meetings." />
        <Toggle id="co-flex" checked={form.flexibleHours} onChange={(v) => setForm({ ...form, flexibleHours: v })} label="Flexible hours" />
        <Toggle id="co-part" checked={form.partTimeOpen} onChange={(v) => setForm({ ...form, partTimeOpen: v })} label="Open to part time" />
        <Field label="How you work" hint="Concrete beats warm. What accommodations exist in practice, who approves them, how fast.">
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            maxLength={1000}
            value={form.accommodationsStatement}
            onChange={(e) => setForm({ ...form, accommodationsStatement: e.target.value })}
          />
        </Field>
      </Card>

      <Button variant="primary" onClick={save} disabled={busy || form.name.trim().length < 2}>
        {busy ? 'Saving…' : existing ? 'Save changes' : 'Create company'}
      </Button>
    </div>
  );
}

/* ─── Talent search ──────────────────────────────────────────────────── */

function TalentSearchTab() {
  const [filters, setFilters] = useState<TalentFilters>({ openToWork: true });
  const [skillInput, setSkillInput] = useState('');
  const [results, setResults] = useState<EmployerTalentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Reset before the fetch — same idiom as useApi in this codebase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    employerApi
      .searchTalent(filters)
      .then((res) => {
        if (cancelled) return;
        setResults(res.results);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const patch = (p: Partial<TalentFilters>) => setFilters((f) => ({ ...f, ...p, page: 1 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <Field label="Skills" hint="Comma separated. Matches only against what each graduate chose to make visible.">
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <input
              style={{ ...inputStyle, flex: '1 1 240px' }}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && patch({ skills: skillInput })}
              placeholder="typescript, evals"
            />
            <Button variant="secondary" size="sm" onClick={() => patch({ skills: skillInput })}>Search</Button>
          </div>
        </Field>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Toggle id="t-open" checked={filters.openToWork ?? false} onChange={(v) => patch({ openToWork: v })} label="Open to work now" />
          <Toggle id="t-remote" checked={filters.remote ?? false} onChange={(v) => patch({ remote: v })} label="Wants remote" />
          <Toggle id="t-async" checked={filters.async ?? false} onChange={(v) => patch({ async: v })} label="Wants async" />
          <Toggle id="t-part" checked={filters.partTime ?? false} onChange={(v) => patch({ partTime: v })} label="Wants part time" />
          <Toggle id="t-flex" checked={filters.flexHours ?? false} onChange={(v) => patch({ flexHours: v })} label="Wants flexible hours" />
          <Toggle id="t-contract" checked={filters.contract ?? false} onChange={(v) => patch({ contract: v })} label="Open to contract" />
        </div>
      </Card>

      {error && <Notice tone="error">Could not run that search.</Notice>}

      {loading ? (
        <LoadingSpinner />
      ) : results.length === 0 ? (
        <EmptyState
          title="No matches"
          body="Only graduates who opted into the directory appear here, and only the details they chose to show are searchable. Try fewer filters."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {results.map((t) => (
            <Card key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <h3 style={{ fontSize: '1.0625rem' }}>
                    <Link to={`/employers/talent/${t.handle}`}>{t.displayName}</Link>
                  </h3>
                  {t.headline && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t.headline}</p>}
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
                    {[t.country, t.timeZone].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textAlign: 'right' }}>
                  {t.projectCount} project{t.projectCount === 1 ? '' : 's'}
                  <br />
                  {t.certificateCount} certificate{t.certificateCount === 1 ? '' : 's'}
                  <br />
                  {t.masteredDomainCount} domain{t.masteredDomainCount === 1 ? '' : 's'} mastered
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                {workShapeTags(t.workShape).map((tag) => <Chip key={tag} tone="signal">{tag}</Chip>)}
                {formatHours(t.workShape.hoursPerWeekMin, t.workShape.hoursPerWeekMax) && (
                  <Chip>{formatHours(t.workShape.hoursPerWeekMin, t.workShape.hoursPerWeekMax)}</Chip>
                )}
                {t.skills.slice(0, 6).map((s) => <Chip key={s}>{s}</Chip>)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Roles ──────────────────────────────────────────────────────────── */

function JobsTab() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [openJobId, setOpenJobId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setJobs((await employerApi.jobs()).jobs);
    } catch {
      setMessage({ tone: 'error', text: 'Could not load your roles.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount; the loading flags it sets are this component's own.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const publish = async (id: string) => {
    try {
      await employerApi.publishJob(id);
      await load();
      setMessage({ tone: 'success', text: 'Published.' });
    } catch (err) {
      const body = (err as { body?: { error?: string } }).body;
      setMessage({ tone: 'error', text: body?.error ?? 'Could not publish this role.' });
    }
  };

  const close = async (id: string) => {
    try {
      await employerApi.closeJob(id);
      await load();
    } catch {
      setMessage({ tone: 'error', text: 'Could not close this role.' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      {creating ? (
        <JobEditor
          onCancel={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      ) : (
        <Button variant="primary" onClick={() => setCreating(true)}>Post a role</Button>
      )}

      {jobs.length === 0 && !creating ? (
        <EmptyState title="No roles yet" body="Draft a role, add a pay range, publish. Ranges are required — that is the deal on this board." />
      ) : (
        jobs.map((job) => (
          <Card key={job.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <h3 style={{ fontSize: '1rem' }}>{job.title}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
                  {formatSalary(job.salary)} · {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip tone={job.status === 'published' ? 'signal' : job.status === 'draft' ? 'gold' : 'neutral'}>
                  {job.status}
                </Chip>
                <Chip>{job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'}</Chip>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {job.status === 'draft' && (
                <Button variant="secondary" size="sm" onClick={() => publish(job.id)}>Publish</Button>
              )}
              {job.status === 'published' && (
                <Button variant="ghost" size="sm" onClick={() => close(job.id)}>Close</Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenJobId(openJobId === job.id ? null : job.id)}
                aria-expanded={openJobId === job.id}
              >
                {openJobId === job.id ? 'Hide applicants' : 'View applicants'}
              </Button>
            </div>

            {openJobId === job.id && <Applicants jobId={job.id} />}
          </Card>
        ))
      )}
    </div>
  );
}

function JobEditor({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft, clearDraft, restored] = useDraft('employer_job', {
    title: '',
    description: '',
    location: '',
    employmentType: 'full_time',
    isRemote: true,
    isAsyncFriendly: false,
    hasFlexibleHours: false,
    hoursPerWeekMin: '',
    hoursPerWeekMax: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'EUR',
    salaryPeriod: 'year',
    skills: '',
  });

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await employerApi.createJob({
        ...draft,
        hoursPerWeekMin: draft.hoursPerWeekMin ? Number(draft.hoursPerWeekMin) : null,
        hoursPerWeekMax: draft.hoursPerWeekMax ? Number(draft.hoursPerWeekMax) : null,
        salaryMin: draft.salaryMin ? Number(draft.salaryMin) : null,
        salaryMax: draft.salaryMax ? Number(draft.salaryMax) : null,
        skills: draft.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      clearDraft();
      await onSaved();
    } catch {
      setError('Could not save this role. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <h2 style={{ fontSize: '1rem' }}>New role</h2>
      {restored && <DraftRestoredNotice onDiscard={clearDraft} />}
      {error && <Notice tone="error">{error}</Notice>}

      <Field label="Title" htmlFor="job-title">
        <input id="job-title" style={inputStyle} value={draft.title} onChange={(e) => setDraft({ title: e.target.value })} />
      </Field>

      <Field label="Description" hint="What the work is, what the first 90 days look like, how the team communicates.">
        <textarea style={{ ...inputStyle, minHeight: 180, resize: 'vertical' }} value={draft.description} onChange={(e) => setDraft({ description: e.target.value })} />
      </Field>

      <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <label style={labelStyle} htmlFor="job-type">Type</label>
          <select id="job-type" style={inputStyle} value={draft.employmentType} onChange={(e) => setDraft({ employmentType: e.target.value })}>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label style={labelStyle} htmlFor="job-loc">Location</label>
          <input id="job-loc" style={inputStyle} value={draft.location} onChange={(e) => setDraft({ location: e.target.value })} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <Toggle id="job-remote" checked={draft.isRemote} onChange={(v) => setDraft({ isRemote: v })} label="Remote" />
        <Toggle id="job-async" checked={draft.isAsyncFriendly} onChange={(v) => setDraft({ isAsyncFriendly: v })} label="Async friendly" />
        <Toggle id="job-flex" checked={draft.hasFlexibleHours} onChange={(v) => setDraft({ hasFlexibleHours: v })} label="Flexible hours" />
      </div>

      <div>
        <p style={labelStyle}>Pay range — required to publish</p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input aria-label="Minimum pay" type="number" style={{ ...inputStyle, width: 140 }} value={draft.salaryMin} onChange={(e) => setDraft({ salaryMin: e.target.value })} placeholder="Min" />
          <input aria-label="Maximum pay" type="number" style={{ ...inputStyle, width: 140 }} value={draft.salaryMax} onChange={(e) => setDraft({ salaryMax: e.target.value })} placeholder="Max" />
          <input aria-label="Currency" style={{ ...inputStyle, width: 90 }} maxLength={3} value={draft.salaryCurrency} onChange={(e) => setDraft({ salaryCurrency: e.target.value.toUpperCase() })} />
          <select aria-label="Pay period" style={{ ...inputStyle, width: 130 }} value={draft.salaryPeriod} onChange={(e) => setDraft({ salaryPeriod: e.target.value })}>
            <option value="year">per year</option>
            <option value="month">per month</option>
            <option value="hour">per hour</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle} htmlFor="job-hmin">Hours / week from</label>
          <input id="job-hmin" type="number" style={{ ...inputStyle, width: 120 }} value={draft.hoursPerWeekMin} onChange={(e) => setDraft({ hoursPerWeekMin: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="job-hmax">to</label>
          <input id="job-hmax" type="number" style={{ ...inputStyle, width: 120 }} value={draft.hoursPerWeekMax} onChange={(e) => setDraft({ hoursPerWeekMax: e.target.value })} />
        </div>
      </div>

      <Field label="Skills" hint="Comma separated. Used for matching and fed back into curriculum planning.">
        <input style={inputStyle} value={draft.skills} onChange={(e) => setDraft({ skills: e.target.value })} />
      </Field>

      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={save} disabled={busy || !draft.title.trim() || !draft.description.trim()}>
          {busy ? 'Saving…' : 'Save draft'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

const NEXT_STATUSES: ApplicationStatus[] = [
  'viewed',
  'in_review',
  'interview',
  'offer',
  'hired',
  'not_selected',
];

function Applicants({ jobId }: { jobId: string }) {
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setApplications((await employerApi.jobApplications(jobId)).applications);
    } catch {
      /* surfaced by the empty state */
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    // Fetch on mount; the loading flags it sets are this component's own.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) return <LoadingSpinner />;
  if (applications.length === 0) {
    return <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>No applicants yet.</p>;
  }

  const setStatus = async (id: string, status: ApplicationStatus) => {
    await employerApi.setApplicationStatus(id, status).catch(() => {});
    await load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-lg)' }}>
      {applications.map((a) => (
        <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem' }}>
                {a.talent.profileVisible ? (
                  <Link to={`/employers/talent/${a.talent.handle}`}>{a.talent.handle}</Link>
                ) : (
                  a.talent.handle
                )}
              </p>
              {a.talent.headline && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{a.talent.headline}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <Chip tone={a.status === 'hired' ? 'signal' : 'gold'}>{APPLICATION_STATUS_LABELS[a.status]}</Chip>
              {a.status !== 'withdrawn' && (
                <select
                  aria-label={`Set status for ${a.talent.handle}`}
                  style={{ ...inputStyle, width: 160, padding: 'var(--space-sm) var(--space-md)' }}
                  value=""
                  onChange={(e) => e.target.value && setStatus(a.id, e.target.value as ApplicationStatus)}
                >
                  <option value="">Move to…</option>
                  {NEXT_STATUSES.map((s) => (
                    <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {a.coverNote && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{a.coverNote}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Intro requests ─────────────────────────────────────────────────── */

function RequestsTab() {
  const [intros, setIntros] = useState<EmployerIntro[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIntros((await employerApi.intros()).intros);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount; the loading flags it sets are this component's own.
    load();
  }, [load]);

  if (loading) return <LoadingSpinner />;
  if (intros.length === 0) {
    return (
      <EmptyState
        title="No requests sent"
        body="Find someone in the directory and ask for an introduction. They see your company and your message, and decide whether to share their contact details."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {intros.map((i) => (
        <Card key={i.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)' }}>
                <Link to={`/employers/talent/${i.talent.handle}`}>{i.talent.handle}</Link>
              </p>
              {i.talent.headline && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{i.talent.headline}</p>}
            </div>
            <Chip tone={i.status === 'accepted' ? 'signal' : i.status === 'pending' ? 'gold' : 'neutral'}>{i.status}</Chip>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{i.message}</p>
          {i.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await employerApi.withdrawIntro(i.id).catch(() => {});
                await load();
              }}
            >
              Withdraw
            </Button>
          )}
          {i.status === 'declined' && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
              Declined. Your company cannot send this person another request.
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
