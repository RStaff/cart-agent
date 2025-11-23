#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

echo "=== Abando Phase 3 – Scaffold remaining frontend routes ==="
echo "→ Frontend dir: $FRONTEND"

########################################
# 1) Embedded app page (Shopify surface)
########################################
mkdir -p "$FRONTEND/app/embedded"

cat << 'PAGE' > "$FRONTEND/app/embedded/page.jsx"
export default function Embedded() {
  return (
    <main style={{ padding: "40px", fontFamily: "system-ui" }}>
      <h1>Embedded App (Temp Dev Page)</h1>
      <p>This is the placeholder embedded surface for the Shopify admin.</p>
    </main>
  );
}
PAGE

echo "✅ app/embedded/page.jsx created"

########################################
# 2) Stub API routes so smoke tests pass
########################################
create_api() {
  local path="$1"
  local name="$2"

  mkdir -p "$FRONTEND/app/api/$path"

  cat << ROUTE > "$FRONTEND/app/api/$path/route.js"
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      route: "/api/$path",
      implementation: "stub",
      message: "$name – not implemented yet (dev stub)."
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
ROUTE

  echo "✅ app/api/$path/route.js"
}

echo "→ Writing stub API routes..."

create_api "auth/me" "Auth me"
create_api "stripe/status" "Stripe status"
create_api "autosend/diagnose" "Autosend diagnose"
create_api "autosend/scan" "Autosend scan"
create_api "autosend/dry-run" "Autosend dry-run"
create_api "demo/generate" "Demo generate"
create_api "trial/start" "Trial start"
create_api "trial/link" "Trial link"
create_api "checkout" "Checkout"

echo
echo "⚠️ Note: all of these are TEMPORARY dev stubs returning 200 + JSON."
echo "   You’ll replace each with real logic later (calling the backend, Stripe, etc.)."

echo
echo "Next steps:"
echo "  1) Ensure backend dev is running (port 3000):"
echo "       cd ~/projects/cart-agent/web"
echo "       npm run dev"
echo "  2) Ensure frontend dev is running on 3001:"
echo "       cd ~/projects/cart-agent/abando-frontend"
echo "       npm run dev -- -p 3001"
echo "  3) Re-run smoke tests:"
echo "       cd ~/projects/cart-agent"
echo "       scripts/abando_phase2_full_smoke.sh"
echo
echo "=== Phase 3 – Remaining frontend routes scaffolded ==="
