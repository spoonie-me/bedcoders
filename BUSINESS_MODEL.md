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

- Marginal cost of a credential ≈ Stripe fees (~1.5% + €0.25 EU cards) + AI grading
  pennies → **~€66 net per €69 sale.**
- Marginal cost of a free learner ≈ hosting + AI feedback pennies. Free learners are
  cheap marketing, community, and the voucher pipeline's supply side.
- The model breaks if exam integrity breaks. Unverified question banks don't ship (the
  sellable-tracks gate in `stripe.ts`). **Known weakness, stated plainly:** the four
  foundation tracks currently draw their exam from their *entire* multiple-choice bank
  (14 of 14, 7 of 7, 13 of 13, 10 of 10) — so those exams are the practice set, whose
  explanations the learner has already seen, with no attempt limit anywhere in the
  codebase. The four career tracks sample 64–85% of their banks, which is better but
  not enough. Until banks are meaningfully larger than the exams that draw from them,
  and a retake policy exists, these are open-book knowledge checks and the marketing
  must not imply otherwise.

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
