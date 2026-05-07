// @ts-nocheck
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/db.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../lib/email.js';
import { logAuditAction } from '../lib/compliance.js';
import { authLimiter, tokenLimiter } from '../middleware/rateLimit.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Set it in .env or Vercel env vars.');
}
const JWT_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, name, gdprConsent, marketingConsent } = req.body;

    if (!email || !password || !gdprConsent) {
      res.status(400).json({ error: 'Email, password, and GDPR consent are required' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        emailVerificationToken: verificationToken,
        gdprConsentedAt: new Date(),
        gdprConsentVersion: '1.0',
        marketingOptIn: marketingConsent ?? false,
      },
    });

    // Create gamification record
    await prisma.gamification.create({
      data: { userId: user.id },
    });

    // Auto-enroll in free tier with fundamentals track
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'active',
        tracksUnlocked: JSON.stringify(['fundamentals']),
      },
    });

    // Log consent
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        consentType: 'gdpr',
        consentStatus: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    await logAuditAction(user.id, 'SIGNUP', undefined, req);

    // Send verification + welcome emails (non-blocking)
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch {
      // Non-blocking — user can resend later
    }
    try {
      await sendWelcomeEmail(email, name);
    } catch {
      // Non-blocking — welcome email is supplementary
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY_SECONDS });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, emailVerified: false },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logAuditAction(user.id, 'LOGIN_FAILED', undefined, req);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAuditAction(user.id, 'LOGIN', undefined, req);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY_SECONDS });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-email', tokenLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid verification token' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId },
      select: {
        id: true, email: true, name: true, emailVerified: true,
        darkMode: true, language: true, fontSize: true,
        reduceMotion: true, highContrast: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Password Reset ─────────────────────────────────────────────────────

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      // Always return 200 to prevent email enumeration
      res.json({ success: true });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ success: true });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetAt: new Date() },
    });

    // Send password reset email (falls back to console.log if RESEND_API_KEY not set)
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch {
      console.error(`Failed to send password reset email to ${email}`);
    }

    await logAuditAction(user.id, 'PASSWORD_RESET_REQUEST', undefined, req);
    res.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.json({ success: true }); // Never leak errors
  }
});

router.post('/reset-password', tokenLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Token and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetAt) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Token expires after 1 hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.passwordResetAt < hourAgo) {
      res.status(400).json({ error: 'Reset token has expired' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetAt: null },
    });

    await logAuditAction(user.id, 'PASSWORD_RESET', undefined, req);
    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Change Password (authenticated) ───────────────────────────────────

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new passwords are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: authReq.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logAuditAction(user.id, 'PASSWORD_CHANGE', undefined, req);
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Profile ────────────────────────────────────────────────────────────

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const user = await prisma.user.findUnique({
      where: { id: authReq.userId },
      select: {
        darkMode: true, language: true, fontSize: true,
        reduceMotion: true, highContrast: true, leaderboardOptIn: true,
        profile: { select: { displayName: true, bio: true, country: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      profile: user.profile ?? { displayName: null, bio: null, country: null },
      preferences: {
        darkMode: user.darkMode,
        language: user.language,
        reduceMotion: user.reduceMotion,
        highContrast: user.highContrast,
        fontSize: user.fontSize,
        leaderboardOptIn: user.leaderboardOptIn,
      },
    });
  } catch (err) {
    console.error('Profile get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { profile } = req.body;

    if (!profile) {
      res.status(400).json({ error: 'Profile data is required' });
      return;
    }

    await prisma.userProfile.upsert({
      where: { userId: authReq.userId! },
      create: {
        userId: authReq.userId!,
        displayName: profile.displayName ?? null,
        bio: profile.bio ?? null,
        country: profile.country ?? null,
      },
      update: {
        displayName: profile.displayName ?? null,
        bio: profile.bio ?? null,
        country: profile.country ?? null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { preferences } = req.body;

    if (!preferences) {
      res.status(400).json({ error: 'Preferences data is required' });
      return;
    }

    await prisma.user.update({
      where: { id: authReq.userId },
      data: {
        darkMode: preferences.darkMode ?? true,
        language: preferences.language ?? 'en',
        reduceMotion: preferences.reduceMotion ?? false,
        highContrast: preferences.highContrast ?? false,
        fontSize: preferences.fontSize ?? 'medium',
        leaderboardOptIn: preferences.leaderboardOptIn ?? false,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Preferences update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GDPR Data Subject Rights ───────────────────────────────────────────

router.post('/data-export', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    await prisma.user.update({
      where: { id: authReq.userId },
      data: { dataExportRequestedAt: new Date() },
    });
    await logAuditAction(authReq.userId!, 'DATA_EXPORT_REQUEST', undefined, req);
    res.json({ success: true });
  } catch (err) {
    console.error('Data export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/request-deletion', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await prisma.user.update({
      where: { id: authReq.userId },
      data: { deletionRequestedAt: new Date(), deletionScheduledAt: deletionDate },
    });
    await logAuditAction(authReq.userId!, 'DELETION_REQUEST', undefined, req);
    res.json({ success: true, scheduledAt: deletionDate.toISOString() });
  } catch (err) {
    console.error('Deletion request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
