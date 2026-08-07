# Content Authoring Guide — writing a module into the seed data

The operational reference for turning one blueprint module (from
`backend/prisma/seed-data/curriculum-plan/<track>.json`) into real lesson and
exercise JSON. Read `docs/CURRICULUM_ARCHITECTURE_100H.md` first for *why*
the shape below is what it is — this document is the *how*.

The canonical worked example is the module already authored this way:
`backend/prisma/seed-data/domains/accessibility-qa-lived-experience/foundations/`
— module `aqa-f2` in `lessons.json`/`exercises.json`. When in doubt, match
its density, its interaction cadence, and its register. Open it side by side
with this guide.

## 1. What one module produces

Per the architecture doc, one module = 200 minutes = eight rows in
`lessons.json` (the app's `Lesson` model treats every unit — a real lesson,
the practice set, the lab, the checkpoint — as a "lesson" row, distinguished
by content, not by a separate type field):

1. **Five real lessons** (110 min total) — titles, minutes, energy, bloom
   level and `badDayPath` flag come directly from the blueprint. Do not
   invent different ones; the blueprint's numbers are load-bearing (the
   audit checks lesson minutes sum to exactly 110).
2. **One practice set** (30 min) — the blueprint gives its title and drill
   count (6-10).
3. **One lab** (50 min, staged) — the blueprint gives its title, stage count
   and deliverable.
4. **One checkpoint** (10 min) — ungraded retrieval, pulling 4/4/2 from this
   module / the previous module / three-or-more-back (see §3 below for the
   first two modules of a track, which relax this since nothing precedes
   them yet).

## 2. File layout and IDs

For blueprint phase `<phase-slug>` of track `<track>`, the domain folder is
`backend/prisma/seed-data/domains/<track>/<domain-slug>/` — **the domain
folder's slug is not always the same as the blueprint phase's slug**; you
will be told the exact folder to use. It contains `modules.json`,
`lessons.json`, `exercises.json`, all JSON arrays (start `[]` if empty).

**Never rewrite these files.** Load the existing array, filter out anything
with `moduleId` equal to the module you're (re-)authoring (so a re-run is
idempotent), append your new entries, write back with `indent=2`,
`ensure_ascii=False`, and a trailing newline. Do this in a throwaway Python
script under the scratchpad, the same way `aqa-f2` was authored — do not hand
-edit the JSON files directly, they're too large to safely diff by eye.

**ID conventions** — pick a short, stable, track-scoped prefix for the
module (e.g. `aqa-f2`, `aod-cs1`, whatever reads sensibly for your track/
phase/module), then:

- Module id: `<prefix>` — goes in `modules.json` and as `moduleId` on every
  lesson/exercise row belonging to it.
- Lesson ids: `<prefix>-l01`..`<prefix>-l05` for the five real lessons,
  `<prefix>-p01` for the practice set, `<prefix>-lab` for the lab,
  `<prefix>-cp` for the checkpoint. `order` 1-8 respectively.
- Exercise refs: `<TRACK-PREFIX>-<MODULE>-NNN` for lesson exercises (e.g.
  `AQA-F2-001`), `<...>-PNN` for practice-set drills (e.g. `AQA-F2-P01`).
  Refs must be **globally unique across the whole repo** — prefix with
  something that can't collide with another phase's agent (your module's
  own prefix is enough).

**modules.json entry:**
```json
{
  "id": "<prefix>",
  "title": "<blueprint module name>",
  "description": "<blueprint module objective, expanded to a real sentence>",
  "tier": "<blueprint tier>",
  "bloomLevel": "<blueprint bloom>",
  "order": <blueprint module order within its phase, 1-5>,
  "blueprintModule": "<blueprint module slug>"
}
```

## 3. Checkpoint pulls

The blueprint's `checkpoint.pulls` tells you the 40/40/20 split *by count*
(e.g. `{thisModule: 4, previousModule: 4, olderModules: 2}`), but the
`retrieval-check` section's questions need a `from` string naming the real
module each question is drawn from — write real questions pulling from your
own module's lessons for the `thisModule` share, and if this is module 1 or
2 of the phase (nothing to pull from yet, per the blueprint's own relaxed
pulls for those), just use the full 10 from this module — don't fabricate
references to modules that don't exist yet. If you're authoring module 3+
of a phase you're doing solo, either use your own phase's earlier modules
for the "previous"/"older" slices, or fall back to `thisModule`-only if you
don't have that context — a spec warning on this is not a build failure and
is preferable to a fabricated `from` string.

## 4. Section types — the interaction toolkit

At least 40% of a lesson's *interactive-eligible* sections must be from this
list (§9 of the architecture doc), no two of the same type back to back, and
never more than two non-interactive sections in a row.

**Cheap / prose (not interactive, use freely but don't let them dominate):**
`hook` (`{type, body}`), `text` (`{type, body}`, markdown), `callout`
(`{type, variant: 'info'|'warning'|'tip'|'example', body}`), `pod-header`
(`{type, title, podNumber, duration}` — marks a pod boundary, use at the
start of each ~10-min pod), `takeaway` (`{type, body}` — one sentence,
closes a pod), `exercise` (`{type, exerciseRef}` — points at a ref in
`exercises.json`).

**Interactive — guess-first set** (all from
`src/components/lesson-templates/GuessFirstTemplates.tsx`):

| type | shape |
|---|---|
| `interactive-guess` | `{question, answer, hint?}` — cheap predict-then-reveal |
| `concept-flow` | `{scenario, question, options: {label,value}[], correctValue, feedback: {[value]: string}, concept}` — classify a real example, feedback per choice, concept revealed after |
| `diagnose-mechanism` | same shape as concept-flow but `mechanism` instead of `concept` — diagnose a root cause |
| `spot-flaw` | `{code, question, options, correctValue, feedback, flawExplanation}` — find the defect in a snippet |
| `sequence-it` | `{question, steps: string[] (correct order), explanation}` — steps are shuffled for the learner |
| `build-it` | `{intro, objectName, fields: {key,prompt,options,correctValue,feedback}[], synthesis}` — assemble something field by field |
| `evidence-stack` | `{scenario, question, items: {value,label,applicable}[], explanation: {[value]: string}, synthesis}` — multi-select which apply |
| `predict-number` | `{scenario, question, unit?, actualValue, explanation}` — commit to a number before reveal |
| `prompt-build` | `{intro, fields: {key,question,options,correctValue,feedback}[], synthesis}` — compose from components |

**Interactive — depth set** (from
`src/components/lesson-templates/DepthTemplates.tsx`, added for this
architecture):

- `worked-example`: `{problem, steps: {label,work,why}[], faded: {problem, blanks: {prompt,answer,accept?,why}[]}, procedure}`. Fully worked first, then the same shape with steps blanked one at a time. `accept` is an optional array of alternative correct phrasings.
- `retrieval-check`: `{title?, framing?, questions: {from,prompt,options: {value,label}[],correctValue,explanation}[]}`. `from` names the module the question pulls from.
- `case-sim`: `{title, opening, start, nodes: {[id]: {situation,question,choices: {value,label,consequence,nextNode?,ending?}[]}}, endings: {[id]: {verdict:'good'|'mixed'|'costly',summary,lesson}}}`. Each choice has exactly one of `nextNode`/`ending`.
- `lab-brief`: `{labId, title, brief, deliverable, stages: {title,minutes,instructions,checkpoint}[], rubric: {criterion,meets}[]}`. `labId` must be globally unique (used as a localStorage key) — use your module prefix, e.g. `aqa-f2-reviewer-profile`.

A lesson section list is a JSON array under `contentSections` on the lesson
row; `learningObjectives` is a JSON array of `{text, bloomLevel}`.

## 5. Exercise types — stick to these six

`exercises.json` rows: `{ref, moduleId, lessonId, type, prompt, config,
hints: string[], explanation, bloomLevel, difficulty (1-5 int), xpReward
(int), isKnowledgeCheck (bool)}`.

Use only these six types — their component contracts are verified; the
other four (`FILL_IN_BLANK`, `CASE_STUDY`, `DIAGRAM_LABEL`, `CODE_QUERY`)
have config shapes that don't match their real usage elsewhere in the repo
or need assets/a sandbox you don't have. Don't reach for them.

| type | `config` shape |
|---|---|
| `MULTIPLE_CHOICE` | `{options: {text, correct}[]}` |
| `OPEN_ENDED` | `{}` (grading is AI-driven from `prompt`/`explanation`; set `isKnowledgeCheck: false`) |
| `MATCHING` | `{pairs: {left,right}[], distractors?: {right: string[]}}` |
| `SEQUENCING` | `{items: string[], correctOrder: number[]}` — **`correctOrder` is required**; if `items` is already written in the correct order, it's the identity permutation `[0,1,2,...]` |
| `TRUE_FALSE_JUSTIFY` | `{statement, correctAnswer: bool, justificationRequired: true, rubric}` — **set `justificationRequired: true` or the component never asks for a reason** |
| `CATEGORIZATION` | `{categories: string[], items: {text, category}[]}` |

Every exercise needs real, specific `hints` (2-3, escalating) and an
`explanation` that teaches the *why*, not just states the right answer —
including explaining why the tempting wrong answers are tempting. This is
what makes an exercise a teaching moment instead of a quiz question. Match
the depth in `aqa-f2`'s exercises, not a one-line explanation.

## 6. Quality bar (§8 of the architecture doc, restated for this job)

- Every scenario is concrete and specific — a real technology, a real
  situation, never "a company" or "some code."
- Wrong answers in exercises are things a real learner would actually
  believe, and the explanation says why that belief is tempting and wrong.
- No lesson opens with a definition or "in this lesson we will cover."
  Open with a concrete situation (the `hook` section).
- No two consecutive high-energy units (the lab is the module's only
  `high` unit — nothing else in the module may be `high`).
- The bad-day path (lessons/checkpoint marked `badDayPath: true` in the
  blueprint) must still cover the module's objective on its own.

## 7. Self-verification before you're done

From the repo root:

```
node scripts/curriculum-audit.mjs --json 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
mine = [w for w in d['warnings'] + d['errors'] if '<your-domain-slug>' in w]
print('\n'.join(mine) if mine else 'clean')
"
```

Fix every **error** involving your module (dangling exercise refs, lesson
minutes not summing to 110, missing bad-day path, etc — these fail the
build). Warnings are advisory; a handful is fine, but if you see the same
one repeated across all five lessons (e.g. every lesson under the
interactivity floor), that's a real signal to add another interactive
section, not something to wave off.

Also run, and make sure neither introduces a new failure attributable to
your files:

```
python3 -c "import json; json.load(open('backend/prisma/seed-data/domains/<track>/<domain-slug>/lessons.json')); json.load(open('backend/prisma/seed-data/domains/<track>/<domain-slug>/exercises.json')); print('valid json')"
```

## 8. Scope discipline

Touch only your assigned domain folder's three JSON files (and
`modules.json` in it). Do **not** edit `trackCatalog.ts`, `domains.json`,
any other track's folder, or run `git commit`/`git push` — those are handled
centrally after your work is reviewed, because they're shared files other
agents are touching concurrently.
