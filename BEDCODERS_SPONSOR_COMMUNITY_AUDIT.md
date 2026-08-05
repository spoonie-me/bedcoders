# BEDCODERS SPONSOR + COMMUNITY PLATFORM AUDIT
**Date:** 2026-08-02
**Scope:** Full local audit of the current codebase against the goal of "an amazing, sponsor-based platform with a strong community component"
**Method:** Direct read of schema, routes, pages, and prior planning docs (dev brief, pricing docs, focus-group findings)

---

## EXECUTIVE SUMMARY

Bedcoders today is a **solo, subscription-funded learning product** (€12/month, Stripe `mode: subscription` only). It has zero sponsor/donor infrastructure and zero community infrastructure. The good news: the platform's own [dev brief](docs/bedcoders-dev-brief.md) already named this destination — *"Revenue: Sponsorship, merch, community (future)"* — so this is a planned pivot, not a detour. The database, auth, and content engine are solid enough to build on. What's missing is entirely new surface area: a sponsorship/giving model, and social primitives (posts, comments, groups, moderation) that don't exist in the schema at all.

The single most important constraint, already on record from the platform's own focus group (`docs/bedcoders-dev-brief.md` §6, item 7):

> **"Do not scale community before moderation infrastructure — health-adjacent unmoderated spaces cause harm."**

That should gate the whole community workstream below.

---

## PART 1 — MONETIZATION: SUBSCRIPTION, NOT SPONSORSHIP

**Current state** (`backend/src/routes/checkout.ts`, `src/pages/Pricing.tsx`, `backend/prisma/schema.prisma`):

- One Stripe flow exists: `stripe.checkout.sessions.create({ mode: 'subscription', ... })`. There is no `mode: 'payment'` path, no one-time gift/donation session, no recurring "sponsor a spoonie" pledge.
- `Subscription` model tracks `plan`, `status`, `tracksUnlocked` — built entirely around **individual paid access**, not **third-party sponsorship of someone else's access**.
- No `Sponsor`, `Donation`, `Pledge`, or `Scholarship` model anywhere in the 29-model schema.
- No concept of a sponsored seat — i.e., Person A pays so Person B (who can't afford €12/mo) gets free access. This is the core mechanic implied by "sponsor-based platform" and it doesn't exist.
- No public sponsor recognition surface (sponsor wall, badges, tiers, thank-you page).
- Landing/Pricing copy is 100% "you pay for yourself." Nothing invites a benefactor.
- Legacy docs (`MEDINFORMICS_AUDIT.md`, `PRICING_MODELS_VISUAL.txt`, `IMPLEMENTATION_CHECKLIST.md`, `CURRICULUM_*`) are about a **different, since-separated product** (Medinformics — the paid professional-certificate spin-off). They're useful context for pricing psychology but describe the wrong business model for Bedcoders' sponsor pivot; don't reuse their tier logic wholesale.

**What a sponsor model needs (none of this exists yet):**

| Gap | Detail |
|---|---|
| `Sponsor` model | who's sponsoring, tier, recurring vs one-time, public/anonymous flag |
| `SponsoredSeat` / `Scholarship` model | links a sponsor to a beneficiary user or to a general pool; tracks redemption |
| Stripe one-time + recurring "give" flow | separate from the existing subscription checkout; needs its own webhook handling in `webhooks.ts` |
| "Apply for a sponsored seat" flow | intake form + approval queue (ties into the "no shame architecture" mandate — this must not feel like a means-test) |
| Sponsor-facing dashboard | impact reporting ("your sponsorship funded 3 months for someone") without exposing beneficiary identity (privacy-critical for a chronic-illness population) |
| Public sponsor wall / thank-you page | opt-in visibility, tiered recognition |
| Webhook handling for one-time payments | `backend/src/routes/webhooks.ts` currently only reconciles subscription lifecycle events |

---

## PART 2 — COMMUNITY: DOESN'T EXIST YET

**Current state:**

Grepping the entire `src/` and `backend/src/` trees for social primitives (forum, comment, chat, group, follow, friend) turns up **nothing** except:
- `Leaderboard.tsx` — a ranked XP list, opt-in (`leaderboardOptIn`), no interaction between users, explicitly flagged in the dev brief as needing review for flare-safety.
- `ShareStory.tsx` — a one-way testimonial submission form (`POST /api/story`), moderated presumably by a human reading emails; not a community feature, just user-generated marketing content.

There is no:
- Comment or discussion thread on lessons, exercises, or profiles
- Direct messaging or any peer-to-peer contact
- Groups/circles (e.g., by track, by condition, by timezone/energy pattern)
- Follow/connection graph
- Reactions (even lightweight ones like "me too" / "this helped")
- Notification system
- **Any moderation infrastructure**: no `Report` model, no admin review queue, no rate-limiting tuned for social posting (existing rate limits are auth/API-abuse focused, not spam/harassment focused), no content flagging, no block/mute.
- Any policy artifact: no community guidelines, no crisis-response protocol, no code of conduct page in `src/pages` (legal pages exist — imprint, privacy, terms, cookies, DPA — but nothing about community conduct).

**Why this matters more than usual here:** the userbase is explicitly chronically ill / disabled / bedbound. The dev brief's own focus-group findings (§6) are direct constraints on any community design:
1. No streaks/leaderboards that punish absence — extend this principle to community: no "you haven't posted" nudges, no visible inactivity.
2. No real-name requirement — pseudonymous identity must be a first-class option in whatever profile/social schema gets built (`UserProfile.displayName` already supports this — good foundation, don't regress it).
3. No urgent re-engagement messaging.
4. Do not become a wellness app — toxic positivity is a named anti-pattern; community moderation guidelines need to explicitly rule out forced positivity language.
5. **Moderation infrastructure must precede any scaled community surface.** This isn't a nice-to-have, it's a sequencing requirement.

This last point means: shipping even a simple comment thread before a reporting/blocking/admin-review path exists would violate the platform's own documented mandate.

---

## PART 3 — TECHNICAL FOUNDATION (what's usable as-is)

Reasonably solid, low-risk to build on:

- **Auth**: JWT + bcrypt, httpOnly cookie (hardened per commit `ae17eed`), email verification, password reset — fine to extend for community identity.
- **Schema hygiene**: consistent `cuid()` ids, `onDelete: Cascade` relations, GDPR-aware fields (`gdprConsentedAt`, `dataExportRequestedAt`, `deletionRequestedAt`) already exist on `User` — a new `Sponsor`/`Post`/`Comment` model should follow this same compliance pattern from day one rather than bolting it on later.
- **AuditLog / ActivityLog / ConsentLog** models already exist — extend rather than reinvent when logging sponsor transactions or community moderation actions.
- **Accessibility groundwork**: dark mode, reduce-motion, high-contrast, font-size prefs on `User` — any new community UI must inherit these, not add a parallel settings surface.
- **Rate limiting** (`express-rate-limit`, `helmet`) exists at the API layer — needs new, separate limits for write-heavy social endpoints (posting/commenting) distinct from the current auth-focused limits.
- **Stripe integration** is real and working (not just scaffolded) for subscriptions — the sponsor/donation flow can reuse `lib/stripe.ts` and `createCustomer`, it just needs a second checkout mode and webhook branch.
- **Content pipeline** (`backend/prisma/seed-data/domains/{trackId}/`) is unrelated to community but proves the team can ship structured JSON-driven features quickly — same pattern could seed initial community guidelines/FAQ content.

---

## PART 4 — RECOMMENDED SEQUENCING

Given the "don't scale community before moderation" mandate, and that sponsorship is pure greenfield:

**Phase 1 — Sponsorship core (lower risk, no social surface area)**
1. `Sponsor`, `SponsoredSeat` schema + migration
2. One-time + recurring "give" Stripe flow, separate webhook branch
3. Sponsored-seat redemption flow (shame-free application, or auto-pooled — recommend auto-pooled to avoid means-testing UX)
4. Public sponsor thank-you page (opt-in visibility)

**Phase 2 — Moderation infrastructure (build before any social feature ships)**
1. `Report` model + admin review queue
2. Block/mute at the data layer
3. Community guidelines page + crisis-response protocol doc
4. Social-specific rate limiting

**Phase 3 — Community primitives (only after Phase 2 is live)**
1. Lightweight reactions before full comments (lower moderation surface to start)
2. Threaded comments on lessons/profiles, pseudonymous by default
3. Groups/circles scoped by track (natural, low-risk grouping — avoids condition-based grouping which raises disclosure/privacy stakes)
4. Notifications — must respect "no urgent re-engagement" mandate (batched/digest, not push-nagging)

Direct messaging and condition-based grouping are the highest-risk community features (1:1 unmoderated contact, involuntary health disclosure) — defer both past Phase 3 and revisit with the focus-group process the team already has in place (`spoonie-focus-group` skill) before building.

---

## PART 5 — OPEN QUESTIONS FOR ROI

1. Sponsorship model: should sponsors fund a **shared pool** (simpler, no beneficiary matching) or **specific individuals** (more emotionally resonant, but raises privacy/disclosure risk for beneficiaries — a sponsor knowing who they funded could feel like surveillance to a chronically ill user)?
2. Does Bedcoders' `€12/mo` subscription stay as-is alongside sponsorship, or does sponsorship replace/subsidize it for a target segment?
3. Community scope: track-based study groups only, or does this extend toward the kind of peer support Spooniversity already handles? (Dev brief explicitly says "don't merge Spooniversity and Bedcoders communities" — worth re-confirming that boundary still holds now that community is becoming a stated pillar of Bedcoders itself.)
4. Who moderates? Volunteer community moderators, staff, or AI-assisted triage (Claude) with human escalation? This determines the `Report`/review-queue design in Phase 2.

---

*This audit is descriptive, not a build spec — no code was changed. Recommend routing Phase 1/2/3 into separate PRs once the open questions above are answered, following the same pattern as the existing `IMPLEMENTATION_CHECKLIST.md`.*
