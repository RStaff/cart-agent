#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://cart-agent-backend.onrender.com}"

echo "== Ensure we’re in a git repo and on a branch =="
git rev-parse --is-inside-work-tree >/dev/null

echo "== Auto-stage backend bits if present =="
git add web/index.js web/package.json 2>/dev/null || true

echo "== Commit staged (if any) =="
git commit -m "chore: backend update" || true

echo "== Stash ANY uncommitted edits =="
git stash -u || true

echo "== Rebase & push =="
git pull --rebase origin main || true
git push || true

echo "== Restore stashed edits (if any) =="
git stash pop || true

if [ "${PATCH_REDIRECTS:-0}" = "1" ]; then
  echo "== Patch [auth].redirect_urls in shopify.app.toml (if missing) =="
  if [ -f shopify.app.toml ] && grep -q '^\[auth\]' shopify.app.toml; then
    if ! grep -q '^[[:space:]]*redirect_urls' shopify.app.toml; then
      awk '{
        print $0
        if ($0 ~ /^\[auth\]/ && !p) {
          print "redirect_urls = [\"https://cart-agent-backend.onrender.com/auth/callback\"]"
          p=1
        }
      }' shopify.app.toml > shopify.app.toml.tmp && mv shopify.app.toml.tmp shopify.app.toml
      git add shopify.app.toml
      git commit -m "chore: add auth.redirect_urls" || true
      git push || true
    else
      echo "redirect_urls already present"
    fi
  else
    echo "shopify.app.toml missing or [auth] block not found; skipping"
  fi
fi

echo "== Poll Render /health =="
# Poll /health with a clear timeout
max=60  # 60 tries * 2s = ~2 minutes
for i in $(seq 1 $max); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" || true)
  if [ "$code" = "200" ]; then
    echo "health OK"
    break
  fi
  echo "waiting $i/$max (code=$code)"
  sleep 2
  if [ "$i" -eq "$max" ]; then
    echo "ERROR: Health never reached 200. Check Render logs."
    exit 1
  fi
done


if git status --porcelain -- shopify.app.toml | grep -q .; then
  echo ""
  echo "⚠️  shopify.app.toml changed locally."
  echo "Run these to refresh config:"
  echo "   shopify app deploy"
  echo "   shopify app dev --reset --store=cart-agent-dev.myshopify.com"
fi
