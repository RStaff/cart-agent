#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo " Abando Phase 2 – API Smoke  "
echo "=============================="
echo

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT_DEV_BASE="http://localhost:3001"

echo "→ Assuming dev frontend is running at: $FRONT_DEV_BASE"
echo "  (If not, run: scripts/abando_stack_boot.sh first.)"
echo

# Helper: curl and show status
hit() {
  local path="$1"
  local url="${FRONT_DEV_BASE}${path}"
  local label="$2"

  printf "→ [%s] %s ... " "$label" "$url"

  local http_code
  http_code="$(curl -s -o /tmp/abando_api_smoke_response -w "%{http_code}" "$url" || echo "000")"

  if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo "✅ (HTTP $http_code)"
  elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo "⚠️  (HTTP $http_code – reachable but auth/permission required)"
  elif [ "$http_code" = "405" ]; then
    echo "⚠️  (HTTP 405 – method not allowed, but route exists)"
  else
    echo "❌ (HTTP $http_code)"
  fi
}

echo "1️⃣ Health & basic system APIs"
hit "/api/health"           "health"
hit "/api/auth/me"          "auth me"
hit "/api/stripe/status"    "stripe status"

echo
echo "2️⃣ Autosend / AI email agent APIs"
hit "/api/autosend/diagnose" "autosend diagnose"
hit "/api/autosend/scan"     "autosend scan"
hit "/api/autosend/dry-run"  "autosend dry-run"

echo
echo "3️⃣ Demo & trial APIs"
hit "/api/demo/generate"  "demo generate"
hit "/api/trial/start"    "trial start"
hit "/api/trial/link"     "trial link"

echo
echo "4️⃣ Checkout / billing APIs"
hit "/api/checkout"         "checkout"

echo
echo "=============================="
echo "  Phase 2 API Smoke Complete  "
echo "=============================="
