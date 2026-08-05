# Soft Reset School — Recommendations

*Compiled 2026-08-05. Companion to `BUSINESS_MODEL.md`. Prioritised by leverage: fix what
undermines the trust product first, then build the moat, then extend reach.*

**The throughline:** the platform's actual asset is *trust in the credential*. Every
recommendation here either removes something that quietly weakens that trust (shallow tracks
at full price, self-graded practice exams, a verification service only one person can keep
alive) or adds something that strengthens it in a way a competitor can't cheaply copy (real
employer proof, continuity guarantees, enforced quality invariants). Revenue-stream expansion
waits behind those.

Each item is tagged with rough effort — **[S]** hours, **[M]** days, **[L]** weeks — so a
low-capacity week still has something actionable in it. Items marked **✅ SHIPPED** were
implemented on 2026-08-05; the rest are open.

---

## Part 1 — Product & trust (the core eight)

### Now — fixes an active credibility risk

**1. ✅ SHIPPED — Stop selling the thinnest career track at full price until it's deeper. [S–M]**
*Resolved by holding both sub-bar tracks back from sale rather than discounting them: a
cheaper credential would have broken the one-price principle and created the two-tier
credential the trust model exists to avoid. Both track pages now state what is missing and
how many lessons remain; the credential re-opens automatically when the curriculum lands.*
`accessibility-qa-lived-experience` has **3 lessons** behind a €69 "Career Credential" — the
same price as tracks with 8–30 lessons (`src/data/trackCatalog.ts`: fundamentals 23, tools 30,
advanced 30, ai 14, the two mid career tracks 8 each; `ai-orchestrated-dev` is 4). Either
(a) hold it back from the career-tier price until it hits a comparable minimum lesson count,
or (b) price/label it explicitly as an early-access track. The code comment at
`trackCatalog.ts:36` already flags exactly this ("thinnest tracks (3-4 lessons) were being
sold under the same 'Career Credential' language") — someone on the team already sees it as a
problem; it just hasn't been acted on. Selling a shallow track at parity price is the fastest
way to burn the trust the whole model depends on.

**2. Close the `drawsFullBank` gap on at least one foundation track, not just disclose it. [M]**
Disclosure was the right first move, but a track whose exam is literally its own practice set
with visible explanations isn't testing anything (all four foundation tracks: 14/14, 7/7,
13/13, 10/10). Pick the highest-enrollment foundation track first and grow its bank past **2×**
the exam size. Fastest ROI on trust per engineering hour.

**3. ✅ SHIPPED — Add a minimum-quality gate to the sellable-tracks check in `stripe.ts`. [S]**
*`CREDENTIAL_SELLABLE_TRACKS` is now computed from two gates (exam integrity × depth ≥8
lessons / ≥150 min) instead of hand-maintained, with tests asserting seed data, public
catalog, and checkout gate agree. CI now runs those tests (CTO-1, also shipped).*
`CREDENTIAL_SELLABLE_TRACKS` currently encodes exam integrity only. It should also assert
lesson count / estimated content-hours before a track can carry the "Career Credential" price
tier. This turns "don't sell shallow tracks" from a policy into an enforced invariant — the
same pattern the exam-integrity gate already proves the team trusts. Ship it with a unit test
that fails the build when a listed track drops below the bar.

### Next — converts the moat from soft to real

**4. Get one real employer-side data point before "later." [M]**
Placement fees and accessibility audits are listed as future revenue streams with zero
evidence of employer traction. A single named or anonymised case — *"an EU company hired a
graduate for EAA compliance work"* — is worth more to the moat than any amount of
exam-integrity engineering, because it's the only thing that makes "publicly verifiable
credential" mean something to the *next* employer. Prioritise landing this over building
further revenue streams (#7) that assume it already exists.

**5. Address the continuity risk with a concrete, cheap mitigation, not just disclosure copy. [M]**
`Imprint.tsx`'s honest line — "a sole trader's promise is only as durable as the sole trader" —
doesn't reduce the risk. Cheapest options worth evaluating: (a) escrow the
certificate-verification data/keys with a neutral third party, or commit to a notarised static
export schedule; (b) find one advisory or successor-of-record relationship (even informal)
that could take over verification hosting. See also **CTO-3**, which makes the credential
verifiable *without* the platform at all — the technical half of this same fix.

**6. Turn the advisory-board review into a recurring cadence, not a one-off. [S]**
The 2026-08-05 review (naming, exam integrity, continuity) was clearly valuable. Schedule it
quarterly, and trigger it on any pricing or credential-claim change. It's the highest-quality
QA mechanism in the business and it's currently ad hoc.

### Later — extends reach

**7. Only then pursue insurer / occupational-health / vocational-rehab partnerships**
(`BUSINESS_MODEL.md` stream 7). These buyers will diligence exactly the things above —
credential rigour, continuity, employer outcomes — before committing budget. Pursuing them
before #1–5 land risks a "no" that is very hard to reverse.

**8. Once 2–3 tracks have real depth parity and one employer proof point, make that the
headline claim.** *"Verified by employers, not just us"* is a stronger USP extension than
anything content-volume-based, and it's the natural next sentence after the current pitch.

---

## Part 2 — Legal & compliance

The business sells a cross-border EU digital service from an Austrian sole trader
(`Imprint.tsx`, VAT ID ATU79713516, Finanzamt Wien) to consumers *and* organisations. That
combination carries specific, well-defined obligations. Most of what follows is cheap to fix
now and expensive to fix retroactively.

**L-1. ✅ SHIPPED (code) / open (registration) — Resolve EU VAT on B2C digital sales properly. [M]**
*Checkout now runs Stripe Tax with VAT-inclusive pricing and tax ID collection, so €69 stays
€69 in every country and organisational buyers can get a reverse-charge invoice. What
remains is not code: enable Stripe Tax, register for OSS, set `tax_behavior = inclusive` on
the fixed Prices in the Stripe Dashboard, and have an accountant confirm the
OSS/Kleinunternehmer position. The three dashboard steps are in BUSINESS_MODEL.md's deploy
checklist — step 1 blocks revenue if skipped, because `automatic_tax` errors without it.*
`Imprint.tsx` currently says "VAT applicability is determined per transaction. Where VAT
applies it will be displayed at checkout." For electronically supplied services sold to EU
consumers, VAT is generally due **in the customer's member state**, from the first euro, with
no cross-border threshold relief once you're outside the small domestic-only regime. The
practical fix is registering for the **OSS (One-Stop-Shop)** scheme and letting Stripe Tax
compute and collect destination VAT at checkout. Two things to decide with an accountant, not
in code: whether the Kleinunternehmer domestic exemption applies at all given a VAT ID is
already issued, and whether the €69 is VAT-inclusive (it should be — a consumer price that
grows at checkout by country is both a conversion killer and, for consumer sales, a labelling
problem). *This is the one item on the whole list where "we'll fix it when revenue justifies
it" is the wrong answer: unpaid VAT compounds silently across every sale.*

**L-2. Partly shipped — Make invoices real invoices. [S]**
*Tax ID collection is now on at checkout, which covers the VAT-ID half. Still open: enabling
Stripe Invoicing so voucher-block buyers get a sequential, forwardable invoice rather than a
receipt.*
Employers, nonprofits, and vocational-rehab agencies (three of the named customer segments)
cannot expense a Stripe receipt in most jurisdictions. Enable Stripe Invoicing / customer tax
IDs so a B2B buyer gets a compliant invoice with seller VAT ID, buyer VAT ID, reverse-charge
note where applicable, and a sequential number. Voucher blocks sold "via hello@ email" are
where this bites first.

**L-3. The €0 pay-what-you-can path needs a written policy, not just code. [S]**
`checkout.ts` grants entitlement directly with no Stripe session at `amountCents === 0`. That's
the right *values* call and it's correctly implemented, but it creates three exposures worth a
paragraph each in the Terms: (a) it's a supply for VAT purposes of €0 — document it as a
grant/bursary, not a discount, so it doesn't muddy the taxable base; (b) there is no
rate-limit or identity check documented, so define the abuse policy *before* you need to
enforce it; (c) certificates issued on the €0 path must be indistinguishable from paid ones —
confirm they are, and say so publicly, because any hint of a two-tier credential destroys the
dignity principle the model is built on.

**L-4. Withdrawal-right handling is good — extend it to the €0 and voucher paths. [S]**
The 14-day withdrawal waiver modal in `Pricing.tsx` is genuinely well done and ahead of most
EU edtech. Check the same acknowledgement exists for program credentials, code review, and
voucher-redeemed exams, and that the waiver text is stored per-purchase (not just
client-side), so it's provable if disputed.

**L-5. Accessibility conformance for *this* site is a credibility issue, not just a legal one. [M]**
You sell a Digital Accessibility QA credential to companies who need EAA compliance. Your own
platform must be exemplary. There's an `e2e/a11y.spec.ts` — good. Add a published
**accessibility statement** (EAA/EN 301 549 style: conformance level, known gaps, feedback
channel, review date). Have the accessibility-QA cohort audit the platform as a graded
capstone — it produces the statement, deepens the thinnest track (#1), and generates the
first portfolio artefacts for graduates. One action, three problems solved.

**L-6. Certificate claims wording review. [S]**
Recheck every public surface (landing, pricing, ad landing pages `/go/*`, blog, LinkedIn copy)
against the ratified Terms definition of what a certificate confirms. The 2026-08-05 fix
covered `TrackInfo.tsx`, `Pricing.tsx` and `Imprint.tsx`; marketing surfaces drift fastest and
are the ones a regulator or a disappointed learner actually screenshots.

**L-7. Data-protection housekeeping. [S–M]**
GDPR consent capture, audit logging (`middleware/gdpr.ts`), and DSR endpoints
(`routes/auth.ts:496`) already exist — genuinely above average. Remaining gaps: a
**Record of Processing Activities (ROPA)** document, a **DPA with every processor** (Stripe,
Vercel, Anthropic, email provider, database host), and an explicit note that AI grading sends
learner-written answers to a third-party model. That last one belongs in the privacy policy
*and* in the exam UI, in one sentence, before the learner types.

**L-8. Health-adjacent content boundary. [S]**
The medical-coding track and the chronic-illness framing sit near regulated territory. One
explicit line — this is vocational education, not medical advice, and not a clinical
qualification — in both the track page and the Terms closes an ambiguity that costs nothing
now and would be very awkward to argue later.

---

## Part 3 — Marketing

**M-1. Lead with the free-forever asymmetry, not the price. [S]**
The strongest line the business owns is already written: *"Every lesson free. €69 once, when
you're ready — €0 if you can't."* No competitor with a subscription can say it without
destroying their own model. Make it the first thing on every surface, above the fold, before
any feature list.

**M-2. Fix the proof gap in the funnel. [M]**
The site sells trust but shows little third-party evidence. Priority order: (1) one employer
quote (blocked on #4), (2) three graduate stories with real outcomes, (3) the advisory-board
review published as a public page. That last one is free — you already did the work, and
"here's what our advisory board told us to change, and what we changed" is a marketing asset
almost nobody in edtech can produce because almost nobody does it.

**M-3. Publish the honesty decisions as content. [S] — highest ROI marketing action here.**
`BUSINESS_MODEL.md`'s "known weakness, stated plainly" paragraph is remarkable writing.
Published as a blog post — *"Our foundation exams draw from the full question bank. Here's why
that's a problem and what we're doing about it"* — it converts a weakness into the single
clearest demonstration of the trustworthiness the product sells. This is the kind of post that
gets shared by people who never buy, and believed by the people who do.

**M-4. Segment the messaging: learner vs employer vs funder. [M]**
Three buyers with three fears. Learners fear wasting energy on something that won't lead
anywhere. Employers fear an unverifiable credential and a legal deadline (EAA). Funders
(nonprofits, vocational rehab) fear an unauditable line item. `Employers.tsx` and
`ForTeams.tsx` exist — make sure each answers *its* fear in the first paragraph rather than
restating the learner pitch.

**M-5. SEO around the actual demand, not the product name. [M]**
The real search demand is "EAA compliance deadline", "WCAG audit requirement", "return to work
after long covid", "jobs you can do from bed". The blog has four posts pointed at AI literacy;
at least half the calendar should point at the compliance and return-to-work queries, where
intent is high and competition is thin.

**M-6. Set a channel discipline rule. [S]**
Given founder capacity constraints, pick **two** channels (suggest: the Spooniversity community
+ LinkedIn) and drop everything else until a paid hire exists. Anything else is capacity spent
on reach that doesn't convert.

---

## Part 4 — Learning & Development (curriculum)

**LD-1. Define a minimum viable track spec and publish it. [S]**
Numbers that make #1 and #3 enforceable rather than aspirational — a proposed starting bar:
career track ≥ 12 lessons, ≥ 300 minutes, ≥ 4 published domains, MC bank ≥ 2× exam size,
≥ 2 open-ended judgment questions, ≥ 1 portfolio artefact. Publish it on the site. A public
standard is both a quality gate and a marketing asset.

**LD-2. Close the "in development" domains before adding new tracks. [L]**
`ai-orchestrated-dev` ships 4 lessons with two domains flagged `inDevelopment`. Breadth
without depth is what makes #1 an active risk. **Freeze new track creation** until every
career track meets LD-1.

**LD-3. Every career track needs an assessed artefact, not just an exam. [M–L]**
An exam proves recall and (now) some judgment. What an employer buys is evidence of work. Each
career track should end with one reviewable artefact: an audit report (accessibility QA), a
process-automation scope doc (consulting), a reviewed AI-generated PR (dev), a coding-exception
memo (health informatics). This is also the natural upsell path for the €25 human review, and
it converts the credential from "passed a test" to "produced this."

**LD-4. Build assessment blueprints per track. [M]**
For each track, map every exam question to a taught learning objective and publish the
coverage table. Makes bank growth (#2) mechanical instead of creative, and makes the exam
defensible to any employer who asks what was actually tested.

**LD-5. Design explicitly for relapse. [S]**
The pedagogy should assume interruption: every lesson resumable mid-way, every module
summarised in a one-screen recap for returning-after-six-weeks learners, no streak mechanic
that punishes a flare (check `gamification.ts` against this — streak logic and chronic illness
are a hostile pairing unless deliberately designed otherwise).

**LD-6. Recruit two subject-matter reviewers per career track. [M]**
Ideally practitioners who hire for the role. Cheap (a few hours of review each, likely donated
given the mission), and it directly de-risks the "who says this curriculum is right?" question
that every employer and funder will eventually ask.

---

## Part 5 — Knowledge management

**K-1. The docs are the company — and they're currently one person's memory. [S]**
`BUSINESS_MODEL.md`, `IMPLEMENTATION_CHECKLIST.md`, and the inline decision comments in
`stripe.ts` / `trackCatalog.ts` are unusually good institutional memory. Formalise the pattern:
a lightweight **decision log** (`docs/decisions/NNNN-title.md`) capturing date, decision,
reasoning, and what would reverse it. Every honesty decision already ratified should be
backfilled — it takes an hour and it is the single cheapest continuity mitigation available
(see #5).

**K-2. Stop duplicating source-of-truth data. [M]**
`trackCatalog.ts` mirrors `backend/prisma/seed-data/**` by hand, with a comment asking future
maintainers to keep them in sync. Lesson counts, exam config, and `drawsFullBank` are exactly
the facts the pricing gate (#3) and the public pricing claims depend on. **Generate the catalog
from the seed data at build time**, and the disclosure can never silently go stale. This is a
correctness fix disguised as a refactor.

**K-3. Write the operational runbook. [M]**
How to deploy, rotate a Stripe key, issue a manual certificate, honour a GDPR erasure request,
handle a failed webhook, restore the database. It exists in the founder's head today. Anyone
taking over during a crash — the *actual* failure mode this business must plan for — needs it
written down.

**K-4. Capture graduate outcomes systematically from day one. [S]**
A single structured record per certified learner (consented): track, date, prior situation,
outcome at 3 and 6 months. This is simultaneously the placement-fee evidence base (#4), the
funder reporting artefact, and the marketing proof (M-2). Retrofitting it later is nearly
impossible; starting it now costs one form.

---

## Part 6 — CTO / engineering

**CTO-1. ✅ SHIPPED — There is no CI that runs the tests. [S]**
*`.github/workflows/ci.yml` now runs lint, build (including prerender), and the full test
suite on every PR and every push to main.*
`.github/workflows/` contains only `deploy-softreset.yml` and a recovery workflow. The deploy
workflow builds before deploying (good) but the vitest and Playwright suites — which exist and
are decent — never gate anything. Add a PR workflow running `npm run lint`, `npm test`, and
`npm run test:a11y`. On a solo-founder project with variable capacity, CI *is* the second
engineer. Everything else in this section is less important than this.

**CTO-2. ✅ SHIPPED — Encode the business invariants as tests. [S]**
*`src/data/__tests__/credentialBar.test.ts` (22 assertions) plus a page-level test that the
UI never advertises a price for a held-back track. Catalog↔seed-data parity is asserted per
track, which closes the risk half of K-2 without the full generation refactor.*
Then #3 and LD-1 stop depending on anyone remembering: assert every
`CREDENTIAL_SELLABLE_TRACKS` entry meets the minimum lesson/minute bar; assert every track with
`drawsFullBank: true` carries visible disclosure; assert catalog counts match seed data (K-2).
Three tests that make the honesty policy structurally hard to violate.

**CTO-3. Make certificates verifiable without the platform. [M] — the technical half of #5.**
Verification today is a database lookup on `verifyCode` (`routes/certificates.ts`). If the
platform stops, every credential silently becomes unverifiable — which is exactly the "permanent"
claim failing. Fix: sign the certificate payload (learner, track, date, exam version) with a
long-lived key, embed the signature and public key fingerprint in the PDF, and publish the
public key at a stable location plus in the certificate itself. Then a PDF is verifiable by
anyone, offline, forever, with no server. Pair with a periodic signed static export of the
verification index. *This converts a promise into mathematics — and it is the strongest
possible answer to the continuity question the advisory board left open.*

**CTO-4. Observability before scale. [S]**
No error tracking or uptime monitoring is apparent. A failed Stripe webhook or a broken exam
submission currently surfaces only when a learner emails — and this user population is
disproportionately unlikely to complain, they just leave. Sentry (or equivalent) + an uptime
check on `/api/health` and the checkout path. Half a day.

**CTO-5. Security pass on the paid path. [M]**
Rate-limit the €0 grant endpoint and exam attempts (helmet + express-rate-limit are already
installed — confirm they cover these specific routes); verify Stripe webhook signatures and
make handlers idempotent; confirm exam answers/keys can't be read from the client before
submission. Also: `backend/src/lib/stripe.ts` opens with `// @ts-nocheck` — on the file that
handles money. Remove it and fix what surfaces.

**CTO-6. Database and backup posture. [S]**
Confirm automated backups exist with a *tested* restore, and that certificates + purchases are
in the daily set. The deploy workflow runs `migrate` and `seed` against production — confirm
the seed step is strictly idempotent and cannot overwrite learner-linked data.

**CTO-7. Keep the boring stack. [S]**
React + Express + Prisma + Stripe on Vercel is exactly right for this scale and this founder's
capacity. Resist rewrites. The competitive advantage is curriculum, trust, and community —
never infrastructure.

---

## Part 7 — CFO / finance

**CFO-1. Model the real breakeven, publicly to yourself. [S]**
At ~€66 net per credential, note the monthly certified-learner count that covers hosting, AI
costs, and any founder draw. One number that turns "is this working?" into a check rather than
a feeling.

**CFO-2. Track the PWYC ratio as a first-class metric. [S]**
The €0 path is a values commitment *and* the largest single variable in revenue. Instrument
the distribution (€0 / partial / full) from day one. If it drifts toward €0, the answer is
never to restrict it — it's to grow the employer/funder-paid side (vouchers, audits) that
subsidises it. But you can only make that call if you're measuring.

**CFO-3. Voucher blocks are the most under-exploited live revenue stream. [M]**
Nonprofits and vocational-rehab agencies have *existing budget lines* and buy in blocks. It's
live today, needs no product work, has near-zero marginal cost, and — unlike placement fees —
doesn't require employer traction to exist first. Currently it's a "email hello@" footnote.
Give it a real page, a one-page PDF a procurement officer can forward, and a named price for
10/25/100 credentials.

**CFO-4. Separate business banking and get a bookkeeper before the first €1k. [S]**
Sole-trader finances blur fast, and the VAT position (L-1) needs someone accountable who isn't
the founder. Cheapest possible insurance.

**CFO-5. Price the accessibility audits before selling one. [M]**
It's called the highest-margin stream but has no price. Set a scoped starting package (e.g.
fixed-price audit of N templates + report + remediation guidance), define what a graduate
reviewer is paid, and confirm the margin holds. Selling a service with an undefined cost base
is how high-margin streams turn into unpaid work.

**CFO-6. Build an 18-month cash-and-capacity runway view. [S]**
Not just money — founder capacity. A plan that assumes consistent weekly hours from someone
with POTS is not a plan. Model a realistic bad quarter and check the business survives it
without breaking a promise to a learner.

---

## Part 8 — Growth

**G-1. Instrument the funnel before optimising it. [S]**
Signup → first lesson → track completion → exam attempt → purchase. Without this, every growth
decision is a guess. Privacy-respecting analytics only (this audience is rightly wary of
tracking, and the cookie banner promise must hold).

**G-2. The single most important conversion metric is completion, not signup. [S]**
Free-forever content means signups are cheap and meaningless. The number that predicts revenue
is *track completion by people who started during a bad month*. Optimise for that.

**G-3. Community-first distribution. [M]**
Spooniversity is the unfair advantage: a trusted audience with the exact problem. Referral
should be social, not transactional — graduates telling their own communities beats any paid
channel and is the only acquisition path that scales without ad spend.

**G-4. Build the employer side as a *pull*, not a push. [M]**
The EAA deadline creates urgency employers already feel. A free "is your site EAA-exposed?"
self-check that produces a real, useful mini-report is the most natural top of funnel for both
audits (stream 5) and placement (stream 6) — and it's built from curriculum you already have.

**G-5. Cohort effects without cohort deadlines. [M]**
Fixed-date cohorts are hostile to this population; total isolation kills completion. The middle
path: rolling enrolment with soft, opt-in "people who started around when you did" groupings.
Preserves the pace promise while capturing the social pull that drives completion.

**G-6. Don't run paid acquisition yet. [S — a decision, not a task]**
The three ad landing pages are ready, but paying to send strangers to a funnel whose conversion
is uninstrumented (G-1) and whose thinnest track is over-priced (#1) buys expensive
disappointment. Revisit after #1, #3, and G-1.

---

## Part 9 — Scale & operations

**S-1. Name the bottleneck honestly: it is founder capacity, not traffic. [S]**
Every scaling decision should be evaluated against "does this consume founder hours linearly
with volume?" AI grading, self-serve checkout, and static prerendering already scale well.
Human code review (€25), audits, and voucher sales-by-email do not. That's the whole scaling
map.

**S-2. Build the reviewer bench before demand arrives. [L]**
Graduates reviewing other learners' work — paid — is the flywheel that makes human review,
accessibility audits, and placement all scale at once. It's also the strongest possible proof
of the model: graduates earning income through the platform *is* the outcome the whole business
claims to produce. Start with two.

**S-3. Automate the voucher flow once it exceeds ~5 buyers. [M]**
Until then, email is correct and cheaper than the software.

**S-4. Define support SLAs you can keep on a bad week. [S]**
"We reply within 5 working days, and slower during a flare — we'll say so" is more trustworthy
and far more sustainable than a 24-hour promise that breaks. Publish it.

**S-5. Reduce single-person dependency in the operating loop, incrementally. [L]**
Ordered by cost: runbook (K-3) → decision log (K-1) → one trusted contractor with deploy access
→ an advisory relationship that could act as successor-of-record (#5) → incorporation when
revenue justifies it. Each step is independently useful; none requires the next.

---

## Suggested sequence

| Window | Items | Why this order |
|---|---|---|
| **Done 2026-08-05** | #1, #3, L-1 (code), CTO-1, CTO-2 | Depth gate enforced, VAT handed to Stripe, CI running the suites. |
| **This week** | K-1, L-1 (Stripe Dashboard + OSS registration) | The three dashboard settings block the first sale; the decision log is an hour's work. |
| **This month** | L-2, #2, CTO-3, CTO-4, G-1, CFO-2 | The exam-integrity gap, offline-verifiable credentials, invoices, and the instrumentation everything later depends on. |
| **This quarter** | #4, #5, LD-1, LD-2, LD-3, CFO-3, CFO-5, M-2, M-3, G-4 | Depth parity, the first employer proof point, and the two revenue streams that don't need it yet. |
| **After that** | #7, #8, S-2, G-3, G-5, S-5 | Reach and scale — everything here diligences the items above, so it only works once they've landed. |

**If only three things get done:** #1 (stop selling the thin track at parity price), **CTO-1**
(CI that runs the tests), and **L-1** (EU VAT). The first protects the asset, the second
protects everything else from silent regression, and the third is the only item that gets more
expensive every single day it waits. *All three are now implemented in code — L-1 still needs
its Stripe Dashboard and OSS registration steps, which nobody but you can do.*

**Next-highest leverage, now that those are done:** #4 (one real employer proof point) and
**CTO-3** (sign certificates so they verify without the platform). Between them they turn the
two claims the whole model rests on — *employers trust this* and *this credential is
permanent* — from promises into evidence.
