# CLAUDE CODE PROMPT
## Bed Coders — Curriculum Depth Expansion

> Paste this into a Claude Code session.
> This prompt expands every track from 6–10 shallow lessons to ~30 substantive ones.
> Read the entire prompt before writing any code or content.

---

## WHAT YOU ARE DOING

The current curriculum has the right structure but insufficient depth.
Each track has 6–10 lessons, most are short text with a single quiz or simple exercise.
This prompt expands each track to approximately 30 lessons (except Track 6 — see below)
using a specific pedagogical model designed for learners with limited, variable energy.

You are not padding existing lessons. You are adding new concepts, new skills,
new contexts, and new exercise types. Every new lesson must teach something
the track did not teach before.

---

## PEDAGOGICAL MODEL — READ THIS FIRST

### The four-step loop (applies to every module)

Every module follows this pattern, in order:

```
1. EXPLAIN   — short text or worked example (READING lesson, 5–8 min)
               Introduces one concept only. No concept list. No overview slide.
               Opens with a concrete scenario, not a definition.

2. APPLY     — interactive exercise (EXERCISE lesson, 10–15 min)
               Learner uses the concept immediately.
               Claude provides feedback. Hints available.

3. VARY      — second exercise in a different context (EXERCISE lesson, 10 min)
               Same skill, different scenario.
               This is interleaving — the research is clear that varied practice
               beats blocked practice for retention.

4. REFLECT   — structured reflection or retrieval quiz (REFLECTION or QUIZ, 5 min)
               Not "what did you learn?" — that produces nothing.
               Specific prompts: "Describe a situation from your own life where
               this would apply." or "What surprised you about this concept?"
               or a retrieval quiz testing the last 2–3 lessons.
```

Not every module needs all four steps. Low-energy days may have EXPLAIN + REFLECT only.
The key is that APPLY always precedes REFLECT — practice before reflection, always.

### Spaced retrieval

Every 5 lessons, insert one RETRIEVAL lesson:
- Type: QUIZ
- Content: 5 questions pulling from the previous 5 lessons
- Not graded — just retrieval practice
- Framing: "Let's see what stuck." (not "test yourself")
- Energy cost: LOW
- These do NOT count toward the 30-lesson target — they are added on top.
  A 30-lesson track will have approximately 6 retrieval checkpoints.

### Reflection prompts — exact framing

Never use: "What did you learn?" / "How do you feel about this?" / "Summarise the lesson."

Use instead:
- "Where in your actual life would you use this?"
- "What would you do differently with this knowledge?"
- "What's still unclear? Write it as a question."
- "Describe the last time you did this badly — what would you do now?"
- "If you had to explain this to someone who has never coded, what would you say?"

These are specific enough to produce real thinking.
Claude evaluates reflection responses: warm, no wrong answers, but does acknowledge
if a response is too brief to be genuinely useful.

### Learning modalities — how to vary within low-stimulation constraints

The platform must stay low-stimulation (no video, no audio, no flashing).
Within those constraints, vary the *format* of each lesson:

```
READING formats (vary these — not all lessons are the same):
  - Explanation with worked example (most common)
  - Annotated code walkthrough (for coding tracks)
  - Side-by-side comparison: bad version vs good version
  - Myth vs reality (e.g. "You might think X. Actually Y.")
  - Scenario narrative: follow a fictional learner through a problem

EXERCISE formats (vary these — no two consecutive exercises identical format):
  - Write from scratch
  - Fix the broken version (debug/edit)
  - Choose between two options and justify (no right answer — Claude evaluates reasoning)
  - Extend the given code/prompt to do something more
  - Spot the error (multiple choice but requires understanding not guessing)
  - Fill in the blank (structured scaffold, learner completes it)
  - Real-world application: apply to learner's own situation

REFLECTION formats:
  - Free write (200 words max — longer is not better)
  - Specific prompt (see above)
  - Self-assessment: "Rate your confidence with this concept 1–5 and say why"
  - Connection: "How does this connect to something you already knew?"
```

### What NOT to build

```
✗ No points, badges, XP, or level-up mechanics
✗ No leaderboards
✗ No "lesson complete" confetti (a quiet completion message is enough)
✗ No timed elements of any kind
✗ No "correct/incorrect" in large text — feedback is always prose
✗ No lesson that is purely multiple choice (every lesson needs at least
  some open-ended element or a real exercise)
✗ No concept introduced without an immediate application within the same module
✗ No two consecutive HIGH energy lessons
✗ No module that is more than 5 lessons long
```

---

## TRACK-BY-TRACK EXPANSION SPEC

### TRACK 1 — AI Foundations
**Target: 30 lessons + 6 retrieval checkpoints**
**Certificate: €49**

Current gaps: lacks depth on how LLMs actually work, has no practical exercises
on evaluating AI output quality, doesn't cover multimodal AI, doesn't cover AI ethics
in a way that connects to learners' real lives (healthcare AI is directly relevant).

**Modules to build or expand:**

```
Module 1: What AI actually is (currently exists — deepen)
  Lesson 1:  The calculator analogy — why AI is not thinking (READING)
  Lesson 2:  How a language model predicts the next word (READING + worked example)
  Lesson 3:  Exercise: predict what the AI will say (EXERCISE — fun, low stakes)
  Lesson 4:  What AI is genuinely good at vs genuinely bad at (READING)
  Lesson 5:  Exercise: test an AI on tasks in both categories (EXERCISE)
  [Retrieval checkpoint 1]

Module 2: Prompting fundamentals (currently exists — expand)
  Lesson 6:  Why specificity beats cleverness (READING)
  Lesson 7:  Exercise: rewrite a vague prompt to be specific (EXERCISE)
  Lesson 8:  Context, role, task, format — the four components (READING)
  Lesson 9:  Exercise: build a prompt using all four components (EXERCISE)
  Lesson 10: Fix the broken prompt — what went wrong and why (EXERCISE — debug format)
  Lesson 11: Reflection: write a prompt for something in your own life (REFLECTION)
  [Retrieval checkpoint 2]

Module 3: Understanding AI outputs
  Lesson 12: What hallucination actually is (READING — myth vs reality format)
  Lesson 13: Exercise: spot the hallucination (EXERCISE — find the error)
  Lesson 14: When to trust AI output and when not to (READING)
  Lesson 15: Exercise: fact-check an AI response (EXERCISE — real task)
  Lesson 16: How to ask AI to show its reasoning (READING + worked example)
  [Retrieval checkpoint 3]

Module 4: AI in your context
  Lesson 17: AI tools for remote and freelance work (READING — practical)
  Lesson 18: Exercise: use AI to draft a professional email (EXERCISE)
  Lesson 19: AI for research and summarisation (READING)
  Lesson 20: Exercise: use AI to summarise a complex document (EXERCISE)
  Lesson 21: Multimodal AI — images, voice, documents (READING — awareness level)
  Lesson 22: Reflection: where in your work could AI save you the most energy? (REFLECTION)
  [Retrieval checkpoint 4]

Module 5: AI ethics — grounded, not abstract
  Lesson 23: Who benefits from AI and who doesn't (READING — honest framing)
  Lesson 24: Healthcare AI: what it can and cannot do (READING — highly relevant)
  Lesson 25: Exercise: identify bias in an AI output (EXERCISE)
  Lesson 26: Privacy and AI — what you're sharing when you prompt (READING)
  Lesson 27: Exercise: rewrite a prompt to remove sensitive information (EXERCISE)
  Lesson 28: Reflection: has AI helped or harmed people like you? (REFLECTION — open)
  [Retrieval checkpoint 5]

Module 6: Final synthesis
  Lesson 29: AI limitations — a genuine honest reckoning (READING)
  Lesson 30: Exercise: design an AI use case for your situation (EXERCISE — capstone)
  [Retrieval checkpoint 6]
  [Assessment]
```

---

### TRACK 2 — Prompt Engineering
**Target: 30 lessons + 6 retrieval checkpoints**
**Certificate: €49**

Current gaps: lacks chain-of-thought, system prompts, few-shot examples,
iterative refinement loops, evaluation frameworks.

```
Module 1: Prompt anatomy
  Lesson 1:  The difference between a request and a prompt (READING)
  Lesson 2:  Exercise: turn 5 requests into structured prompts (EXERCISE)
  Lesson 3:  Role prompting — when it helps and when it's theatre (READING)
  Lesson 4:  Exercise: test role vs no role on the same task (EXERCISE — compare)
  Lesson 5:  Context loading — how much is enough (READING + bad/good comparison)
  [Retrieval checkpoint 1]

Module 2: Getting specific
  Lesson 6:  Format instructions — JSON, markdown, bullets, plain text (READING)
  Lesson 7:  Exercise: write a prompt that returns structured JSON (EXERCISE)
  Lesson 8:  Tone and register instructions (READING)
  Lesson 9:  Exercise: same prompt, three different tones (EXERCISE — vary format)
  Lesson 10: Negative instructions — what NOT to do (READING)
  Lesson 11: Exercise: add constraints to improve a weak prompt (EXERCISE — extend)
  [Retrieval checkpoint 2]

Module 3: Advanced techniques
  Lesson 12: Chain-of-thought — making AI show its work (READING)
  Lesson 13: Exercise: add "think step by step" and compare outputs (EXERCISE)
  Lesson 14: Few-shot examples — teaching by showing (READING + worked example)
  Lesson 15: Exercise: write a few-shot prompt for a classification task (EXERCISE)
  Lesson 16: System prompts vs user prompts — what's the difference (READING)
  Lesson 17: Exercise: build a system prompt for a personal assistant (EXERCISE)
  [Retrieval checkpoint 3]

Module 4: Iteration and evaluation
  Lesson 18: Why first prompts are rarely best prompts (READING)
  Lesson 19: Exercise: iterative refinement — improve a prompt across 3 rounds (EXERCISE)
  Lesson 20: How to evaluate a prompt output (READING — rubric thinking)
  Lesson 21: Exercise: score two outputs against your own rubric (EXERCISE — justify)
  Lesson 22: Reflection: what makes a prompt yours? Develop your own style. (REFLECTION)
  [Retrieval checkpoint 4]

Module 5: Prompting for real tasks
  Lesson 23: Prompting for writing assistance (READING + worked example)
  Lesson 24: Exercise: use prompting to improve a piece of your own writing (EXERCISE)
  Lesson 25: Prompting for research and synthesis (READING)
  Lesson 26: Exercise: use prompting to research a topic you care about (EXERCISE)
  Lesson 27: Prompting for coding help — even if you don't code yet (READING)
  Lesson 28: Exercise: use a prompt to get explained code (EXERCISE)
  [Retrieval checkpoint 5]

Module 6: Capstone
  Lesson 29: Prompt libraries — building a personal collection (READING)
  Lesson 30: Exercise: build your personal prompt library for 3 recurring tasks (EXERCISE — capstone)
  [Retrieval checkpoint 6]
  [Assessment]
```

---

### TRACK 3 — Python for Data
**Target: 30 lessons + 6 retrieval checkpoints**
**Certificate: €49**
**All exercises run in Piston sandbox**

```
Module 1: Python foundations
  Lesson 1:  Why Python and not something else (READING — honest, not evangelism)
  Lesson 2:  Variables and types — what the computer is storing (READING + annotated code)
  Lesson 3:  Exercise: write 5 variables that describe your week (EXERCISE — personal context)
  Lesson 4:  Lists and dictionaries — your two workhorses (READING)
  Lesson 5:  Exercise: build a dictionary that describes a person (EXERCISE)
  [Retrieval checkpoint 1]

Module 2: Control flow
  Lesson 6:  If/else — making decisions in code (READING + side-by-side)
  Lesson 7:  Exercise: write a simple symptom checker (EXERCISE — relevant context)
  Lesson 8:  Loops — doing things repeatedly without repeating yourself (READING)
  Lesson 9:  Exercise: loop through a list and filter it (EXERCISE)
  Lesson 10: Functions — packaging up work to reuse it (READING)
  Lesson 11: Exercise: convert a repetitive block into a function (EXERCISE — refactor)
  [Retrieval checkpoint 2]

Module 3: Working with data
  Lesson 12: Reading files — CSV and text (READING + worked example)
  Lesson 13: Exercise: load a dataset and print its first 10 rows (EXERCISE)
  Lesson 14: Introduction to pandas — the library that changed data work (READING)
  Lesson 15: Exercise: load, inspect, describe a real dataset (EXERCISE)
  Lesson 16: Filtering data — find what you need (READING + annotated code)
  Lesson 17: Exercise: filter a dataset using 2 conditions (EXERCISE)
  [Retrieval checkpoint 3]

Module 4: Transforming data
  Lesson 18: Groupby and aggregation — finding patterns (READING)
  Lesson 19: Exercise: group a dataset and compute a summary stat (EXERCISE)
  Lesson 20: Handling missing data — the most common real-world problem (READING)
  Lesson 21: Exercise: clean a messy dataset with missing values (EXERCISE — fix broken)
  Lesson 22: Adding and transforming columns (READING)
  Lesson 23: Exercise: create a new column from existing ones (EXERCISE)
  [Retrieval checkpoint 4]

Module 5: Visualisation
  Lesson 24: Why visualisation is not decoration (READING)
  Lesson 25: Exercise: create a bar chart from a grouped dataset (EXERCISE)
  Lesson 26: Line charts for time series (READING + worked example)
  Lesson 27: Exercise: plot a trend over time from a real dataset (EXERCISE)
  Lesson 28: Choosing the right chart type (READING — decision tree format)
  [Retrieval checkpoint 5]

Module 6: Capstone
  Lesson 29: Putting it together — a mini data project (READING — project brief)
  Lesson 30: Exercise: end-to-end mini project — load, clean, analyse, visualise (EXERCISE — capstone)
             This exercise is longer than others. Energy cost: HIGH.
             Split across two sessions if needed — progress saves.
  [Retrieval checkpoint 6]
  [Assessment]
```

---

### TRACK 4 — Data Science Essentials
**Target: 30 lessons + 6 retrieval checkpoints**
**Certificate: €49**
**Prerequisite: Track 3 completion or explicit acknowledgement**

```
Module 1: Statistical thinking
  Lesson 1:  The difference between data and insight (READING)
  Lesson 2:  Mean, median, mode — and when each one lies (READING + side-by-side)
  Lesson 3:  Exercise: calculate and compare central tendency on a real dataset (EXERCISE)
  Lesson 4:  Spread — variance, standard deviation, range (READING)
  Lesson 5:  Exercise: identify outliers in a dataset (EXERCISE)
  [Retrieval checkpoint 1]

Module 2: Relationships in data
  Lesson 6:  Correlation — what it means and what it doesn't (READING — myth vs reality)
  Lesson 7:  Exercise: calculate and plot a correlation (EXERCISE)
  Lesson 8:  Causation — why correlation is not enough (READING + scenario narrative)
  Lesson 9:  Exercise: identify spurious correlations in provided examples (EXERCISE — spot the error)
  Lesson 10: Distributions — what normal means and doesn't mean (READING)
  Lesson 11: Exercise: plot and describe a distribution (EXERCISE)
  [Retrieval checkpoint 2]

Module 3: Intro to machine learning
  Lesson 12: What machine learning actually does (READING — demystifying)
  Lesson 13: Supervised vs unsupervised — two very different problems (READING)
  Lesson 14: Train/test split — why you can't test on what you trained on (READING)
  Lesson 15: Exercise: split a dataset and explain why the split matters (EXERCISE)
  Lesson 16: Linear regression — fitting a line to data (READING + annotated code)
  Lesson 17: Exercise: train a linear regression and interpret the output (EXERCISE)
  [Retrieval checkpoint 3]

Module 4: Classification
  Lesson 18: Classification problems — what you're trying to predict (READING)
  Lesson 19: Logistic regression — the simplest classifier (READING + worked example)
  Lesson 20: Exercise: train a classifier on a real dataset (EXERCISE)
  Lesson 21: Evaluating models — accuracy, precision, recall (READING)
  Lesson 22: Exercise: evaluate your classifier using three metrics (EXERCISE)
  Lesson 23: When your model is wrong — types of errors and what they cost (READING — important for healthcare context)
  [Retrieval checkpoint 4]

Module 5: Communicating with data
  Lesson 24: Visualisation for communication vs exploration (READING)
  Lesson 25: Exercise: redesign a bad chart to tell its story better (EXERCISE — fix broken)
  Lesson 26: Writing about data — how to describe findings in plain language (READING)
  Lesson 27: Exercise: write a 200-word summary of a model's output (EXERCISE — writing)
  Lesson 28: Reflection: what question in your own life could data answer? (REFLECTION)
  [Retrieval checkpoint 5]

Module 6: Capstone
  Lesson 29: End-to-end data science project — brief and setup (READING — project brief)
  Lesson 30: Exercise: complete mini project — EDA → model → evaluation → summary (EXERCISE — capstone)
  [Retrieval checkpoint 6]
  [Assessment]
```

---

### TRACK 5 — Build with AI
**Target: 30 lessons + 6 retrieval checkpoints**
**Certificate: €49**

```
Module 1: APIs and how they work
  Lesson 1:  What an API is — without the jargon (READING — scenario narrative)
  Lesson 2:  HTTP requests — what your code is actually doing (READING + annotated example)
  Lesson 3:  Exercise: make your first API call in Python (EXERCISE)
  Lesson 4:  Authentication — API keys and why they're secret (READING)
  Lesson 5:  Exercise: use a free public API to retrieve data (EXERCISE)
  [Retrieval checkpoint 1]

Module 2: The Claude API
  Lesson 6:  The messages endpoint — structure and parameters (READING + annotated code)
  Lesson 7:  Exercise: send your first message to Claude via Python (EXERCISE)
             Note: exercises use mock API responses by default to avoid requiring
             learners to supply API keys. Provide a mock fixture.
  Lesson 8:  System prompts in code — building consistent behaviour (READING)
  Lesson 9:  Exercise: build a Python function with a custom system prompt (EXERCISE)
  Lesson 10: Handling API responses — parsing, errors, retries (READING)
  Lesson 11: Exercise: write robust error handling for an API call (EXERCISE — extend)
  [Retrieval checkpoint 2]

Module 3: Prompt templating
  Lesson 12: Separating prompts from code — why it matters (READING)
  Lesson 13: Exercise: build a prompt template with variable substitution (EXERCISE)
  Lesson 14: Dynamic prompts — building prompts from user input (READING)
  Lesson 15: Exercise: build a CLI tool that generates personalised prompts (EXERCISE)
  Lesson 16: Cost awareness — tokens, pricing, how to estimate (READING)
  Lesson 17: Exercise: estimate the cost of your tool for 1000 uses (EXERCISE — calculation)
  [Retrieval checkpoint 3]

Module 4: Building real things
  Lesson 18: Designing a tool around a real need (READING — design thinking light)
  Lesson 19: Exercise: write a spec for a tool that would help you personally (EXERCISE — reflection + planning)
  Lesson 20: Building a text summariser (READING + worked example)
  Lesson 21: Exercise: build a document summariser for a topic you care about (EXERCISE)
  Lesson 22: Building a personal assistant script (READING + walked build)
  Lesson 23: Exercise: extend the assistant with one custom capability (EXERCISE — extend)
  [Retrieval checkpoint 4]

Module 5: Output and quality
  Lesson 24: Validating AI output in code — don't trust, verify (READING)
  Lesson 25: Exercise: add output validation to an existing tool (EXERCISE)
  Lesson 26: Structured output — getting JSON back reliably (READING)
  Lesson 27: Exercise: build a tool that returns structured data (EXERCISE)
  Lesson 28: Reflection: what's the most useful thing you could build for your life? (REFLECTION)
  [Retrieval checkpoint 5]

Module 6: Ship something
  Lesson 29: Making a tool shareable — basic CLI packaging (READING)
  Lesson 30: Exercise: complete and document your capstone tool (EXERCISE — capstone)
             The learner ships something real. It runs. It does something useful.
  [Retrieval checkpoint 6]
  [Assessment]
```

---

### TRACK 6 — Working with Chronic Illness
**Target: 20 lessons + 4 retrieval checkpoints (shorter by design)**
**Certificate: FREE — auto-issued on completion**
**Tone: practical, direct, zero inspiration language**
**No tech prerequisite**

```
Module 1: Remote work realities
  Lesson 1:  What remote work actually means in 2025 (READING — practical)
  Lesson 2:  Tools and setup for working from bed or low-energy environments (READING)
  Lesson 3:  Exercise: audit your current setup and identify 2 improvements (EXERCISE)
  Lesson 4:  Async work — how to work across time zones without real-time pressure (READING)
  Lesson 5:  Exercise: write an async update for a hypothetical project (EXERCISE)
  [Retrieval checkpoint 1]

Module 2: Freelancing with variable capacity
  Lesson 6:  Freelancing models that work with unpredictable availability (READING)
  Lesson 7:  Pricing your work when you can't promise hours (READING)
  Lesson 8:  Exercise: write a project-based proposal instead of hourly (EXERCISE)
  Lesson 9:  Contracts and boundaries — what to put in writing (READING)
  Lesson 10: Exercise: draft a simple service agreement clause for availability (EXERCISE)
  [Retrieval checkpoint 2]

Module 3: The CV and employment gap
  Lesson 11: What employers actually think about gaps (READING — honest, not reassuring)
  Lesson 12: Language for explaining gaps — without lying or over-explaining (READING)
  Lesson 13: Exercise: write your own gap explanation in 3 sentences (EXERCISE)
  Lesson 14: Skills you built while ill that transfer to work (READING — reframing)
  Lesson 15: Exercise: identify 3 transferable skills from your experience of illness (REFLECTION)
  [Retrieval checkpoint 3]

Module 4: Disclosure and energy at work
  Lesson 16: Disclosure — when, how, and whether to (READING — no right answer)
  Lesson 17: Reasonable adjustments — what you can ask for (READING — general principles, not jurisdiction-specific legal advice)
  Lesson 18: Energy budgeting for work, not life (READING — specific to work context)
  Lesson 19: Exercise: plan a realistic work week using energy budgeting (EXERCISE)
  Lesson 20: Reflection: what would sustainable work actually look like for you? (REFLECTION — open, personal)
  [Retrieval checkpoint 4]
  [Assessment — shorter: 6 questions, pass threshold 60%]
```

---

## IMPLEMENTATION INSTRUCTIONS

### How to implement this in the codebase

**Step 1: Update the seed data format**

Each lesson in the seed data must follow this schema exactly:

```typescript
{
  slug: string,              // kebab-case, unique across all lessons
  title: string,             // clear, specific — not "Lesson 5"
  moduleSlug: string,
  lessonType: 'READING' | 'EXERCISE' | 'REFLECTION' | 'QUIZ',
  estimatedMin: number,      // honest — measure against a real example
  energyCost: 'LOW' | 'MEDIUM' | 'HIGH',
  orderIndex: number,
  content: string,           // MDX — see format below
  exercise?: {               // required if lessonType === 'EXERCISE'
    exerciseType: ExType,
    prompt: string,
    starterCode?: string,
    language?: string,
    hints: string[],         // minimum 2, maximum 4
    solution: string,        // model answer — shown after passing or 3 attempts
    rubric: RubricCriteria[] // minimum 3 criteria
  }
}
```

**Step 2: MDX content format**

Reading lessons use MDX. Keep it structured but not sterile.

```mdx
<!-- Standard reading lesson -->

<!-- Opening: scenario or question — never a definition -->
You're writing an email to a specialist and you want AI to help.
You type: "Write me an email." The result is useless.

Here's why — and how to fix it.

---

<!-- Core concept — one only -->
## What specificity actually does

[explanation in 150–300 words]

<!-- Worked example — always present in reading lessons -->
## See it in practice

**Vague:**
> "Write me an email about my appointment."

**Specific:**
> "Write a professional but warm email to a rheumatologist's
>  secretary, explaining that my symptoms have worsened since
>  my last appointment three months ago and asking whether
>  I can be seen sooner. Keep it under 100 words."

[brief analysis of what changed]

<!-- Connection — what this enables -->
## Why this matters

[1–2 sentences connecting concept to learner's real context]
```

```mdx
<!-- Reflection lesson -->

<!-- No preamble. Straight to the prompt. -->

## Where would you use this?

Think about your actual work or daily life — not a hypothetical.

Describe one specific situation where [concept from this module]
would make a real difference. Be concrete: what would you be doing,
what would you prompt, what would you hope to get back?

There's no right answer here. Claude will respond to what you write,
not judge it.

[textarea — min 50 words, no max]
```

**Step 3: Rubric format for Claude grading**

```typescript
type RubricCriteria = {
  criterion: string,     // what Claude is evaluating
  weight: number,        // 0–1, must sum to 1.0 across all criteria
  passThreshold: number  // 0–100, minimum score on this criterion to pass overall
}

// Example for a prompt-writing exercise:
rubric: [
  { criterion: "Includes specific context about the situation",     weight: 0.35, passThreshold: 60 },
  { criterion: "Specifies the desired format or length",            weight: 0.25, passThreshold: 50 },
  { criterion: "States the task clearly without ambiguity",         weight: 0.40, passThreshold: 70 }
]
```

**Step 4: Retrieval checkpoint format**

```typescript
// Retrieval checkpoints are QUIZ lessons inserted every 5 lessons.
// They are NOT in the module lesson list — they are between modules
// or at specific points in a module's sequence.
// They do NOT block progress — learners can skip them.
// They ARE counted in the "lessons completed" total for progress display.

{
  lessonType: 'QUIZ',
  title: "Let's see what stuck",    // same title for all checkpoints
  energyCost: 'LOW',
  estimatedMin: 5,
  content: '...',   // 5 questions, each referencing a specific prior lesson
  isRetrieval: true // flag to distinguish from assessment and regular quizzes
}
```

**Step 5: Content for Claude-in-lesson exercises**

Some exercises should use Claude as a live tool within the exercise itself.
This is different from Claude grading the submission — here Claude is
part of the learning experience.

```typescript
// Claude-in-lesson exercise type: INTERACTIVE_PROMPT
// Learner writes a prompt → sees Claude's actual response → reflects on it
// This requires a live API call within the exercise (not sandboxed)

// UI:
// [Write your prompt here]
// [Send to Claude →]
// [Claude's response appears]
// [Reflection: did you get what you wanted? What would you change?]
// [Submit reflection → Claude grades the reflection, not the prompt]

// This exercise type is HIGH energy cost — learner is doing real work.
// Used in: Track 2 (prompt engineering), Track 1 (module 3)
// NOT used in: coding tracks (Piston handles those)
// Cost note: each INTERACTIVE_PROMPT exercise uses 1–2 Claude API calls.
//   Budget approximately €0.002–0.005 per exercise submission.
//   This is acceptable at launch. Monitor and optimise if volume grows.
```

---

## CONTENT TONE GUIDE

Every piece of content must pass this check before it is written into the seed:

```
✓ Opens with a scenario or question — not a definition or overview
✓ Uses "you" not "learners" or "students"
✓ Uses plain language — no jargon without immediate explanation
✓ Does not assume the learner has energy to re-read — one pass should be enough
✓ Does not contain: "exciting", "amazing", "powerful", "just", "simply", "easy"
✓ Does not contain: inspiration language about illness or disability
✓ Does not contain: "despite your challenges" or any variant
✓ Code examples use realistic scenarios (health tracking, work tools, personal data)
   not toy examples (sorting lists of fruit, counting vowels)
✓ Reflection prompts are specific — not "how do you feel about this?"
✓ Every lesson is complete in itself — learner does not need to remember
   what came three lessons ago to understand this one
   (retrieval checkpoints handle the remembering)
```

---

## BEFORE YOU WRITE ANY CONTENT

Run the existing audit script first:
```
pnpm audit:curriculum
```

Note which tracks have the most gaps. Start with the track that fails
the most checks — that is the most urgent to fix.

After expanding, run the audit again. Every track must exit 0 before
certificates are enabled on that track.

---

## DONE WHEN

- [ ] All 5 paid tracks have 30 lessons + 6 retrieval checkpoints in seed data
- [ ] Track 6 (Working with Illness) has 20 lessons + 4 retrieval checkpoints
- [ ] Every lesson has an honest estimatedMin (measure against a real read-through)
- [ ] No two consecutive HIGH energy lessons in any track
- [ ] No module longer than 5 lessons
- [ ] Every EXERCISE lesson has minimum 2 hints and 3 rubric criteria
- [ ] Every EXERCISE has a model solution
- [ ] At least 2 INTERACTIVE_PROMPT exercises exist in Track 1 and Track 2
- [ ] All reading lessons open with a scenario or question — not a definition
- [ ] All reflection prompts are specific (not "what did you learn?")
- [ ] No content contains "exciting", "amazing", "simply", "easy", or inspiration language
- [ ] Code examples use realistic scenarios, not toy examples
- [ ] pnpm audit:curriculum exits 0 for all 6 tracks
- [ ] Track 6 assessment pass threshold is 60% (lower than other tracks — by design)
- [ ] Retrieval checkpoints are skippable and do not block progress

---

*End of Curriculum Depth Expansion Prompt — Bed Coders*
