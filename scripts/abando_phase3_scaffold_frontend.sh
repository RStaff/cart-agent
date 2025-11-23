#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando Phase 3 – Frontend Page Scaffolding ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT="$ROOT/abando-frontend/app"

echo "→ Ensuring dirs exist..."
mkdir -p "$FRONT/onboarding"
mkdir -p "$FRONT/pricing"
mkdir -p "$FRONT/trial"
mkdir -p "$FRONT/dashboard"
mkdir -p "$FRONT/support"
mkdir -p "$FRONT/settings"
mkdir -p "$FRONT/demo/playground"
mkdir -p "$FRONT/legal/privacy"
mkdir -p "$FRONT/legal/terms"
mkdir -p "$FRONT/legal/dpa"

create_page () {
  local path="$FRONT/$1/page.jsx"
  cat << PAGE > "$path"
export default function Page() {
  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>$2</h1>
      <p>Temporary scaffold page for $1.</p>
    </div>
  );
}
PAGE
  echo "   ✓ $1"
}

echo "→ Writing scaffold pages..."
create_page "onboarding" "Onboarding"
create_page "pricing" "Pricing"
create_page "trial" "Trial"
create_page "dashboard" "Dashboard"
create_page "support" "Support"
create_page "settings" "Settings"
create_page "demo/playground" "Demo Playground"
create_page "legal/privacy" "Privacy Policy"
create_page "legal/terms" "Terms of Service"
create_page "legal/dpa" "Data Processing Agreement"

echo
echo "→ Cleaning .next build so Next loads new routes..."
rm -rf "$ROOT/abando-frontend/.next"

echo "=== Phase 3 Frontend Scaffolding Complete ==="
