import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  employerAuthMiddleware,
  signEmployerToken,
  EMPLOYER_COOKIE_NAME,
  type EmployerRequest,
} from '../middleware/employerAuth.js';

const router = Router();

const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days — shorter than learner sessions
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 12;

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const REMOTE_POLICIES = ['remote_first', 'hybrid', 'onsite'];

function passwordIsStrongEnough(pw: string): { ok: true } | { ok: false; reason: string } {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (!/[A-Z]/.test(pw)) return { ok: false, reason: 'Password must contain an uppercase letter' };
  if (!/[0-9]/.test(pw)) return { ok: false, reason: 'Password must contain a number' };
  return { ok: true };
}

function setEmployerCookie(res: import('express').Response, token: string) {
  res.cookie(EMPLOYER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: JWT_EXPIRY_SECONDS * 1000,
    path: '/',
  });
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'company'
  );
}

async function uniqueCompanySlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await prisma.company.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function publicEmployer(account: {
  id: string;
  email: string;
  name: string;
  jobTitle: string | null;
  role: string;
  companyId: string | null;
}) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    jobTitle: account.jobTitle,
    role: account.role,
    companyId: account.companyId,
  };
}

function publicCompany(company: {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  size: string | null;
  location: string | null;
  remotePolicy: string | null;
  asyncFriendly: boolean;
  flexibleHours: boolean;
  partTimeOpen: boolean;
  accommodationsStatement: string | null;
  verifiedAt: Date | null;
}) {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    websiteUrl: company.websiteUrl,
    logoUrl: company.logoUrl,
    description: company.description,
    size: company.size,
    location: company.location,
    remotePolicy: company.remotePolicy,
    asyncFriendly: company.asyncFriendly,
    flexibleHours: company.flexibleHours,
    partTimeOpen: company.partTimeOpen,
    accommodationsStatement: company.accommodationsStatement,
    isVerified: company.verifiedAt !== null,
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, name, jobTitle } = req.body ?? {};

    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'A valid work email is required' });
      return;
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Your name is required' });
      return;
    }
    const strength = passwordIsStrongEnough(password);
    if (!strength.ok) {
      res.status(400).json({ error: strength.reason });
      return;
    }

    const normalisedEmail = email.trim().toLowerCase();
    const existing = await prisma.employerAccount.findUnique({ where: { email: normalisedEmail } });
    if (existing) {
      // Same generic message as a bad password on login — an employer signup
      // form should not confirm which addresses already have accounts.
      res.status(409).json({ error: 'Could not create account with those details' });
      return;
    }

    const account = await prisma.employerAccount.create({
      data: {
        email: normalisedEmail,
        name: name.trim().slice(0, 100),
        jobTitle: typeof jobTitle === 'string' ? jobTitle.trim().slice(0, 100) : null,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      },
    });

    const token = signEmployerToken({ employerId: account.id, companyId: null }, JWT_EXPIRY_SECONDS);
    setEmployerCookie(res, token);
    res.status(201).json({ token, employer: publicEmployer(account), company: null });
  } catch (err) {
    console.error('Employer signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const account = await prisma.employerAccount.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { company: true },
    });

    // Constant-ish work whether or not the account exists.
    const hash = account?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    const valid = await bcrypt.compare(password, hash);

    if (!account || !valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    await prisma.employerAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signEmployerToken(
      { employerId: account.id, companyId: account.companyId },
      JWT_EXPIRY_SECONDS,
    );
    setEmployerCookie(res, token);
    res.json({
      token,
      employer: publicEmployer(account),
      company: account.company ? publicCompany(account.company) : null,
    });
  } catch (err) {
    console.error('Employer login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(EMPLOYER_COOKIE_NAME, { path: '/' });
  res.json({ success: true });
});

router.get('/me', employerAuthMiddleware, async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    const account = await prisma.employerAccount.findUnique({
      where: { id: employerReq.employerId },
      include: { company: true },
    });
    if (!account) {
      res.status(401).json({ error: 'Account not found' });
      return;
    }
    res.json({
      employer: publicEmployer(account),
      company: account.company ? publicCompany(account.company) : null,
    });
  } catch (err) {
    console.error('Employer me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Company profile ─────────────────────────────────────────────────────

function readCompanyFields(body: Record<string, unknown>) {
  const str = (v: unknown, max: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

  return {
    websiteUrl: (() => {
      const url = str(body.websiteUrl, 200);
      return url && /^https?:\/\//i.test(url) ? url : null;
    })(),
    logoUrl: (() => {
      const url = str(body.logoUrl, 300);
      return url && /^https?:\/\//i.test(url) ? url : null;
    })(),
    description: str(body.description, 2000),
    size: COMPANY_SIZES.includes(body.size as string) ? (body.size as string) : null,
    location: str(body.location, 120),
    remotePolicy: REMOTE_POLICIES.includes(body.remotePolicy as string)
      ? (body.remotePolicy as string)
      : null,
    asyncFriendly: body.asyncFriendly === true,
    flexibleHours: body.flexibleHours === true,
    partTimeOpen: body.partTimeOpen === true,
    accommodationsStatement: str(body.accommodationsStatement, 1000),
  };
}

router.post('/company', employerAuthMiddleware, async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    if (employerReq.employerCompanyId) {
      res.status(409).json({ error: 'This account already belongs to a company' });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2) {
      res.status(400).json({ error: 'Company name is required' });
      return;
    }

    const company = await prisma.company.create({
      data: {
        name: name.slice(0, 120),
        slug: await uniqueCompanySlug(name),
        ...readCompanyFields(req.body ?? {}),
      },
    });

    await prisma.employerAccount.update({
      where: { id: employerReq.employerId },
      data: { companyId: company.id, role: 'owner' },
    });

    // The company id is carried in the token, so it has to be reissued here
    // or `requireCompany` keeps rejecting until the session expires.
    const token = signEmployerToken(
      { employerId: employerReq.employerId as string, companyId: company.id },
      JWT_EXPIRY_SECONDS,
    );
    setEmployerCookie(res, token);

    res.status(201).json({ token, company: publicCompany(company) });
  } catch (err) {
    console.error('Company create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/company', employerAuthMiddleware, async (req, res) => {
  try {
    const employerReq = req as EmployerRequest;
    if (!employerReq.employerCompanyId) {
      res.status(404).json({ error: 'No company on this account' });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const company = await prisma.company.update({
      where: { id: employerReq.employerCompanyId },
      data: {
        ...(name.length >= 2 ? { name: name.slice(0, 120) } : {}),
        ...readCompanyFields(req.body ?? {}),
      },
    });

    res.json({ company: publicCompany(company) });
  } catch (err) {
    console.error('Company update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** Public company page — what a learner sees before engaging with a job or intro. */
router.get('/company/:slug', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { slug: req.params.slug },
      include: {
        jobs: {
          where: { status: 'published' },
          orderBy: { publishedAt: 'desc' },
          select: { id: true, title: true, employmentType: true, isRemote: true, publishedAt: true },
        },
      },
    });
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json({ company: publicCompany(company), jobs: company.jobs });
  } catch (err) {
    console.error('Company get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
