#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

note() {
  printf 'info: %s\n' "$1"
}

require_file() {
  local f="$1"
  [[ -f "$f" ]] || fail "missing required file: $f"
}

require_file "package.json"
require_file "web/package.json"
require_file "web/src/index.js"
require_file "web/frontend/package.json"
require_file "shopify.app.toml"
require_file "render.yaml"
require_file "render.backend.yaml"
require_file "docs/architecture-canonical.md"
require_file "api/DEPRECATED.md"
require_file "backend/DEPRECATED.md"
require_file "frontend/DEPRECATED.md"
require_file "abando-frontend/DEPRECATED.md"

ROOT_START="$(node -p "(require('./package.json').scripts||{}).start||''")"
[[ "$ROOT_START" == *"web/src/index.js"* ]] || fail "root scripts.start must boot web/src/index.js (current: $ROOT_START)"

ROOT_BUILD="$(node -p "(require('./package.json').scripts||{}).build||''")"
[[ "$ROOT_BUILD" == *"web/frontend"* ]] || fail "root scripts.build must target web/frontend (current: $ROOT_BUILD)"
[[ "$ROOT_BUILD" != *"abando-frontend"* ]] || fail "root scripts.build must not target abando-frontend (current: $ROOT_BUILD)"

ROOT_POSTINSTALL="$(node -p "(require('./package.json').scripts||{}).postinstall||''")"
[[ "$ROOT_POSTINSTALL" != *"abando-frontend"* ]] || fail "root scripts.postinstall must not target abando-frontend (current: $ROOT_POSTINSTALL)"

WEB_START="$(node -p "(require('./web/package.json').scripts||{}).start||''")"
[[ "$WEB_START" == "node src/index.js" ]] || fail "web scripts.start must be 'node src/index.js' (current: $WEB_START)"

RENDER_BUILD_MATCHES="$( (rg -n "web/frontend run build|web/frontend/dist" render.yaml || true) | wc -l | tr -d ' ')"
[[ "$RENDER_BUILD_MATCHES" -ge 2 ]] || fail "render.yaml must reference web/frontend build and dist paths"

RENDER_HAS_LEGACY="$( (rg -n "abando-frontend|npm --prefix api|npm --prefix backend|node api/|node backend/" render.yaml render.backend.yaml || true) | wc -l | tr -d ' ')"
[[ "$RENDER_HAS_LEGACY" -eq 0 ]] || fail "render config must not wire legacy app trees (api/backend/abando-frontend)"

RENDER_START="$( (rg -n "startCommand:\\s*npm start" render.backend.yaml || true) | wc -l | tr -d ' ')"
[[ "$RENDER_START" -ge 1 ]] || fail "render.backend.yaml must start canonical root app via 'npm start'"

SHOPIFY_APP_URL="$( (rg -n '^application_url\s*=\s*"https://pay\.abando\.ai/embedded"' shopify.app.toml || true) | wc -l | tr -d ' ')"
[[ "$SHOPIFY_APP_URL" -eq 1 ]] || fail "shopify.app.toml must define application_url as https://pay.abando.ai/embedded"

SHOPIFY_GDPR_URI="$( (rg -n '^\s*uri\s*=\s*"/api/webhooks/gdpr"' shopify.app.toml || true) | wc -l | tr -d ' ')"
[[ "$SHOPIFY_GDPR_URI" -ge 1 ]] || fail "shopify.app.toml must use /api/webhooks/gdpr for GDPR subscription"

for legacy in api backend frontend abando-frontend; do
  if [[ -f "$legacy/package.json" ]]; then
    note "non-canonical app tree detected: $legacy/"
  fi
done

note "architecture integrity check passed"
