#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-}"

if [ -z "$BASE" ]; then
  # Autodetect common dev ports
  if curl -sS -I "http://localhost:3000" >/dev/null 2>&1; then
    BASE="http://localhost:3000"
  elif curl -sS -I "http://localhost:3001" >/dev/null 2>&1; then
    BASE="http://localhost:3001"
  else
    BASE="http://localhost:3000"
  fi
fi

echo "== Smoke test: $BASE =="

check() {
  local path="$1"
  echo
  echo "GET $path"

  # Follow redirects, fail on 4xx/5xx, and show final effective URL
  curl -sS -L --fail-with-body -o /dev/null \
    -w '  status=%{http_code}  final_url=%{url_effective}
' \
    "$BASE$path" || {
      echo "❌ Request failed: $BASE$path"
      exit 1
    }

  # Also show the first few response headers (from the final response)
  curl -sS -L -I "$BASE$path" | sed -n '1,10p'
}

check "/demo/playground"
check "/verticals"
check "/verticals/women-boutique"
check "/marketing/demo/playground"
check "/marketing/verticals"
check "/marketing/verticals/women-boutique"

echo
echo "DONE ✅"
