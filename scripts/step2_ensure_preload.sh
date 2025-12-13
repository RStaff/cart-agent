#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

mkdir -p web

FILE="web/smc-preload.cjs"
if [ -f "$FILE" ]; then
  echo "✅ preload exists: $FILE"
else
  cat > "$FILE" <<'PRE'
/**
 * smc-preload.cjs
 * Safe preload hook for local/dev + Render.
 * - Loads .env if present (repo root, then web/)
 * - Never throws if dotenv is missing
 */
function tryDotenv(path) {
  try {
    const dotenv = require("dotenv");
    const res = dotenv.config({ path });
    if (!res.error) console.log(`[preload] loaded env from ${path}`);
  } catch (_) {}
}
tryDotenv(".env");
tryDotenv("web/.env");
PRE
  echo "✅ Created preload: $FILE"
fi

node -c "$FILE" >/dev/null && echo "✅ preload syntax OK"

echo "NEXT:"
echo "  npm run start   (should boot Express on :3000)"
