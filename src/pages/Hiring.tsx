import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useDraft } from '@/lib/useDraft';
import {
  talentApi,
  visibleFieldCount,
  workShapeTags,
  APPLICATION_STATUS_LABELS,
  type EmployerTalentView,
  type LearnerApplication,
  type LearnerIntro,
  type OwnProject,
  type OwnTalentProfile,
  type PortfolioSuggestion,
} from '@/lib/hiring';

type Tab = 'visibility' | 'portfolio' | 'requests' | 'applications' | 'preview';

/**
 * The learner's hiring hub. Entirely opt-in: a learner who never opens this
 * page is not in the directory, is not searchable, and loses nothing.
 */
export function Hiring() {
  const [tab, setTab] = useState<Tab>('visibility');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<OwnTalentProfile | null>(null);
  const [projects, setProjects] = useState<OwnProject[]>([]);
  const [intros, setIntros] = useState<LearnerIntro[]>([]);
  const [applications, setApplications] = useState<LearnerApplication[]>([]);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const notify = useCallback((tone: 'success' | 'error', text: string) => {
    setMessage({ tone, text });
    window.setTimeout(() => setMessage(null), 5000);
  }, []);

  const loadCore = useCallback(async () => {
    const res = await talentApi.getProfile();
    setProfile(res.profile);
    setProjects(res.projects);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [core, introRes, appRes] = await Promise.all([
          talentApi.getProfile(),
          talentApi.intros(),
          talentApi.applications(),
        ]);
        if (cancelled) return;
        setProfile(core.profile);
        setProjects(core.projects);
        setIntros(introRes.intros);
        setApplications(appRes.applications);
      } catch {
        if (!cancelled) notify('error', 'Could not load your hiring profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <Notice tone="error">Could not load your hiring profile. Reload to try again.</Notice>
      </div>
    );
  }

  const pendingIntros = intros.filter((i) => i.status === 'pending').length;
  const openApplications = applications.filter(
    (a) => !['not_selected', 'withdrawn', 'hired'].includes(a.status),
  ).length;

  return (
    <div className="page-padded" style={{ maxWidth: 820, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Link
        to="/dashboard"
        style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', display: 'inline-block', marginBottom: 'var(--space-xl)' }}
      >
        &larr; Back to Dashboard
      </Link>

      <PageHeading
        title="Hiring"
        subtitle="Your work, shown to employers on your terms. Nothing here is on until you switch it on, and you can switch it off at any time."
      />

      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <TabBar<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'visibility', label: 'Visibility' },
          { key: 'portfolio', label: 'Portfolio' },
          { key: 'requests', label: 'Requests', badge: pendingIntros },
          { key: 'applications', label: 'Applications', badge: openApplications },
          { key: 'preview', label: 'Preview' },
        ]}
      />

      {tab === 'visibility' && (
        <VisibilityTab profile={profile} onProfile={setProfile} notify={notify} />
      )}
      {tab === 'portfolio' && (
        <PortfolioTab
          projects={projects}
          profile={profile}
          notify={notify}
          onChanged={async () => {
            await loadCore();
          }}
        />
      )}
      {tab === 'requests' && (
        <RequestsTab
          intros={intros}
          notify={notify}
          onChanged={async () => setIntros((await talentApi.intros()).intros)}
        />
      )}
      {tab === 'applications' && (
        <ApplicationsTab
          applications={applications}
          notify={notify}
          onChanged={async () => setApplications((await talentApi.applications()).applications)}
        />
      )}
      {tab === 'preview' && <PreviewTab />}
    </div>
  );
}

/* ─── Visibility ─────────────────────────────────────────────────────── */

function VisibilityTab({
  profile,
  onProfile,
  notify,
}: {
  profile: OwnTalentProfile;
  onProfile: (p: OwnTalentProfile) => void;
  notify: (tone: 'success' | 'error', text: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(profile);

  const patch = (p: Partial<OwnTalentProfile>) => setForm((f) => ({ ...f, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await talentApi.updateProfile(form);
      onProfile(res.profile);
      setForm(res.profile);
      notify('success', 'Saved.');
    } catch {
      notify('error', 'Could not save. Your changes are still here — try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDiscoverable = async (next: boolean) => {
    setSaving(true);
    try {
      const res = await talentApi.setDiscoverable(next);
      onProfile(res.profile);
      setForm((f) => ({ ...f, isDiscoverable: res.profile.isDiscoverable }));
      notify(
        'success',
        next
          ? 'You are now visible to verified employers.'
          : 'You are hidden again. Employers can no longer find you.',
      );
    } catch {
      notify('error', 'Could not change your visibility.');
    } finally {
      setSaving(false);
    }
  };

  const visibleCount = visibleFieldCount(form);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {/* Master switch, on its own card — it is the only control that makes
          any of this reach another person. */}
      <Card
        style={{
          borderColor: form.isDiscoverable ? 'var(--signal-muted)' : 'var(--bg-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-lg)',
        }}
      >
        <Toggle
          id="discoverable"
          checked={form.isDiscoverable}
          onChange={toggleDiscoverable}
          label="Let employers find me"
          description={
            form.isDiscoverable
              ? 'On. Employers with a verified company can find you in the directory.'
              : 'Off. You are not in the directory and nobody can search for you.'
          }
        />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
          {form.isDiscoverable
            ? `You are showing ${visibleCount} of 7 optional detail${visibleCount === 1 ? '' : 's'}. Your name and email are never in search results — an employer only gets those if you accept an intro request.`
            : 'Turning this off does not delete anything. Your profile and portfolio stay exactly as you left them.'}
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
          You appear as <code style={{ color: 'var(--signal)' }}>{form.publicHandle}</code> unless you
          choose to show your real name below.
        </p>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1rem' }}>About your work</h2>

        <Field label="Headline" hint="One line. What you build, or want to.">
          <input
            style={inputStyle}
            maxLength={120}
            value={form.headline ?? ''}
            onChange={(e) => patch({ headline: e.target.value })}
            placeholder="Agent tooling and eval harnesses"
          />
        </Field>

        <Field
          label="Summary"
          hint="Yours to write. You are never required to explain gaps, health, or anything about why you work the way you do."
        >
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            maxLength={2000}
            value={form.summary ?? ''}
            onChange={(e) => patch({ summary: e.target.value })}
          />
        </Field>

        <Field label="Pronouns" hint="Optional. Shown next to your name if you fill it in.">
          <input
            style={{ ...inputStyle, maxWidth: 200 }}
            maxLength={40}
            value={form.pronouns ?? ''}
            onChange={(e) => patch({ pronouns: e.target.value })}
          />
        </Field>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1rem' }}>How you want to work</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
            Employers filter on these. They see what you asked for — never why.
          </p>
        </div>

        <Toggle
          id="open-to-work"
          checked={form.openToWork}
          onChange={(v) => patch({ openToWork: v })}
          label="Open to work right now"
          description="Turn off when you need a break. You stay in the directory, marked as not currently looking."
        />
        <Toggle id="w-remote" checked={form.wantsRemote} onChange={(v) => patch({ wantsRemote: v })} label="Remote" />
        <Toggle
          id="w-async"
          checked={form.wantsAsync}
          onChange={(v) => patch({ wantsAsync: v })}
          label="Async"
          description="Written-first, few scheduled calls."
        />
        <Toggle id="w-flex" checked={form.wantsFlexHours} onChange={(v) => patch({ wantsFlexHours: v })} label="Flexible hours" />
        <Toggle id="w-part" checked={form.wantsPartTime} onChange={(v) => patch({ wantsPartTime: v })} label="Part time" />
        <Toggle id="w-contract" checked={form.wantsContract} onChange={(v) => patch({ wantsContract: v })} label="Contract or freelance" />

        <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <Field label="Hours / week — from">
            <input
              type="number"
              min={1}
              max={60}
              style={{ ...inputStyle, width: 120 }}
              value={form.hoursPerWeekMin ?? ''}
              onChange={(e) => patch({ hoursPerWeekMin: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
          <Field label="to">
            <input
              type="number"
              min={1}
              max={60}
              style={{ ...inputStyle, width: 120 }}
              value={form.hoursPerWeekMax ?? ''}
              onChange={(e) => patch({ hoursPerWeekMax: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
        </div>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1rem' }}>What employers can see</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
            Everything starts hidden. A hidden field is absent, not blank — employers cannot tell it exists.
          </p>
        </div>

        <Toggle id="s-name" checked={form.showRealName} onChange={(v) => patch({ showRealName: v })} label="My real name" description={`Otherwise you appear as ${form.publicHandle}.`} />
        <Toggle id="s-country" checked={form.showCountry} onChange={(v) => patch({ showCountry: v })} label="Country" />
        <Toggle id="s-tz" checked={form.showTimeZone} onChange={(v) => patch({ showTimeZone: v })} label="Time zone" />
        <Toggle id="s-portfolio" checked={form.showPortfolio} onChange={(v) => patch({ showPortfolio: v })} label="Portfolio projects" description="Only the individual projects you also marked visible." />
        <Toggle id="s-certs" checked={form.showCertificates} onChange={(v) => patch({ showCertificates: v })} label="Certificates" />
        <Toggle id="s-mastery" checked={form.showMastery} onChange={(v) => patch({ showMastery: v })} label="Domain mastery" />
        <Toggle id="s-links" checked={form.showLinks} onChange={(v) => patch({ showLinks: v })} label="My links" />

        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
          Your email address is not on this list because it is never shown in search — not to anyone,
          at any setting. It is released only when you accept an intro request.
        </p>
      </Card>

      <LinksEditor links={form.links} onChange={(links) => patch({ links })} />

      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function LinksEditor({
  links,
  onChange,
}: {
  links: Array<{ label: string; url: string }>;
  onChange: (links: Array<{ label: string; url: string }>) => void;
}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const add = () => {
    if (!label.trim() || !/^https?:\/\//i.test(url)) return;
    onChange([...links, { label: label.trim(), url: url.trim() }].slice(0, 8));
    setLabel('');
    setUrl('');
  };

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <h2 style={{ fontSize: '1rem' }}>Links</h2>
      {links.length > 0 && (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {links.map((l, i) => (
            <li key={`${l.url}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', overflowWrap: 'anywhere' }}>
                <strong>{l.label}</strong>{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>{l.url}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(links.filter((_, idx) => idx !== i))}
                aria-label={`Remove link ${l.label}`}
                style={{ color: 'var(--rust)', fontSize: '0.8125rem', minHeight: 44 }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 140px' }}>
          <label style={labelStyle} htmlFor="link-label">Label</label>
          <input id="link-label" style={inputStyle} value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div style={{ flex: '2 1 240px' }}>
          <label style={labelStyle} htmlFor="link-url">URL</label>
          <input id="link-url" style={inputStyle} value={url} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
        </div>
        <Button variant="secondary" size="sm" onClick={add} disabled={!label.trim() || !/^https?:\/\//i.test(url)}>
          Add
        </Button>
      </div>
    </Card>
  );
}

/* ─── Portfolio ──────────────────────────────────────────────────────── */

function PortfolioTab({
  projects,
  profile,
  notify,
  onChanged,
}: {
  projects: OwnProject[];
  profile: OwnTalentProfile;
  notify: (tone: 'success' | 'error', text: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [suggestions, setSuggestions] = useState<PortfolioSuggestion[]>([]);
  const [busy, setBusy] = useState(false);

  const [draft, setDraft, clearDraft, restored] = useDraft('portfolio_project', {
    title: '',
    description: '',
    repoUrl: '',
    liveUrl: '',
    skills: '',
    isVisible: true,
    moduleId: '' as string | null,
  });

  const reloadSuggestions = useCallback(async () => {
    try {
      setSuggestions((await talentApi.suggestions()).suggestions);
    } catch {
      /* suggestions are a bonus — a failure here should not break the tab */
    }
  }, []);

  useEffect(() => {
    // Fetch on mount; the loading flags it sets are this component's own.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reloadSuggestions();
  }, [reloadSuggestions]);

  const submit = async () => {
    if (!draft.title.trim() || !draft.description.trim()) return;
    setBusy(true);
    try {
      await talentApi.createProject({
        title: draft.title,
        description: draft.description,
        repoUrl: draft.repoUrl || null,
        liveUrl: draft.liveUrl || null,
        skills: draft.skills.split(',').map((s) => s.trim()).filter(Boolean),
        isVisible: draft.isVisible,
        moduleId: draft.moduleId || null,
      });
      clearDraft();
      await Promise.all([onChanged(), reloadSuggestions()]);
      notify('success', 'Project added.');
    } catch {
      notify('error', 'Could not add the project. Your text is still here.');
    } finally {
      setBusy(false);
    }
  };

  const toggleVisible = async (project: OwnProject) => {
    try {
      await talentApi.updateProject(project.id, { ...project, isVisible: !project.isVisible });
      await onChanged();
    } catch {
      notify('error', 'Could not update the project.');
    }
  };

  const remove = async (project: OwnProject) => {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    try {
      await talentApi.deleteProject(project.id);
      await Promise.all([onChanged(), reloadSuggestions()]);
      notify('success', 'Project deleted.');
    } catch {
      notify('error', 'Could not delete the project.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {!profile.showPortfolio && projects.some((p) => p.isVisible) && (
        <Notice tone="info">
          Your portfolio is switched off under Visibility, so none of these are reaching employers yet.
        </Notice>
      )}

      {suggestions.length > 0 && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <h2 style={{ fontSize: '1rem' }}>From your coursework</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
              Modules you finished. Add one and it carries a verified badge — employers can see the
              platform stands behind it, not just you.
            </p>
          </div>
          {suggestions.map((s) => (
            <div
              key={s.moduleId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--space-lg)',
                paddingBottom: 'var(--space-lg)',
                borderBottom: '1px solid var(--bg-border)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 260px' }}>
                <p style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{s.title}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                  {s.domainName}
                  {s.assessmentScore !== null && ` · assessment ${Math.round(s.assessmentScore)}%`}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDraft({
                    title: s.title,
                    description: s.description,
                    skills: s.suggestedSkills.join(', '),
                    moduleId: s.moduleId,
                    isVisible: true,
                  });
                  document.getElementById('project-title')?.focus();
                }}
              >
                Use this
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1rem' }}>Add a project</h2>
        {restored && <DraftRestoredNotice onDiscard={clearDraft} />}

        <Field label="Title" htmlFor="project-title">
          <input
            id="project-title"
            style={inputStyle}
            maxLength={120}
            value={draft.title}
            onChange={(e) => setDraft({ title: e.target.value })}
          />
        </Field>

        <Field label="What it is" hint="What you built, what was hard, what you'd change.">
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            maxLength={2000}
            value={draft.description}
            onChange={(e) => setDraft({ description: e.target.value })}
          />
        </Field>

        <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px' }}>
            <Field label="Repo URL">
              <input style={inputStyle} value={draft.repoUrl} placeholder="https://" onChange={(e) => setDraft({ repoUrl: e.target.value })} />
            </Field>
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <Field label="Live URL">
              <input style={inputStyle} value={draft.liveUrl} placeholder="https://" onChange={(e) => setDraft({ liveUrl: e.target.value })} />
            </Field>
          </div>
        </div>

        <Field label="Skills" hint="Comma separated. These are what employers search on.">
          <input style={inputStyle} value={draft.skills} onChange={(e) => setDraft({ skills: e.target.value })} placeholder="typescript, evals, prompt-design" />
        </Field>

        <Toggle
          id="project-visible"
          checked={draft.isVisible}
          onChange={(v) => setDraft({ isVisible: v })}
          label="Show this project to employers"
          description="You can change this later."
        />

        <Button variant="primary" onClick={submit} disabled={busy || !draft.title.trim() || !draft.description.trim()}>
          {busy ? 'Adding…' : 'Add project'}
        </Button>
      </Card>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Finish a module and it shows up above, ready to add in one click. Or write one from scratch — both count."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {projects.map((p) => (
            <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <h3 style={{ fontSize: '1rem' }}>{p.title}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {p.source === 'curriculum' && <Chip tone="signal">Verified coursework</Chip>}
                    {!p.isVisible && <Chip>Hidden</Chip>}
                    {p.skills.map((s) => (
                      <Chip key={s}>{s}</Chip>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <Button variant="ghost" size="sm" onClick={() => toggleVisible(p)}>
                    {p.isVisible ? 'Hide' : 'Show'}
                  </Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--rust)' }} onClick={() => remove(p)}>
                    Delete
                  </Button>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{p.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Intro requests ─────────────────────────────────────────────────── */

function RequestsTab({
  intros,
  notify,
  onChanged,
}: {
  intros: LearnerIntro[];
  notify: (tone: 'success' | 'error', text: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const respond = async (id: string, decision: 'accepted' | 'declined') => {
    setBusyId(id);
    try {
      await talentApi.respondToIntro(id, decision);
      await onChanged();
      notify(
        'success',
        decision === 'accepted'
          ? 'Your name and email have been shared with this company.'
          : 'Declined. This company cannot request an intro again.',
      );
    } catch {
      notify('error', 'Could not send your answer.');
    } finally {
      setBusyId(null);
    }
  };

  if (intros.length === 0) {
    return (
      <EmptyState
        title="No requests"
        body="When a company wants an introduction, it lands here. They see your profile, not your contact details — you decide whether they get those."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
        Requests expire on their own after two weeks. Letting one lapse is a valid answer and is not
        recorded as a refusal.
      </p>

      {intros.map((intro) => (
        <Card key={intro.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1rem' }}>{intro.company.name}</h3>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                {intro.company.isVerified && <Chip tone="signal">Verified</Chip>}
                {intro.company.asyncFriendly && <Chip>Async friendly</Chip>}
                {intro.company.flexibleHours && <Chip>Flexible hours</Chip>}
                {intro.company.partTimeOpen && <Chip>Part time open</Chip>}
                {intro.job && <Chip tone="gold">{intro.job.title}</Chip>}
              </div>
            </div>
            <Chip tone={intro.status === 'accepted' ? 'signal' : intro.status === 'pending' ? 'gold' : 'neutral'}>
              {intro.status}
            </Chip>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{intro.message}</p>

          {intro.company.accommodationsStatement && (
            <div style={{ borderLeft: '2px solid var(--bg-border)', paddingLeft: 'var(--space-lg)' }}>
              <p style={{ ...labelStyle, marginBottom: 4 }}>How they work</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{intro.company.accommodationsStatement}</p>
            </div>
          )}

          {intro.status === 'pending' && (
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <Button variant="primary" size="sm" disabled={busyId === intro.id} onClick={() => respond(intro.id, 'accepted')}>
                Share my contact details
              </Button>
              <Button variant="ghost" size="sm" disabled={busyId === intro.id} onClick={() => respond(intro.id, 'declined')}>
                Decline
              </Button>
            </div>
          )}

          {intro.status === 'accepted' && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
              You shared your name and email with {intro.company.name}. Nothing else was sent.
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ─── Applications ───────────────────────────────────────────────────── */

function ApplicationsTab({
  applications,
  notify,
  onChanged,
}: {
  applications: LearnerApplication[];
  notify: (tone: 'success' | 'error', text: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        body="Every role on the board states its pay range and whether it is async, remote, or part time before you spend a single spoon on it."
        action={
          <Link to="/jobs">
            <Button variant="secondary" size="sm">Browse roles</Button>
          </Link>
        }
      />
    );
  }

  const withdraw = async (id: string) => {
    setBusyId(id);
    try {
      await talentApi.withdraw(id);
      await onChanged();
      notify('success', 'Application withdrawn.');
    } catch {
      notify('error', 'Could not withdraw the application.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {applications.map((a) => (
        <Card key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <h3 style={{ fontSize: '1rem' }}>
              <Link to={`/jobs/${a.job.id}`}>{a.job.title}</Link>
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-xs)' }}>
              {a.job.company.name} · applied {new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip tone={a.status === 'hired' ? 'signal' : a.status === 'not_selected' ? 'neutral' : 'gold'}>
              {APPLICATION_STATUS_LABELS[a.status]}
            </Chip>
            {!['withdrawn', 'hired', 'not_selected'].includes(a.status) && (
              <Button variant="ghost" size="sm" disabled={busyId === a.id} onClick={() => withdraw(a.id)}>
                Withdraw
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Preview ────────────────────────────────────────────────────────── */

function PreviewTab() {
  const [preview, setPreview] = useState<EmployerTalentView | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    talentApi
      .preview()
      .then((res) => {
        if (cancelled) return;
        setPreview(res.preview);
        setIsLive(res.isLive);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!preview) return <Notice tone="error">Could not build your preview.</Notice>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <Notice tone="info">
        {isLive
          ? 'This is exactly what an employer sees today.'
          : 'This is what an employer would see if you switched visibility on. Right now nobody can see it.'}
      </Notice>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>
            {preview.displayName}
            {preview.pronouns && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 400 }}>
                {' '}({preview.pronouns})
              </span>
            )}
          </h2>
          {preview.headline && <p style={{ color: 'var(--text-secondary)' }}>{preview.headline}</p>}
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-sm)' }}>
            {[preview.country, preview.timeZone].filter(Boolean).join(' · ') || 'Location hidden'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {workShapeTags(preview.workShape).map((t) => (
            <Chip key={t} tone="signal">{t}</Chip>
          ))}
          {!preview.workShape.openToWork && <Chip>Not currently looking</Chip>}
        </div>

        {preview.summary && <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{preview.summary}</p>}

        <PreviewSection title="Projects" empty="Hidden — employers see nothing here.">
          {preview.projects?.map((p) => (
            <div key={p.id} style={{ marginBottom: 'var(--space-lg)' }}>
              <p style={{ fontWeight: 500 }}>
                {p.title}{' '}
                {p.provenance === 'curriculum' && <Chip tone="signal">Verified coursework</Chip>}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>{p.description}</p>
            </div>
          ))}
        </PreviewSection>

        <PreviewSection title="Certificates" empty="Hidden.">
          {preview.certificates?.map((c) => (
            <p key={c.verifyCode} style={{ fontSize: '0.875rem' }}>
              {c.trackId} — {Math.round(c.examScore)}%
            </p>
          ))}
        </PreviewSection>

        <PreviewSection title="Mastery" empty="Hidden.">
          {preview.mastery?.map((m) => (
            <p key={m.domainId} style={{ fontSize: '0.875rem' }}>
              {m.domainName} — {'★'.repeat(m.stars)}
            </p>
          ))}
        </PreviewSection>

        <div>
          <p style={labelStyle}>Contact</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            Not shown. Employers only ever get your name and email after you accept an intro request.
          </p>
        </div>
      </Card>
    </div>
  );
}

function PreviewSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children?: React.ReactNode;
}) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div>
      <p style={labelStyle}>{title}</p>
      {hasContent ? children : <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>{empty}</p>}
    </div>
  );
}
