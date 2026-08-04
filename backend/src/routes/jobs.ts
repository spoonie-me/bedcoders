import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import {
  employerAuthMiddleware,
  requireCompany,
  type EmployerRequest,
} from '../middleware/employerAuth.js';
import { normaliseSkillKey } from '../lib/talentVisibility.js';
import { recordSkillDemand } from './directory.js';

const router = Router();

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'];
const SALARY_PERIODS = ['year', 'month', 'hour'];
const APPLICATION_STATUSES = [
  'submitted',
  'viewed',
  'in_review',
  'interview',
  'offer',
  'hired',
  'not_selected',
];
const PAGE_SIZE = 20;

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function publicJob(job: {
  id: string;
  title: string;
  description: string;
  location: string | null;
  isRemote: boolean;
  isAsyncFriendly: boolean;
  hasFlexibleHours: boolean;
  employmentType: string;
  hoursPerWeekMin: number | null;
  hoursPerWeekMax: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  skills: string;
  status: string;
  publishedAt: Date | null;
  closesAt: Date | null;
  company?: {
    name: string;
    slug: string;
    logoUrl: string | null;
    location: string | null;
    remotePolicy: string | null;
    asyncFriendly: boolean;
    flexibleHours: boolean;
    partTimeOpen: boolean;
    accommodationsStatement: string | null;
    verifiedAt: Date | null;
  } | null;
}) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    isRemote: job.isRemote,
    isAsyncFriendly: job.isAsyncFriendly,
    hasFlexibleHours: job.hasFlexibleHours,
    employmentType: job.employmentType,
    hoursPerWeekMin: job.hoursPerWeekMin,
    hoursPerWeekMax: job.hoursPerWeekMax,
    salary: {
      min: job.salaryMin,
      max: job.salaryMax,
      currency: job.salaryCurrency,
      period: job.salaryPeriod,
    },
    skills: parseJsonArray<string>(job.skills),
    status: job.status,
    publishedAt: job.publishedAt,
    closesAt: job.closesAt,
    company: job.company
      ? {
          name: job.company.name,
          slug: job.company.slug,
          logoUrl: job.company.logoUrl,
          location: job.company.location,
          remotePolicy: job.company.remotePolicy,
          asyncFriendly: job.company.asyncFriendly,
          flexibleHours: job.company.flexibleHours,
          partTimeOpen: job.company.partTimeOpen,
          accommodationsStatement: job.company.accommodationsStatement,
          isVerified: job.company.verifiedAt !== null,
        }
      : null,
  };
}

const companySelect = {
  name: true,
  slug: true,
  logoUrl: true,
  location: true,
  remotePolicy: true,
  asyncFriendly: true,
  flexibleHours: true,
  partTimeOpen: true,
  accommodationsStatement: true,
  verifiedAt: true,
} as const;

function readJobFields(body: Record<string, unknown>) {
  const int = (v: unknown, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), max) : null;
  };

  const skills = Array.isArray(body.skills)
    ? [
        ...new Set(
          (body.skills as unknown[])
            .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
            .map(normaliseSkillKey),
        ),
      ].slice(0, 12)
    : [];

  return {
    title: typeof body.title === 'string' ? body.title.trim().slice(0, 140) : '',
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 20000) : '',
    location:
      typeof body.location === 'string' && body.location.trim()
        ? body.location.trim().slice(0, 120)
        : null,
    isRemote: body.isRemote !== false,
    isAsyncFriendly: body.isAsyncFriendly === true,
    hasFlexibleHours: body.hasFlexibleHours === true,
    employmentType: EMPLOYMENT_TYPES.includes(body.employmentType as string)
      ? (body.employmentType as string)
      : 'full_time',
    hoursPerWeekMin: int(body.hoursPerWeekMin, 60),
    hoursPerWeekMax: int(body.hoursPerWeekMax, 60),
    salaryMin: int(body.salaryMin, 100_000_000),
    salaryMax: int(body.salaryMax, 100_000_000),
    salaryCurrency:
      typeof body.salaryCurrency === 'string' && /^[A-Z]{3}$/.test(body.salaryCurrency)
        ? body.salaryCurrency
        : 'EUR',
    salaryPeriod: SALARY_PERIODS.includes(body.salaryPeriod as string)
      ? (body.salaryPeriod as string)
      : 'year',
    skills: JSON.stringify(skills),
    closesAt: (() => {
      const raw = body.closesAt;
      if (typeof raw !== 'string' || !raw) return null;
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    })(),
  };
}

// ─── Public / learner-facing board ───────────────────────────────────────
//
// Mounted before the employer middleware so learners (and logged-out
// visitors deciding whether this platform is worth their time) can browse.

router.get('/', async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(q.page) || 1);

    const where = {
      status: 'published',
      ...(q.remote === 'true' ? { isRemote: true } : {}),
      ...(q.async === 'true' ? { isAsyncFriendly: true } : {}),
      ...(q.flexHours === 'true' ? { hasFlexibleHours: true } : {}),
      ...(EMPLOYMENT_TYPES.includes(q.employmentType ?? '')
        ? { employmentType: q.employmentType }
        : {}),
      ...(Number(q.maxHours)
        ? { hoursPerWeekMin: { lte: Math.min(Number(q.maxHours), 60) } }
        : {}),
    };

    const [total, jobs] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.findMany({
        where,
        include: { company: { select: companySelect } },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    res.json({
      jobs: jobs.map(publicJob),
      page,
      pageSize: PAGE_SIZE,
      total,
      hasMore: page * PAGE_SIZE < total,
    });
  } catch (err) {
    console.error('Job list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Employer job management ─────────────────────────────────────────────

const manage = Router();
manage.use(employerAuthMiddleware, requireCompany);

manage.get('/', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const jobs = await prisma.jobPosting.findMany({
      where: { companyId: employerReq.employerCompanyId as string },
      include: {
        company: { select: companySelect },
        _count: { select: { applications: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      jobs: jobs.map((j) => ({ ...publicJob(j), applicationCount: j._count.applications })),
    });
  } catch (err) {
    console.error('Employer job list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

manage.post('/', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const fields = readJobFields((req.body ?? {}) as Record<string, unknown>);

    if (!fields.title || !fields.description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const job = await prisma.jobPosting.create({
      data: { ...fields, companyId: employerReq.employerCompanyId as string },
      include: { company: { select: companySelect } },
    });

    res.status(201).json({ job: publicJob(job) });
  } catch (err) {
    console.error('Job create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

manage.put('/:id', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const existing = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.companyId !== employerReq.employerCompanyId) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const fields = readJobFields((req.body ?? {}) as Record<string, unknown>);
    if (!fields.title || !fields.description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const job = await prisma.jobPosting.update({
      where: { id: existing.id },
      data: fields,
      include: { company: { select: companySelect } },
    });

    res.json({ job: publicJob(job) });
  } catch (err) {
    console.error('Job update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Publishing is where the board's rules are enforced. A pay range is
 * mandatory: this audience negotiates from a weak position often enough that
 * "competitive salary" is a cost passed to them, and the platform will not
 * carry it.
 */
manage.post('/:id/publish', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job || job.companyId !== employerReq.employerCompanyId) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.salaryMin === null || job.salaryMax === null) {
      res.status(400).json({
        error: 'Add a pay range before publishing. Ranges are required on this board.',
        code: 'SALARY_RANGE_REQUIRED',
      });
      return;
    }
    if (job.salaryMin > job.salaryMax) {
      res.status(400).json({ error: 'Minimum pay cannot exceed maximum pay' });
      return;
    }

    const updated = await prisma.jobPosting.update({
      where: { id: job.id },
      data: { status: 'published', publishedAt: job.publishedAt ?? new Date() },
      include: { company: { select: companySelect } },
    });

    recordSkillDemand(parseJsonArray<string>(job.skills), 'postedCount').catch(() => {});

    res.json({ job: publicJob(updated) });
  } catch (err) {
    console.error('Job publish error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

manage.post('/:id/close', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job || job.companyId !== employerReq.employerCompanyId) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const updated = await prisma.jobPosting.update({
      where: { id: job.id },
      data: { status: 'closed' },
      include: { company: { select: companySelect } },
    });

    res.json({ job: publicJob(updated) });
  } catch (err) {
    console.error('Job close error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Applications (employer side) ────────────────────────────────────────

manage.get('/:id/applications', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job || job.companyId !== employerReq.employerCompanyId) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobPostingId: job.id },
      orderBy: { createdAt: 'desc' },
      include: {
        talentProfile: {
          select: { publicHandle: true, headline: true, isDiscoverable: true },
        },
      },
    });

    res.json({
      applications: applications.map((a) => ({
        id: a.id,
        status: a.status,
        statusUpdatedAt: a.statusUpdatedAt,
        createdAt: a.createdAt,
        coverNote: a.coverNote,
        // Applying shares a handle and a cover note, not an identity. Names
        // and emails still come only from an accepted intro request.
        talent: {
          handle: a.talentProfile.publicHandle,
          headline: a.talentProfile.headline,
          // Whether the employer can open the full profile from here.
          profileVisible: a.talentProfile.isDiscoverable,
        },
      })),
    });
  } catch (err) {
    console.error('Application list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

manage.post('/applications/:id/status', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const status = req.body?.status;

    if (!APPLICATION_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid application status' });
      return;
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: req.params.id },
      include: { jobPosting: { select: { companyId: true } } },
    });
    if (!application || application.jobPosting.companyId !== employerReq.employerCompanyId) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    if (application.status === 'withdrawn') {
      res.status(409).json({ error: 'This application was withdrawn' });
      return;
    }

    const updated = await prisma.jobApplication.update({
      where: { id: application.id },
      data: { status, statusUpdatedAt: new Date() },
    });

    res.json({ application: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error('Application status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.use('/manage', manage);

// Learner-authenticated helper so the board can show application state
// without leaking anything to anonymous callers.
router.get('/me/applied-ids', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await prisma.talentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      res.json({ jobIds: [] });
      return;
    }
    const applications = await prisma.jobApplication.findMany({
      where: { talentProfileId: profile.id },
      select: { jobPostingId: true },
    });
    res.json({ jobIds: applications.map((a) => a.jobPostingId) });
  } catch (err) {
    console.error('Applied ids error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Single published job. Includes `hasApplied` when a learner is signed in, so
 * the board never invites someone to apply twice.
 */
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.jobPosting.findUnique({
      where: { id: req.params.id },
      include: { company: { select: companySelect } },
    });

    if (!job || job.status !== 'published') {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    let hasApplied = false;
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const learnerToken = (req.cookies as Record<string, string | undefined> | undefined)?.bc_token ?? bearer;

    if (learnerToken) {
      // Best-effort: an unreadable or expired token just means we don't know,
      // which is fine — the POST path re-checks and returns 409 on duplicates.
      try {
        const decoded = jwt.verify(learnerToken, process.env.JWT_SECRET as string, {
          algorithms: ['HS256'],
        }) as { userId?: string };
        if (decoded.userId) {
          const profile = await prisma.talentProfile.findUnique({
            where: { userId: decoded.userId },
            select: { id: true },
          });
          if (profile) {
            hasApplied =
              (await prisma.jobApplication.count({
                where: { jobPostingId: job.id, talentProfileId: profile.id },
              })) > 0;
          }
        }
      } catch {
        /* not signed in as a learner — leave hasApplied false */
      }
    }

    res.json({ job: publicJob(job), hasApplied });
  } catch (err) {
    console.error('Job get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
