# Hiring data policy

How learner data does and does not reach employers. This is the document the
schema comments and route comments point at; if you are changing anything in
the hiring layer, the rules here are the ones you have to keep true.

## The shape of the promise

Soft Reset School teaches people who often have non-linear résumés, variable
capacity, and good reason to be cautious about what an employer learns about
them. The hiring layer exists to get them paid work. It must not do that by
spending the thing they came here with least of: control over their own story.

So the whole layer is built on one asymmetry — **employers get less by
default, and only ever get more because a learner said so.**

## The four rules

### 1. Nothing is on by default

`TalentProfile.isDiscoverable` defaults to `false`, and so does every one of
the seven `show*` columns. A learner who opens the hiring page, looks around,
and closes it again has changed nothing about their visibility.

Turning discoverability on has its own endpoint (`POST /api/talent/me/discoverable`)
rather than being a field on the profile update. Becoming visible to strangers
should never be a side effect of saving an unrelated field, and it writes an
audit log entry.

### 2. There is no health data, so there is nothing to leak

There is deliberately **no diagnosis, disability, condition, accommodation, or
health column anywhere in the hiring schema.** This is not an oversight and it
is not a gap to fill later.

What employers can see is the *work shape* a learner asked for — remote,
async, part time, flexible hours, an hours-per-week range. That is the
operationally relevant part. The reason behind it is the learner's, and if
they want to disclose it they can write it in their own summary, in their own
words, at a moment of their choosing.

`backend/src/lib/__tests__/talentVisibility.test.ts` asserts that no
serialised employer view contains health-adjacent substrings. If you add a
field that trips it, the test is right and the field is wrong.

### 3. Contact details come from consent, not from search

The directory never returns a name or an email address. Not at any filter
setting, not on any plan, not to any account.

An employer who wants to reach someone sends an **intro request**: their
company profile plus a written message of at least 40 characters. The learner
accepts, declines, or lets it lapse. Only `accepted` releases their name and
email, and only through `releaseContact()`, which checks the status itself so
there is no code path to an email address that skips the check.

Three details that matter:

- **A decline is final for that company.** Otherwise "no" is a pause button
  and the inbox becomes something to dread.
- **Requests expire after 14 days.** Letting one lapse is a valid answer and
  is recorded as `expired`, not as a refusal.
- **Learners can read back exactly what was shared** via
  `GET /api/talent/me/intros/:id/shared`.

### 4. One choke point, and it is tested

`backend/src/lib/talentVisibility.ts` is the only place learner data becomes
employer-visible data. It is pure — no Prisma import — so it can be tested
directly, and it is, at 35 cases covering each flag independently.

Employer-facing routes must project through `toEmployerView` or
`toDirectoryCard`. Do not hand a Prisma `TalentProfile` to an employer
response from anywhere else, even if it looks safe at the call site. The value
of a choke point is that it is the only one.

Two supporting details:

- **Hidden fields are omitted, not nulled.** An employer cannot distinguish a
  hidden country from an unset one.
- **A non-discoverable profile 404s, not 403s.** An employer must not be able
  to use the directory to confirm that a given person is on the platform.
- **Searchable skills are derived after projection**, from visible sources
  only. A learner who hides their portfolio does not become searchable by its
  contents — otherwise search becomes an oracle for hidden data.

## Employer sessions are cookie-only

The employer session token is never returned in a response body and never
written to `localStorage`. It exists only in the `bc_emp` cookie, set
`httpOnly` + `secure` + `sameSite=strict`, so no script on the page — ours or
an injected one — can read it, and it never travels over plaintext http.
`EmployerAuthContext` therefore has no token in it at all; it asks
`GET /api/employers/me` whether a session exists.

`secure` is unconditional here, where the learner cookie makes it conditional
on `NODE_ENV`. Local development still works because browsers treat
`localhost` as a trustworthy origin; serving the dev API from a LAN IP would
need a localhost tunnel. Worth applying the same change to `setAuthCookie` in
`middleware/auth.ts` — out of scope for this change, since it touches the
existing learner session.

The learner client still keeps its token in `localStorage` for backwards
compatibility (see the note in `middleware/auth.ts`). The employer surface is
new code with no such constraint, so it does not inherit that.

Related: employer tokens are signed with the same secret as learner tokens but
carry `employerId` and an `employer` audience. Both middlewares check for
their own shape and reject the other's — `authMiddleware` rejects a token with
an `employer` audience or no `userId`, and `employerAuthMiddleware` requires
the `employer` audience. `backend/src/__tests__/hiringRoutes.test.ts` asserts
the rejection in both directions.

## What employers get in exchange

The rules above are strict, and they are also the product. What an employer
gets here that a general job board cannot offer:

- **Provenance on every portfolio item.** `source: 'curriculum'` is set by the
  server, only after verifying the learner completed every published lesson in
  the module. A learner cannot mark their own project as graded coursework.
  That is exactly why the badge means something.
- **Independently verifiable certificates**, each with a public code checkable
  at `/verify/:code` without trusting us or the candidate.
- **Filters that match how people can actually work**, so nobody discovers a
  mismatch at offer stage.

## Rules the board enforces on employers

- **Pay ranges are required to publish.** `POST /api/jobs/manage/:id/publish`
  rejects a posting with no range. An audience that often negotiates from a
  weak position should not also be made to guess.
- **A company profile is required** before searching or contacting anyone, so
  every request a learner receives has an accountable company behind it.
- **Applying is not the same as being listed.** A learner can apply to a
  single role without entering the directory, and applying shares their handle
  and cover note with that one employer — not their email.

## Curriculum feedback loop

`SkillDemandSignal` counts, per skill key, how often it appears in a directory
filter and on a published job. It carries no learner id, no employer id, and
no per-event rows — just two counters. It exists to tell curriculum planning
which skills the market is actually asking for, and it is not capable of
telling anyone anything about an individual.

## Things not built yet

Named here so nobody assumes they exist:

- Employer email verification and company verification are stubs.
  `Company.verifiedAt` is settable but nothing sets it yet; the "Verified"
  chip therefore only appears once someone sets it manually.
- No notification emails on intro requests or application status changes.
- Post-hire outcome feedback (phase 5 of the original brief) is not built.
- Deleting a learner account cascades to their talent profile, portfolio,
  intro requests and applications via `onDelete: Cascade`. Contact details
  already released to an employer are, necessarily, already released — that is
  worth saying plainly in the privacy policy when this ships.
