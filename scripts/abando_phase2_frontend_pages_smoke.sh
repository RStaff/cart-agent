#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo " Abando Phase 2 – Pages Smoke "
echo "=============================="
echo

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT_DEV_BASE="http://localhost:3001"

echo "→ Assuming dev frontend is running at: $FRONT_DEV_BASE"
echo "  (If not, run: scripts/abando_stack_boot.sh first.)"
echo

check_page() {
  local path="$1"
  local label="$2"
  local url="${FRONT_DEV_BASE}${path}"

  printf "→ [%s] %s ... " "$label" "$url"

  local http_code
  http_code="$(curl -s -o /tmp/abando_pages_smoke_response -w "%{http_code}" "$url" || echo "000")"

  if [ "$http_code" = "200" ]; then
    echo "✅ (HTTP 200)"
  elif [ "$http_code" = "302" ] || [ "$http_code" = "301" ]; then
    echo "⚠️  (HTTP $http_code – redirect, but route exists)"
  elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo "⚠️  (HTTP $http_code – auth required)"
  else
    echo "❌ (HTTP $http_code)"
  fi
}

echo "1️⃣ Core product entry points"
check_page "/"                "root landing"
check_page "/command-center"  "command center"
check_page "/dashboard"       "dashboard"
check_page "/embedded"        "embedded app"
check_page "/admin-entry"     "admin entry (pages)"

echo
echo "2️⃣ Onboarding & pricing"
check_page "/onboarding"      "onboarding"
check_page "/pricing"         "pricing"
check_page "/trial"           "trial"

echo
echo "3️⃣ Demo & support surfaces"
check_page "/demo/playground" "demo playground"
check_page "/support"         "support"
check_page "/settings"        "settings"

echo
echo "4️⃣ Legal"
check_page "/legal/privacy"   "privacy"
check_page "/legal/terms"     "terms"
check_page "/legal/dpa"       "DPA"

echo
echo "=============================="
echo " Phase 2 Pages Smoke Complete "
echo "=============================="
