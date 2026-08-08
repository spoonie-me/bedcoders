# Soft Reset School — Business Model

*Last updated: 2026-08-04. This is the operating document for how this project makes money
without betraying the people it serves. If a pricing decision contradicts this doc, update
the doc first — deliberately — or don't make the change.*

## Mission (what the money is for)

People coming back from serious illness don't need another course platform. They need
**purpose, direction, and a credible route back to income** — retraining that works at the
pace their body actually allows. Soft Reset School exists to turn "I can't work anymore"
into "I work differently now." Revenue is how this mission survives; it is not the mission.

## The one-sentence model

**All learning is free forever; we sell the proof.** A learner pays once — €69 — only at
the moment they're ready to certify, and the thing they buy (a permanent, publicly
verifiable credential) is precisely the thing an employer needs to trust them.

## Who pays, and why it's worth it to them

| Customer | What they buy | Why they buy it |
|---|---|---|
| **Learners** | Track Credential €69 · Program Credential (any 3 tracks) €149 · Human code review €25 | Proof of an employable skill, earned at their own pace, that never expires and never re-bills |
| **Employers** | Credential vouchers (flat €69/track) · Accessibility compliance audits (scoped) · Hire-train-place (scoped) | EAA/WCAG compliance they legally need; verified, uniquely qualified talent; the cheapest return-to-work instrument they'll ever buy |
| **Nonprofits & vocational-rehab agencies** | Pre-paid voucher blocks at the same flat €69 | A concrete, outcome-shaped line item: "we funded N certifications," verifiable by anyone |

## Why no subscription (a values decision, already made — don't reopen it)

A recurring charge bills a fixed clock to a population that can't control its own clock.
A crash month becomes a guilt month becomes a churn event. One-time credential pricing
means a bad month costs the learner **nothing** and loses us **nothing** — the free content
keeps them here, and the purchase waits for a good week. (The old €12/month model was
retired 2026-08-04; it unlocked no content anyway.)

**Pricing principles:**
1. Every lesson free, forever, no card. The funnel *is* the product quality.
2. One price, €69, for every track — career or foundation. No tiering games.
3. Pay-what-you-can down to €0, no proof, no application. Dignity is not means-tested.
   The dialog (`Pricing.tsx`) defaults to the €69 standard price rather than €0 — fixed
   2026-08-08 after a review noted a €0-prefilled dialog sitting next to a €69 price is
   functionally indistinguishable from having no price at all. €0 is still one click
   away, no questions asked; it's just not what a learner sees before they've chosen.
4. Organisations pay the same flat price as individuals. We sell volume, not markup.
5. Nothing renews. Nothing expires. Nothing punishes a relapse.

## What makes the tracks sellable (the employability test)

Every career track must pass all four:
1. **Employable or billable** — maps to a role someone hires or a service clients pay for.
2. **Beneficial to employers** — solves a problem they already have (EAA compliance,
   AI-output review, clinical-coding exceptions), not a problem we invented.
3. **Unique to this community** — leans on what our learners have that others don't:
   lived assistive-tech experience, hard-won judgment, tolerance for careful review work.
4. **Restorative** — the learning itself gives structure, purpose, and identity back,
   not just information. Soft pace is a feature, not an apology.

| Career track | The buyer of the skill |
|---|---|
| 🧭 AI-Assisted Software Development | Any org shipping software; freelance clients — output no longer capped by hours upright |
| ⚙️ AI Automation Consulting | SMEs that need honest guidance on where AI belongs in their process |
| 🩺 AI-Augmented Medical Coding | Health orgs whose AI routes complex cases to human expert reviewers |
| ♿ Digital Accessibility QA | Every EU-market company — the European Accessibility Act made this a legal requirement |

## Revenue streams, in order of activation

**Live now (this release):**
1. Track Credentials — all **8** tracks sellable (the 4 career tracks unlocked after full
   question-by-question verification of their exam banks; see `backend/src/lib/stripe.ts`).
2. Program Credential — €149 for any 3 of 8.
3. Human code review — €25 add-on.
4. Credential vouchers — employer/nonprofit blocks at flat €69, via hello@ email.

**Next (weeks, not months):**
5. Accessibility audits — scoped engagements delivered with graduate reviewers. This is
   the highest-margin stream and doubles as the placement engine for the QA track.
6. Placement fees — once the first cohort certifies, employers pay for successful
   hire-train-place outcomes (nothing due until a hire sticks).

**Later:**
7. Partnerships with insurers, occupational-health providers, and state vocational-rehab
   budgets — they already pay for far less effective reintegration programs.

## Unit economics (honest version)

- Marginal cost of a credential ≈ Stripe fees (~1.5% + €0.25 EU cards) + **EU VAT,
  charged where the learner is (checkout now uses Stripe Tax `automatic_tax`,
  `tax_id_collection`, and `tax_behavior: 'inclusive'` on the pay-what-you-can path —
  see `backend/src/routes/checkout.ts`, added 2026-08-08) + AI grading pennies →
  ~€55–58 net per €69 sale, not the ~€66 an earlier version of this doc claimed by
  omitting VAT entirely.** €69 stays €69 in every member state; the net varies. VAT
  applies from the first euro because a credential is an electronically supplied
  service. **Before the first real sale**, three Stripe Dashboard steps are still
  required (code can't do these): (1) enable Stripe Tax and register (Austria home +
  EU OSS) — `automatic_tax` errors on checkout without this; (2) set
  `tax_behavior = inclusive` on the `STRIPE_PRICE_ID_*` Prices — Stripe owns this field
  for fixed Prices, so missing it charges an Austrian learner €82.80 after promising
  €69; (3) confirm tax ID collection appears at checkout. The OSS/Kleinunternehmer
  position needs an accountant's confirmation — this doc says what the code does, not
  what's owed.
- Marginal cost of a free learner ≈ hosting + AI feedback pennies. Free learners are
  cheap marketing, community, and the voucher pipeline's supply side.
- **Content-depth gate (added 2026-08-08).** Exam-bank verification alone let a
  4-lesson track sell the same €69 "Career Credential," under the same wording, as a
  30-lesson one. `CREDENTIAL_SELLABLE_TRACKS` (`backend/src/lib/stripe.ts`) now also
  requires ≥8 lessons and ≥150 minutes of published content
  (`backend/src/lib/credentialBar.ts`, mirrored for the frontend in
  `src/data/credentialBar.ts`, cross-checked by `src/data/__tests__/credentialBar.test.ts`).
  **`ai-orchestrated-dev` is currently held back** — 4 lessons / 100 minutes, two of its
  four advertised domains still `inDevelopment`. It stays free to read and its
  credential opens automatically, no code change needed, once it clears the bar. The
  other 3 career tracks and all 4 foundation tracks currently clear it.
- The model breaks if exam integrity breaks. Unverified question banks don't ship (the
  sellable-tracks gate in `stripe.ts`). **Known weakness, stated plainly:** the four
  foundation tracks still draw their exam from their *entire* multiple-choice bank
  (14 of 14, 7 of 7, 13 of 13, 10 of 10) — those exams are the practice set, whose
  explanations the learner has already seen. This is now disclosed on every affected
  track's page (`trackCatalog.ts` `exam.drawsFullBank`), not left implicit. The four
  career tracks sample 64–85% of their MC banks *and*, since 2026-08-05, fold in 2
  AI-graded open-ended judgment questions per exam (`backend/src/routes/exams.ts`,
  `CAREER_TRACK_IDS`) — so passing one requires demonstrating the actual judgment the
  track claims to teach, not just recall. All eight exams now enforce a 2-hour
  cooldown after a failed attempt: not a hard cap (someone in a flare may need several
  tries), but enough that a fail can't be immediately re-guessed against the same
  shuffled bank. Until the foundation-track banks grow meaningfully past their exam
  size, that gap stays disclosed rather than fixed by claim alone.

## Honesty decisions ratified 2026-08-05 (expert advisory board)

Five simulated learner sessions surfaced three questions no code fix alone could answer —
credential naming vs. the Terms of Service, exam integrity, and founder continuity. Put to
an expert advisory board (patient advocacy, disability rights, health communications,
health economics, behavioral health, health-tech founder, and social-work perspectives)
rather than decided solo. What shipped as a result:

1. **Naming.** "Career Credential" stays, but every track page now states its lesson
   count and total estimated minutes next to the price (`TrackInfo.tsx`), and the Terms
   (`Imprint.tsx`) define exactly what a certificate confirms instead of a blanket
   "educational engagement only" disclaimer that quietly contradicted the sales copy.
   Pricing copy dropped "for a role you can actually be hired... for" (reads as a
   guarantee) for "proof of practiced skill, not a promise of the job."
2. **Exam integrity.** See the "known weakness" paragraph above — open-ended judgment
   questions in career-track exams, a 2-hour retry cooldown platform-wide, and explicit
   full-bank disclosure where it's true.
3. **Continuity.** `Imprint.tsx` now has a plain-language Continuity section: what a
   certificate PDF is self-contained enough to prove even without a live lookup, and what
   the founder commits to (a final static export, a notice period) if the platform ever
   has to stop. Not a substitute for an actual successor entity — stated as exactly that.

The board's one open question, unresolved by design: none of this fixes the underlying
fact that a sole trader's promise is only as durable as the sole trader. The Continuity
section says so rather than papering over it. Revisit if/when the business can afford a
real successor structure (escrow, a partner org, or incorporation).

## What "revenue tomorrow morning" requires

1. **Deploy** — the repo's Vercel Git integration is active again (PR previews build and
   deploy Ready), so merging to the production branch may deploy automatically. Fallback:
   `.github/workflows/deploy-softreset.yml` (needs only a `VERCEL_TOKEN` repo secret,
   addable from a phone; see the workflow header).
2. **Stripe** — no new products needed: career credentials reuse the existing
   `STRIPE_PRICE_ID_TRACK_CREDENTIAL` price. Zero configuration change.
3. **Announce** — the Spooniversity community, LinkedIn, and the three ad landing pages
   (`/go/coding`, `/go/ai`, `/go/agents`) are ready today. First message writes itself:
   *"Every lesson free. Four career credentials for getting back to work. €69, once,
   when you're ready — €0 if you can't."*
