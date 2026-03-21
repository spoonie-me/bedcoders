# CLAUDE CODE AUDIT PROMPT
## Bed Coders — Curriculum Depth Audit + Certificate System Verification

> Paste this into a Claude Code session after the main build is complete.
> Run it as a structured audit across two areas: curriculum sufficiency and certificate integrity.
> Fix every issue found before considering the platform ready to launch.

---

## PART 1: CURRICULUM DEPTH AUDIT

### What you are checking

Each of the six tracks must meet minimum standards of depth, breadth, and learner value.
A track that is too short produces a certificate that means nothing.
A track that is too shallow produces skills that don't transfer.
Run this audit against the seeded curriculum in the database.

---

### Minimum standards per track

Every track must meet ALL of the following before its certificate is enabled:

```
LESSONS
  Minimum 12 lessons per track
  Minimum 3 modules per track
  Minimum 3 lessons per module
  Mix of lesson types required — no track may be 100% one type:
    - At least 30% EXERCISE lessons (hands-on, not just reading)
    - At least 20% READING lessons (conceptual grounding)
    - At least 10% REFLECTION or QUIZ lessons
  No two consecutive lessons may be the same type
    (alternating keeps cognitive load manageable)

TIME
  Total estimated minutes per track: minimum 180 minutes (3 hours)
  No single lesson may exceed 25 minutes estimated time
  No module may have all HIGH energy cost lessons in sequence
    (max 2 HIGH lessons in a row before a LOW or MEDIUM lesson)

EXERCISES
  Every EXERCISE lesson must have:
    - A clear task prompt (not vague)
    - At least 2 progressive hints (not just one)
    - A rubric with at least 3 evaluation criteria for Claude feedback
    - A model solution or exemplar answer
  No track may have fewer than 5 exercise lessons
  No track may have fewer than 2 code execution exercises
    (except: Working with Chronic Illness track — code execution not required)

ASSESSMENT
  Every track must have a final assessment (minimum 10 questions or tasks)
  Assessment must include at least one open-ended exercise (not just multiple choice)
  Pass threshold: 70% minimum
  Assessment must be distinct from lesson exercises — no reuse of identical prompts
```

---

### Per-track specific requirements

```
TRACK 1 — AI Foundations
  Must cover: what AI is, how LLMs work (plain language), what AI is good/bad at,
              basic prompting, ethical considerations, hallucination and limitations
  Must NOT assume: any coding background, any prior tech knowledge
  Benchmark: a learner with zero tech background can complete this track

TRACK 2 — Prompt Engineering
  Must cover: prompt structure, role/context/task framing, chain-of-thought,
              few-shot examples, iterative refinement, system prompts,
              prompt evaluation and testing
  Must include: at least 5 exercises where learner writes and iterates a real prompt
  Must NOT be: a copy of Track 1 extended — new concepts at every lesson

TRACK 3 — Python for Data
  Must cover: variables, data types, lists, dicts, loops, functions,
              file reading, pandas (load/inspect/filter/groupby/aggregate),
              basic visualisation (matplotlib or plotly)
  Must include: at least 4 exercises using real or realistic datasets
  Code execution required: all Python exercises must run in Piston sandbox
  Must NOT require: environment setup, local Python installation, Jupyter

TRACK 4 — Data Science Essentials
  Must cover: descriptive statistics, distributions, correlation vs causation,
              basic hypothesis testing, train/test split, intro to scikit-learn
              (at least linear regression and one classification model),
              model evaluation metrics, visualisation for communication
  Must include: at least one end-to-end mini-project exercise
  Prerequisite check: gate this track behind Track 3 completion or explicit acknowledgement

TRACK 5 — Build with AI
  Must cover: API authentication and requests, Anthropic Claude API (messages endpoint),
              prompt templating in code, building a simple CLI tool,
              building a simple web-callable function,
              error handling for AI outputs, cost awareness,
              one complete real-world mini-project (learner builds something usable)
  Must include: at least one exercise where learner ships something that actually runs
  Code execution required: Python exercises run in Piston; API call exercises
    may use mock responses to avoid requiring learner to supply API keys

TRACK 6 — Working with Chronic Illness
  Must cover: remote work setup and tools, freelancing basics (contracts, rates, invoicing),
              explaining CV gaps honestly and professionally,
              energy budgeting for work (not just life),
              benefits and income interaction (general principles — not jurisdiction-specific advice),
              disability disclosure decisions,
              setting boundaries with employers and clients
  Must NOT: give legal or benefits advice specific to any jurisdiction
  Must NOT: be inspirational or motivational in tone — practical only
  Must NOT: require any technical prerequisite
  Certificate: FREE — auto-issued on completion, no payment
```

---

### How to run the audit

```typescript
// Run this as a script: pnpm audit:curriculum

import { prisma } from './packages/db'

async function auditCurriculum() {
  const tracks = await prisma.track.findMany({
    include: {
      modules: {
        include: {
          lessons: {
            include: { exercise: true }
          }
        }
      }
    },
    orderBy: { orderIndex: 'asc' }
  })

  const issues: string[] = []

  for (const track of tracks) {
    const lessons = track.modules.flatMap(m => m.lessons)
    const exercises = lessons.filter(l => l.lessonType === 'EXERCISE')
    const totalMin = lessons.reduce((sum, l) => sum + l.estimatedMin, 0)
    const highEnergyRuns = checkConsecutiveHigh(lessons)

    // Lesson count
    if (lessons.length < 12)
      issues.push(`[${track.slug}] Only ${lessons.length} lessons — minimum 12`)

    // Module count
    if (track.modules.length < 3)
      issues.push(`[${track.slug}] Only ${track.modules.length} modules — minimum 3`)

    // Lessons per module
    for (const mod of track.modules) {
      if (mod.lessons.length < 3)
        issues.push(`[${track.slug}/${mod.slug}] Only ${mod.lessons.length} lessons — minimum 3`)
    }

    // Time
    if (totalMin < 180)
      issues.push(`[${track.slug}] Only ${totalMin} min total — minimum 180`)

    // Exercise proportion
    const exPct = exercises.length / lessons.length
    if (exPct < 0.3)
      issues.push(`[${track.slug}] Only ${Math.round(exPct*100)}% exercise lessons — minimum 30%`)

    // Exercise quality
    for (const lesson of exercises) {
      if (!lesson.exercise) {
        issues.push(`[${track.slug}/${lesson.slug}] EXERCISE lesson has no exercise record`)
        continue
      }
      const hints = lesson.exercise.hints as string[]
      if (!hints || hints.length < 2)
        issues.push(`[${track.slug}/${lesson.slug}] Fewer than 2 hints`)
      const rubric = lesson.exercise.rubric as any[]
      if (!rubric || rubric.length < 3)
        issues.push(`[${track.slug}/${lesson.slug}] Fewer than 3 rubric criteria`)
      if (!lesson.exercise.solution)
        issues.push(`[${track.slug}/${lesson.slug}] No model solution`)
    }

    // Minimum 5 exercises per track
    if (exercises.length < 5)
      issues.push(`[${track.slug}] Only ${exercises.length} exercises — minimum 5`)

    // Code execution (except track 6)
    if (track.slug !== 'working-with-illness') {
      const codeEx = exercises.filter(l =>
        l.exercise?.exerciseType === 'WRITE_CODE' ||
        l.exercise?.exerciseType === 'DEBUG_CODE'
      )
      if (codeEx.length < 2)
        issues.push(`[${track.slug}] Fewer than 2 code execution exercises`)
    }

    // Consecutive HIGH energy
    if (highEnergyRuns > 0)
      issues.push(`[${track.slug}] Has ${highEnergyRuns} sequence(s) of 3+ HIGH energy lessons in a row`)

    // Lesson type variety
    const types = new Set(lessons.map(l => l.lessonType))
    if (types.size < 2)
      issues.push(`[${track.slug}] Only one lesson type — needs variety`)

    // Assessment exists
    // Check for a lesson with title containing "assessment" or "final" in last module
    const lastModule = track.modules[track.modules.length - 1]
    const hasAssessment = lastModule?.lessons.some(l =>
      l.title.toLowerCase().includes('assessment') ||
      l.title.toLowerCase().includes('final')
    )
    if (!hasAssessment)
      issues.push(`[${track.slug}] No final assessment found in last module`)
  }

  if (issues.length === 0) {
    console.log('✓ All tracks pass curriculum depth audit.')
  } else {
    console.log(`\n✗ ${issues.length} curriculum issues found:\n`)
    issues.forEach(i => console.log('  —', i))
    process.exit(1)
  }
}

function checkConsecutiveHigh(lessons: any[]): number {
  let runs = 0, count = 0
  for (const l of lessons) {
    count = l.energyCost === 'HIGH' ? count + 1 : 0
    if (count >= 3) runs++
  }
  return runs
}

auditCurriculum().catch(console.error)
```

Add to `package.json` scripts:
```json
"audit:curriculum": "tsx packages/api/src/scripts/auditCurriculum.ts"
```

**Do not enable certificates for any track until this script exits with code 0.**

---

## PART 2: CERTIFICATE SYSTEM — FULL SPECIFICATION

### What a Bed Coders certificate must do

1. Be visually distinct and professional — not a generic PDF
2. Be publicly verifiable at a permanent URL
3. Be shareable directly to LinkedIn via the Add to Profile flow
4. Be tamper-evident — verifier can confirm authenticity without contacting us
5. Carry the exact required wording — not editable, not overridable

---

### Certificate data model

```prisma
model Certificate {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  trackSlug     String
  trackTitle    String    // stored at time of issue — track title may change later
  recipientName String    // stored at time of issue
  issuedAt      DateTime  @default(now())
  verifyHash    String    @unique  // 32-char hex, generated on issue
  isRevoked     Boolean   @default(false)
  revokedReason String?
  pdfUrl        String?   // object storage URL (Cloudflare R2 or Render disk)
  linkedInUrl   String?   // pre-built LinkedIn Add to Profile URL

  @@unique([userId, trackSlug])
}
```

---

### Certificate generation — step by step

```typescript
// packages/api/src/lib/certificates.ts

import crypto from 'crypto'
import { generateCertificatePDF } from './certificatePdf'
import { buildLinkedInUrl } from './linkedin'
import { prisma } from '../../db'

export async function issueCertificate(userId: string, trackSlug: string) {
  // 1. Verify track assessment passed
  const passed = await prisma.assessmentResult.findFirst({
    where: { userId, trackSlug, passed: true }
  })
  if (!passed) throw new Error('Assessment not passed')

  // 2. Verify certificate purchase exists (or is free track)
  const track = await prisma.track.findUnique({ where: { slug: trackSlug } })
  if (!track?.certFree) {
    const purchase = await prisma.certificatePurchase.findFirst({
      where: { userId, trackSlug }
    })
    if (!purchase) throw new Error('No certificate purchase found')
  }

  // 3. Generate unique verify hash
  const verifyHash = crypto.randomBytes(16).toString('hex')

  // 4. Get user name (fall back to email prefix if no name set)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const recipientName = user.name || user.email.split('@')[0]

  // 5. Create certificate record first (needed for PDF URL construction)
  const cert = await prisma.certificate.create({
    data: {
      userId,
      trackSlug,
      trackTitle: track!.title,
      recipientName,
      verifyHash,
    }
  })

  // 6. Generate PDF
  const pdfBuffer = await generateCertificatePDF({
    recipientName,
    trackTitle: track!.title,
    issuedAt: cert.issuedAt,
    verifyHash,
    verifyUrl: `${process.env.APP_URL}/verify/${verifyHash}`,
  })

  // 7. Store PDF (write to /certs/{verifyHash}.pdf on Render persistent disk
  //    or upload to Cloudflare R2 — adjust as appropriate)
  const pdfUrl = await storeCertificatePdf(verifyHash, pdfBuffer)

  // 8. Build LinkedIn URL
  const linkedInUrl = buildLinkedInUrl({
    trackTitle: track!.title,
    issuedAt: cert.issuedAt,
    verifyHash,
  })

  // 9. Update certificate record with URLs
  await prisma.certificate.update({
    where: { id: cert.id },
    data: { pdfUrl, linkedInUrl }
  })

  return { ...cert, pdfUrl, linkedInUrl }
}
```

---

### Certificate PDF — visual specification

```typescript
// packages/api/src/lib/certificatePdf.ts
// Use: pdf-lib (npm install pdf-lib)
// Fonts: embed Lora (serif) + DM Sans — download from Google Fonts, embed as base64

// DIMENSIONS: A4 landscape (841.89 x 595.28 pt)

// LAYOUT (top to bottom, centred):
//
//  ┌─────────────────────────────────────────────────────────────┐
//  │                                                             │
//  │   [top border: 2pt terracotta line full width]              │
//  │                                                             │
//  │         bed coders                    [small, DM Sans 600]  │
//  │                                                             │
//  │         Certificate of Completion     [Lora 500, 28pt]      │
//  │                                                             │
//  │         ─────────────────────────                           │
//  │                                                             │
//  │         [Recipient Name]              [Lora italic, 36pt]   │
//  │                                                             │
//  │         completed                     [DM Sans 300, 14pt]   │
//  │                                                             │
//  │         [Track Title]                 [Lora 500, 22pt]      │
//  │                                                             │
//  │         at their own pace,            [Lora italic, 14pt,   │
//  │         on their own terms.            colour: #6b635c]     │
//  │                                                             │
//  │         ─────────────────────────                           │
//  │                                                             │
//  │   Issued [Month Year]    Verify: bedcoders.com/verify/[hash]│
//  │   [small, DM Sans, muted]                                   │
//  │                                                             │
//  │   [bottom border: 2pt terracotta line full width]           │
//  └─────────────────────────────────────────────────────────────┘

// COLOURS:
//   Background: #f7f5f2 (warm off-white — NOT pure white)
//   Primary text: #2d2926
//   Accent lines: #c96a3a (terracotta)
//   Secondary text: #6b635c
//   No images, no watermark graphics — clean typographic certificate

// VERIFICATION TEXT (bottom, small, monospace-style):
//   "Verify the authenticity of this certificate at:"
//   "bedcoders.com/verify/[verifyHash]"
//   This URL must be live and permanent

// OUTPUT: Buffer (PDF bytes) — caller handles storage
```

---

### Public verification endpoint

```typescript
// GET /verify/:hash
// Public — no auth required
// Used by employers, LinkedIn, anyone checking authenticity

// Returns an HTML page (not JSON) for human verifiers:
//
//  ┌─────────────────────────────────────────────────────┐
//  │  bed coders — Certificate Verification              │
//  │                                                     │
//  │  ✓ This certificate is authentic.                   │
//  │                                                     │
//  │  Issued to:    [Recipient Name]                     │
//  │  Track:        [Track Title]                        │
//  │  Issued:       [Month Day, Year]                    │
//  │  Certificate:  [verifyHash]                         │
//  │                                                     │
//  │  [Download PDF]   [View on LinkedIn]                │
//  └─────────────────────────────────────────────────────┘
//
// If hash not found: "This certificate could not be verified."
// If revoked: "This certificate has been revoked." (no reason shown publicly)
// Page must be indexable by Google (no noindex) — permanent URLs matter

// Route: app.get('/verify/:hash', async (req, res) => {
//   const cert = await prisma.certificate.findUnique({
//     where: { verifyHash: req.params.hash },
//     include: { user: true }
//   })
//   if (!cert) return res.status(404).render('verify-not-found')
//   if (cert.isRevoked) return res.render('verify-revoked')
//   return res.render('verify-valid', { cert })
// })
```

---

### LinkedIn Add to Profile integration

LinkedIn supports a direct URL that pre-fills the "Add Licence or Certification" form.

```typescript
// packages/api/src/lib/linkedin.ts

export function buildLinkedInUrl({
  trackTitle,
  issuedAt,
  verifyHash,
}: {
  trackTitle: string
  issuedAt: Date
  verifyHash: string
}): string {
  // LinkedIn Add to Profile URL format:
  // https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&...

  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: `${trackTitle} — Bed Coders`,
    organizationName: 'Bed Coders',
    issueYear: String(issuedAt.getFullYear()),
    issueMonth: String(issuedAt.getMonth() + 1),
    // No expiry — skills don't expire
    certUrl: `https://bedcoders.com/verify/${verifyHash}`,
    certId: verifyHash,
  })

  return `https://www.linkedin.com/profile/add?${params.toString()}`
}

// This URL, when opened by a LinkedIn user, takes them directly to
// a pre-filled "Add Licence or Certification" form in their profile editor.
// They click save — the certificate appears on their profile with:
//   Name: [Track Title] — Bed Coders
//   Issuing organisation: Bed Coders
//   Issue date: [Month Year]
//   Credential ID: [verifyHash]
//   Credential URL: https://bedcoders.com/verify/[verifyHash]
//
// When a profile viewer clicks the credential URL, they land on
// the /verify/:hash page which confirms authenticity.
```

---

### On the certificate page (after earning a certificate)

```
┌─────────────────────────────────────────────────────────────┐
│  🎓  You earned it.                                         │
│                                                             │
│  [Track Title]                                              │
│  Completed at your own pace, on your own terms.             │
│                                                             │
│  Issued: [Month Year]                                       │
│  Certificate ID: [verifyHash]                               │
│                                                             │
│  [⬇ Download PDF]                                          │
│  [in Add to LinkedIn Profile]                               │
│  [🔗 Copy verify link]                                     │
│                                                             │
│  Anyone can verify this certificate at:                     │
│  bedcoders.com/verify/[verifyHash]                          │
└─────────────────────────────────────────────────────────────┘

Notes on this page:
- No "Share on social media" pressure — LinkedIn button is enough
- Copy verify link copies the full URL to clipboard, no page reload
- PDF downloads immediately, no second click
- "Completed at your own pace, on their own terms" appears here too —
  not just on the PDF. It is the framing of what this credential means.
```

---

### Tamper-evidence — how verification actually works

The verifyHash is a 32-character random hex string generated at time of issue and stored in the database. It is embedded in:
- The PDF itself (visible text at the bottom)
- The LinkedIn credential URL
- The public verify endpoint URL

There is no cryptographic signature on the PDF itself (that would require a PKI setup). Instead, the authority is the live database — the verify endpoint is the source of truth. This is the same model used by Coursera, edX, and most credible online learning platforms.

For now this is sufficient. If Bed Coders grows to a point where a PKI-signed PDF is warranted, implement it then — do not over-engineer at launch.

```typescript
// Certificate revocation (admin only)
// POST /api/admin/certificates/:verifyHash/revoke
// body: { reason: string }  — internal only, not shown publicly
// Sets cert.isRevoked = true
// Sends email to certificate holder: "Your certificate has been updated.
//   Please contact hello@bedcoders.com if you have questions."
// Does NOT delete the certificate record — keep for audit trail
```

---

## DONE WHEN — CERTIFICATE AUDIT CHECKLIST

Run these checks before enabling certificates on any track:

```
CURRICULUM
- [ ] pnpm audit:curriculum exits with code 0 for all 6 tracks
- [ ] Each track has been manually reviewed — not just passed the script
- [ ] Assessment questions reviewed — no duplicate lesson exercises
- [ ] Track 6 (Working with Illness) reviewed for jurisdiction-specific advice — remove any found
- [ ] Track 3 and 4 datasets are real or realistic — no toy data that doesn't transfer
- [ ] Track 5 includes a mini-project the learner actually ships

CERTIFICATES
- [ ] Certificate PDF generates for all 6 tracks
- [ ] PDF contains exact wording: "at their own pace, on their own terms"
- [ ] verifyHash is unique — confirmed by DB constraint
- [ ] /verify/:hash returns correct data for a real certificate
- [ ] /verify/:hash returns "not found" for a fake hash
- [ ] /verify/:hash returns "revoked" for a revoked certificate
- [ ] LinkedIn URL opens LinkedIn profile editor with correct pre-filled data
- [ ] LinkedIn credential URL points to live /verify/:hash page
- [ ] PDF download works on mobile (iOS Safari, Android Chrome — these handle PDFs differently)
- [ ] Certificate page shows all three actions: download, LinkedIn, copy link
- [ ] Working with Chronic Illness certificate issues automatically at track completion
- [ ] Gift certificate issues on recipient track completion (not on purchase)
- [ ] Scholarship certificate issues identically to paid certificate — no visual difference
- [ ] Revocation works — revoked cert shows correct message on verify page
- [ ] Certificate email includes PDF attachment and LinkedIn link
```

---

*End of Curriculum & Certificate Audit Prompt — Bed Coders*
