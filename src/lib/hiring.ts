// ─── Hiring API — talent profiles, employer accounts, directory, job board ──
//
// Three clients, matching the three trust boundaries on the server:
//   talentApi    — learner auth (shared `api` client, `bc_token`)
//   employerApi  — employer auth (its own token, `bc_emp_token`)
//   jobsApi      — public / learner
//
// The employer client is separate on purpose. Reusing the learner client for
// employer calls is exactly how a learner token ends up on an employer
// endpoint, so the two never share a code path.

import { api, ApiError } from './api';

const API_BASE = import.meta.env.VITE_BACKEND_URL ?? '/api';
export const EMPLOYER_TOKEN_KEY = 'bc_emp_token';

async function employerRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(EMPLOYER_TOKEN_KEY);
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json();
    } catch {
      body = { error: res.statusText };
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const empClient = {
  get: <T>(p: string) => employerRequest<T>(p),
  post: <T>(p: string, body?: unknown) =>
    employerRequest<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(p: string, body?: unknown) =>
    employerRequest<T>(p, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
};

// ─── Shared types ────────────────────────────────────────────────────────

export interface WorkShape {
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

export interface TalentLink {
  label: string;
  url: string;
}

export interface EmployerProjectView {
  id: string;
  title: string;
  description: string;
  provenance: 'curriculum' | 'self';
  repoUrl?: string;
  liveUrl?: string;
  skills: string[];
}

export interface EmployerTalentView {
  id: string;
  handle: string;
  displayName: string;
  headline?: string;
  summary?: string;
  pronouns?: string;
  country?: string;
  timeZone?: string;
  workShape: WorkShape;
  links?: TalentLink[];
  projects?: EmployerProjectView[];
  certificates?: Array<{
    trackId: string;
    examScore: number;
    issuedAt: string;
    verifyCode: string;
  }>;
  mastery?: Array<{ domainId: string; domainName: string; stars: number; isMastered: boolean }>;
  skills: string[];
}

export type EmployerTalentCard = Omit<
  EmployerTalentView,
  'summary' | 'projects' | 'certificates' | 'mastery'
> & {
  projectCount: number;
  certificateCount: number;
  masteredDomainCount: number;
};

/** The learner's own record — every field, including the ones nobody else sees. */
export interface OwnTalentProfile {
  id: string;
  publicHandle: string;
  isDiscoverable: boolean;
  discoverableAt: string | null;
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
  earliestStart: string | null;
  showRealName: boolean;
  showCountry: boolean;
  showTimeZone: boolean;
  showPortfolio: boolean;
  showCertificates: boolean;
  showMastery: boolean;
  showLinks: boolean;
  links: TalentLink[];
}

export interface OwnProject {
  id: string;
  title: string;
  description: string;
  source: 'curriculum' | 'self';
  moduleId: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  skills: string[];
  isVisible: boolean;
  order: number;
}

export interface PortfolioSuggestion {
  moduleId: string;
  title: string;
  description: string;
  trackId: string | null;
  domainName: string | null;
  tier: string;
  assessmentScore: number | null;
  suggestedSkills: string[];
}

export interface CompanySummary {
  name: string;
  slug: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  location: string | null;
  remotePolicy: string | null;
  asyncFriendly: boolean;
  flexibleHours: boolean;
  partTimeOpen: boolean;
  accommodationsStatement: string | null;
  isVerified: boolean;
}

export type IntroStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';

export interface LearnerIntro {
  id: string;
  status: IntroStatus;
  message: string;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
  job: { id: string; title: string } | null;
  company: CompanySummary;
}

export interface EmployerIntro {
  id: string;
  status: IntroStatus;
  message: string;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
  job: { id: string; title: string } | null;
  talent: { handle: string; headline: string | null };
}

export type ApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'in_review'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'not_selected'
  | 'withdrawn';

export interface LearnerApplication {
  id: string;
  status: ApplicationStatus;
  statusUpdatedAt: string;
  createdAt: string;
  coverNote: string | null;
  job: {
    id: string;
    title: string;
    status: string;
    employmentType: string;
    company: { name: string; slug: string; logoUrl: string | null };
  };
}

export interface EmployerApplication {
  id: string;
  status: ApplicationStatus;
  statusUpdatedAt: string;
  createdAt: string;
  coverNote: string | null;
  talent: { handle: string; headline: string | null; profileVisible: boolean };
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  isRemote: boolean;
  isAsyncFriendly: boolean;
  hasFlexibleHours: boolean;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  hoursPerWeekMin: number | null;
  hoursPerWeekMax: number | null;
  salary: { min: number | null; max: number | null; currency: string; period: string };
  skills: string[];
  status: 'draft' | 'published' | 'closed';
  publishedAt: string | null;
  closesAt: string | null;
  company: CompanySummary | null;
}

export interface EmployerJob extends Job {
  applicationCount: number;
}

export interface EmployerAccount {
  id: string;
  email: string;
  name: string;
  jobTitle: string | null;
  role: string;
  companyId: string | null;
}

export interface Company extends CompanySummary {
  id: string;
  description: string | null;
  size: string | null;
}

// ─── Learner-side ────────────────────────────────────────────────────────

export const talentApi = {
  getProfile: () =>
    api.get<{ profile: OwnTalentProfile; projects: OwnProject[] }>('/talent/me'),

  updateProfile: (patch: Partial<OwnTalentProfile>) =>
    api.put<{ profile: OwnTalentProfile }>('/talent/me', patch),

  setDiscoverable: (isDiscoverable: boolean) =>
    api.post<{ profile: OwnTalentProfile }>('/talent/me/discoverable', { isDiscoverable }),

  preview: () =>
    api.get<{ preview: EmployerTalentView; isLive: boolean }>('/talent/me/preview'),

  suggestions: () =>
    api.get<{ suggestions: PortfolioSuggestion[] }>('/talent/me/suggestions'),

  createProject: (project: {
    title: string;
    description: string;
    repoUrl?: string | null;
    liveUrl?: string | null;
    skills?: string[];
    isVisible?: boolean;
    moduleId?: string | null;
  }) => api.post<{ project: OwnProject }>('/talent/me/projects', project),

  updateProject: (id: string, project: Partial<OwnProject>) =>
    api.put<{ project: OwnProject }>(`/talent/me/projects/${id}`, project),

  deleteProject: (id: string) => api.delete<void>(`/talent/me/projects/${id}`),

  intros: () => api.get<{ intros: LearnerIntro[] }>('/talent/me/intros'),

  respondToIntro: (id: string, decision: 'accepted' | 'declined') =>
    api.post<{ intro: { id: string; status: IntroStatus } }>(`/talent/me/intros/${id}/respond`, {
      decision,
    }),

  sharedContact: (id: string) =>
    api.get<{ shared: { name: string; email: string; releasedAt: string } | null }>(
      `/talent/me/intros/${id}/shared`,
    ),

  applications: () => api.get<{ applications: LearnerApplication[] }>('/talent/me/applications'),

  apply: (jobPostingId: string, coverNote?: string) =>
    api.post<{ application: { id: string; status: ApplicationStatus } }>(
      '/talent/me/applications',
      { jobPostingId, coverNote },
    ),

  withdraw: (id: string) =>
    api.post<{ application: { id: string; status: ApplicationStatus } }>(
      `/talent/me/applications/${id}/withdraw`,
    ),
};

// ─── Job board (public / learner) ────────────────────────────────────────

export interface JobFilters {
  remote?: boolean;
  async?: boolean;
  flexHours?: boolean;
  employmentType?: string;
  maxHours?: number;
  page?: number;
}

function toQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === false || value === '') continue;
    params.set(key, String(value));
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const jobsApi = {
  list: (filters: JobFilters = {}) =>
    api.get<{ jobs: Job[]; page: number; total: number; hasMore: boolean }>(
      `/jobs${toQuery(filters as Record<string, unknown>)}`,
    ),

  get: (id: string) => api.get<{ job: Job; hasApplied: boolean }>(`/jobs/${id}`),

  appliedIds: () => api.get<{ jobIds: string[] }>('/jobs/me/applied-ids'),

  company: (slug: string) =>
    api.get<{ company: Company; jobs: Array<{ id: string; title: string }> }>(
      `/employers/company/${slug}`,
    ),
};

// ─── Employer-side ───────────────────────────────────────────────────────

export interface TalentFilters {
  skills?: string;
  openToWork?: boolean;
  remote?: boolean;
  async?: boolean;
  partTime?: boolean;
  flexHours?: boolean;
  contract?: boolean;
  maxHours?: number;
  page?: number;
}

export const employerApi = {
  signup: (data: { email: string; password: string; name: string; jobTitle?: string }) =>
    empClient.post<{ token: string; employer: EmployerAccount; company: Company | null }>(
      '/employers/signup',
      data,
    ),

  login: (data: { email: string; password: string }) =>
    empClient.post<{ token: string; employer: EmployerAccount; company: Company | null }>(
      '/employers/login',
      data,
    ),

  logout: () => empClient.post<{ success: boolean }>('/employers/logout'),

  me: () => empClient.get<{ employer: EmployerAccount; company: Company | null }>('/employers/me'),

  createCompany: (data: Record<string, unknown>) =>
    empClient.post<{ token: string; company: Company }>('/employers/company', data),

  updateCompany: (data: Record<string, unknown>) =>
    empClient.put<{ company: Company }>('/employers/company', data),

  searchTalent: (filters: TalentFilters = {}) =>
    empClient.get<{
      results: EmployerTalentCard[];
      page: number;
      totalBeforeSkillFilter: number;
      hasMore: boolean;
    }>(`/directory/talent${toQuery(filters as Record<string, unknown>)}`),

  getTalent: (handle: string) =>
    empClient.get<{
      talent: EmployerTalentView;
      contact: { name: string; email: string; releasedAt: string } | null;
      introStatus: 'pending' | 'accepted' | null;
    }>(`/directory/talent/${handle}`),

  requestIntro: (handle: string, message: string, jobPostingId?: string) =>
    empClient.post<{ intro: { id: string; status: IntroStatus; expiresAt: string } }>(
      `/directory/talent/${handle}/intro`,
      { message, jobPostingId },
    ),

  intros: () => empClient.get<{ intros: EmployerIntro[] }>('/directory/intros'),

  withdrawIntro: (id: string) =>
    empClient.post<{ success: boolean }>(`/directory/intros/${id}/withdraw`),

  skillDemand: () =>
    empClient.get<{ signals: Array<{ skillKey: string; searchCount: number; postedCount: number }> }>(
      '/directory/skill-demand',
    ),

  jobs: () => empClient.get<{ jobs: EmployerJob[] }>('/jobs/manage'),

  createJob: (data: Record<string, unknown>) =>
    empClient.post<{ job: Job }>('/jobs/manage', data),

  updateJob: (id: string, data: Record<string, unknown>) =>
    empClient.put<{ job: Job }>(`/jobs/manage/${id}`, data),

  publishJob: (id: string) => empClient.post<{ job: Job }>(`/jobs/manage/${id}/publish`),

  closeJob: (id: string) => empClient.post<{ job: Job }>(`/jobs/manage/${id}/close`),

  jobApplications: (id: string) =>
    empClient.get<{ applications: EmployerApplication[] }>(`/jobs/manage/${id}/applications`),

  setApplicationStatus: (id: string, status: ApplicationStatus) =>
    empClient.post<{ application: { id: string; status: ApplicationStatus } }>(
      `/jobs/manage/applications/${id}/status`,
      { status },
    ),
};

// ─── Presentation helpers ────────────────────────────────────────────────

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  internship: 'Internship',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  viewed: 'Viewed',
  in_review: 'In review',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  not_selected: 'Not selected',
  withdrawn: 'Withdrawn',
};

/**
 * Pay ranges are mandatory on published jobs, so this never has to render a
 * "competitive salary" placeholder — if it somehow gets null, say so plainly
 * rather than dressing it up.
 */
export function formatSalary(salary: Job['salary']): string {
  const { min, max, currency, period } = salary;
  if (min === null || max === null) return 'Pay range not stated';

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  const suffix = period === 'year' ? '/yr' : period === 'month' ? '/mo' : '/hr';
  return min === max ? `${fmt(min)}${suffix}` : `${fmt(min)} – ${fmt(max)}${suffix}`;
}

export function formatHours(min: number | null | undefined, max: number | null | undefined): string | null {
  if (!min && !max) return null;
  if (min && max) return min === max ? `${min} hrs/week` : `${min}–${max} hrs/week`;
  return min ? `From ${min} hrs/week` : `Up to ${max} hrs/week`;
}

/** The work-shape chips shown on cards, in a stable order. */
export function workShapeTags(shape: WorkShape): string[] {
  const tags: string[] = [];
  if (shape.remote) tags.push('Remote');
  if (shape.async) tags.push('Async');
  if (shape.flexibleHours) tags.push('Flexible hours');
  if (shape.partTime) tags.push('Part time');
  if (shape.contract) tags.push('Contract');
  return tags;
}

export function jobTags(job: Job): string[] {
  const tags: string[] = [];
  if (job.isRemote) tags.push('Remote');
  if (job.isAsyncFriendly) tags.push('Async');
  if (job.hasFlexibleHours) tags.push('Flexible hours');
  return tags;
}

/**
 * Counts the fields a learner has made visible. Used to tell them plainly how
 * much of themselves is on show, rather than making them audit seven toggles.
 */
export function visibleFieldCount(profile: OwnTalentProfile): number {
  return [
    profile.showRealName,
    profile.showCountry,
    profile.showTimeZone,
    profile.showPortfolio,
    profile.showCertificates,
    profile.showMastery,
    profile.showLinks,
  ].filter(Boolean).length;
}

export { ApiError };
