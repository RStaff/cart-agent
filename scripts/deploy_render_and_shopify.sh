#!/usr/bin/env bash
set -euo pipefail

# ========= SETTINGS =========
BASE="${BASE:-https://cart-agent-backend.onrender.com}"
STORE="${STORE:-cart-agent-dev.myshopify.com}"
INSERT_REDIRECTS="${INSERT_REDIRECTS:-true}"   # set to "false" to skip auto-insert
APP_TOML="${APP_TOML:-shopify.app.toml}"
# ============================

echo "== Stage backend + config =="
git add web/index.js web/package.json web/prisma render.yaml "$APP_TOML" 2>/dev/null || true
git commit -m "deploy: backend/config update" || true

echo "== Stash other local edits (if any) =="
STASHED="false"
if ! git diff --quiet || ! git diff --cached --quiet; then
  git stash -u
  STASHED="true"
fi

restore_stash() {
  if [ "$STASHED" = "true" ]; then
    echo "== Restoring stashed edits =="
    git stash pop || true
  fi
}
trap restore_stash EXIT

echo "== Rebase with origin/main and push =="
git pull --rebase origin main
git push

if [ "$INSERT_REDIRECTS" = "true" ]; then
  echo "== Ensuring [auth].redirect_urls in $APP_TOML =="
  python3 - <<PY
from pathlib import Path
import re, sys, os

toml_path = Path("${APP_TOML}")
if not toml_path.exists():
    print("WARNING: shopify.app.toml not found; skipping redirect_urls insert")
    sys.exit(0)

s = toml_path.read_text(encoding="utf-8")

auth_match = re.search(r'(?ms)^\[auth\]\s*.*?(?=^\[|\Z)', s)
if not auth_match:
    # No [auth] section at all; create one at end
    block = f"\n[auth]\nredirect_urls = [\n  \"{os.getenv('BASE','${BASE}')}/auth/callback\",\n  \"{os.getenv('BASE','${BASE}')}/api/auth/callback\"\n]\n"
    s = s.rstrip() + block
    toml_path.write_text(s, encoding="utf-8")
    print("Added [auth] with redirect_urls at end of file")
    sys.exit(0)

auth_block = auth_match.group(0)
if re.search(r'^\s*redirect_urls\s*=\s*\[', auth_block, flags=re.M):
    print("redirect_urls already present; no changes")
    sys.exit(0)

insert = f"redirect_urls = [\n  \"{os.getenv('BASE','${BASE}')}/auth/callback\",\n  \"{os.getenv('BASE','${BASE}')}/api/auth/callback\"\n]\n"
# Insert after [auth] line
s = s[:auth_match.start()] + re.sub(r'^\[auth\]\s*', f"[auth]\n{insert}", auth_block, count=1, flags=re.M) + s[auth_match.end():]
toml_path.write_text(s, encoding="utf-8")
print("Inserted redirect_urls under [auth]")
PY

  # Include the change in this deploy
  git add "$APP_TOML" || true
  git commit -m "config: add [auth].redirect_urls" || true
  git push
fi

echo "== Poll Render /health until 200 =="
for i in $(seq 1 40); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/health" || true)"
  if [ "$code" = "200" ]; then
    echo "health OK"
    break
  fi
  echo "waiting $i (code=$code)"
  sleep 3
  if [ "$i" -eq 40 ]; then
    echo "ERROR: /health never returned 200"; exit 1
  fi
done

echo "== Shopify: deploy updated app config =="
shopify app deploy

echo "== Shopify: reset local CLI config (refresh URLs, etc.) =="
shopify app dev --reset --store="$STORE"

echo "== Smoke test: /api/generate-copy =="
payload='{"items":["T-Shirt x2"],"tone":"Friendly","brand":"Default","goal":"recover","total":49.99}'
curl -sS -X POST "$BASE/api/generate-copy" -H "Content-Type: application/json" -d "$payload"
echo
