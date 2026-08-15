#!/usr/bin/env bash
# Bedcoders Pre-Deploy Preflight Check
# Enforces decisions locked on 2026-04-11 (see DECISIONS.md)
# Called automatically by `npm run build`.
# Do NOT skip this. It exists because stale content has shipped to prod before.

set -e

FAIL=0
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() { echo -e "${RED}✗ FAIL: $1${NC}"; FAIL=1; }
pass() { echo -e "${GREEN}✓ PASS: $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ WARN: $1${NC}"; }

APPROVAL_FILE="$(dirname "$0")/../deploy-approval.json"
SRC="src backend/src"

echo "=== Bedcoders Preflight Check ==="
echo "Decisions: DECISIONS.md (locked 2026-04-11)"
echo ""

# ─── 1. Manual approval gate ───────────────────────────────────────────────
echo "--- Manual Approval ---"

# approve-deploy.sh sets this while it runs preflight as its own gate. Without
# it the two scripts deadlock: an expired approval fails preflight, which makes
# approve-deploy exit before it can write a fresh approval, so the gate can
# never be reopened. Only THIS check is skipped — every other check below still
# has to pass before an approval is granted, and `npm run build` still runs the
# full preflight with no skip, so a real unexpired approval is always required
# to ship.
if [ "$BEDCODERS_APPROVING" = "1" ]; then
  warn "Approval check skipped — approve-deploy.sh is granting approval right now."
elif [ ! -f "$APPROVAL_FILE" ]; then
  fail "No deploy-approval.json found. Run: npm run approve-deploy"
else
  APPROVED=$(python3 -c "import json,sys; d=json.load(open('$APPROVAL_FILE')); print(d.get('approved','false'))" 2>/dev/null || echo "false")
  EXPIRES=$(python3 -c "import json,sys; d=json.load(open('$APPROVAL_FILE')); print(d.get('expires_at',''))" 2>/dev/null || echo "")

  if [ "$APPROVED" != "True" ] && [ "$APPROVED" != "true" ]; then
    fail "Deploy not approved. Run: npm run approve-deploy"
  else
    # Check expiry
    NOW_EPOCH=$(date -u +%s)
    if [ -n "$EXPIRES" ]; then
      EXPIRES_EPOCH=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$EXPIRES" +%s 2>/dev/null || date -u -d "$EXPIRES" +%s 2>/dev/null || echo 0)
      if [ "$NOW_EPOCH" -gt "$EXPIRES_EPOCH" ]; then
        fail "Deploy approval has EXPIRED. Run: npm run approve-deploy"
      else
        REASON=$(python3 -c "import json; d=json.load(open('$APPROVAL_FILE')); print(d.get('reason',''))" 2>/dev/null || echo "")
        APPROVER=$(python3 -c "import json; d=json.load(open('$APPROVAL_FILE')); print(d.get('approved_by',''))" 2>/dev/null || echo "")
        pass "Approved by: $APPROVER — \"$REASON\""
      fi
    else
      fail "Approval file malformed. Run: npm run approve-deploy"
    fi
  fi
fi

echo ""

# ─── 2. Stale prices ────────────────────────────────────────────────────────
echo "--- Stale Prices ---"
STALE=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  -E '(€49|€199|€29\/mo|"29/mo"|€99.*seat|"Two Tracks"|"Monthly Pro"|"Single Track"|"Per Course"|PRICE_ID_MONTHLY|PRICE_ID_SINGLE_TRACK|PRICE_ID_PER_COURSE|PRICE_ID_TEAM_SEAT|STRIPE_COUPON.*STUDENT)' \
  $SRC 2>/dev/null | grep -v "node_modules" | grep -v "DECISIONS" | grep -v "process.env" || true)
if [ -n "$STALE" ]; then
  fail "Stale price references found:"
  echo "$STALE"
else
  pass "No stale prices"
fi

echo ""

# ─── 3. Correct prices present ──────────────────────────────────────────────
echo "--- Canonical Prices (€299/yr + €24.90/mo) ---"
if grep -rn --include="*.ts" --include="*.tsx" -E '(29900|ANNUAL.*299|299.*ANNUAL|PRICE_ANNUAL)' $SRC 2>/dev/null | grep -q .; then
  pass "Annual price (€299) found"
else
  fail "Annual price (€299) NOT found in code — check Stripe constants"
fi

if grep -rn --include="*.ts" --include="*.tsx" -E '(2490|INSTALL.*2490|2490.*INSTALL|PRICE_INSTALLMENT)' $SRC 2>/dev/null | grep -q .; then
  pass "Installment price (€24.90) found"
else
  warn "Installment price (€24.90) not found — add if installment checkout is wired"
fi

echo ""

# ─── 4. Program names start with Bed ────────────────────────────────────────
echo "--- Program Names (must start with Bed) ---"
OLD_NAMES=$(grep -rn --include="*.ts" --include="*.tsx" \
  -E '"(Health Informatics|Health AI|Genomics|Data Science|Monthly Pro|Annual Pro|Explorer|Single Track|Per Course)"' \
  $SRC 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$OLD_NAMES" ]; then
  fail "Old program/tier names found (must be Bed* names):"
  echo "$OLD_NAMES"
else
  pass "No old program names found"
fi

echo ""

# ─── 5. No deprecated routes ────────────────────────────────────────────────
echo "--- Deprecated Routes ---"
DEAD=$(grep -rn --include="*.ts" --include="*.tsx" \
  -E '(/patient-pro|/solidarity|/forum|/campus|/employers|/jobs|/mentorship|/graduate[^s]|/graduates|/affiliate|/portfolio|/enroll/modules|/programs[^/])' \
  $SRC 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$DEAD" ]; then
  fail "Deprecated route references found:"
  echo "$DEAD"
else
  pass "No deprecated routes"
fi

echo ""

# ─── 6. No dev auth bypass ──────────────────────────────────────────────────
echo "--- Dev Auth Bypass ---"
DEV_BYPASS=$(grep -rn --include="*.ts" --include="*.tsx" \
  -E "(token === 'dev'|DEV_USER|dev.*bypass|bypass.*dev)" \
  $SRC 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$DEV_BYPASS" ]; then
  fail "Dev auth bypass found in code — MUST remove before production:"
  echo "$DEV_BYPASS"
else
  pass "No dev auth bypass"
fi

echo ""
echo "=================================="
if [ "$FAIL" -eq 1 ]; then
  echo -e "${RED}PREFLIGHT FAILED — fix above issues, then re-run approve-deploy${NC}"
  exit 1
else
  echo -e "${GREEN}PREFLIGHT PASSED — safe to build${NC}"
  exit 0
fi
