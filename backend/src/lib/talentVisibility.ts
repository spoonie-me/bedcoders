/**
 * The one place learner data is turned into something an employer may see.
 *
 * Every employer-facing route MUST project through `toEmployerView` (or
 * `toDirectoryCard`, which delegates to it). Nothing else may hand a
 * TalentProfile to an employer response. Keeping it to a single choke point
 * is what makes the privacy promise auditable — and testable, which is why
 * this module is pure and imports no Prisma client.
 *
 * The rules it enforces:
 *   - `isDiscoverable` off  → the learner does not exist to employers at all.
 *   - Each `show*` flag off → that field is omitted, not blanked. An employer
 *     cannot tell a hidden country from an unset one.
 *   - Real name and email   → never here. Contact release runs through an
 *     accepted IntroRequest (see routes/intros.ts), never through search.
 *   - Health / diagnosis    → not a field on the model, so not a field here.
 *     What is exposed is the work shape a learner asked for, never why.
 */

// ─── Input shapes ────────────────────────────────────────────────────────
// Structural types, not Prisma types, so this module stays pure and the
// tests can construct fixtures without a database.

export interface TalentProfileSource {
  id: string;
  publicHandle: string;
  isDiscoverable: boolean;

  headline: string | null;
  summary: string | null;
  pronouns: string | null;

  openToWork: boolean;
  hoursPerWeekMin: number | null;
  hoursPerWeekMax: number | null;
  wantsRemote: boolean;
  wantsAsync: boolean;
  wantsPartTime: boolean;
  wantsFlexHours: boolean;
  wantsContract: boolean;
  earliestStart: Date | string | null;

  showRealName: boolean;
  showCountry: boolean;
  showTimeZone: boolean;
  showPortfolio: boolean;
  showCertificates: boolean;
  showMastery: boolean;
  showLinks: boolean;

  links: string; // JSON
}

export interface TalentUserSource {
  name: string | null;
  timeZone: string | null;
  profile?: { country: string | null; displayName: string | null } | null;
}

export interface TalentProjectSource {
  id: string;
  title: string;
  description: string;
  source: string; // curriculum | self
  repoUrl: string | null;
  liveUrl: string | null;
  skills: string; // JSON
  isVisible: boolean;
  order: number;
}

export interface TalentCertificateSource {
  trackId: string;
  examScore: number;
  issuedAt: Date | string;
  verifyCode: string;
}

export interface TalentMasterySource {
  domainId: string;
  domainName: string;
  stars: number;
  isMastered: boolean;
}

export interface TalentViewInput {
  profile: TalentProfileSource;
  user: TalentUserSource;
  projects?: TalentProjectSource[];
  certificates?: TalentCertificateSource[];
  mastery?: TalentMasterySource[];
}

// ─── Output shapes ───────────────────────────────────────────────────────

export interface EmployerLinkView {
  label: string;
  url: string;
}

export interface EmployerProjectView {
  id: string;
  title: string;
  description: string;
  /**
   * `curriculum` means the platform graded this work and stands behind it.
   * `self` means the learner added it themselves. Employers see the
   * difference — an unlabelled portfolio is worth less than an honest one.
   */
  provenance: 'curriculum' | 'self';
  repoUrl?: string;
  liveUrl?: string;
  skills: string[];
}

export interface EmployerCertificateView {
  trackId: string;
  examScore: number;
  issuedAt: string;
  /** Public verification code — anyone can check it at /verify/:code. */
  verifyCode: string;
}

export interface EmployerMasteryView {
  domainId: string;
  domainName: string;
  stars: number;
  isMastered: boolean;
}

/**
 * Work shape. This is the honest version of "flexible candidate": what the
 * learner asked for, stated plainly, with no inference about why.
 */
export interface EmployerWorkShapeView {
  openToWork: boolean;
  remote: boolean;
  async: boolean;
  partTime: boolean;
  flexibleHours: boolean;
  contract: boolean;
  hoursPerWeekMin?: number;
  hoursPerWeekMax?: number;
  earliestStart?: string;
}

export interface EmployerTalentView {
  id: string;
  handle: string;
  /** Real name only when `showRealName` is on; otherwise the handle stands in. */
  displayName: string;
  headline?: string;
  summary?: string;
  pronouns?: string;
  country?: string;
  timeZone?: string;
  workShape: EmployerWorkShapeView;
  links?: EmployerLinkView[];
  projects?: EmployerProjectView[];
  certificates?: EmployerCertificateView[];
  mastery?: EmployerMasteryView[];
  /** Which skills this profile can be matched on — union of visible sources. */
  skills: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

/** Drops keys whose value is `undefined` so hidden fields are absent, not null. */
function compact<T extends object>(obj: T): T {
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (record[key] === undefined) delete record[key];
  }
  return obj;
}

/** Only links that are http(s) — a portfolio link is not a place for `javascript:`. */
function safeLinks(raw: string): EmployerLinkView[] {
  return parseJsonArray<{ label?: unknown; url?: unknown }>(raw)
    .filter((l): l is { label: string; url: string } =>
      typeof l?.label === 'string' && typeof l?.url === 'string',
    )
    .filter((l) => /^https?:\/\//i.test(l.url))
    .map((l) => ({ label: l.label.slice(0, 40), url: l.url }));
}

export function normaliseSkillKey(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40);
}

// ─── The choke point ─────────────────────────────────────────────────────

/**
 * Returns `null` when the learner is not discoverable. Callers must treat
 * `null` as "no such profile" — a 404, never a 403, so employers cannot use
 * the directory to probe whether a given person is on the platform.
 */
export function toEmployerView(input: TalentViewInput): EmployerTalentView | null {
  const { profile, user } = input;

  if (!profile.isDiscoverable) return null;

  const projects = profile.showPortfolio
    ? (input.projects ?? [])
        .filter((p) => p.isVisible)
        .sort((a, b) => a.order - b.order)
        .map((p) =>
          compact<EmployerProjectView>({
            id: p.id,
            title: p.title,
            description: p.description,
            provenance: p.source === 'curriculum' ? 'curriculum' : 'self',
            repoUrl: p.repoUrl ?? undefined,
            liveUrl: p.liveUrl ?? undefined,
            skills: parseJsonArray<string>(p.skills).map(normaliseSkillKey),
          }),
        )
    : undefined;

  const certificates = profile.showCertificates
    ? (input.certificates ?? []).map((c) => ({
        trackId: c.trackId,
        examScore: c.examScore,
        issuedAt: toIso(c.issuedAt) as string,
        verifyCode: c.verifyCode,
      }))
    : undefined;

  const mastery = profile.showMastery
    ? (input.mastery ?? []).map((m) => ({
        domainId: m.domainId,
        domainName: m.domainName,
        stars: m.stars,
        isMastered: m.isMastered,
      }))
    : undefined;

  // Matchable skills come only from what is actually visible. A learner who
  // hides their portfolio does not become searchable by its contents.
  const skills = new Set<string>();
  for (const p of projects ?? []) for (const s of p.skills) skills.add(s);
  for (const c of certificates ?? []) skills.add(normaliseSkillKey(`track-${c.trackId}`));
  for (const m of mastery ?? []) if (m.isMastered) skills.add(normaliseSkillKey(m.domainName));

  const displayName = profile.showRealName
    ? (user.profile?.displayName ?? user.name ?? profile.publicHandle)
    : profile.publicHandle;

  return compact<EmployerTalentView>({
    id: profile.id,
    handle: profile.publicHandle,
    displayName,
    headline: profile.headline ?? undefined,
    summary: profile.summary ?? undefined,
    pronouns: profile.pronouns ?? undefined,
    country: profile.showCountry ? (user.profile?.country ?? undefined) : undefined,
    timeZone: profile.showTimeZone ? (user.timeZone ?? undefined) : undefined,
    workShape: compact<EmployerWorkShapeView>({
      openToWork: profile.openToWork,
      remote: profile.wantsRemote,
      async: profile.wantsAsync,
      partTime: profile.wantsPartTime,
      flexibleHours: profile.wantsFlexHours,
      contract: profile.wantsContract,
      hoursPerWeekMin: profile.hoursPerWeekMin ?? undefined,
      hoursPerWeekMax: profile.hoursPerWeekMax ?? undefined,
      earliestStart: toIso(profile.earliestStart),
    }),
    links: profile.showLinks ? safeLinks(profile.links) : undefined,
    projects,
    certificates,
    mastery,
    skills: [...skills].sort(),
  });
}

/**
 * Directory listing card — the same view, trimmed. Summary and full project
 * bodies are withheld from list results so a scraper pulling the directory
 * gets less than someone who opens a profile.
 */
export type EmployerTalentCard = Omit<
  EmployerTalentView,
  'summary' | 'projects' | 'certificates' | 'mastery'
> & {
  projectCount: number;
  certificateCount: number;
  masteredDomainCount: number;
};

export function toDirectoryCard(input: TalentViewInput): EmployerTalentCard | null {
  const full = toEmployerView(input);
  if (!full) return null;

  const { summary: _summary, projects, certificates, mastery, ...card } = full;
  return {
    ...card,
    projectCount: projects?.length ?? 0,
    certificateCount: certificates?.length ?? 0,
    masteredDomainCount: mastery?.filter((m) => m.isMastered).length ?? 0,
  };
}

/**
 * Contact details, released only against an accepted intro request. The
 * `status` check lives here rather than in the route so there is no path to
 * an email address that skips it.
 */
export interface ContactRelease {
  name: string;
  email: string;
  releasedAt: string;
}

export function releaseContact(
  intro: { status: string; contactReleasedAt: Date | string | null },
  user: { name: string | null; email: string },
): ContactRelease | null {
  if (intro.status !== 'accepted') return null;
  return {
    name: user.name ?? 'Soft Reset School graduate',
    email: user.email,
    releasedAt: toIso(intro.contactReleasedAt) ?? new Date().toISOString(),
  };
}

// ─── Learner-side preview ────────────────────────────────────────────────

/**
 * What the learner sees under "preview as an employer". Built from the exact
 * same function employers hit, so the preview cannot drift from reality —
 * with the discoverability gate lifted, so a learner can check their profile
 * before switching it on.
 */
export function toSelfPreview(input: TalentViewInput): EmployerTalentView {
  const view = toEmployerView({
    ...input,
    profile: { ...input.profile, isDiscoverable: true },
  });
  // Non-null by construction: the only `null` path is the gate we just lifted.
  return view as EmployerTalentView;
}
