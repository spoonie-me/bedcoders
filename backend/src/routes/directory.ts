import { Router } from 'express';
import { prisma } from '../lib/db.js';
import {
  employerAuthMiddleware,
  requireCompany,
  type EmployerRequest,
} from '../middleware/employerAuth.js';
import {
  toDirectoryCard,
  toEmployerView,
  releaseContact,
  normaliseSkillKey,
  type TalentViewInput,
} from '../lib/talentVisibility.js';

const router = Router();

// Every route here is employer-only and company-backed. A learner token is
// rejected by employerAuthMiddleware (wrong audience, wrong claim), and an
// employer without a company profile cannot reach learners at all.
router.use(employerAuthMiddleware, requireCompany);

const PAGE_SIZE = 20;
const INTRO_EXPIRY_DAYS = 14;

/**
 * Only profiles that opted in are ever loaded. This `where` clause is the
 * database-level half of the promise; `toDirectoryCard` is the projection
 * half. Both are required — neither is trusted alone.
 */
const DISCOVERABLE_ONLY = { isDiscoverable: true } as const;

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

const talentInclude = {
  user: {
    select: {
      name: true,
      timeZone: true,
      profile: { select: { country: true, displayName: true } },
    },
  },
  projects: { orderBy: { order: 'asc' } },
} as const;

/**
 * Certificates and mastery are fetched per-user rather than joined through
 * TalentProfile, because they hang off User. Batched to avoid N+1 across a
 * page of results.
 */
async function attachCredentials(
  profiles: Array<{ id: string; userId: string }>,
): Promise<{
  certsByUser: Map<string, TalentViewInput['certificates']>;
  masteryByUser: Map<string, TalentViewInput['mastery']>;
}> {
  const userIds = profiles.map((p) => p.userId);
  const [certificates, mastery] = await Promise.all([
    prisma.certificate.findMany({ where: { userId: { in: userIds } } }),
    prisma.domainMastery.findMany({
      where: { userId: { in: userIds } },
      include: { domain: { select: { name: true } } },
    }),
  ]);

  const certsByUser = new Map<string, TalentViewInput['certificates']>();
  for (const c of certificates) {
    const list = certsByUser.get(c.userId) ?? [];
    list.push(c);
    certsByUser.set(c.userId, list);
  }

  const masteryByUser = new Map<string, TalentViewInput['mastery']>();
  for (const m of mastery) {
    const list = masteryByUser.get(m.userId) ?? [];
    list.push({
      domainId: m.domainId,
      domainName: m.domain.name,
      stars: m.stars,
      isMastered: m.isMastered,
    });
    masteryByUser.set(m.userId, list);
  }

  return { certsByUser, masteryByUser };
}

/** Aggregate-only, fire-and-forget: which skills employers are asking for. */
async function recordSkillDemand(skills: string[], field: 'searchCount' | 'postedCount') {
  await Promise.all(
    skills.slice(0, 12).map((skillKey) =>
      prisma.skillDemandSignal.upsert({
        where: { skillKey },
        create: { skillKey, [field]: 1 },
        update: { [field]: { increment: 1 } },
      }),
    ),
  );
}

// ─── Search ──────────────────────────────────────────────────────────────

router.get('/talent', async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;

    const skillFilters = (q.skills ?? '')
      .split(',')
      .map((s) => normaliseSkillKey(s))
      .filter(Boolean)
      .slice(0, 12);

    const page = Math.max(1, Number(q.page) || 1);

    // Work-shape filters map to what the learner asked for. Note there is no
    // filter for anything health-adjacent, because no such field exists.
    const where = {
      ...DISCOVERABLE_ONLY,
      ...(q.openToWork === 'true' ? { openToWork: true } : {}),
      ...(q.remote === 'true' ? { wantsRemote: true } : {}),
      ...(q.async === 'true' ? { wantsAsync: true } : {}),
      ...(q.partTime === 'true' ? { wantsPartTime: true } : {}),
      ...(q.flexHours === 'true' ? { wantsFlexHours: true } : {}),
      ...(q.contract === 'true' ? { wantsContract: true } : {}),
      ...(Number(q.maxHours)
        ? { hoursPerWeekMin: { lte: Math.min(Number(q.maxHours), 60) } }
        : {}),
    };

    const [total, profiles] = await Promise.all([
      prisma.talentProfile.count({ where }),
      prisma.talentProfile.findMany({
        where,
        include: talentInclude,
        orderBy: { discoverableAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    const { certsByUser, masteryByUser } = await attachCredentials(profiles);

    let cards = profiles
      .map((p) =>
        toDirectoryCard({
          profile: p,
          user: p.user,
          projects: p.projects,
          certificates: certsByUser.get(p.userId) ?? [],
          mastery: masteryByUser.get(p.userId) ?? [],
        }),
      )
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Skill matching runs after projection, deliberately: the searchable
    // skill set is derived from what is *visible*, so a hidden portfolio
    // cannot be used as a search oracle to infer its contents.
    if (skillFilters.length > 0) {
      cards = cards.filter((c) => skillFilters.every((s) => c.skills.includes(s)));
      recordSkillDemand(skillFilters, 'searchCount').catch(() => {});
    }

    res.json({
      results: cards,
      page,
      pageSize: PAGE_SIZE,
      // `total` counts the pre-skill-filter set; the skill pass runs in
      // application space, so it is a ceiling, not an exact count.
      totalBeforeSkillFilter: total,
      hasMore: page * PAGE_SIZE < total,
    });
  } catch (err) {
    console.error('Directory search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Single profile ──────────────────────────────────────────────────────

router.get('/talent/:handle', async (req, res) => {
  try {
    const profile = await prisma.talentProfile.findUnique({
      where: { publicHandle: req.params.handle },
      include: talentInclude,
    });

    // 404 rather than 403 for a non-discoverable profile: an employer must
    // not be able to use this endpoint to confirm someone is on the platform.
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const { certsByUser, masteryByUser } = await attachCredentials([profile]);
    const view = toEmployerView({
      profile,
      user: profile.user,
      projects: profile.projects,
      certificates: certsByUser.get(profile.userId) ?? [],
      mastery: masteryByUser.get(profile.userId) ?? [],
    });

    if (!view) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Contact details appear here only if this employer's company already
    // has an accepted intro with this learner.
    const employerReq = req as EmployerRequest;
    const accepted = await prisma.introRequest.findFirst({
      where: {
        talentProfileId: profile.id,
        companyId: employerReq.employerCompanyId as string,
        status: 'accepted',
      },
      orderBy: { respondedAt: 'desc' },
    });

    let contact = null;
    if (accepted) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: profile.userId },
        select: { name: true, email: true },
      });
      contact = releaseContact(accepted, user);
    }

    const pendingIntro = await prisma.introRequest.findFirst({
      where: {
        talentProfileId: profile.id,
        companyId: employerReq.employerCompanyId as string,
        status: 'pending',
      },
    });

    res.json({
      talent: view,
      contact,
      introStatus: accepted ? 'accepted' : pendingIntro ? 'pending' : null,
    });
  } catch (err) {
    console.error('Directory profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Intro requests (employer side) ──────────────────────────────────────

router.post('/talent/:handle/intro', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const companyId = employerReq.employerCompanyId as string;

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (message.length < 40) {
      // A one-line "hi, interested?" costs the sender nothing and costs the
      // recipient a decision. The floor is a small tax on the cheap version.
      res.status(400).json({
        error: 'Tell them about the role and why you are reaching out (at least 40 characters)',
      });
      return;
    }

    const profile = await prisma.talentProfile.findUnique({
      where: { publicHandle: req.params.handle },
    });
    if (!profile || !profile.isDiscoverable) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const existingPending = await prisma.introRequest.findFirst({
      where: { talentProfileId: profile.id, companyId, status: 'pending' },
    });
    if (existingPending) {
      res.status(409).json({ error: 'You already have a pending request with this person' });
      return;
    }

    // Declines are final for this company. Without this, "no" is just a
    // pause button and the inbox becomes something to dread.
    const previousDecline = await prisma.introRequest.findFirst({
      where: { talentProfileId: profile.id, companyId, status: 'declined' },
    });
    if (previousDecline) {
      res.status(409).json({ error: 'This person declined a previous request from your company' });
      return;
    }

    let jobPostingId: string | null = null;
    if (typeof req.body?.jobPostingId === 'string') {
      const job = await prisma.jobPosting.findUnique({ where: { id: req.body.jobPostingId } });
      if (job && job.companyId === companyId) jobPostingId = job.id;
    }

    const expiresAt = new Date(Date.now() + INTRO_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const intro = await prisma.introRequest.create({
      data: {
        companyId,
        employerAccountId: employerReq.employerId as string,
        talentProfileId: profile.id,
        jobPostingId,
        message: message.slice(0, 2000),
        expiresAt,
      },
    });

    res.status(201).json({
      intro: { id: intro.id, status: intro.status, expiresAt: intro.expiresAt },
    });
  } catch (err) {
    console.error('Intro create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/intros', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const intros = await prisma.introRequest.findMany({
      where: { companyId: employerReq.employerCompanyId as string },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        talentProfile: { select: { publicHandle: true, headline: true } },
        jobPosting: { select: { id: true, title: true } },
      },
    });

    const now = Date.now();
    res.json({
      intros: intros.map((i) => ({
        id: i.id,
        status: i.status === 'pending' && i.expiresAt.getTime() < now ? 'expired' : i.status,
        message: i.message,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        respondedAt: i.respondedAt,
        job: i.jobPosting,
        // Handle and headline only. A pending or declined request never
        // carries a name or an email.
        talent: {
          handle: i.talentProfile.publicHandle,
          headline: i.talentProfile.headline,
        },
      })),
    });
  } catch (err) {
    console.error('Employer intro list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/intros/:id/withdraw', async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const intro = await prisma.introRequest.findUnique({ where: { id: req.params.id } });

    if (!intro || intro.companyId !== employerReq.employerCompanyId) {
      res.status(404).json({ error: 'Intro request not found' });
      return;
    }
    if (intro.status !== 'pending') {
      res.status(409).json({ error: 'Only pending requests can be withdrawn' });
      return;
    }

    await prisma.introRequest.update({
      where: { id: intro.id },
      data: { status: 'withdrawn', respondedAt: new Date() },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Intro withdraw error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Skill demand (shared back to curriculum planning) ───────────────────

router.get('/skill-demand', async (_req, res) => {
  try {
    const signals = await prisma.skillDemandSignal.findMany({
      orderBy: [{ searchCount: 'desc' }, { postedCount: 'desc' }],
      take: 50,
    });
    res.json({ signals });
  } catch (err) {
    console.error('Skill demand error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { recordSkillDemand, parseJsonArray };
export default router;
