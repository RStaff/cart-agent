#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

echo "=== Abando Phase 3 – Add frontend /api/health ==="
echo "→ Frontend dir: $FRONTEND"

# 1) Ensure the API route directory exists
mkdir -p "$FRONTEND/app/api/health"

# 2) Write a minimal /api/health route for the Next.js app router
cat << 'ROUTE' > "$FRONTEND/app/api/health/route.js"
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "abando-frontend",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
ROUTE

echo "✅ Wrote app/api/health/route.js"

echo
echo "Next steps (manual, so you stay in control):"
echo "  1) Make sure backend dev is running:"
echo "       cd ~/projects/cart-agent/web"
echo "       npm run dev"
echo "  2) Make sure frontend dev is running on 3001:"
echo "       cd ~/projects/cart-agent/abando-frontend"
echo "       npm run dev -- -p 3001"
echo "  3) Test the route directly:"
echo "       curl http://localhost:3001/api/health"
echo "  4) Optional: run full smoke:"
echo "       cd ~/projects/cart-agent"
echo "       scripts/abando_phase2_full_smoke.sh"
echo
echo "=== Phase 3 – /api/health setup complete ==="
