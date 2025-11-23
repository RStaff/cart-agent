#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo "   Abando Phase 3 – Plumbing Prep"
echo "=============================="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/web"
FRONTEND="$ROOT/abando-frontend"

echo "📦 Repo root:   $ROOT"
echo "🖥  Backend dir: $BACKEND"
echo "🖥  Frontend dir: $FRONTEND"
echo

warn=0

check_file () {
  local path="$1"
  local label="$2"

  if [ -f "$path" ]; then
    echo "✅ $label: $path"
  else
    echo "⚠️ $label missing: $path"
    warn=1
  fi
}

check_dir () {
  local path="$1"
  local label="$2"

  if [ -d "$path" ]; then
    echo "✅ $label dir present: $path"
  else
    echo "⚠️ $label dir missing: $path"
    warn=1
  fi
}

echo "1️⃣ Backend core files"
check_dir  "$BACKEND"                         "backend root"
check_file "$BACKEND/src/index.js"            "backend entry"
check_file "$BACKEND/prisma/schema.prisma"    "Prisma schema"
check_dir  "$BACKEND/src/routes"              "routes dir"

# Key routes we rely on for Abando behavior
check_file "$BACKEND/src/routes/abandon.js"         "abandon route"
check_file "$BACKEND/src/routes/billing.js"         "billing route"
check_file "$BACKEND/src/routes/preview.js"         "preview route"
check_file "$BACKEND/src/routes/playground.esm.js"  "playground route"
check_file "$BACKEND/src/routes/publicPages.esm.js" "public pages route"
check_file "$BACKEND/src/routes/installShopify.esm.js" "Shopify install route"
check_file "$BACKEND/src/routes/stripeWebhook.esm.js"  "Stripe webhook route"

echo
echo "2️⃣ Backend config & infra"
check_file "$ROOT/shopify.app.toml"          "Shopify app config"
check_file "$ROOT/render.yaml"              "Render main config"
check_file "$ROOT/render.backend.yaml"      "Render backend config"

if [ -f "$BACKEND/.env" ] || [ -f "$BACKEND/.env.local" ]; then
  echo "✅ Backend env file present in web/ (.env or .env.local)"
else
  echo "⚠️ No backend env file (.env or .env.local) in web/."
  warn=1
fi

echo
echo "3️⃣ Frontend presence & env"
check_dir  "$FRONTEND"                        "frontend root"
check_dir  "$FRONTEND/app"                    "Next.js app/ dir"
check_dir  "$FRONTEND/app/command-center"     "command-center route dir"

if [ -f "$FRONTEND/.env.local" ]; then
  echo "✅ Frontend env file present: abando-frontend/.env.local"
else
  echo "⚠️ No frontend env file: abando-frontend/.env.local"
  warn=1
fi

if [ -f "$FRONTEND/next.config.js" ]; then
  echo "✅ next.config.js present (ESM, workspace-aware)."
else
  echo "⚠️ next.config.js missing in abando-frontend."
  warn=1
fi

echo
echo "4️⃣ Summary"
if [ "$warn" -eq 0 ]; then
  echo "✅ Phase 3 plumbing prep: PASS (no missing critical files detected)."
else
  echo "⚠️ Phase 3 plumbing prep: Completed with warnings."
  echo "   Review the ⚠️ lines above before moving toward Shopify install."
fi

echo
echo "=============================="
echo "   Plumbing Prep Finished"
echo "=============================="
