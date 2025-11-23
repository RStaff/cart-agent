#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando Phase 3 – Fixing Frontend Routes (App Router) ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

echo "→ Frontend: $FRONTEND"

# Ensure app/ and app/command-center exist
mkdir -p "$FRONTEND/app/command-center"

# Minimal, dev-safe Command Center page
cat << 'PAGE' > "$FRONTEND/app/command-center/page.jsx"
export default function CommandCenter() {
  return (
    <div style={{ padding: "40px", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Abando Command Center</h1>
      <p style={{ marginBottom: "0.5rem" }}>
        Temporary dev-only Command Center route is working.
      </p>
      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Once plumbing is fully verified, this will be replaced with the real dashboard UI.
      </p>
    </div>
  );
}
PAGE

echo "✅ Created /app/command-center/page.jsx"
echo "=== Frontend routing scaffolding complete ==="
