# The Job-Ready Program Standard (v1)

*Written 2026-08-05. The bar every career track must clear before it can call its graduate
ready to work — and the build spec anyone (human or agent) authoring curriculum works from.*

## Why this exists

A 3-lesson track is not a route back to income; it's a pamphlet. The credential gate now
stops us selling those (`src/data/credentialBar.ts`), but a gate only prevents harm — it
doesn't produce a graduate an employer wants to hire. This document defines what does.

The claim we want to be able to defend, in public, to a hiring manager:

> *"This person has completed 12–15 hours of structured instruction in this role, produced
> five reviewable artefacts of the exact kind the job requires, and passed an exam that
> includes judgment questions a search engine can't answer. Here is the competency map. Here
> is their portfolio. Verify it yourself."*

Every requirement below exists to make one clause of that sentence true.

## The standard

A **career track** is job-ready when all of the following hold:

| # | Requirement | Why |
|---|---|---|
| 1 | **≥ 36 published lessons** across **6 domains**, ~15–25 min each → **12–15 hours** | Below ~12 hours nobody can honestly claim role readiness. |
| 2 | **≥ 100 `MULTIPLE_CHOICE` exercises** across the track | Makes the exam bank ≥ 4× the exam size — permanently kills the `drawsFullBank` problem, where the exam *is* the practice set. |
| 3 | **≥ 24 `OPEN_ENDED` judgment exercises** | The exam folds in AI-graded judgment questions. Passing must require judgment, not recall. |
| 4 | **5 portfolio artefacts + 1 capstone**, each with a published rubric | What an employer actually reads. An exam score is a claim; an artefact is evidence. |
| 5 | **A competency map** — every domain states the job tasks it qualifies someone for | Turns "passed a course" into "can do these things on Monday". |
| 6 | **Every lesson has a low-spoon core path** | See below. Non-negotiable, and the reason this school exists. |

A track meeting all six may carry the €69 Career Credential and the words "job-ready" in
marketing. A track meeting fewer may not, regardless of how good the individual lessons are.

## The five innovations (what makes this different from an online course)

These are the design commitments that make the programs worth building rather than
assembling from existing material.

### 1. One continuous engagement, not a topic list

Each track follows **a single realistic engagement from first contact to delivery**, running
across all six domains. The accessibility track audits one real-shaped client site across the
whole program. The dev track ships one real-shaped feature. Lessons compound into a
deliverable instead of resetting each time.

Why it matters: a graduate can say *"here is the audit I ran"* rather than *"here are the
topics I studied."* It also solves the returning-learner problem — the narrative is the
memory aid for someone coming back after six weeks in a flare.

### 2. Two-speed lessons — the low-spoon path is designed, not improvised

Every lesson is authored at two depths:

- **Core path (~8–10 min):** the thing you must know, the one worked example, one check.
  Marked with `"corePath": true` on the content sections that comprise it.
- **Full path (~20–25 min):** everything, including the extended example and the harder
  exercises.

Both paths count as completing the lesson. A learner on a bad day takes the core path and is
*not behind* — they've met the learning objective, just with less practice. Nothing in the
UI, progress tracking, or credential eligibility distinguishes the two.

No other vocational program is built this way, because no other vocational program starts
from the assumption that capacity varies daily and unpredictably. This is the single most
defensible thing about the pedagogy — it should be built in, not bolted on.

### 3. Artefact-first modules

Each domain ends by producing a **portfolio artefact** — a real deliverable in the format the
job uses: an audit report, a remediation ticket set, a scoping memo, a reviewed pull request,
a coding-exception memo. Each artefact ships with:

- a **brief** (what the client/employer asked for),
- a **rubric** (what "good" means, in the terms a reviewer would use),
- a **worked exemplar** (one complete, honest example — not a template to fill in).

The €25 human review attaches naturally here, and the artefacts are what the placement
conversation (`RECOMMENDATIONS.md` #4) is actually about.

### 4. Judgment over recall, assessed as such

Every domain contributes at least 4 `OPEN_ENDED` judgment items with grading rubrics. These
are situations where the correct answer is *"it depends, and here is what it depends on"* —
the thing employers say is missing from bootcamp graduates, and the thing our learners, who
have spent years navigating systems that don't fit them, are frequently better at than
their conventionally-trained peers.

### 5. A competency map an employer can read

Each domain declares the concrete job tasks it qualifies a graduate to perform. Aggregated,
this becomes the competency map published alongside the certificate. An employer verifying a
credential sees *what the person can do*, not just that a fee was paid and a test was passed.

## Build spec — file formats

Content lives in `backend/prisma/seed-data/domains/<track-slug>/<domain-slug>/` as three
files. Everything below is enforced by existing seeding code, so it isn't stylistic.

### `modules.json`

```jsonc
[{
  "id": "awc-f1",                    // unique, stable, kebab/short prefix per track
  "title": "Where AI Belongs in a Process",
  "description": "One or two sentences, concrete.",
  "tier": "foundation",              // foundation | application | mastery
  "bloomLevel": "analyze",           // remember|understand|apply|analyze|evaluate|create
  "order": 1
}]
```

Tier progresses across the track: early domains `foundation`, middle `application`, capstone
`mastery`.

### `lessons.json`

```jsonc
[{
  "id": "awc-f-l01",                 // unique across the whole platform
  "moduleId": "awc-f1",              // must match a module id in this domain
  "title": "Not Every Step in a Process Is the Same Kind of Decision",
  "description": "One sentence a learner reads before deciding to open it.",
  "duration": 25,                    // minutes, full path
  "order": 1,
  "learningObjectives": [
    { "text": "Break a process into steps and classify each by decision type",
      "bloomLevel": "analyze" }
  ],
  "contentSections": [ /* see below */ ]
}]
```

**Section types available** (use them; don't invent new ones — the renderer only knows these):
`pod-header`, `hook`, `text`, `interactive-guess`, `concept-flow`, `callout`, `takeaway`,
`exercise`, `diagnose-mechanism`, `evidence-stack`, `predict-number`, `sequence-it`,
`prompt-build`, `build-it`, `spot-flaw`.

**Required lesson anatomy** (in order):

1. `pod-header` — title, `podNumber`, `duration`
2. `hook` — a specific, concrete situation. A named scenario with real stakes, not "imagine
   you are a developer". This is where the track's continuous engagement advances.
3. `text` — the actual teaching. Markdown. Use **bold** lead-ins for scannable structure.
4. `interactive-guess` — ask before telling; the learner commits to an answer first.
5. At least one `exercise` reference
6. `takeaway` — what to remember when everything else has been forgotten

Mark the minimum viable subset with `"corePath": true` (typically hook, one text section,
one interactive-guess, one exercise, takeaway).

### `exercises.json`

```jsonc
[{
  "ref": "AWC-F-001",                // unique, TRACKPREFIX-DOMAIN-NNN
  "moduleId": "awc-f1",
  "lessonId": "awc-f-l01",
  "type": "MULTIPLE_CHOICE",
  "prompt": "…",
  "config": { "options": [{ "text": "…", "correct": true }] },
  "hints": ["…"],
  "explanation": "Why the right answer is right AND why each wrong one is tempting.",
  "bloomLevel": "analyze",
  "difficulty": 3,                   // 1–4
  "xpReward": 15,
  "isKnowledgeCheck": true
}]
```

Supported `type` values and their `config` shape:

| type | config |
|---|---|
| `MULTIPLE_CHOICE` | `{ options: [{text, correct}] }` — 3–5 options, exactly one correct |
| `OPEN_ENDED` | `{}` — graded by AI against `explanation` as rubric |
| `TRUE_FALSE_JUSTIFY` | `{ correctAnswer: true|false }` |
| `CATEGORIZATION` | `{ categories: [{name, items: []}] }` |
| `MATCHING` | `{ pairs: [{left, right}] }` |
| `SEQUENCING` | `{ items: [], correctOrder: [] }` |
| `FILL_IN_BLANK` | `{ blanks: [{answer, alternatives?}] }` |

## Quality bar — how to tell real curriculum from filler

Content that fails any of these gets rewritten, not shipped:

1. **Every hook names a specific situation.** "A client asks you to automate their refund
   process" — not "accessibility is important for many users."
2. **Every multiple-choice distractor is tempting.** If a learner can eliminate three options
   without knowing the material, the question tests reading comprehension, not skill. The
   `explanation` must say why each wrong answer attracts.
3. **Nothing is asserted that a practitioner would dispute** without acknowledging the
   dispute. Where the field disagrees, teach the disagreement — that's the judgment being
   sold.
4. **No inflated earnings or outcome claims.** Ever. Not in a hook, not in an example.
5. **Concrete over abstract.** Real WCAG success criteria numbers, real screen-reader
   behaviours, real error messages, real code. A lesson that could have been written without
   knowing the domain is filler.
6. **Respects the reader.** These are adults with professional histories, currently ill. Not
   beginners in life. No cheerleading, no "you've got this!", no infantilising.

## Per-track blueprint — Phase 1

Two tracks, 36 lessons each, taking both from below the credential bar to job-ready.

### ♿ Digital Accessibility QA (`accessibility-qa-lived-experience`)

Continuous engagement: **a mid-size EU retailer's site**, audited from scoping to
remediation hand-off, under European Accessibility Act pressure.

| # | Domain (slug) | Lessons | Artefact |
|---|---|---|---|
| 1 | What Accessibility Actually Means (`foundations`) | 6 (3 exist) | Barrier inventory |
| 2 | Assistive Technology Fluency (`assistive-tech-fluency`) | 7 | AT test matrix |
| 3 | WCAG & the European Accessibility Act (`eaa-standards`) | 6 | Conformance scoping memo |
| 4 | Running a Real Audit (`audit-practice`) | 8 | Full audit report |
| 5 | Reporting, Remediation & Advocacy (`advocacy-and-change`) | 5 | Prioritised remediation tickets |
| 6 | Client Engagement Capstone (`capstone`) | 4 | Capstone: end-to-end audit + defence |

### 🧭 AI-Assisted Software Development (`ai-orchestrated-dev`)

Continuous engagement: **shipping one real feature** — spec to production — directing AI
tools throughout and owning every correctness decision.

| # | Domain (slug) | Lessons | Artefact |
|---|---|---|---|
| 1 | Directing, Not Typing (`foundations`) | 6 (2 exist) | Executable task brief |
| 2 | Specs, Tests & Verification (`specs-and-verification`) | 6 | Spec + test plan |
| 3 | Reviewing AI-Generated Code (`review`) | 7 (2 exist) | Annotated code review |
| 4 | Agentic Workflows (`agentic-workflows`) | 7 | Multi-step agent run log + critique |
| 5 | Shipping with AI Assistance (`shipping`) | 6 | Deployment + monitoring plan |
| 6 | Portfolio Capstone: Ship & Defend (`capstone`) | 4 | Capstone: shipped feature + defence |

Phase 2 (not in this pass): `ai-workflow-consulting` and
`ai-oversight-health-informatics`, 8 → 36 lessons each, same standard.

## Definition of done

- [ ] Lesson and exercise counts meet the table above
- [ ] `npx vitest run` passes — including `credentialBar.test.ts`, which asserts the public
      catalog matches the seeded lesson counts exactly
- [ ] `src/data/trackCatalog.ts` regenerated from seed data (counts, minutes, domains)
- [ ] Both tracks clear the credential bar, so their €69 credential re-opens automatically
- [ ] `BUSINESS_MODEL.md` updated: which tracks are sellable, and why that changed
