# Piston API Integration Status

**Status:** ⚠️ NOT INTEGRATED (whitelist-only constraint)

## Problem

The Piston API (public code execution service) moved to whitelist-only access as of **February 15, 2026**. The public instance at `https://api.piston.rocks` now requires explicit whitelist approval for new domains.

**Error Response:** `403 Forbidden` with message indicating domain is not whitelisted.

## Current State

- **CODE_QUERY exercises:** Collect code submissions in textarea editor (working)
- **Code Execution:** NOT implemented (submissions recorded as-is with 50pt default score)
- **Default Feedback:** "Your answer has been recorded and will be reviewed" (manual review expected)
- **Claude AI Feedback:** Available via optional `/feedback` endpoint for code analysis

## Alternatives

### Option 1: Self-Hosted Piston (Recommended for Production)
- Deploy own Piston instance (open-source: https://github.com/engineer-man/piston)
- Full control over execution environment
- Setup: Docker + Railway/Heroku
- Cost: ~$5-7/month for basic tier

### Option 2: Alternative Code Execution Services
- **Replit API** — $20-50/month, includes IDE
- **Judge0** — $99/month, cloud judge system
- **AWS Lambda** — Build custom executor, pay-per-execution

### Option 3: Keep Current Flow (Interim)
- CODE_QUERY submissions recorded for **manual review**
- Students see: "Code submitted for review by instructors"
- Claude AI feedback available as supplementary review tool
- Instructor dashboard shows pending submissions for manual testing
- Transition to self-hosted Piston when ready

## Decision Log

**Locked 2026-04-11:** Using Option 3 (manual review) for MVP. Self-hosted Piston (Option 1) planned for Phase 2 after user validation.

Reason: Rapid iteration prioritized over automated execution. Real instructor feedback provides better learning outcomes initially.

## Implementation Path (Phase 2)

1. Deploy self-hosted Piston instance on Railway
2. Update `CODE_QUERY` exercise handler to call Piston
3. Parse execution output and compare against test cases
4. Return automated score + execution results
5. Optional: Pair with Claude for enhanced feedback

See: `/backend/src/routes/exercises.ts` (lines 40-60) where CODE_QUERY handler needs wiring.
