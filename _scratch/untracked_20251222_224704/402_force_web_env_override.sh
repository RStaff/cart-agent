#!/usr/bin/env bash
set -euo pipefail

TARGET="web/start.mjs"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

cp "$TARGET" "$TARGET.bak_$(date +%s)"
echo "✅ Backup: $TARGET.bak_*"

# If already patched, exit cleanly
if rg -n "ABANDO_FORCE_WEB_ENV" "$TARGET" >/dev/null 2>&1; then
  echo "✅ Already patched (ABANDO_FORCE_WEB_ENV present)."
  exit 0
fi

tmp="$(mktemp)"
cat > "$tmp" <<'PATCH'
/* ABANDO_FORCE_WEB_ENV
   Force-load web/.env (and OVERRIDE any env injected by Shopify CLI)
   so webhook HMAC verification uses the Partners API secret key you expect.
*/
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const __secret = process.env.SHOPIFY_API_SECRET || "";
const __fp = crypto.createHash("sha256").update(__secret).digest("hex").slice(0, 12);
console.log("[abando][BOOT_ENV] loaded web/.env override=true");
console.log("[abando][BOOT_ENV] SHOPIFY_API_SECRET len =", __secret.length);
console.log("[abando][BOOT_ENV] SHOPIFY_API_SECRET fp  =", __fp);

PATCH

# Prepend patch to file
cat "$tmp" "$TARGET" > "$TARGET.new"
mv "$TARGET.new" "$TARGET"
rm -f "$tmp"

echo "✅ Patched $TARGET (force-load web/.env with override=true)."
