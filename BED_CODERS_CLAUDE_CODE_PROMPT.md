# CLAUDE CODE BUILD PROMPT
## Bed Coders — Learn Tech From Wherever You Are

> Paste everything below this line into a new Claude Code session.
> This is a complete full-stack build spec.

---

## MISSION

Build **Bed Coders** — a learning platform dedicated to people with chronic illness, disability, or conditions that keep them housebound or bedbound. The platform teaches AI prompting, coding, and data science through short, low-effort interactive exercises designed for limited energy, variable focus, and accessibility-first needs.

This is not an inspiration-porn platform. It is a serious technical education tool that happens to be built around the real constraints of its users: fatigue, brain fog, pain, inconsistent availability, and the need for genuine economic retraining — not charity.

---

## CORE DESIGN PRINCIPLES (non-negotiable)

1. **Low sensory load** — soft contrast, no flashing, no animations that can't be paused
2. **Energy-aware UX** — every session can be as short as 5 minutes and still feel complete
3. **No shame architecture** — no streaks that punish missing days, no leaderboards, no "you're falling behind" messaging
4. **Screen-reader and keyboard navigable** — WCAG 2.1 AA minimum
5. **Works on phone in bed** — layout must work one-handed, portrait, low brightness
6. **Offline-tolerant** — lessons should cache; losing connection mid-exercise should not lose progress

---

## TECH STACK

```
Frontend:   React 18 + Vite + TypeScript
Styling:    Tailwind CSS (custom calm theme)
Backend:    Node.js + Express (TypeScript)
Database:   PostgreSQL + Prisma ORM
Auth:       Better Auth (email/password + magic link — NO social login required)
Payments:   Stripe (optional subscription + one-time donation)
AI:         Anthropic Claude API (claude-sonnet-4-5) — exercise feedback + hints
Email:      Resend
Hosting:    Render.com (web service + PostgreSQL)
Code exec:  Piston API (free, open-source — sandboxed code execution)
```

---

## DESIGN SYSTEM

### Theme: Warm Minimal

```css
:root {
  /* Backgrounds — warm off-white to soft dark, never pure black or white */
  --bg-base:       #f7f5f2;    /* warm off-white — default light mode */
  --bg-surface:    #f0ede8;    /* card backgrounds */
  --bg-elevated:   #e8e4de;    /* input fields, code blocks */
  --bg-border:     #d8d2cc;    /* subtle dividers */

  /* Dark mode (user-preferred, auto-detected + manual toggle) */
  --bg-base-dark:      #1a1814;
  --bg-surface-dark:   #211f1c;
  --bg-elevated-dark:  #2a2723;
  --bg-border-dark:    #38342f;

  /* Accent — single warm color, used sparingly */
  --accent:        #c96a3a;    /* terracotta — warm, not clinical */
  --accent-soft:   rgba(201,106,58,0.12);
  --accent-muted:  #e8a882;

  /* Text */
  --text-primary:   #2d2926;
  --text-secondary: #6b635c;
  --text-muted:     #a09890;
  --text-inverse:   #f7f5f2;

  /* Semantic */
  --success:  #5a8a6a;   /* muted green */
  --warning:  #b8860b;   /* muted amber */
  --error:    #b85450;   /* muted red */

  /* Fonts */
  --font-body:    'Lora', Georgia, serif;         /* warm, readable body */
  --font-ui:      'DM Sans', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing rhythm */
  --space-xs: 0.375rem;
  --space-sm: 0.75rem;
  --space-md: 1.25rem;
  --space-lg: 2rem;
  --space-xl: 3.5rem;

  /* Type scale — slightly larger than normal for readability */
  --text-sm:  0.9rem;
  --text-md:  1rem;
  --text-lg:  1.125rem;
  --text-xl:  1.375rem;
  --text-2xl: 1.75rem;
  --text-3xl: 2.25rem;
}
```

### Visual Rules
- **No pure black text** — use `--text-primary` (#2d2926) only
- **No white backgrounds** — always warm off-white
- **Single accent color** (terracotta) — not multiple neons
- **No hover animations faster than 200ms**
- **No auto-playing anything**
- **Font size minimum 16px everywhere, 18px for lesson content**
- **Line height minimum 1.7 for body text**
- **Buttons: large tap targets (min 48px height)**
- **No infinite scroll — paginate everything**
- **Dark mode auto-detected, manually toggleable, persisted**

---

## DATABASE SCHEMA

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────────────────────────
// IMPORTANT: There is NO subscription model.
// All lessons are free to all users.
// Revenue comes only from one-time certificate purchases.
// The Tier enum is removed. Access control is not needed on lessons.
// ─────────────────────────────────────────────────────────────────────

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String?
  passwordHash   String?
  emailVerified  Boolean   @default(false)
  darkMode       Boolean   @default(false)
  fontSize       FontSize  @default(MEDIUM)
  reduceMotion   Boolean   @default(false)
  energyTracking Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  progress         LessonProgress[]
  certificates     CertificatePurchase[]
  energyLogs       EnergyLog[]
  scholarshipClaim ScholarshipSeat?
}

enum FontSize {
  SMALL    // 16px base
  MEDIUM   // 18px base (default)
  LARGE    // 21px base
  XLARGE   // 24px base
}

// ── SCHOLARSHIP POOL ──────────────────────────────────────────────────
// Singleton row (id = "main"). Balance in pence.
// Every £5 pay-it-forward contribution adds 500 to balance.
// When balance >= 2900, one ScholarshipSeat is created and balance -= 2900.

model ScholarshipPool {
  id        String   @id @default("main")
  balance   Int      @default(0)  // pence
  totalFunded Int    @default(0)  // cumulative count of seats ever funded
  updatedAt DateTime @updatedAt
}

model ScholarshipSeat {
  id          String    @id @default(cuid())
  available   Boolean   @default(true)
  claimedById String?   @unique
  claimedBy   User?     @relation(fields: [claimedById], references: [id])
  claimedAt   DateTime?
  trackSlug   String?
  createdAt   DateTime  @default(now())
}

model ScholarshipWaitlist {
  id        String   @id @default(cuid())
  email     String   @unique
  trackSlug String?
  createdAt DateTime @default(now())
  notified  Boolean  @default(false)
}

// ── CERTIFICATE PURCHASES ─────────────────────────────────────────────
// paidAmount = 0 for: free illness track, scholarship claims
// paidAmount = 2900 for: standard cert purchase
// paidAmount = 3400 for: cert + pay-it-forward
// paidAmount = 9900 for: bundle
// paidAmount = 10400 for: bundle + pay-it-forward

model CertificatePurchase {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  trackSlug       String   // "all" for bundle
  paidAmount      Int      // pence
  isScholarship   Boolean  @default(false)
  isPif           Boolean  @default(false)
  isFree          Boolean  @default(false)  // illness track auto-issue
  stripeSessionId String?  @unique
  issuedAt        DateTime?  // set when assessment passed + cert generated
  createdAt       DateTime @default(now())

  @@unique([userId, trackSlug])
}

model Track {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  description     String
  orderIndex      Int
  icon            String
  certFree        Boolean  @default(false)  // true for illness track only
  modules         Module[]
}

// Tracks (all lessons free, cert purchase optional except illness track):
// 1. ai-foundations           — cert £29
// 2. prompt-engineering       — cert £29
// 3. python-for-data          — cert £29
// 4. data-science             — cert £29
// 5. build-with-ai            — cert £29
// 6. working-with-illness     — cert FREE (certFree: true)

model Module {
  id          String   @id @default(cuid())
  slug        String   @unique
  trackId     String
  track       Track    @relation(fields: [trackId], references: [id])
  title       String
  description String
  orderIndex  Int
  lessons     Lesson[]
}

model Lesson {
  id           String       @id @default(cuid())
  slug         String       @unique
  moduleId     String
  module       Module       @relation(fields: [moduleId], references: [id])
  title        String
  content      String       // MDX or structured JSON
  lessonType   LessonType
  // NOTE: No tier field. All lessons are accessible to all users.
  estimatedMin Int          @default(5)
  energyCost   EnergyCost   @default(LOW)
  orderIndex   Int

  exercise     Exercise?
  progress     LessonProgress[]
}

enum LessonType {
  READING      // Short explanatory text
  EXERCISE     // Interactive coding/prompting exercise
  REFLECTION   // Open-ended written reflection (no wrong answers)
  QUIZ         // Multiple choice, low-stakes
}

enum EnergyCost {
  LOW     // reading or simple quiz, ~5 min
  MEDIUM  // exercise with some thinking, ~10-15 min
  HIGH    // complex exercise or reflection, ~20+ min
}

model Exercise {
  id           String   @id @default(cuid())
  lessonId     String   @unique
  lesson       Lesson   @relation(fields: [lessonId], references: [id])
  exerciseType ExType
  prompt       String   // What the learner is asked to do
  starterCode  String?  // For coding exercises
  language     String?  // "python" | "javascript" | "sql"
  hints        Json     // Array of progressive hint strings
  solution     String?  // Model solution (shown after passing)
  rubric       Json     // Criteria for Claude to evaluate against

  attempts     ExerciseAttempt[]
}

enum ExType {
  WRITE_PROMPT    // Write a prompt for an AI task
  EDIT_PROMPT     // Improve a given prompt
  WRITE_CODE      // Write code to pass tests
  DEBUG_CODE      // Find and fix bugs
  ANALYZE_DATA    // Answer questions about a dataset
  FREE_WRITE      // Open-ended, Claude gives gentle feedback
}

model ExerciseAttempt {
  id           String   @id @default(cuid())
  userId       String
  exerciseId   String
  exercise     Exercise @relation(fields: [exerciseId], references: [id])
  submission   String
  score        Int?     // 0-100, null if free-write
  passed       Boolean  @default(false)
  feedback     Json?    // Claude API response
  hintsUsed    Int      @default(0)
  createdAt    DateTime @default(now())
}

model LessonProgress {
  id          String         @id @default(cuid())
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  lessonId    String
  lesson      Lesson         @relation(fields: [lessonId], references: [id])
  status      ProgressStatus @default(IN_PROGRESS)
  completedAt DateTime?
  notes       String?        // personal notes on lesson
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([userId, lessonId])
}

enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETE
  SKIPPED     // Users can skip — no shame, always return
}

model EnergyLog {
  id        String      @id @default(cuid())
  userId    String
  date      DateTime    @default(now())
  level     EnergyLevel
  notes     String?
}

enum EnergyLevel {
  ONE TWO THREE FOUR FIVE
}
// No Donation model — pay-it-forward is handled via CertificatePurchase.isPif
// No GrantSeat model — replaced by ScholarshipSeat above
```

---

## CURRICULUM STRUCTURE

### Track 1: AI Foundations (FREE)
Module 1: What AI actually is
  - Lesson: AI isn't magic, it's pattern matching (READING, LOW, 5 min)
  - Lesson: What AI is good at — and what it isn't (READING, LOW, 5 min)
  - Lesson: Your first conversation with an AI (EXERCISE: FREE_WRITE, LOW, 10 min)

Module 2: Prompting basics
  - Lesson: What is a prompt? (READING, LOW, 5 min)
  - Lesson: Exercise — Write a prompt that gets a useful answer (EXERCISE: WRITE_PROMPT, LOW, 10 min)
  - Lesson: Why specificity matters (READING, LOW, 5 min)
  - Lesson: Exercise — Fix a vague prompt (EXERCISE: EDIT_PROMPT, MEDIUM, 15 min)

Module 3: AI tools overview
  - Lesson: Claude, ChatGPT, Gemini — what's different (READING, LOW, 8 min)
  - Lesson: Choosing the right tool for your goal (QUIZ, LOW, 5 min)

### Track 2: Prompt Engineering (FREE → SUPPORTED)
Module 1: Structure and clarity (FREE)
  - Role-based prompting
  - Chain-of-thought prompting
  - Context windows and limits

Module 2: Advanced techniques (SUPPORTED)
  - Few-shot examples
  - System prompts
  - Prompt chaining and pipelines
  - Evaluating prompt output quality

### Track 3: Python for Data (FREE → SUPPORTED)
Module 1: Python basics (FREE)
  - Variables, types, loops
  - Functions
  - Reading a CSV file

Module 2: Data with pandas (SUPPORTED)
  - DataFrames
  - Filtering and grouping
  - Cleaning messy data

Module 3: Visualisation (SUPPORTED)
  - matplotlib basics
  - Telling a story with a chart
  - Exporting for reports

### Track 4: Data Science Essentials (SUPPORTED)
  - Descriptive statistics
  - Correlation and causation
  - Intro to machine learning concepts
  - Building a simple model with scikit-learn

### Track 5: Build with AI (SUPPORTED)
  - Using the Claude API from Python
  - Building a personal assistant script
  - Creating an AI-powered tool for your own needs
  - Freelancing with AI tools

### Track 6: Working with Chronic Illness (FREE)
  - Energy-budgeting your workday
  - Remote work: what to disclose, what not to
  - Freelancing platforms that work for variable availability
  - Writing a CV when you have employment gaps
  - Benefits and work: understanding the rules (UK, US, EU — separate modules)

---

## PAGES & ROUTES

### Public (no auth)
```
/                    Landing page
/about               About Bed Coders + mission
/curriculum          Full track overview
/accessibility       Accessibility statement
/support             Donate / grant info
/verify/:id          Certificate verification
```

### Auth
```
/signup              Email + password, or magic link
/login               Login
/forgot-password     Password reset
```

### Authenticated
```
/learn               Home dashboard (today's suggestion based on energy)
/learn/:track        Track overview
/learn/:track/:module/:lesson    Individual lesson
/progress            Full progress view
/settings            Accessibility settings, dark mode, font size, notifications
/account             Subscription, billing, pause/cancel
```

---

## PAGE 1: LANDING PAGE (`/`)

### Tone and approach
No hero images of people in hospital beds. No inspiration language. No "despite their illness" framing. Speak directly to people who are smart, capable, and limited by their body — not by their mind.

### Sections

**1.1 Hero**
```
Headline:     "Learn from wherever you are."
Subheadline:  "Bed Coders is a tech education platform built for people
               with chronic illness, disability, or anything else that
               keeps you at home. Short lessons. Honest pacing.
               No streaks to break."

CTA:          [Start Learning Free →]   → /signup
Secondary:    [See the curriculum]      → /curriculum

Visual: No hero image. Clean typography. Subtle warm background texture.
```

**1.2 Who this is for (specific, not vague)**
```
Warm, direct paragraph — NOT a bullet list of conditions:

"If you have ME/CFS, fibromyalgia, dysautonomia, EDS, MS, Long Covid,
a mental health condition, or anything else that makes a traditional
classroom or office job difficult — this is built for you. You don't
need to explain yourself to access it."

Followed by three short, honest statements:
  "Lessons are 5–20 minutes. Stop and come back whenever."
  "No daily streaks. No falling behind. Your progress waits."
  "Core curriculum is free. Always."
```

**1.3 What you'll learn**
```
Six track cards (icon + title + one-line description + tier badge)
  AI Foundations          — FREE
  Prompt Engineering      — FREE + SUPPORTED
  Python for Data         — FREE + SUPPORTED
  Data Science            — SUPPORTED
  Build with AI           — SUPPORTED
  Working with Chronic Illness  — FREE
```

**1.4 How it works (3 points)**
```
1. Pick a track that matches your energy today
2. Do as much or as little as you can — your progress saves automatically
3. Get feedback from our AI tutor — no waiting for a human to grade you
```

**1.5 Pricing (honest)**
```
"Most of it is free."

Core curriculum: free forever. No card required.
Advanced tracks: £9/month — or pay what you can.
Can't afford it: apply for a grant-sponsored seat.
Want to give back: donate to fund free seats for others.

[Start Free →]   [Apply for a Grant Seat →]   [Donate →]
```

**1.6 Community note (optional, soft)**
```
"There's a small community of learners if you want it.
It's not required. Lurk as long as you like."
→ Link to Discord or forum
```

**1.7 Accessibility statement snippet**
```
Brief: "This platform is built with accessibility as a core requirement,
not an afterthought. Dark mode, large text, reduced motion, keyboard
navigation, screen reader support. If something doesn't work for you,
tell us and we'll fix it."
→ [Full accessibility statement]
```

---

## PAGE 2: LESSON INTERFACE (`/learn/:track/:module/:lesson`)

This is the heart of the product. Build it with extreme care.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  NAV: [← Back to Module]  [Title]  [⚙ Settings]    │
│  Progress: ████████░░░░░  Lesson 4 of 9             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  LESSON CONTENT AREA                                │
│  (Reading, exercise, quiz, or reflection)           │
│  Max-width 680px, centered, generous line-height    │
│                                                     │
│  For exercises:                                     │
│    - Instructions (above fold)                      │
│    - Code editor or text area                       │
│    - [Get a Hint] — reveals one hint at a time      │
│    - [Submit] — calls Claude feedback API           │
│    - [Skip this for now] — always visible           │
│                                                     │
├─────────────────────────────────────────────────────┤
│  FEEDBACK AREA (appears after submit)               │
│  Score (if applicable) + warm, specific feedback    │
│  [Try Again] or [Continue →]                        │
└─────────────────────────────────────────────────────┘
```

### Critical UX details
- "Skip this for now" is always one tap away. Skipping = neutral, not failure.
- Progress autosaves on every interaction, not just on completion.
- If user is mid-exercise and closes browser: restore their draft on return.
- No timer. No countdown. No "complete by date" messaging anywhere.
- Feedback from Claude: warm, specific, non-judgmental. Prompt engineered carefully.
- Hints are progressive — first hint is gentle nudge, third hint nearly gives the answer.
- After completing a lesson: brief pause. A single sentence: "Done. That's enough for today if you need it." Then [Continue to next →] and [I'm done for now].

### Energy cost display
Every lesson shows:
```
⏱ ~10 min   🔋 Medium energy
```
This helps users decide whether to start a lesson given their current state.

---

## PAGE 3: LEARN DASHBOARD (`/learn`)

### "What can I do today?" — the core feature

```
Good morning, {name}.

How are you feeling today?

[🔋 Low energy]   [⚡ Medium]   [💪 Good day]

                    ↓ (after selection)

[Low energy selected]
"Here's something gentle."

  → Lesson: "What AI is good at — and what it isn't"
    AI Foundations · 5 min · Reading

  Other low-energy options:
  → Quiz: AI tools overview (5 min)
  → Reflection: What skill feels most useful to you? (5 min)

  [Something else →]  (shows full curriculum)
```

### Progress summary (below energy picker)
```
Where you left off:
  Track: Python for Data
  Module: Data with pandas
  Lesson: Filtering and grouping (in progress)
  [Continue →]

Your streaks: — (not shown — no streak system)

Completed this month: 7 lessons
Note: "No pressure on pace. You're here, and that counts."
```

---

## PAGE 4: SETTINGS (`/settings`)

These are critical for accessibility. Every setting persists to the database.

```
Appearance
  Dark mode          [toggle — auto / light / dark]
  Font size          [S  M  L  XL] — live preview
  Reduce motion      [toggle]
  High contrast      [toggle]

Learning preferences
  Energy tracking    [toggle] — enables daily energy log
  Show energy cost   [toggle] — shows 🔋 on lessons

Notifications
  Email reminders    [off / weekly / fortnightly]
  (Never daily — this is not a streak platform)
  Reminder tone:     ["You haven't been here in a while" is disabled.
                       Only positive: "When you're ready, we're here."]

Account
  Email address
  Change password
  My certificates: [list of purchased/earned certs + download links]
  [Export my data]
  [Delete my account]
```

---

## BACKEND: CLAUDE FEEDBACK ENGINE

### Prompt engineering for warm, accessible feedback

```typescript
// apps/api/src/lib/feedback.ts

export async function getExerciseFeedback(
  exercise: Exercise,
  submission: string,
  hintsUsed: number,
  userName: string
): Promise<FeedbackResult> {

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 800,
    system: `You are a patient, warm coding tutor for Bed Coders — a platform
    for people with chronic illness learning tech skills. Many learners have
    brain fog, fatigue, or inconsistent energy.

    Your feedback must be:
    - Short: 3-5 sentences maximum
    - Warm but not patronising — treat them as capable adults
    - Specific: point to the exact thing they did well or missed
    - Never use the word "unfortunately", "sadly", "but", or negative openers
    - If they got it wrong: start with what they got right first
    - If they used hints: acknowledge that using hints is smart, not a failure
    - Never mention health, illness, or energy — just focus on the work
    - End with one clear, actionable next step or encouragement

    Exercise type: ${exercise.exerciseType}
    Exercise prompt: ${exercise.prompt}
    Evaluation rubric: ${JSON.stringify(exercise.rubric)}
    Hints used: ${hintsUsed} of ${(exercise.hints as string[]).length}

    Respond in JSON only:
    {
      "score": number (0-100, or null for FREE_WRITE),
      "passed": boolean,
      "whatWentWell": string,
      "whatToImprove": string | null,
      "encouragement": string,
      "nextStep": string
    }`,
    messages: [{
      role: 'user',
      content: `Learner submission: ${submission}`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### Hint system
```typescript
// POST /api/exercises/:id/hint
// Returns the next unrevealed hint in sequence
// Tracks hints used per attempt
// Never reveals the full solution (that only shows after passing or 3+ attempts)
```

### Code execution (for Python/JS exercises)
```typescript
// POST /api/exercises/:id/run
// Sends code to Piston API (https://emkc.org/api/v2/piston/execute)
// Sandboxed execution, no internet access, 10s timeout
// Returns stdout, stderr, exit code
// Display output in read-only terminal panel below editor
```

---

## PRICING & BUSINESS MODEL

### The model in one sentence
Everything is free to learn. Certificates are £49 — community pricing, openly subsidised by those who pay it forward. The Working with Chronic Illness certificate is free forever. Pay £54 to also fund a scholarship seat for someone who can't pay.

### Why £49, not lower
£29 risks reading as "not a real credential." The comparison isn't other edtech —
it's what an employer or benefits assessor makes of the number.
£49 (~$62) is still well below Coursera and LinkedIn Learning,
accessible with the scholarship mechanic for those who genuinely can't pay,
and signals that the certificate was earned, not given.
Bundle at £149 for all six is a strong, honest saving (vs £294 full price).

### Pricing language on the site
Under the price, one line only:
  "Community pricing. Scholarships available — no questions asked."
No lengthy explanation. No charity framing. Just honest.

### Full structure

```
FREE — no account required to browse, account required to save progress
  All 6 tracks, all lessons, all exercises
  AI feedback on every submission
  Progress saving and accessibility settings
  Certificate: Working with Chronic Illness — FREE, always

CERTIFICATE — one-time purchase, per track
  £49 per track
  OR £54 — includes £5 pay-it-forward scholarship contribution
  Bundle: all 6 certificates £149 (or £154 with £5 scholarship)
  Working with Chronic Illness: always £0

GIFT A CERTIFICATE
  Any certificate can be purchased as a gift
  Buyer pays £49, enters recipient email at checkout
  Recipient gets: "Someone who cares about you bought you this."
  No expiry. Certificate issues when recipient completes the track.
  Gift is a checkbox in the standard checkout — not a separate flow.

SCHOLARSHIP SEAT — £0 to the recipient
  Funded from the pay-it-forward pool
  No application, no income verification, no questions
  First-come, first-served when pool has funds
  Auto-waitlist if pool empty — email when next seat opens

NO subscriptions. NO instalments. NO monthly charges.
```

### Why no instalments
£49 is low enough that instalments add more complexity than they solve.
People who genuinely cannot pay should claim a scholarship seat.
Instalment logic requires failed payment handling, access revocation,
retry emails, and Stripe subscription plumbing. Not worth it at this price.

### Stripe integration — what to build

```typescript
// PRODUCTS TO CREATE IN STRIPE DASHBOARD:

// 1. Certificate — Single track
//    Type: one-time payment
//    Price: £49 (4900 pence)
//    metadata: { type: 'certificate', track: '<track_slug>' }

// 2. Certificate — Single track + Pay it Forward
//    Type: one-time payment
//    Price: £54 (5400 pence)
//    metadata: { type: 'certificate', track: '<track_slug>', pif: true }

// 3. Certificate Bundle — All tracks
//    Type: one-time payment
//    Price: £149 (14900 pence)
//    metadata: { type: 'bundle' }

// 4. Certificate Bundle + Pay it Forward
//    Type: one-time payment
//    Price: £154 (15400 pence)
//    metadata: { type: 'bundle', pif: true }

// 5. Gift Certificate — Single track
//    Type: one-time payment
//    Price: £49
//    metadata: { type: 'certificate', track: '<track_slug>', gift: true, recipientEmail: '<email>' }

// NO recurring products. NO subscription products.

// CHECKOUT FLOW:
// POST /api/billing/checkout
//   body: {
//     trackSlug: string,
//     withPif: boolean,
//     bundle: boolean,
//     isGift: boolean,
//     recipientEmail?: string   // required if isGift: true
//   }
//   → creates Stripe Checkout Session
//   → on success: webhook fires checkout.session.completed

// WEBHOOK: POST /api/webhooks/stripe
// On checkout.session.completed:
//   1. Read metadata from session
//   2. If pif: true → add 500 pence to ScholarshipPool balance
//      → if pool >= 4900 → create ScholarshipSeat (available: true), pool -= 4900
//   3. If gift: true:
//      → Create GiftCertificate record { recipientEmail, trackSlug, purchasedBy: userId }
//      → Send gift notification email to recipient
//      → CertificatePurchase created for recipient when they claim + complete track
//   4. Else: create CertificatePurchase for buyer
//   5. If bundle: create purchase records for all 5 paid tracks
//   6. Send confirmation email via Resend
```

### Scholarship pool — database schema addition

```prisma
// ── SCHOLARSHIP POOL ──────────────────────────────────────────────────
// Singleton (id = "main"). Balance in pence. Seat threshold: 4900 (£49).
model ScholarshipPool {
  id          String   @id @default("main")
  balance     Int      @default(0)
  totalFunded Int      @default(0)  // cumulative seats ever funded — shown publicly
  updatedAt   DateTime @updatedAt
}

model ScholarshipSeat {
  id          String    @id @default(cuid())
  available   Boolean   @default(true)
  claimedById String?   @unique
  claimedBy   User?     @relation(fields: [claimedById], references: [id])
  claimedAt   DateTime?
  trackSlug   String?
  createdAt   DateTime  @default(now())
}

model ScholarshipWaitlist {
  id        String   @id @default(cuid())
  email     String   @unique
  trackSlug String?
  createdAt DateTime @default(now())
  notified  Boolean  @default(false)
}

// ── GIFT CERTIFICATES ─────────────────────────────────────────────────
// No expiry. Certificate issues when recipient completes the track.
// Not tied to recipient's account at purchase time — just their email.
model GiftCertificate {
  id              String    @id @default(cuid())
  purchasedById   String
  purchasedBy     User      @relation("GiftsSent", fields: [purchasedById], references: [id])
  recipientEmail  String
  trackSlug       String    // "all" for bundle gift
  stripeSessionId String    @unique
  claimedById     String?
  claimedAt       DateTime?
  createdAt       DateTime  @default(now())
}

// ── CERTIFICATE PURCHASES ─────────────────────────────────────────────
// paidAmount = 0:     free illness track, scholarship, gift (on recipient side)
// paidAmount = 4900:  standard cert
// paidAmount = 5400:  cert + pay-it-forward
// paidAmount = 14900: bundle
// paidAmount = 15400: bundle + pay-it-forward
model CertificatePurchase {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  trackSlug       String    // "all" for bundle
  paidAmount      Int       // pence
  isScholarship   Boolean   @default(false)
  isGift          Boolean   @default(false)
  isPif           Boolean   @default(false)
  isFree          Boolean   @default(false)  // illness track auto-issue
  stripeSessionId String?   @unique
  issuedAt        DateTime?
  createdAt       DateTime  @default(now())

  @@unique([userId, trackSlug])
}
```

### Scholarship claim flow

```typescript
// POST /api/scholarships/claim
// Auth required
// body: { trackSlug: string }

// 1. Check ScholarshipSeat where available: true — if none, add to waitlist
// 2. If seat available:
//    → Set seat.available = false, seat.claimedBy = userId, seat.claimedAt = now
//    → Create CertificatePurchase { paidAmount: 0, isScholarship: true }
//    → Send "seat claimed" email
// 3. Return: { success: true } or { success: false, waitlisted: true }

// GET /api/scholarships/pool
// Public endpoint — returns { balance: number, availableSeats: number }
// Used to power the live counter on the landing page and pricing page
// Cache for 60 seconds — no need to hit DB on every page load
```

### Public scholarship counter
Display on landing page and pricing page:

```
[X] certificates funded by this community
[Claim a free certificate] — shows if availableSeats > 0
[Join the waitlist] — shows if availableSeats === 0
```

Running total only. Not a progress bar toward "next seat" — 
just the cumulative number of people helped. Compounds visibly over time.

### Working with Chronic Illness — free certificate logic

```typescript
// This track's certificate requires NO purchase
// On track completion (all lessons done + assessment passed):
//   → Automatically create CertificatePurchase { paidAmount: 0, isScholarship: false }
//   → Generate and send certificate
//   → No Stripe involved
// This should be the FIRST certificate most users earn
// It is the clearest signal that Bed Coders is not a typical edtech platform
```

---

## EMAIL FLOWS

```
1.  Welcome:             "Your account is ready. No pressure on when to start."
2.  Verification:        Magic link — plain, no urgency
3.  First lesson nudge:  24h after signup, no lesson started — one line only
4.  Re-engagement:       14 days inactive — "We're here when you're ready."
5.  Certificate bought:  "Your [Track] certificate is unlocked. Complete the track to claim it."
6.  Certificate earned:  "You completed [Track]. Here's your certificate." + PDF attached
7.  Pay-it-forward:      "Thank you. Your £5 is in the pool. Someone will get access because of this."
8.  Scholarship claimed: "Your free certificate seat is active. Take your time."
9.  Waitlist joined:     "We'll email you the moment a seat opens."
10. Seat available:      To waitlisted — "A seat just opened. Claim it here."
11. Illness track cert:  Auto-sent on completion — "You earned this. No purchase needed."
12. Gift sent:           To buyer — "Your gift to [email] is confirmed. They'll receive it when they finish the track."
13. Gift received:       To recipient — "Someone who cares about you bought you a Bed Coders certificate. It's yours whenever you're ready. No expiry."
14. Gift claimed:        To buyer — "The person you gifted [Track] to just earned their certificate."
```

### Email tone rules (enforced in all templates)
- No exclamation marks in subject lines
- No urgency language ("Last chance", "Don't miss out")
- No streak or progress shaming
- Always plain text fallback
- Unsubscribe is prominent, not hidden

---

## CERTIFICATE SYSTEM

On completing a full track + passing the assessment:

```
1. Generate certificate:
   - Learner name, Track title, Completion date
   - Wording (exact, non-negotiable):
       "[Name] completed [Track Title]
        at their own pace, on their own terms."
   - NOT "has successfully completed" — that phrasing erases the how
   - Public verify URL: /verify/{unique-hash}
   - SVG (for display) + PDF (for download and sharing)
   - For illness track: auto-issued on completion, no purchase check

2. Gift claim logic:
   - On completion, check GiftCertificate where recipientEmail = user.email
   - If found and unclaimed: auto-issue certificate, mark gift as claimed
   - No action needed from user — it just arrives

3. LinkedIn share (optional, never required):
   - Pre-written caption the learner can edit before posting
   - Default text: "I completed [Track] with Bed Coders —
     a platform built for people learning tech from bed.
     Completed at my own pace, on my own terms."
   - No requirement to share publicly to receive certificate
```

---

## FLARE MODE

One of the most important UX features. Simple to build, profound in impact.

### What it is
A single button on the dashboard: **"I'm in a flare."**
Tapping it shifts the entire interface into a lower-demand state — no form submission, no settings page, just one tap.

### What changes in flare mode
```
- Dashboard shows only LOW energy content (reading, short quizzes)
- No exercise prompts, no code editors, no open-ended reflections
- Font size bumps up one level automatically (if not already at max)
- Reduce motion activates automatically
- All progress bars and completion percentages are hidden
- The energy picker is hidden — no need to "report" how you feel
- A single soft message replaces the usual dashboard header:
    "Easy mode on. Everything will be here when you're ready."
- No "complete this before your streak breaks" anywhere (already true globally)
```

### What doesn't change
```
- All content is still accessible — nothing is locked
- Progress from previous sessions is preserved
- Settings remain as user had them (flare mode is a temporary overlay, not a settings change)
```

### Exiting flare mode
```
- On next login: one gentle prompt — "Still in easy mode. Keep it on or switch back?"
  [Keep easy mode]   [I'm feeling better]
- No fanfare on exit. No "welcome back!" Just normal dashboard.
- If user dismisses without choosing: stays in flare mode
```

### Technical implementation
```typescript
// Add to User model:
//   inFlareMode  Boolean  @default(false)
//   flareModeSetAt DateTime?

// POST /api/user/flare-mode
//   body: { active: boolean }
//   → sets user.inFlareMode, user.flareModeSetAt
//   → no other side effects

// Frontend: FlareMode context wraps dashboard
//   if (user.inFlareMode) → filter lesson suggestions to energyCost === 'LOW'
//   → apply CSS class .flare-mode to dashboard root
//   → .flare-mode hides progress bars, percentages, exercise cards
//   → font-size context bumps one level (unless already XLARGE)
//   → reduceMotion forced true for session
```

### The button placement
```
Dashboard header — subtle, not prominent, never alarming:
  Text: "In a flare today?"  →  [Easy mode]
  Size: Small, muted colour (--text-muted), below the energy picker
  After activation: replaced by "Easy mode on." with a small [turn off] link
```

---

## COMPLETION LANGUAGE

These are exact strings. Do not use generic "Congratulations" or "Well done."

```
After completing a lesson:
  "Done. That's enough for today if you need it."
  Then: [Continue →]  [I'm done for now]

After completing a module:
  "You finished this module. That took something."
  Then: [Next module →]  [Take a break]

After completing a full track:
  "You did that. On days when doing things isn't easy."
  Then certificate generation begins.

After a difficult exercise (3+ attempts before passing):
  "That one was hard. You got there."

After skipping:
  No message. Skipping is neutral. No counter, no acknowledgement.

Re-engagement email subject line (after 14 days):
  "We're here when you're ready."
  Body: one sentence. No bullet points listing what they missed.

First login after flare mode:
  "Still in easy mode. Keep it on or switch back?"
  [Keep easy mode]  [I'm feeling better]
```

---

## ENVIRONMENT VARIABLES

```env
# .env.example

DATABASE_URL="postgresql://user:password@localhost:5432/bedcoders"

BETTER_AUTH_SECRET="generate-32-char-secret"
APP_URL="http://localhost:3000"

ANTHROPIC_API_KEY="sk-ant-..."

STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CERT_PRICE_ID="price_..."          # £49 single cert
STRIPE_CERT_PIF_PRICE_ID="price_..."      # £54 single cert + pay-it-forward
STRIPE_BUNDLE_PRICE_ID="price_..."        # £149 bundle
STRIPE_BUNDLE_PIF_PRICE_ID="price_..."    # £154 bundle + pay-it-forward
STRIPE_GIFT_PRICE_ID="price_..."          # £49 gift cert

RESEND_API_KEY="re_..."
EMAIL_FROM="hello@bedcoders.com"

PISTON_API_URL="https://emkc.org/api/v2/piston"

NODE_ENV="development"
```

---

## BUILD ORDER

```
1.  Initialize monorepo (pnpm workspaces)
2.  Set up Prisma schema + seed data (3 sample lessons across 2 tracks)
3.  Build Express API — auth middleware, error handling, request validation
4.  Implement Better Auth (email/password + magic link)
5.  Build Stripe checkout — single cert £49, bundle £149, pay-it-forward +£5, gift option
6.  Implement Stripe webhook — pool logic, seat creation, gift issuance, cert purchase
7.  Implement Claude feedback engine with warm tone prompt (see CLAUDE FEEDBACK section)
8.  Implement Piston code execution endpoint
9.  Build React frontend — routing, dark mode context, font size context, flare mode context
10. Build landing page — community pricing language, scholarship counter, gift option
11. Build auth pages (calm, no dark patterns)
12. Build Learn dashboard — energy picker + flare mode button
13. Build Lesson interface (reading, exercise, quiz, reflection)
14. Build Flare mode — content filter overlay, exit prompt on next login
15. Build Settings page (dark mode, font size, reduce motion, energy tracking)
16. Build Account page — certificates list, gift history, no subscription UI
17. Build Progress page — no streaks, no "days since last login" anywhere
18. Build Scholarship flow — claim button, waitlist, public pool counter endpoint
19. Build Gift flow — checkout checkbox, recipient email input, auto-claim on completion
20. Set up Resend — all 14 email templates with correct tone (see EMAIL FLOWS)
21. Certificate generation — SVG + PDF, exact wording, /verify/{hash} endpoint
22. Working with Chronic Illness auto-cert — issues on completion, no payment check
23. WCAG 2.1 AA audit — fix all issues before proceeding to next step
24. Mobile audit — 375px, portrait, one-handed, simulate low brightness
25. Codebase search: "streak", "last active", "days since", "falling behind" — remove all instances
26. E2E: signup → lesson → exercise → feedback → flare mode → resume
27. E2E: cert purchase → complete track → certificate → verify URL
28. E2E: pay-it-forward → pool grows → seat opens → scholarship claimed
29. E2E: gift purchase → recipient email → recipient completes → cert issued → buyer notified
30. Deploy to Render.com
```

---

## QUALITY BAR

### Accessibility (non-negotiable)
- All interactive elements keyboard-navigable
- All images have alt text
- Color contrast ratio: 4.5:1 minimum for text
- Focus indicators visible
- Screen reader tested (NVDA + VoiceOver minimum)
- No content that flashes more than 3 times per second
- All forms have labels (not just placeholders)

### Performance
- First contentful paint < 1.5s
- Works on 3G connection
- Lessons cache for offline reading via Service Worker
- Images optimised, lazy loaded

### Emotional safety
- No negative streak counters anywhere in the codebase
- No "you haven't logged in in X days" messaging
- All error messages written in calm, non-alarming language
- No dark patterns in cancellation or subscription flows

### Privacy
- No third-party tracking scripts
- Analytics: self-hosted Plausible (privacy-preserving) or none
- Health/energy log data is private, never shared, deletable
- GDPR compliant from day one

---

## DONE WHEN

- [ ] User can sign up and access full curriculum without entering payment info
- [ ] Energy picker on dashboard suggests appropriate lessons by cost
- [ ] Flare mode activates with one tap — filters content, persists across sessions
- [ ] Lesson progress saves even if browser closes mid-session
- [ ] Claude feedback is warm, specific, loads in < 30 seconds
- [ ] Python/JS code executes in sandbox and returns output
- [ ] Certificate checkout completes at £49 (single) and £149 (bundle)
- [ ] Pay-it-forward £5 flows into scholarship pool correctly
- [ ] Scholarship pool opens a seat automatically when balance ≥ £49
- [ ] Scholarship claim requires no form — just a button
- [ ] Gift purchase sends email to recipient, certificate issues on track completion
- [ ] Working with Chronic Illness certificate issues automatically at track completion
- [ ] Certificate PDF generates with exact wording: "at their own pace, on their own terms"
- [ ] Public verify URL works at /verify/{hash}
- [ ] Dark mode, font size, reduce motion all persist to database
- [ ] No "last active" display anywhere in the UI
- [ ] No streak counters anywhere in the codebase (search for "streak" before shipping)
- [ ] All completion messages use exact specified language
- [ ] WCAG 2.1 AA passes on all core pages
- [ ] All pages render correctly at 375px, portrait, one-handed
- [ ] Re-engagement email fires at 14 days and contains no shame language

---

*End of Claude Code Build Prompt — Bed Coders*
