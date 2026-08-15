# Bedcoders Suite — Locked Decisions

> **SET IN STONE: 2026-04-11**
> Do not reopen without explicit founder approval + written reason.
> Every PR, deploy, and Stripe config gets checked against this file.

---

## Program Suite — LOCKED 2026-04-11

| Emoji | Name | Status | Price |
|-------|------|--------|-------|
| ⛺ | **BedCamp** | Live | FREE |
| 💻 | **Bedcoders** | Live | €299/yr or 12×€24.90 |
| 🏥 | **BedOps** | Live | €299/yr or 12×€24.90 |
| 🧭 | **Bedvocates** | Soon | €299/yr or 12×€24.90 |
| 📊 | **BedData** | Soon | €299/yr or 12×€24.90 |
| 🎓 | **BedTeacher** | Soon | €299/yr or 12×€24.90 |
| 🤝 | **BedCare** | Soon | €299/yr or 12×€24.90 |
| 🔨 | **BedMaker** | Soon | €299/yr or 12×€24.90 |

**Rules:**
- Every program name starts with "Bed" — no exceptions
- Slugs: `bed-camp`, `bedcoders`, `bed-ops`, `bedvocates`, `bed-data`, `bed-teacher`, `bed-care`, `bed-maker`
- BedCamp is always free — it's the entry point, not a trial

---

## Pricing — LOCKED 2026-04-11

**€299/year per program — OR — 12 × €24.90/month installment plan**

| Option | Price | Notes |
|--------|-------|-------|
| Annual | €299/year | Pay once, full year |
| Installment | 12 × €24.90 | Total: €298.80 — essentially the same |

**What is deprecated (remove from all code, copy, DB):**
- ~~€49 per-course~~
- ~~€199 single track~~
- ~~€29/month Monthly Pro~~
- ~~€99/seat/year team seat~~
- ~~"Two Tracks" tier~~
- ~~"Explorer" free trial framing~~
- ~~Student 40% discount auto-apply~~
- ~~Any reference to old track names: Health Informatics, Health AI, Genomics, Data Science~~

**Stripe constants to create:**
- `STRIPE_PRICE_ANNUAL` = €299/yr recurring
- `STRIPE_PRICE_INSTALLMENT` = €24.90/mo recurring (12-month commitment)

---

## Naming Rules — LOCKED 2026-04-11

**In code:**
- Program slugs: `bed-camp`, `bedcoders`, `bed-ops`, etc.
- DB `name` field: `BedCamp`, `Bedcoders`, `BedOps`, etc.
- Display copy: use full name with emoji where supported

**Never use:**
- "from Bed" as a program suffix (use in descriptions only)
- "Medinformics" as user-facing program name (backend/credential only)
- Old track names (Health Informatics, AI, Genomics, Data Science) as user-facing names

---

## Deploy Approval — LOCKED 2026-04-11

**Every production deploy requires manual approval.**

Run before deploying:
```bash
npm run approve-deploy
```

This will:
1. Run preflight checks
2. Ask for approval reason
3. Require typing "DEPLOY" to confirm
4. Write a signed `deploy-approval.json`
5. Preflight blocks build if no fresh approval exists

The approval expires after **2 hours**. Stale approval = blocked build.

---

*Last updated: 2026-04-11 by Roi Shternin*
*Next review: Only if business fundamentals change*
