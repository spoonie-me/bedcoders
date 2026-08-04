import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { logAuditAction } from '../lib/compliance.js';
import {
  toSelfPreview,
  releaseContact,
  normaliseSkillKey,
  type TalentViewInput,
} from '../lib/talentVisibility.js';

const router = Router();

// Everything here is learner-owned: a learner reading and writing their own
// hiring profile. Employers never reach these routes — see routes/directory.ts.
router.use(authMiddleware);

const INTRO_RESPONSE_STATUSES = ['accepted', 'declined'];

function generateHandle(): string {
  // Pseudonymous and non-sequential, so the directory can't be enumerated
  // and a handle leaks nothing about signup order or cohort size.
  return `srs-${crypto.randomBytes(4).toString('hex')}`;
}

async function uniqueHandle(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = generateHandle();
    const clash = await prisma.talentProfile.findUnique({ where: { publicHandle: candidate } });
    if (!clash) return candidate;
  }
  return `srs-${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * A talent profile is created lazily and inert: discoverable off, every
 * `show*` flag off. Merely opening the hiring page must not make anyone
 * visible to anyone.
 */
async function getOrCreateProfile(userId: string) {
  const existing = await prisma.talentProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.talentProfile.create({
    data: { userId, publicHandle: await uniqueHandle() },
  });
}

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Loads everything `toEmployerView` needs, in one place, for reuse. */
async function loadViewInput(userId: string, profileId: string): Promise<TalentViewInput> {
  const [profile, user, projects, certificates, mastery] = await Promise.all([
    prisma.talentProfile.findUniqueOrThrow({ where: { id: profileId } }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        timeZone: true,
        profile: { select: { country: true, displayName: true } },
      },
    }),
    prisma.portfolioProject.findMany({
      where: { talentProfileId: profileId },
      orderBy: { order: 'asc' },
    }),
    prisma.certificate.findMany({ where: { userId } }),
    prisma.domainMastery.findMany({
      where: { userId },
      include: { domain: { select: { name: true } } },
    }),
  ]);

  return {
    profile,
    user,
    projects,
    certificates,
    mastery: mastery.map((m) => ({
      domainId: m.domainId,
      domainName: m.domain.name,
      stars: m.stars,
      isMastered: m.isMastered,
    })),
  };
}

function ownProfileResponse(profile: Record<string, unknown>) {
  return { ...profile, links: parseJsonArray(profile.links as string) };
}

// ─── Profile ─────────────────────────────────────────────────────────────

router.get('/me', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);
    const projects = await prisma.portfolioProject.findMany({
      where: { talentProfileId: profile.id },
      orderBy: { order: 'asc' },
    });

    res.json({
      profile: ownProfileResponse(profile),
      projects: projects.map((p) => ({ ...p, skills: parseJsonArray(p.skills) })),
    });
  } catch (err) {
    console.error('Talent profile get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const BOOLEAN_FIELDS = [
  'openToWork',
  'wantsRemote',
  'wantsAsync',
  'wantsPartTime',
  'wantsFlexHours',
  'wantsContract',
  'showRealName',
  'showCountry',
  'showTimeZone',
  'showPortfolio',
  'showCertificates',
  'showMastery',
  'showLinks',
] as const;

router.put('/me', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    for (const field of BOOLEAN_FIELDS) {
      if (typeof body[field] === 'boolean') data[field] = body[field];
    }

    if ('headline' in body) {
      data.headline =
        typeof body.headline === 'string' && body.headline.trim()
          ? body.headline.trim().slice(0, 120)
          : null;
    }
    if ('summary' in body) {
      data.summary =
        typeof body.summary === 'string' && body.summary.trim()
          ? body.summary.trim().slice(0, 2000)
          : null;
    }
    if ('pronouns' in body) {
      data.pronouns =
        typeof body.pronouns === 'string' && body.pronouns.trim()
          ? body.pronouns.trim().slice(0, 40)
          : null;
    }

    for (const field of ['hoursPerWeekMin', 'hoursPerWeekMax'] as const) {
      if (field in body) {
        const n = Number(body[field]);
        data[field] = Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 60) : null;
      }
    }

    if ('earliestStart' in body) {
      const raw = body.earliestStart;
      const parsed = typeof raw === 'string' && raw ? new Date(raw) : null;
      data.earliestStart = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }

    if ('links' in body && Array.isArray(body.links)) {
      const links = (body.links as Array<{ label?: unknown; url?: unknown }>)
        .filter(
          (l) =>
            typeof l?.label === 'string' &&
            typeof l?.url === 'string' &&
            /^https?:\/\//i.test(l.url),
        )
        .slice(0, 8)
        .map((l) => ({ label: (l.label as string).slice(0, 40), url: (l.url as string).slice(0, 300) }));
      data.links = JSON.stringify(links);
    }

    // Hours range should not be able to read backwards.
    const min = (data.hoursPerWeekMin ?? profile.hoursPerWeekMin) as number | null;
    const max = (data.hoursPerWeekMax ?? profile.hoursPerWeekMax) as number | null;
    if (min !== null && max !== null && min > max) {
      res.status(400).json({ error: 'Minimum hours cannot exceed maximum hours' });
      return;
    }

    const updated = await prisma.talentProfile.update({ where: { id: profile.id }, data });
    res.json({ profile: ownProfileResponse(updated) });
  } catch (err) {
    console.error('Talent profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * The master switch, on its own endpoint rather than folded into PUT /me, so
 * that becoming visible is always a deliberate act with its own audit entry
 * — never a side effect of saving an unrelated field.
 */
router.post('/me/discoverable', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);
    const next = req.body?.isDiscoverable === true;

    const updated = await prisma.talentProfile.update({
      where: { id: profile.id },
      data: {
        isDiscoverable: next,
        discoverableAt: next ? (profile.discoverableAt ?? new Date()) : null,
      },
    });

    await logAuditAction(
      userId,
      next ? 'talent.discoverable.on' : 'talent.discoverable.off',
      profile.id,
      req,
    ).catch(() => {});

    res.json({ profile: ownProfileResponse(updated) });
  } catch (err) {
    console.error('Discoverable toggle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * "Preview as an employer" — rendered from the same projection employers get,
 * with the discoverability gate lifted so it works before going live. If this
 * page shows something, an employer can see it; if it doesn't, they can't.
 */
router.get('/me/preview', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);
    const input = await loadViewInput(userId, profile.id);
    res.json({ preview: toSelfPreview(input), isLive: profile.isDiscoverable });
  } catch (err) {
    console.error('Talent preview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Portfolio ───────────────────────────────────────────────────────────

function readProjectFields(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '';
  const url = (v: unknown) =>
    typeof v === 'string' && /^https?:\/\//i.test(v) ? v.slice(0, 300) : null;

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
    title,
    description,
    repoUrl: url(body.repoUrl),
    liveUrl: url(body.liveUrl),
    skills: JSON.stringify(skills),
    isVisible: body.isVisible === true,
  };
}

router.post('/me/projects', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);
    const fields = readProjectFields((req.body ?? {}) as Record<string, unknown>);

    if (!fields.title || !fields.description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const count = await prisma.portfolioProject.count({ where: { talentProfileId: profile.id } });
    if (count >= 30) {
      res.status(400).json({ error: 'Portfolio limit reached (30 projects)' });
      return;
    }

    // `source` is server-set. A learner cannot label their own project as
    // graded coursework — that claim is the platform's to make, and it is the
    // reason an employer can trust a `curriculum` badge at all.
    const moduleId = typeof req.body?.moduleId === 'string' ? req.body.moduleId : null;
    let source = 'self';
    if (moduleId) {
      const verified = await hasCompletedModule(userId, moduleId);
      if (verified) source = 'curriculum';
    }

    const project = await prisma.portfolioProject.create({
      data: {
        talentProfileId: profile.id,
        ...fields,
        source,
        moduleId: source === 'curriculum' ? moduleId : null,
        order: count,
      },
    });

    res.status(201).json({ project: { ...project, skills: parseJsonArray(project.skills) } });
  } catch (err) {
    console.error('Portfolio create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me/projects/:id', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);

    const existing = await prisma.portfolioProject.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.talentProfileId !== profile.id) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const fields = readProjectFields((req.body ?? {}) as Record<string, unknown>);
    if (!fields.title || !fields.description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const project = await prisma.portfolioProject.update({
      where: { id: existing.id },
      // `source` and `moduleId` are omitted: provenance is not editable.
      data: fields,
    });

    res.json({ project: { ...project, skills: parseJsonArray(project.skills) } });
  } catch (err) {
    console.error('Portfolio update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/me/projects/:id', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);

    const existing = await prisma.portfolioProject.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.talentProfileId !== profile.id) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await prisma.portfolioProject.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (err) {
    console.error('Portfolio delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Has this learner finished every published lesson in the module? That is the
 * bar for calling a portfolio item `curriculum`-backed.
 */
async function hasCompletedModule(userId: string, moduleId: string): Promise<boolean> {
  const lessons = await prisma.lesson.findMany({
    where: { moduleId, isPublished: true },
    select: { id: true },
  });
  if (lessons.length === 0) return false;

  const completed = await prisma.lessonProgress.count({
    where: { userId, status: 'completed', lessonId: { in: lessons.map((l) => l.id) } },
  });
  return completed === lessons.length;
}

/**
 * Coursework the learner has actually finished, offered as ready-made
 * portfolio entries. This is the "portfolio built into the curriculum"
 * piece — nothing is added until the learner picks it, and nothing is
 * visible until they say so.
 */
router.get('/me/suggestions', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);

    const completedProgress = await prisma.lessonProgress.findMany({
      where: { userId, status: 'completed' },
      select: { lesson: { select: { moduleId: true } } },
    });
    const touchedModuleIds = [...new Set(completedProgress.map((p) => p.lesson.moduleId))];
    if (touchedModuleIds.length === 0) {
      res.json({ suggestions: [] });
      return;
    }

    const [modules, alreadyAdded, passedAssessments] = await Promise.all([
      prisma.module.findMany({
        where: { id: { in: touchedModuleIds } },
        include: {
          domain: { select: { name: true, trackId: true } },
          lessons: { where: { isPublished: true }, select: { id: true } },
          assessment: { select: { id: true } },
        },
      }),
      prisma.portfolioProject.findMany({
        where: { talentProfileId: profile.id, moduleId: { in: touchedModuleIds } },
        select: { moduleId: true },
      }),
      prisma.assessmentAttempt.findMany({
        where: { userId, passed: true },
        select: { assessmentId: true, score: true },
        orderBy: { score: 'desc' },
      }),
    ]);

    const addedModuleIds = new Set(alreadyAdded.map((p) => p.moduleId));
    const bestScoreByAssessment = new Map<string, number>();
    for (const a of passedAssessments) {
      if (!bestScoreByAssessment.has(a.assessmentId)) {
        bestScoreByAssessment.set(a.assessmentId, a.score);
      }
    }

    const completedLessonIds = new Set(
      (
        await prisma.lessonProgress.findMany({
          where: { userId, status: 'completed' },
          select: { lessonId: true },
        })
      ).map((p) => p.lessonId),
    );

    const suggestions = modules
      .filter((m) => !addedModuleIds.has(m.id))
      .filter((m) => m.lessons.length > 0 && m.lessons.every((l) => completedLessonIds.has(l.id)))
      .map((m) => ({
        moduleId: m.id,
        title: m.title,
        description: m.description,
        trackId: m.domain?.trackId ?? null,
        domainName: m.domain?.name ?? null,
        tier: m.tier,
        assessmentScore: m.assessment ? (bestScoreByAssessment.get(m.assessment.id) ?? null) : null,
        suggestedSkills: [
          ...new Set(
            [m.domain?.name, m.tier].filter((s): s is string => !!s).map(normaliseSkillKey),
          ),
        ],
      }));

    res.json({ suggestions });
  } catch (err) {
    console.error('Portfolio suggestions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Intro requests (learner side) ───────────────────────────────────────

router.get('/me/intros', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);

    const intros = await prisma.introRequest.findMany({
      where: { talentProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        company: true,
        jobPosting: { select: { id: true, title: true } },
      },
    });

    const now = Date.now();
    res.json({
      intros: intros.map((i) => ({
        id: i.id,
        // Expiry is computed at read time rather than swept by a cron: an
        // unanswered request should read as lapsed the moment it lapses, not
        // whenever a job next runs.
        status: i.status === 'pending' && i.expiresAt.getTime() < now ? 'expired' : i.status,
        message: i.message,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        respondedAt: i.respondedAt,
        job: i.jobPosting,
        company: {
          name: i.company.name,
          slug: i.company.slug,
          websiteUrl: i.company.websiteUrl,
          logoUrl: i.company.logoUrl,
          location: i.company.location,
          remotePolicy: i.company.remotePolicy,
          asyncFriendly: i.company.asyncFriendly,
          flexibleHours: i.company.flexibleHours,
          partTimeOpen: i.company.partTimeOpen,
          accommodationsStatement: i.company.accommodationsStatement,
          isVerified: i.company.verifiedAt !== null,
        },
      })),
    });
  } catch (err) {
    console.error('Intro list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/me/intros/:id/respond', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);
    const decision = req.body?.decision;

    if (!INTRO_RESPONSE_STATUSES.includes(decision)) {
      res.status(400).json({ error: 'Decision must be "accepted" or "declined"' });
      return;
    }

    const intro = await prisma.introRequest.findUnique({ where: { id: req.params.id } });
    if (!intro || intro.talentProfileId !== profile.id) {
      res.status(404).json({ error: 'Intro request not found' });
      return;
    }
    if (intro.status !== 'pending') {
      res.status(409).json({ error: 'This request has already been answered' });
      return;
    }
    if (intro.expiresAt.getTime() < Date.now()) {
      res.status(409).json({ error: 'This request has expired' });
      return;
    }

    const updated = await prisma.introRequest.update({
      where: { id: intro.id },
      data: {
        status: decision,
        respondedAt: new Date(),
        // The only write that ever unlocks contact details.
        contactReleasedAt: decision === 'accepted' ? new Date() : null,
      },
    });

    await logAuditAction(userId, `talent.intro.${decision}`, intro.id, req).catch(() => {});

    res.json({ intro: { id: updated.id, status: updated.status, respondedAt: updated.respondedAt } });
  } catch (err) {
    console.error('Intro respond error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Applications (learner side) ─────────────────────────────────────────

router.get('/me/applications', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);

    const applications = await prisma.jobApplication.findMany({
      where: { talentProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
            employmentType: true,
            company: { select: { name: true, slug: true, logoUrl: true } },
          },
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
        job: a.jobPosting,
      })),
    });
  } catch (err) {
    console.error('Applications list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/me/applications', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);
    const jobPostingId = req.body?.jobPostingId;

    if (typeof jobPostingId !== 'string') {
      res.status(400).json({ error: 'jobPostingId is required' });
      return;
    }

    const job = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
    if (!job || job.status !== 'published') {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Applying shares the profile with this one employer. It does not switch
    // on directory-wide discoverability, and we do not nudge them to.
    const existing = await prisma.jobApplication.findUnique({
      where: { jobPostingId_talentProfileId: { jobPostingId, talentProfileId: profile.id } },
    });
    if (existing) {
      res.status(409).json({ error: 'You have already applied to this role' });
      return;
    }

    const coverNote =
      typeof req.body?.coverNote === 'string' ? req.body.coverNote.trim().slice(0, 3000) : null;

    const application = await prisma.jobApplication.create({
      data: { jobPostingId, talentProfileId: profile.id, coverNote },
    });

    res.status(201).json({ application: { id: application.id, status: application.status } });
  } catch (err) {
    console.error('Application create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/me/applications/:id/withdraw', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);

    const application = await prisma.jobApplication.findUnique({ where: { id: req.params.id } });
    if (!application || application.talentProfileId !== profile.id) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const updated = await prisma.jobApplication.update({
      where: { id: application.id },
      data: { status: 'withdrawn', statusUpdatedAt: new Date() },
    });

    res.json({ application: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error('Application withdraw error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Contact release readback ────────────────────────────────────────────

/**
 * Mirror of what an employer receives after an accepted intro, so a learner
 * can always see exactly which of their details went where.
 */
router.get('/me/intros/:id/shared', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId as string;
    const profile = await getOrCreateProfile(userId);

    const intro = await prisma.introRequest.findUnique({ where: { id: req.params.id } });
    if (!intro || intro.talentProfileId !== profile.id) {
      res.status(404).json({ error: 'Intro request not found' });
      return;
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    });

    res.json({ shared: releaseContact(intro, user) });
  } catch (err) {
    console.error('Intro shared readback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
