# Bedcoders Dev Brief

**Date:** 19 March 2026
**Author:** Claude (for Roi Shternin)
**Status:** Ready for implementation
**Repository:** https://github.com/spoonie-me/bedcoders.git
**Codebase:** `/Users/roi/Downloads/Roi Site/bedcoders/`

---

## 1. Brand Architecture (Board-Approved)

**Medinformics = Product. Bedcoders = Movement.** (Unanimous 14-0 board vote)

| Dimension | Medinformics | Bedcoders |
|-----------|-------------|-----------|
| **What** | Professional education platform | Community, blog, podcast, advocacy |
| **Domain** | medinformics.com | bedcoders.com / bedcoders.org |
| **Credential** | "Medinformics Certificate in Health Informatics" | None — it's a story, not a credential |
| **Audience** | Career changers, bedridden/chronically ill learners | Anyone who resonates with the origin story |
| **Revenue** | Course fees, subscriptions, employer seats | Sponsorship, merch, community (future) |
| **Relationship to Spooniversity** | Separate platform, opt-in cross-link, shared SSO | Separate community, no overlap |

**Key rules:**
- Credentials say "Medinformics" only — no patient branding on CVs
- Design for variable energy (90-min blocks, pause-anywhere, flare-friendly) but don't label it as disability-specific (OXO model)
- Don't hide the Bedcoders origin story — it's the best marketing asset
- Don't merge Spooniversity and Bedcoders communities — different audiences (~15% overlap)

---

## 2. Current Technical State

### Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 8, TS 5.9 |
| Routing | react-router-dom | 7.13 |
| Backend | Express + TypeScript | Express 4, TS 5.6 |
| Database | PostgreSQL via Prisma | Prisma 6.19 |
| Auth | JWT (30-day, localStorage `bc_token`) | jsonwebtoken 9 |
| Payments | Stripe (EUR) | stripe 17–20 |
| AI Feedback | Anthropic Claude | claude-sonnet-4-5-20250514 |
| Email | Resend | resend 4–6 |
| PDF Certs | pdf-lib | 1.17 |
| Analytics | PostHog (EU) | — |
| Security | Helmet, CORS, express-rate-limit | — |
| Deploy | Vercel (SPA + serverless) | @vercel/node 5.6 |

### Architecture
```
bedcoders/
├── src/                    # React SPA (Vite)
│   ├── pages/              # 27 page components
│   ├── components/         # 32 shared components
│   └── lib/                # AuthContext, API client
├── backend/
│   ├── src/
│   │   ├── routes/         # 16 Express route files
│   │   ├── middleware/      # auth, entitlements, audit
│   │   └── lib/            # stripe, email helpers
│   └── prisma/
│       ├── schema.prisma   # 22 models
│       └── seed.ts         # JSON-based seed (badges, domains, modules, exercises)
├── api/index.ts            # Vercel serverless entry point
├── vercel.json             # Rewrites: /api/* → serverless, /* → SPA
└── .env.example            # 36 env vars
```

### Database Models (22)

**Users & Auth:** User, UserProfile, Subscription, AuditLog, ConsentLog
**Learning:** CompetencyDomain, Module, Lesson, Exercise, Submission, LessonProgress, DomainMastery
**Assessment:** ModuleAssessment, AssessmentAttempt, TrackExam, ExamAttempt, Certificate
**Gamification:** Gamification (XP/level/streak), Badge, UserBadge, Challenge, UserChallenge
**Compliance:** ActivityLog, DataDeletionRequest, DataExportRequest

### Content Structure
```
4 Tracks → Domains → Modules → Lessons → Exercises
   │
   ├── fundamentals (Health Informatics)  ← SEEDED, LIVE
   ├── ai (Health AI)                     ← PLANNED, NO CONTENT
   ├── genomics (Genomics)                ← PLANNED, NO CONTENT
   └── datascience (Data Science)         ← PLANNED, NO CONTENT
```

### Pages (27 routes)
| Category | Routes |
|----------|--------|
| Public | `/`, `/pricing`, `/login`, `/signup`, `/welcome`, `/for-teams`, `/share-story` |
| Learning | `/dashboard`, `/track/:id`, `/module/:id`, `/lesson/:id` |
| Assessment | `/assessment/:moduleId`, `/exam/:trackId`, `/certificate/:id`, `/leaderboard/:id` |
| Account | `/settings`, `/signup-success`, `/forgot-password`, `/reset-password` |
| Legal | `/imprint`, `/privacy`, `/terms`, `/cookies`, `/dpa` |
| Other | `*` (404) |

### API Endpoints (16 route files)
Auth, lessons, progress, feedback (AI), compliance, tracks, domains, modules, exercises, assessments, exams, certificates, gamification, checkout, story, webhooks + health check.

### Deployment
- **Vercel project:** `spoonie-mes-projects/bedcoders`
- **Domain:** medinformics.com (pending DNS)
- **Serverless:** Express wrapped in Vercel function (30s timeout)
- **Stripe:** Test mode, Price IDs not yet created in Dashboard

---

## 3. What Works Today

| Feature | Status | Notes |
|---------|--------|-------|
| User registration + login | ✅ Working | JWT auth, email verification, password reset |
| Health Informatics track | ✅ Seeded | Domains, modules, lessons, exercises via JSON seed |
| Lesson viewer | ✅ Working | Content sections, knowledge checks, progress tracking |
| Exercise system | ✅ Working | Multiple choice, open-ended, matching, ordering, case study |
| AI feedback | ✅ Working | Claude generates feedback on open-ended submissions |
| Module assessments | ✅ Working | Random 10 questions, 80% pass, unlimited retakes |
| Track exams | ✅ Working | 50 random questions, 75% pass, generates certificate |
| Certificates | ✅ Working | PDF generation, public verification code |
| Gamification | ✅ Working | XP, levels, streaks, badges, challenges, leaderboard |
| GDPR compliance | ✅ Working | Consent gate, audit log, data export, data deletion |
| Stripe checkout | ✅ Scaffolded | Code exists, needs Price IDs + env vars |
| Legal pages | ✅ Complete | Imprint, privacy, terms, cookies, DPA (Austrian law) |
| Dark mode | ✅ Working | User preference stored |
| Accessibility prefs | ✅ Working | High contrast, font size, reduce motion |
| Rate limiting | ✅ Working | 100 req/15min per IP, stricter on auth |

---

## 4. What Needs Building

### P0 — Launch Blockers (do these first)

| Task | Effort | Detail |
|------|--------|--------|
| **Create Stripe Products & Prices** | 1 hr | In Stripe Dashboard: monthly €29, annual €299, single track €199, per-course €49. Copy Price IDs to env vars. |
| **Set Stripe env vars on Vercel** | 15 min | STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, all STRIPE_PRICE_ID_* |
| **Configure production domain** | 30 min | Point medinformics.com to Vercel. Set CORS_ORIGIN, APP_URL, FRONTEND_URL env vars. |
| **Set up production database** | 1 hr | Supabase or Neon PostgreSQL. Run Prisma migrate. Run seed. Set DATABASE_URL on Vercel. |
| **Remove dev auth bypass** | 15 min | AuthContext.tsx has `token === 'dev'` → DEV_USER bypass. Remove or gate behind NODE_ENV. |
| **Fix CORS for production** | 15 min | Currently hardcoded `http://localhost:5173`. Use env var for production origin. |
| **Set up Resend domain** | 30 min | Verify medinformics.com domain in Resend. Set RESEND_API_KEY, RESEND_FROM_EMAIL. |
| **Configure PostHog** | 15 min | Set POSTHOG_API_KEY on Vercel. |

### P1 — First Month

| Task | Effort | Detail |
|------|--------|--------|
| **Pricing page overhaul** | 4 hrs | See `IMPLEMENTATION_CHECKLIST.md`. Simplify to 4 tiers (free, monthly, annual, single track). Remove "coming soon" cards. |
| **Stripe webhook production** | 2 hrs | Register webhook endpoint in Stripe Dashboard. Test subscription lifecycle (create, renew, cancel, fail). |
| **Student discount flow** | 1 hr | Auto-apply Stripe coupon for .edu/.ac.uk emails (already scaffolded in checkout code). |
| **Landing page cleanup** | 2 hrs | Remove 3 "coming soon" track cards. Update copy: "One complete track, ready now." |
| **Re-engagement emails** | 3 hrs | 14-day inactive → warm email. 30-day → pause acknowledgment. 90-day → check-in. All pressureless (focus group mandate). |
| **"Where you left off" dashboard** | 2 hrs | On login: "Last time you were here, you were on [lesson]. Resume?" |
| **Mobile responsiveness audit** | 2 hrs | Pricing cards, lesson viewer, assessment flow on 390px. |

### P2 — Second Month

| Task | Effort | Detail |
|------|--------|--------|
| **Audio lessons** | 8 hrs | Focus group #1 priority (19/27 votes). Brain fog is the top barrier. TTS or recorded. Player with speed control, bookmark, resume. |
| **Portfolio/public profile** | 4 hrs | Certificates, completed tracks, badges. Shareable URL. Export as PDF. |
| **Track 2 content: Health AI** | 20+ hrs | Domains, modules, lessons, exercises. Seed data. Assessment questions. Exam. |
| **For Teams page + flow** | 4 hrs | Bulk enrolment, seat management, invoice. €99/seat/year for 5+ seats. |
| **Subscription management** | 3 hrs | "Manage plan" page: upgrade, downgrade, cancel, view invoices. Stripe Customer Portal integration. |

### P3 — Quarter 2

| Task | Effort | Detail |
|------|--------|--------|
| **Track 3 content: Genomics** | 20+ hrs | Full content pipeline |
| **Track 4 content: Data Science** | 20+ hrs | Full content pipeline |
| **Bedcoders.com (movement site)** | 8 hrs | Blog, podcast, origin story, community links. Separate Vercel project. |
| **SSO between Spooniversity + Medinformics** | 6 hrs | Shared auth (Better Auth or custom). Opt-in cross-link. |
| **Employer dashboard** | 12 hrs | Track team progress, credential verification, bulk purchase. |
| **Certification marketplace** | 8 hrs | Public credential verification. Employer search. |

---

## 5. Pricing Model (Board-Approved)

| Tier | Price | Type | Access |
|------|-------|------|--------|
| **Explorer** | Free | — | First module of any track |
| **Per Course** | €49 | One-time | 1 course, lifetime |
| **Single Track** | €199 | One-time | 1 track, lifetime |
| **Monthly Pro** | €29/mo | Subscription | All tracks |
| **Annual Pro** | €299/yr | Subscription | All tracks, save 14% |
| **Team Seat** | €99/seat/yr | Subscription | All tracks, 5+ seats |
| **Student** | 40% off | Coupon | Auto-apply for .edu/.ac.uk |

**Key decision:** Remove "Two Tracks" tier (annual is always better). Move team pricing to separate page.

---

## 6. Focus Group Warnings (Do Not Violate)

These came from a 27-person virtual focus group of chronically ill and disabled learners:

1. **No streaks, daily challenges, or leaderboards that punish absence** — flare days are not laziness. The gamification system exists but leaderboard is opt-in (good). Review challenge system for flare-safety.
2. **No real-name requirement** — health identity ≠ professional identity. Keep anonymous posting option.
3. **No urgent re-engagement emails** — "You haven't logged in!" is cruel to someone in hospital. All emails must be pressureless.
4. **Do not overclaim the credential** — it's professional development, not a degree. But don't underclaim either.
5. **Do not become a wellness app** — no pastel motivation graphics, no toxic positivity. Trust comes from NOT performing positivity.
6. **Differentiate Fellow-equivalent (advanced) content substantially** — or lower the price. Same experience at higher price = credibility damage.
7. **Do not scale community before moderation infrastructure** — health-adjacent unmoderated spaces cause harm.

---

## 7. Environment Variables Checklist

```bash
# Database
DATABASE_URL=               # Production PostgreSQL connection string

# Auth
JWT_SECRET=                 # Strong random secret (NOT the dev default)
JWT_EXPIRY=30d

# Stripe (create in Stripe Dashboard first)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY_PRO=price_...
STRIPE_PRICE_ID_ANNUAL_PRO=price_...
STRIPE_PRICE_ID_SINGLE_TRACK=price_...
STRIPE_PRICE_ID_PER_COURSE=price_...
STRIPE_PRICE_ID_TEAM_SEAT=price_...
STRIPE_COUPON_ID_STUDENT=...

# AI Feedback
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250514

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@medinformics.com
RESEND_FROM_NAME=Medinformics

# Analytics
POSTHOG_API_KEY=phc_...
POSTHOG_API_URL=https://eu.posthog.com

# App
NODE_ENV=production
FRONTEND_URL=https://medinformics.com
BACKEND_URL=https://medinformics.com
APP_URL=https://medinformics.com
CORS_ORIGIN=https://medinformics.com
```

---

## 8. Relationship to Spooniversity

| Aspect | Decision |
|--------|----------|
| Shared codebase | No — separate repos, separate Vercel projects |
| Shared auth | Yes — SSO (P3, not launch blocker) |
| Shared community | No — different audiences, different needs |
| Shared pricing page | No — different buyer journeys |
| Cross-promotion | Yes — opt-in. Spooniversity recommends Medinformics after Foundation completion |
| Shared Stripe | No — separate Stripe products |
| Learner identity | Spooniversity: "patient becoming professional." Medinformics: "professional who is ill." |

---

## 9. Immediate Action Items (This Week)

1. **Create Stripe products + prices** in Dashboard (1 hr)
2. **Set all env vars on Vercel** — Stripe, Resend, PostHog, JWT_SECRET, DATABASE_URL (30 min)
3. **Provision production database** — Supabase or Neon, run migrations + seed (1 hr)
4. **Point medinformics.com to Vercel** — A record or CNAME (15 min)
5. **Remove dev auth bypass** from AuthContext.tsx (15 min)
6. **Fix CORS** to use env var instead of hardcoded localhost (15 min)
7. **Test end-to-end** — signup, lesson, assessment, exam, certificate, checkout (2 hrs)

**Total estimated launch effort: ~6 hours of focused work.**

---

## 10. Content Roadmap

| Track | Status | Content Source | Est. Effort |
|-------|--------|---------------|-------------|
| Health Informatics Fundamentals | ✅ Seeded | JSON seed data | Done |
| Health AI | 📝 Planned | Needs authoring | 20+ hrs |
| Genomics | 📝 Planned | Needs authoring | 20+ hrs |
| Data Science | 📝 Planned | Needs authoring | 20+ hrs |

Each track needs: domains → modules → lessons (with content sections, learning objectives) → exercises (with hints, rubrics, XP) → assessment questions → exam questions → certificate template.

The seed system uses JSON files at `backend/prisma/seed-data/domains/{trackId}/`. To add a new track: create the directory structure, add `domains.json` + exercise files, run `npx tsx prisma/seed.ts`.

---

*This brief reflects board decisions from 19 March 2026. Medinformics is the product. Bedcoders is the movement. Build one, tell the story of the other.*
