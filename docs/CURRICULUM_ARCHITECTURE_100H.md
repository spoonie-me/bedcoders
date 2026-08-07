# The 100-Hour Track Architecture

How a Soft Reset School track is built when it is meant to carry a credential
someone pays for and puts on a CV.

This document is the contract. `backend/prisma/seed-data/curriculum-plan/<track>.json`
is the machine-readable instance of it, and `npm run curriculum:audit` is the thing
that tells you, without flattery, how far each track currently is from it.

---

## 1. Why 100 hours, and what the number has to mean

A 100-hour figure is worthless as a marketing number and valuable as a design
constraint. It is roughly the depth at which someone who arrives without the skill
leaves able to do paid work in it — comparable to a serious vocational module, not
a weekend course.

So the number is a *budget to spend*, not a total to reach. It is only honest if
every hour in it is an hour a learner actually spends **doing something**. An hour
of reading is not an hour of learning. The budget below is written so that a track
cannot hit 100 hours by getting wordier.

### The hour budget

| Component | Hours | Share | What it is |
|---|---:|---:|---|
| Lessons (guided instruction + embedded practice) | 55 | 55% | The teaching itself — 150 lessons averaging 22 min |
| Deliberate-practice sets | 15 | 15% | 30 drill sets, one per module, no new concepts |
| Applied labs | 25 | 25% | 30 labs producing an artefact the learner keeps |
| Spaced retrieval checkpoints | 5 | 5% | 30 checkpoints, 10 min, low-stakes |
| **Total** | **100** | | 6,000 minutes |

Capstone and exam sit on top of the 100 and are counted separately, because a
learner who has already met the outcomes should not be told the exam is part of
the learning.

### The unit that makes the arithmetic work

Everything divides cleanly, on purpose. One track is **30 modules of 200 minutes**:

```
MODULE = 200 min
  ├── 5 lessons          @ ~22 min  = 110 min
  ├── 1 practice set     @  30 min  =  30 min
  ├── 1 applied lab      @  50 min  =  50 min
  └── 1 checkpoint       @  10 min  =  10 min

30 modules × 200 min = 6,000 min = 100 hours
```

Grouped into **6 phases of 5 modules** (≈16.7 hours per phase). A phase is the unit
a learner describes to someone else: "I've done the review-and-verification phase."

Per track that is 150 lessons, 30 practice sets, 30 labs, 30 checkpoints — 240 units.
Nothing about this is negotiable downward without saying so out loud in the catalog.

---

## 2. The learning cycle

Every lesson is 2–4 **pods** of 5–10 minutes. Each pod is a complete cycle. A pod
that stops before step 5 is not a pod; it is an article.

```
1  HOOK             ~1 min   A concrete situation. Never a definition, never
                             "in this lesson we will."
2  PREDICT          ~2 min   The learner commits to an answer BEFORE being told.
                             Uses the guess-first templates (concept-flow,
                             diagnose-mechanism, spot-flaw, predict-number,
                             evidence-stack, sequence-it).
3  EXPLAIN          ~4 min   The mechanism. ≤400 words. One concept per pod.
4  WORKED EXAMPLE   ~5 min   Fully worked first, then the same procedure with
                             steps progressively blanked (worked-example section).
5  APPLY            ~5 min   Exercise in the SAME context as the explanation.
6  VARY             ~5 min   Exercise in a DIFFERENT context. Same skill.
7  TAKEAWAY         ~1 min   One sentence the learner could say out loud.
```

Steps 2, 4, 5, 6 are interactive. That is the floor, not the ceiling.

**Why this order.** Prediction before instruction produces a much larger retention
effect than the same content read in the same order without the commitment step —
the learner has to notice they were wrong. Faded worked examples beat both pure
worked examples (no retrieval) and pure problem-solving (cognitive overload) for
learners who are new to a domain, which is most of ours. APPLY-then-VARY is
interleaving: same skill, changed surface features, which is what makes the skill
transfer instead of binding to one scenario.

### The two rules that make it real, not decorative

1. **≥40% of every lesson's minutes are interactive sections**, not prose. Audited.
2. **No concept is introduced without an application in the same pod.** If a concept
   has no exercise attached, it is either not worth teaching or it belongs somewhere
   else.

---

## 3. Spaced retrieval — the 40/40/20 rule

Every module ends with a 10-minute checkpoint. It is not graded, it is not timed, and
it is framed as "let's see what stuck," never "test yourself."

Its 10 questions are drawn:

- **40% from this module** — consolidating
- **40% from the previous module** — one module of spacing
- **20% from three or more modules back** — long-interval retrieval

That third slice is the whole point. It is the only mechanism in the track that
fights the forgetting curve across a course someone takes over four months at
variable capacity, and it is the first thing that gets quietly dropped when someone
is authoring in a hurry. The audit script fails a checkpoint whose `pulls` don't
match.

Phase boundaries add a **phase review**: 20 minutes, mixed retrieval across all five
modules, plus one transfer question that requires combining two modules' skills.

---

## 4. Deliberate practice sets

One per module, 30 minutes, no new concepts. This is where a skill stops being
something the learner has seen and becomes something they can do.

A practice set is 6–8 drills with these properties:

- **Narrow.** Each drill targets one sub-skill from the module, not the module.
- **Immediately corrected.** Feedback keyed to the specific wrong answer, explaining
  the misconception, not "incorrect."
- **Difficulty-laddered.** The set opens at the level the lesson ended and finishes
  one clear step above it.
- **Varied in format.** No more than two consecutive drills of the same exercise type.
  The bank is: MULTIPLE_CHOICE, OPEN_ENDED, MATCHING, SEQUENCING, FILL_IN_BLANK,
  CASE_STUDY, DIAGRAM_LABEL, CODE_QUERY, TRUE_FALSE_JUSTIFY, CATEGORIZATION.

---

## 5. Applied labs

One per module, 50 minutes, producing something the learner keeps. Twenty-five of
the hundred hours are labs, because a credential backed only by quiz scores is worth
what quiz scores are worth.

Every lab has, as data, not as prose:

- **A brief** — the situation, written the way the request would actually arrive.
- **Staged steps** — 3–5 stages, each independently checkable, each resumable. A lab
  is never one 50-minute block; it is five 10-minute blocks with saved state.
- **A deliverable** — an artefact: a reviewed diff, an audit report, a scoped
  proposal, a working script, a coded record set.
- **A rubric the learner sees before starting.** 4–6 criteria, each with a concrete
  "meets" description. Not a score out of 100 with no explanation of what earns it.
- **A self-check pass before submission**, against that same rubric. Self-assessment
  against an explicit rubric is a skill the job requires, and it is cheap to teach here.

Labs escalate across the track: phase 1 labs are heavily scaffolded (fill in the
missing stages), phase 6 labs are a brief and a blank page.

---

## 6. Energy-aware pacing

This is the part most curricula don't have and this one cannot skip. Our learners
are, largely, people whose available hours are variable and whose bad days are not
a motivation problem. A 100-hour track that assumes 100 good hours is a 100-hour
track that gets abandoned at hour nine.

Every unit carries an **energy cost**: `low`, `medium`, `high`.

| Cost | Feels like | Typical unit |
|---|---|---|
| `low` | Can be done lying down, on a phone, foggy | Checkpoints, reading + reveal, single-concept pods |
| `medium` | Needs a table or a lap desk and some focus | Standard lessons, practice sets |
| `high` | Needs a genuinely good day | Labs, capstone stages, multi-step synthesis |

The rules, all enforced by the audit script:

1. **Never two consecutive `high` units.** Not within a module, not across a module
   boundary.
2. **At most one `high` unit per module.** In practice this is the lab.
3. **Every module has a low-energy path** — a subset of its units, marked
   `badDayPath: true`, that still covers every module objective. Roughly half the
   minutes. The learner is told which units these are, so "I only have 40 minutes
   and no brain today" has a real answer that isn't "skip the module."
4. **No unit exceeds 30 minutes.** Longer units are staged with saved state.
5. **Nothing is timed.** No countdown, no expiry, no streak-loss. The only timer in
   the product is the exam, and it is generous.

---

## 7. Mastery and gating

Progression is by demonstrated skill, not by pages turned.

- **Module mastered** = checkpoint ≥70% **and** the lab submitted. Both, not either.
- **Phase gate** = all five modules mastered **and** phase review ≥75%. The gate is
  soft: a learner can read ahead freely. It controls what counts toward the
  credential, not what they are allowed to see.
- **Track complete** = 6 phase gates + capstone + exam ≥75%.

A failed checkpoint does not lock anything. It schedules the missed items into the
next two checkpoints' 20% slice, which is a better response to "you didn't retain
this" than a locked door.

### Exam integrity

Once a track reaches the full architecture, its exam bank must be **at least 5× the
exam's question count**, stratified so no phase supplies more than 25% of a sitting,
with **≥30% of questions at Bloom `analyze` or above**. Until a track's bank meets
that, `drawsFullBank: true` stays set in `src/data/trackCatalog.ts` and the catalog
says so on the page. We disclose thin banks rather than hoping nobody counts.

---

## 8. The quality bar — what makes a unit real

A unit ships only if it passes all of these. These are the anti-filler rules, and
they exist because the fastest way to reach 100 hours is to write 100 hours of
nothing.

**Every unit must:**

- Teach something no earlier unit in the track taught. Restating with new words is
  padding; a checkpoint restating deliberately is not, and is labelled as retrieval.
- Be defensible to a practitioner. Would someone who does this for a living say
  "yes, that's how it works"? If the answer needs a caveat, write the caveat in.
- Use a concrete, specific scenario. Not "a company," but the actual situation with
  the actual constraint. Wrong answers in exercises must be things a real learner
  would actually pick, with feedback explaining why that belief is tempting.
- Be honest about limits. Where a technique fails, say so in the lesson that teaches
  it, not three modules later.

**Every unit must not:**

- Open with a definition or a list of what the lesson will cover.
- Contain a multiple-choice question whose wrong answers are obviously filler.
- Contain a reflection prompt of the form "What did you learn?" or "How do you feel
  about this?" Use specific prompts: "Where in your actual work would this apply?",
  "Describe the last time you did this badly — what would you do now?", "What's still
  unclear? Write it as a question."
- Introduce a tool, library, or vendor without saying what it costs and what happens
  when it's not available.
- Assume the learner has a full day, a desk, a second monitor, or a good week.

---

## 9. Section types available to authors

Rendered by `src/pages/Lesson.tsx`. Interactive types are marked ✦ and count toward
the 40% interactivity floor.

| Type | Use it for |
|---|---|
| `hook` | Pod opener — a concrete situation |
| `text` | Explanation prose (markdown) |
| `callout` | `info` / `warning` / `tip` / `example` asides |
| `pod-header` | Pod boundary marker with its own duration |
| `takeaway` | The one-sentence close of a pod |
| `exercise` | Reference into `exercises.json` by `ref` |
| ✦ `interactive-guess` | Cheap predict-then-reveal |
| ✦ `concept-flow` | Classify a real example before the concept is named |
| ✦ `diagnose-mechanism` | Diagnose a root cause before it's named |
| ✦ `spot-flaw` | Find the defect in a snippet, with per-choice feedback |
| ✦ `sequence-it` | Put steps in order before seeing the order |
| ✦ `build-it` | Assemble a correct artefact from parts |
| ✦ `evidence-stack` | Multi-select: which of these apply, and why each does or doesn't |
| ✦ `predict-number` | Commit to a quantity before seeing the real one |
| ✦ `prompt-build` | Compose a prompt from components, get it critiqued |
| ✦ `worked-example` | Fully worked, then faded — steps blanked one at a time |
| ✦ `retrieval-check` | Spaced retrieval, sourced from named earlier modules |
| ✦ `case-sim` | Branching scenario — decisions with consequences that compound |
| ✦ `lab-brief` | Staged, resumable lab with a visible rubric and self-check |

Authoring rules: at most one non-interactive section may sit between two interactive
ones. Every pod contains at least one ✦. Consecutive sections never repeat the same
✦ type.

---

## 10. Current state and the honest gap

`npm run curriculum:audit` prints authored minutes against the 6,000-minute target
per track and lists every spec violation. It is the source of truth for the numbers
in `src/data/trackCatalog.ts`, and the `curriculum` vitest suite fails if the catalog
drifts from the seed data.

Until a track reaches its target, its catalog entry keeps `curriculumNote` set to a
statement of what is actually there. We do not describe a 3-hour track and a 100-hour
track with the same words.

---

## 11. Authoring order

Build a track **phase by phase, module complete**, never lesson-by-lesson across the
whole track. A finished module — 5 lessons, practice set, lab, checkpoint — is
shippable and sellable. Fifteen half-finished modules are not.

Within a module:

1. Write the module objective and the lab first. The lab is the assessment; the
   lessons exist to make it passable.
2. Write the checkpoint's 40/40/20 pulls second, which forces you to name what must
   be retained.
3. Write the five lessons.
4. Write the practice set last, targeting whatever the lessons turned out to
   under-drill.
5. Run `npm run curriculum:audit` and fix every violation before moving on.
