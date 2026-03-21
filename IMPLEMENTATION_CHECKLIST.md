# MEDINFORMICS PRICING OVERHAUL — Implementation Checklist

**Goal:** Shift from pay-once → hybrid (monthly + annual + pay-once + per-course)
**Timeline:** 2–4 weeks (phased)
**Owner:** You (with engineer)
**Status:** Ready to start

---

## PHASE 1: CORE SUBSCRIPTION LAUNCH (Week 1–2)

### Backend (Stripe + Database)

- [ ] **Create Stripe Products**
  - [ ] `prod_monthly_pro`: €29/month recurring
  - [ ] `prod_annual_pro`: €299/year recurring
  - [ ] Keep existing: `prod_single_track` €199 (one-time)
  - [ ] Create `prod_per_course_intro` €49 (one-time, single course)

- [ ] **Create Stripe Prices**
  - [ ] `price_monthly_pro`: €29, recurring monthly
  - [ ] `price_annual_pro`: €299, recurring yearly
  - [ ] `price_single_track`: €199, one-time
  - [ ] `price_per_course`: €49, one-time

- [ ] **Database Schema Update**
  - [ ] Add `User.subscriptionTier` (enum: 'free', 'monthly', 'annual', 'single_track', 'per_course')
  - [ ] Add `User.subscriptionEndDate` (for monthly/annual expiry)
  - [ ] Add `User.tracksAccessible` (JSON array of track IDs — changes based on subscription)
  - [ ] Create `Subscription` model to track renewals and cancellations

- [ ] **Pricing Logic**
  - [ ] Monthly: User can access all 4 tracks while active
  - [ ] Annual: User can access all 4 tracks for 12 months
  - [ ] Single track: User can access 1 chosen track forever
  - [ ] Per-course: User can access 1 course (within 1 track) forever
  - [ ] Free: User can access first module of any track
  - [ ] Implement access control: check `subscriptionTier` + `subscriptionEndDate` before rendering lesson

### Frontend (Pricing Page + Checkout)

- [ ] **Reorder Pricing Tiers in Pricing.tsx**
  ```
  Free
    ↓
  Pro Monthly (€29/mo) — "Try it"
    ↓
  Pro Annual (€299/yr) — "Most popular" + "Save 29%"
    ↓
  Single Track (€199) — "Lifetime access"
    ↓
  Per Course (€49) — "Test drive"
  ```

- [ ] **Update Feature Lists**
  - [ ] Monthly: "Unlimited tracks this month, cancel anytime"
  - [ ] Annual: "Unlimited tracks for 12 months, 40% savings"
  - [ ] Single track: "Lifetime access to one track, no expiry"
  - [ ] Per-course: "Access one course (5–6 lessons), upgrade anytime"

- [ ] **Update Checkout Flow**
  - [ ] After free trial: Show all 4 options (monthly, annual, single, per-course)
  - [ ] Add "Manage subscription" page for monthly/annual users
  - [ ] Add "Upgrade" path: €49 course → €29 monthly → €299 annual

- [ ] **Team Pricing (Simplify)**
  - [ ] Remove variable pricing (€149, €99, custom)
  - [ ] One tier: €99/seat/year for 5+ (simple, same benefits as individual annual)

### Analytics & Tracking

- [ ] **GA4 Events**
  - [ ] `pricing_view` — user landed on pricing page
  - [ ] `tier_selected` — user clicked "Choose" for monthly/annual/single/per-course
  - [ ] `checkout_start` → `checkout_complete` — full funnel

- [ ] **Umami Events**
  - [ ] `monthly-selected`, `annual-selected`, `single-track-selected`, `per-course-selected`

### Marketing/Copy

- [ ] **Pricing Page Copy Updates**
  - [ ] Update headline: "Choose your learning path"
  - [ ] Update subheading: "From €29/month to lifetime access — pick what works for you"
  - [ ] Add comparison table: When to choose each option
  - [ ] Add FAQ: "Can I upgrade from monthly to annual?"

- [ ] **Landing Page Updates**
  - [ ] Remove mention of "€199 per track"
  - [ ] Add: "Start free, then choose how to learn: monthly (€29), annual (€299), or lifetime (€199)"
  - [ ] Update hero CTA: Still "Enter the Mastery Track" but link to pricing with monthly highlighted

---

## PHASE 2: REMOVE CONFUSION (Week 2)

### Pricing Page Cleanup

- [ ] **Delete "Two Tracks" Tier**
  - [ ] Remove from Pricing.tsx
  - [ ] Archive the TwoTrackSelectorModal component (or rename to "legacy")
  - [ ] Reason: Annual gives 4 tracks for only €299, so "2 for €299" makes no sense

- [ ] **Simplify Comparison**
  - [ ] Keep only: Free vs. Monthly vs. Annual vs. Single Track vs. Per-Course
  - [ ] Remove team pricing from main page (move to "For Teams" page)

### Landing Page Cleanup

- [ ] **Remove "Coming Soon" Cards**
  - [ ] Delete Health AI, Genomics, Data Science cards from landing
  - [ ] Update section heading: "Master Health Informatics (More tracks coming)"
  - [ ] New copy: "Start with the foundation everyone needs. Subscribe to access new tracks as we launch them."

- [ ] **Update Testimonials Section**
  - [ ] Add: "Learners can pause and resume without guilt" — speaks to variable energy but not disability-specific yet

---

## PHASE 3: OPTIONAL PER-COURSE PRICING (Week 3–4)

### Define Course Boundaries

- [ ] **Health Informatics Track Breakdown**
  - [ ] Course 1 (Intro): Lessons 1–6 (What is FHIR, EHR basics, HL7)
  - [ ] Course 2 (Intermediate): Lessons 7–12 (FHIR in practice, data mapping)
  - [ ] Course 3 (Advanced): Lessons 13–18 (Interop, workflows)
  - [ ] ... (repeat for other tracks)

- [ ] **Update Pricing.tsx**
  - [ ] Add new section: "Or pick a single course"
  - [ ] Show 3 courses from Health Informatics as examples: €49 each
  - [ ] Copy: "Try before committing to a full track"

- [ ] **Gating Logic**
  - [ ] Per-course purchase: User can access that course + lessons
  - [ ] Auto-prompt after course completion: "Upgrade to monthly (€29) to unlock the next course"

---

## PHASE 4: REMOVE "COMING SOON" MESSAGING (Week 2)

- [ ] **Landing.tsx Changes**
  - [ ] Delete coming-soon cards entirely (or archive in git)
  - [ ] Update "The Mastery Track" section heading
  - [ ] New copy: "One complete track, ready now. We're building three more."

- [ ] **Pricing.tsx Changes**
  - [ ] Update "What you get" section
  - [ ] Change from "4 tracks (150+ hours)" to "Health Informatics foundation (40 hours, more to come)"
  - [ ] If annual: "New tracks unlock for annual members as we launch them"

- [ ] **Hero CTA Changes**
  - [ ] Remove "€199 per track" language
  - [ ] Update to: "Start free. Then choose monthly, annual, or lifetime."

---

## PHASE 5: PEDAGOGY ENHANCEMENTS (Month 1–2, Ongoing)

### Lesson-Level UX

- [ ] **Add Lesson Time Estimates**
  - [ ] Add field to lesson schema: `estimatedMinutes` (5, 15, 30)
  - [ ] Display on lesson card: "15 min lesson"
  - [ ] Display on lesson header: "Estimated 15 minutes to complete"

- [ ] **Progress Visualization**
  - [ ] Show: "You're 40% through this module"
  - [ ] Show: "Most learners finish this in 2 weeks. You're on pace."
  - [ ] Show: "Estimated completion: Mar 30 at this pace"

- [ ] **Checkpoint System (Optional)**
  - [ ] After every 5 lessons: Show "Take a break" modal
  - [ ] Display stats: "You've completed 5 lessons, mastered 15 concepts"
  - [ ] Option: Continue or pause until tomorrow

### Community Signal (Optional)

- [ ] **Peer Learning Display**
  - [ ] Add: "342 people are learning this right now" (real-time counter)
  - [ ] Add: "87% of learners who reach this point finish the course"
  - [ ] Add: "Most common mistake: Confusing FHIR profiles with profiles in healthcare"

---

## TESTING CHECKLIST

### Checkout Flow

- [ ] [ ] Free → Monthly checkout works
- [ ] [ ] Free → Annual checkout works
- [ ] [ ] Free → Single track checkout works (existing)
- [ ] [ ] Free → Per-course checkout works (once built)
- [ ] [ ] Monthly renewal happens on correct date (use test clock in Stripe)
- [ ] [ ] Annual renewal happens 365 days later
- [ ] [ ] Cancel subscription: User access revoked immediately
- [ ] [ ] Upgrade from monthly → annual: Prorated, no double-charge

### Access Control

- [ ] [ ] Free user can only see first module
- [ ] [ ] Monthly user can see all 4 tracks
- [ ] [ ] Annual user can see all 4 tracks
- [ ] [ ] Single-track user can only see chosen track
- [ ] [ ] Per-course user can only see purchased course
- [ ] [ ] After subscription expires: Access reverts to free tier
- [ ] [ ] Student discount applies correctly (40% off monthly/annual)
- [ ] [ ] Team pricing shows for 5+ seats

### Analytics

- [ ] [ ] GA4: pricing_view fires when user lands on pricing
- [ ] [ ] GA4: tier_selected fires with correct tier name
- [ ] [ ] GA4: checkout_start and checkout_complete track full flow
- [ ] [ ] Umami: monthly-selected, annual-selected events fire
- [ ] [ ] Dashboard shows: Conversion rate (free → paid), revenue, churn

### Mobile Responsiveness

- [ ] [ ] Pricing cards stack on mobile (iPhone 390px)
- [ ] [ ] CTA buttons are full-width and clickable
- [ ] [ ] Tier names readable
- [ ] [ ] No horizontal scroll

---

## ROLLOUT PLAN

### Pre-Launch (Day -1)

- [ ] Run through all testing checklist
- [ ] Notify team: "Pricing changes go live tomorrow"
- [ ] Back up current Pricing.tsx to /backup
- [ ] Prepare rollback plan (revert Git commit in <5 min)

### Launch Day (Day 0)

- [ ] Deploy Stripe products + prices
- [ ] Deploy Pricing.tsx changes
- [ ] Monitor: GA4 for pricing_view traffic
- [ ] Monitor: Stripe dashboard for new checkout sessions
- [ ] Respond to any customer questions in first 4 hours

### Post-Launch (Day 1–7)

- [ ] Check: Monthly conversion rate (target: 5% of free users)
- [ ] Check: Revenue per checkout (expect €350 monthly/annual blend)
- [ ] Send email to free tier users: "New way to learn: try monthly for €29"
- [ ] Collect feedback: Any UX friction?

---

## SUCCESS METRICS (30-day target)

| Metric | Current | Target | Success Criteria |
|--------|---------|--------|------------------|
| Free users/month | 500 | 600+ | 20% growth |
| Free → Paid conversion | 3% | 5% | 60% improvement |
| Avg. paying customer LTV | €199 | €300+ | 50% improvement |
| Monthly recurring revenue | €500 | €1,500+ | 3x growth |
| Churn rate (monthly) | N/A | <12% | Industry healthy |
| Annual commitment (% of paid) | N/A | 30%+ | Recurring base |

---

## COMMON PITFALLS (Avoid These)

❌ **Don't launch monthly without annual.** (Monthly-only users churn faster. Annual is the profit driver.)

❌ **Don't keep "Two Tracks" tier.** (Confusing. Annual is always the better deal.)

❌ **Don't mention per-course pricing yet** if it's not ready. (Launch core first, add per-course in Phase 2.)

❌ **Don't forget student discount.** (40% off monthly/annual should be on pricing page day 1.)

❌ **Don't remove "Single Track" option.** (Some users prefer lifetime access. Keep it.)

❌ **Don't launch without analytics.** (You need GA4 events to measure success.)

---

## SIGN-OFF

**Ready to implement?** Check these before starting:

- [ ] Stripe API keys configured in Vercel
- [ ] Database migrations tested locally
- [ ] Pricing.tsx ready to edit
- [ ] GA4 account connected + custom events defined
- [ ] Team notified (if applicable)

**Estimated dev time:** 5–8 hours (Phase 1), 3–5 hours (Phase 2–3), 8–12 hours (Phase 4–5)

**Recommend:** Do Phase 1–2 this week. Phase 3–5 next month.

