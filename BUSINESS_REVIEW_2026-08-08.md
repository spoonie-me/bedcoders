# Soft Reset School — Brutally Honest Business Review

**Date:** 2026-08-08
**Method:** Direct read of the repo as it stands on `main` — code, seed data, pricing surfaces,
legal pages, deploy config, the three open PRs, and the full commit history since 2026-05-07.
`npm run curriculum:audit` was run against current seed data. No live-site check was possible
(outbound HTTPS to the domain is blocked from this environment), so every claim below is
sourced from committed code, not from production behaviour.
**Prior docs:** `BEDCODERS_CONTENT_BUSINESS_SEO_REVIEW.md` (2026-08-04) and
`BEDCODERS_SPONSOR_COMMUNITY_AUDIT.md` (2026-08-02). This review deliberately re-checks their
"critical" findings rather than trusting them, because the interesting finding is which ones
are still open.

---

## The verdict, in one paragraph

There is no business yet. There is a codebase, a genuinely good strategic thesis, and
258 KB of documents reasoning confidently about a market with **zero observed data points** —
no analytics, no signup count, no revenue figure, not one customer conversation recorded
anywhere in the repo. Meanwhile the paid product is a €69 credential for **1.7 hours of
content**, sitting behind a one-click button that hands the same credential over for **€0**,
on a site whose pricing page **404s**, billed by a VAT-registered Austrian sole trader whose
**checkout collects no VAT**. Every one of those four things has a known fix. Three of the
four fixes are already written and sitting in an unmerged PR. That gap — between the quality
of the thinking and the completion of the work — is the actual subject of this review.

---

## 1. What is genuinely good, so it doesn't get lost

This section is short but it is not a courtesy. These are real assets and most solo founders
have none of them.

- **The honesty discipline is unusual and it is a moat.** `trackCatalog.ts`'s
  `exam.drawsFullBank` flag publicly admits that four exams draw their entire question bank.
  `BUSINESS_MODEL.md` has a paragraph headed "Known weakness, stated plainly." `Imprint.tsx`
  has a Continuity section that says out loud that a sole trader's promise is only as durable
  as the sole trader. Almost nobody ships that. With an audience whose defining experience is
  being lied to by institutions, this is the single most valuable thing the product owns.
- **`scripts/curriculum-audit.mjs` is the best artefact in the repo.** A tool whose job is to
  tell you, in one screen, how far you are from your own stated standard — and which reports
  `4.6%` without flinching. Most people never build the instrument that can embarrass them.
  Keep it, run it in CI, and put its number on a wall.
- **The positioning is defensible and hard to copy.** "People with lived assistive-tech
  experience are structurally better accessibility QA reviewers" is a real insight with a
  real regulatory tailwind (the European Accessibility Act) behind it. No competitor can
  assemble that talent pool by hiring.
- **The engineering fundamentals are above average.** JSON-LD, canonicals, the reasoned
  AI-crawler policy in `robots.txt`, GDPR fields in the schema from day one, the a11y test
  suite, and the exam-integrity fixes of 2026-08-03/05 (MC scoring was broken platform-wide,
  four exams were mathematically unpassable, answers leaked to the client — all found and
  fixed). That is real work.
- **The instinct in PR #6 — pull a thin product off sale rather than discount it — is
  correct**, and it is the correct instinct for exactly the reason the business needs it to be.

---

## 2. The five findings that cost money, ranked

### F-1 · You are flying with no instruments, and every strategy doc pretends otherwise

`index.html:285,290` still ships GA4 as the literal string `G-XXXXXXXXXX`. `index.html:301`
still ships Umami as `YOUR-UMAMI-WEBSITE-ID`. PostHog is named as an active processor in the
Privacy Policy and Cookie Policy and is imported nowhere in `src/`. Every `trackEvent()` call
in the app fires into a no-op.

This was flagged **Critical** on 2026-08-04 with a 1–2 hour estimate. Four days and roughly
forty commits later it is unchanged.

The consequence is not "we lack a dashboard." The consequence is that `BUSINESS_MODEL.md`,
both prior audits, `PRICING_MODELS_VISUAL.txt`, the 100-hour curriculum architecture, and the
pay-what-you-can design are **all reasoning from zero evidence**. The doc states unit economics
to the euro (`~€66 net per €69 sale`) for a transaction that may never have occurred. It ranks
seven revenue streams in activation order without knowing whether anyone has ever reached the
pricing page. It retired a €12/month subscription on the reasoning that recurring billing
punishes a variable-capacity audience — which is a good argument, and which was made without
a single churn data point, because there was never any way to have one.

Being wrong about a market is normal and cheap. Being *unable to find out* is the expensive
part, and it is a 90-minute fix that keeps not happening.

> **Also a live GDPR exposure:** `gtag` loads unconditionally on first paint with no consent
> gate, while `CookiePolicy.tsx:48` states analytics is opt-in. Fixing F-1 without fixing the
> consent gate converts a theoretical exposure into a real one for a named, VAT-registered
> Austrian trader.

### F-2 · The pricing page gives the paid product away for free, pre-filled at €0

This is the finding I expect the most disagreement about, so here is the exact mechanism.

`Pricing.tsx:260` — the "Set your own price" button opens the dialog with
`setPwycAmount('0')`. The dialog's default state is **zero**. The primary button then reads
`Unlock for €0`. `checkout.ts:159-172` grants the `CredentialPurchase` immediately, no Stripe,
no review, no human. The only guard is one credential per track per user — so a single account
can take all eight, one click each, for nothing.

Structurally, the product is: *all content free forever, plus a certificate that is one click
from free, sitting on the same page as a €69 price.* That is not pay-what-you-can. Pay-what-
you-can anchors at the standard price and lets people step down. This anchors at zero and asks
them to step up, on a page that has already spent 200 lines explaining that the audience is
broke and shouldn't have to justify themselves.

**To be clear about what I am and am not saying.** The value here — dignity is not
means-tested, no proof, no application, no email — is right, it is the best thing about the
brand, and I am not proposing you means-test anyone. What I am saying is that the current
*implementation* of that value is indistinguishable from having no price, and that the
business model document has not noticed. It computes unit economics on €66 net per sale while
the checkout surface is engineered to produce €0 sales.

Two coherent positions exist. Pick one, deliberately:

1. **It is a donation model.** Credentials are free, some people tip. Then say that,
   rewrite the unit economics, and stop planning around €69 × N. Revenue must then come
   from employers, agencies, and audits — not learners.
2. **€69 is the price, with a genuine no-questions escape hatch.** Then the escape hatch
   lives *inside* checkout — offered after someone declines €69, defaulted to €69 or blank,
   never as a peer call-to-action pre-filled at zero on the pricing page itself.

Position 2 costs nothing in dignity. Nobody is asked to explain anything; the door is just
not the first thing you see. I would take position 2 and expect it to change revenue from
"probably zero" to "measurable," which — see F-1 — you currently cannot detect either way.

### F-3 · You are selling a career credential for 1.7 hours of content

`npm run curriculum:audit`, run today against current seed data:

```
  track                              authored  planned   done  lessons
  tools                                  7.7h     100h   7.7%   30/150
  advanced                               7.6h     100h   7.6%   30/150
  fundamentals                           5.8h     100h   5.8%   23/150
  accessibility-qa-lived-experience      4.4h     100h   4.4%   11/150
  ai                                     3.5h     100h   3.5%   14/150
  ai-workflow-consulting                 3.3h     100h   3.3%    8/150
  ai-oversight-health-informatics        3.0h     100h     3%    8/150
  ai-orchestrated-dev                    1.7h     100h   1.7%    4/150
  total                                 36.9h     800h   4.6%
```

The four **career** tracks — the ones carrying the entire reintegration thesis, sold at €69
as proof an employer should trust — hold **31 lessons between them**. The flagship,
AI-Assisted Software Development, has **four lessons and 1.7 hours**, and two of its four
advertised domains are marked `inDevelopment: true` on the public page.

`docs/CURRICULUM_ARCHITECTURE_100H.md` — written by this project, 2026-08-07 — defines 100
hours as "roughly the depth at which someone who arrives without the skill leaves able to do
paid work in it," and closes the spec with: *"Nothing about this is negotiable downward
without saying so out loud in the catalog."*

What the catalog says out loud, at `trackCatalog.ts:56`, is:

> "This is a young track: a focused, growing curriculum — every lesson free to read before you
> pay anything."

"Young" and "focused" are doing an enormous amount of work there. The honest sentence is
"1.7 of a planned 100 hours." The project wrote the standard, measured itself at 1.7%, and
then described the gap with an adjective. That is the one place where the honesty discipline
in §1 — which is otherwise the best asset here — actually broke.

The exposure is not abstract. `BUSINESS_MODEL.md` tells employers a credential is
"verified, uniquely qualified talent" and "the cheapest return-to-work instrument they'll ever
buy." The first employer who hires a certified graduate, finds the credential represents four
lessons, and posts about it will do more damage than every competitor combined — to an
audience that came here specifically because they are tired of being oversold to.

**PR #6 already fixes this** with a computed depth gate (≥8 lessons / 150 min) that pulls thin
tracks off sale automatically and re-opens them when the curriculum lands. It is written,
tested, and unmerged.

### F-4 · VAT: a published VAT ID, a promise at checkout, and no tax code on `main`

`Imprint.tsx:28` publishes **UID ATU79713516**. `Imprint.tsx:31` states: *"Where VAT applies
it will be displayed at checkout."*

`backend/src/routes/checkout.ts` on `main` contains no `automatic_tax`, no `tax_id_collection`,
and no `tax_behavior`. A credential is an electronically supplied service, taxed in the
learner's member state from the first euro. So the Imprint makes a promise the checkout cannot
keep, on behalf of a named individual whose VAT number is on the page.

PR #6 also fixes this, and its description contains the number that matters: net per sale is
**~€55–58, not the ~€66** `BUSINESS_MODEL.md` claims. The doc's unit economics overstate
margin by roughly 15% by omitting VAT entirely. It also flags that missing one Stripe Dashboard
step charges an Austrian learner **€82.80 after the page promised €69** — which, for this
audience and this brand, is a worse failure than not selling at all.

This is the one finding with a personal-liability tail. Sole trader, no separate entity. Get
an accountant to confirm the OSS position; the code fix is already written.

### F-5 · Two domains, two brand names, and a marketing site that 404s

The 2026-08-04 review's **#1 fix, estimated at 15 minutes**, was to replace `vercel.json`'s
final rule. Today, `vercel.json:59` still reads:

```json
{ "src": "/(.*)", "status": 404, "dest": "/404.html" }
```

`public/404.html` still does not exist. The rewrite list above it still omits `/pricing`,
`/about`, `/employers`, `/blog`, `/signup`, `/login`, `/share-story`, and every legal page.
Unless Vercel project settings override this file, the pricing page — the only page that can
produce revenue — returns 404, and so do the Terms of Service a customer must agree to.

Underneath that, the identity has not converged:

| Surface | Says |
|---|---|
| `SEO.tsx:29` canonical | `softreset.school` |
| `public/sitemap.xml` (all 17 URLs) | `bedcoders.com` |
| `public/robots.txt` header | "Bedcoders — a coding school…" |
| `Imprint.tsx:9` | "Legal notice for **Bedcoders**" |
| `TermsOfService.tsx:22` | binds the customer to "bedcoders.com" |
| every contact email | `hello@` / `legal@` / `privacy@bedcoders.com` |
| `checkout.ts:182` | `APP_URL ?? 'https://bedcoders.com'` |
| `vercel.json` CSP `connect-src` | `https://api.bedcoders.com` |
| `package.json` name | `bedcoders` |

The last two are functional, not cosmetic: if `APP_URL` is unset in Vercel, every successful
Stripe payment redirects the buyer to a different domain, and the CSP permits API calls to a
host the app no longer uses while (as far as this file is concerned) not permitting the one it
does. The legal ones are worse in a quieter way — the contract a paying EU consumer accepts
names a website that is not the website they bought from.

---

## 3. The pattern, which is the actual review

Findings F-1 through F-5 are ordinary. Every early-stage product has a list like it. What is
not ordinary is **which** work got done.

Six days, roughly forty commits:

- retired the subscription and designed a credential model
- verified four exam banks question by question
- fixed platform-wide exam scoring and unpassable exams
- made nine interactive templates spoonie-accessible
- ran five simulated learner sessions and fixed what they hit
- convened an expert advisory board on three honesty questions
- wrote a sponsor/community readiness audit
- wrote a content/business/SEO review
- rebranded, renamed, recovered the production source
- wrote a 100-hour curriculum architecture and the first module against it

And in the same six days, from that SEO review's own "TOP 5 FIXES TO DO THIS WEEK":
**zero are done.** Not the 15-minute one. Not the 30-minute copy fix. Not the one-line email
default — `subscribe.ts:17` still reads `sequence ?? 'spooniversity_launch'`, still routing
every Soft Reset School signup, including 3,721 migrated Substack subscribers, into the sister
product's funnel.

Three PRs are open and stale: **#1** (2026-08-02), **#4** (2026-08-04), **#6** (2026-08-05).
PR #6 is `npm run lint` clean, 117 tests passing, build clean, and contains the fixes for F-3
and F-4 plus the CI workflow that would have caught the next regression. It has been sitting
for three days while the 100-hour architecture was written. `CLAUDE.md` — this repo's own
policy, added 2026-08-05 — says green PRs get merged rather than left open. It is being
overridden by the author who wrote it.

The shape is consistent and it is worth naming precisely, because it is not laziness and it is
not a capacity problem: **the generative work is getting done and the closing work is not.**
Writing a curriculum architecture is intellectually satisfying, produces something to show, and
can be done from bed on a medium day. Merging a PR, pasting a GA4 ID, and reconciling a Terms
of Service with a domain name are none of those things. They are also the only work standing
between this project and its first euro.

There is a second-order version of the same thing. Six days produced **three separate
strategic reframes** — sponsor-and-community platform, then verified career credentials, then
a 100-hour vocational architecture. Each was well argued. None was tested, because F-1 makes
testing impossible. A new frame is the most satisfying possible substitute for evidence, and
this repo is generating them faster than it can validate them.

The 100-hour architecture deserves a specific warning. It commits to 150 lessons, 30 practice
sets, 30 labs, and 30 checkpoints **per track** — 240 units × 8 tracks. Current progress is
36.9 of 800 hours. Completing it as specified means authoring roughly **763 more hours** of
instructional content, solo, with variable capacity, before the catalog stops overstating what
it sells. At a genuinely sustainable pace that is a multi-year commitment. A plan that requires
763 hours of authoring before the product becomes honest is not a plan that is too slow — it is
the wrong plan, and the pace is not what is wrong with it.

---

## 4. What I would actually do

### The strategic call: stop building curriculum

The business is not content-constrained. Thirty-seven hours of material is more than enough to
discover whether anyone wants this. It is **evidence-constrained** and **distribution-
constrained**, and no additional lesson touches either.

**Narrow to one track: Digital Accessibility QA.** It is the only one where every factor lines
up — a legal deadline someone else set (the European Accessibility Act), a buyer with a budget
line and no good alternative supplier, a differentiator no competitor can hire their way into,
and the highest-margin service in the model attached to it. Take it to a depth you would defend
in front of a hiring manager. Freeze the other seven at "free to read, no credential." Eight
tracks at 4% is worth less than one track at 60%.

**Then invert the revenue order.** `BUSINESS_MODEL.md` lists accessibility audits as stream #5,
gated behind "delivered with graduate reviewers" — graduates of an 11-lesson track, of whom
there are currently zero. That sequencing makes the only stream with real money in it wait on
the stream with the least. Reverse it: **sell audits now, with Roi doing the work.** A single
EAA compliance audit is worth €3,000–15,000 — more than a hundred credentials that are one
click from free. It produces revenue this quarter, generates the case studies the training
needs, and tells you what employers actually pay for. The track then becomes the pipeline that
scales delivery, which is the right order: the service proves the demand, the credential
industrialises it.

That also resolves F-2 cleanly. If employers and agencies are the payers, learner credentials
can be free without guilt, and the pricing page stops arguing with itself.

### The two-week list, in order

| # | Do | Time | Why this one |
|---|---|---|---|
| 1 | **Merge PR #6.** Green, tested, three days old. | 10 min | Closes F-3 and F-4, adds CI. Nothing else on this list is worth doing while a live VAT gap and a 1.7-hour credential are on sale. |
| 2 | Do the three Stripe Dashboard steps PR #6 names — **especially `tax_behavior = inclusive`** | 30 min | Skipping step 2 charges an Austrian learner €82.80 against a promised €69. |
| 3 | Replace `vercel.json`'s 404 catch-all with `{ "src": "/(.*)", "dest": "/index.html" }`; verify `/pricing` and `/terms` return 200 in production | 15 min | F-5. Everything downstream is theatre until the pricing page loads. |
| 4 | Real GA4 or PostHog ID, behind the consent gate; correct the policies to name only live processors | 90 min | F-1. This is the one that converts every future decision from opinion to evidence. |
| 5 | One domain, one name: sitemap, robots, Imprint, ToS, all `@bedcoders.com` addresses, `APP_URL`, CSP `connect-src`, `package.json` | 2 hrs | F-5. The contract naming the wrong website is the part that actually matters. |
| 6 | Move pay-what-you-can *inside* checkout; default to €69 or blank, never €0 | 1 hr | F-2. Keeps the dignity, removes the zero anchor. |
| 7 | `subscribe.ts:17` → default `bedcoders_welcome`, and rewrite that sequence to sell something | 45 min | Still handing 3,721 owned subscribers to the sister product. |
| 8 | **Ten conversations with EU companies about EAA audits.** No code. | the rest | The only item on this list that can discover whether the business exists. |

Items 1–7 total under seven hours of work — call it three or four working sessions at a
realistic pace, or one bad week. They have been available for four days. Item 8 is the whole
job, and it is the only one that cannot be done from inside the repo, which is very likely why
none of the previous six days went to it.

### One structural suggestion

Add a `STATE.md` at the repo root with five numbers and a date: unique visitors, signups,
credentials issued, euros collected, authored hours (`curriculum:audit` prints the last one
already). Update it weekly. Right now every strategy document in this repo opens by asserting
what the business is; none of them opens by stating where it is. Four of those five numbers are
currently unknowable — which is itself the finding, and a file with four blanks in it will
apply more pressure to fix F-1 than this review will.

---

## 5. The part that isn't in the code

The thesis is right. "People coming back from serious illness need a credible route back to
income, at the pace their body allows" is a real, underserved, growing market, and the person
building it has standing in it that no competitor can buy. The accessibility-QA insight is
genuinely good. The honesty discipline is a durable advantage in a category built on
overpromising.

None of that is the constraint. The constraint is that six days of exceptional generative work
produced three strategic frames, two audits, a curriculum architecture, and forty commits —
and did not produce a merged PR, a working pricing URL, an analytics ID, or one conversation
with someone who might pay. The gap is not talent, effort, or capacity. It is that the last
mile of every workstream is the least rewarding part of it, and it is currently the only part
that matters.

Merge the PR. Then go talk to ten companies about the Accessibility Act.

---

*Read-only review. No application code was changed by this document.*
