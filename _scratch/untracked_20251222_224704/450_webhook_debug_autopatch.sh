#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent || { echo "❌ repo not found"; exit 1; }

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

STAMP="ABANDO_WEBHOOK_DEBUG_BLOCK_v1"
BACKUP="$FILE.bak_$(date +%s)"
cp "$FILE" "$BACKUP"
echo "✅ Backup: $BACKUP"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

STAMP = "ABANDO_WEBHOOK_DEBUG_BLOCK_v1"
if STAMP in s:
    print("✅ Debug block already present (idempotent). No changes.")
    raise SystemExit(0)

debug_block = f"""
// {STAMP}
console.log("[abando][WEBHOOK_DEBUG]", {{
  has_hmac: Boolean(req.get("x-shopify-hmac-sha256")),
  hmac_len: (req.get("x-shopify-hmac-sha256") || "").length,
  body_is_buffer: Buffer.isBuffer(req.body),
  body_len: Buffer.isBuffer(req.body) ? req.body.length : -1,
  topic: req.get("x-shopify-topic"),
  shop: req.get("x-shopify-shop-domain"),
}});
"""

# Heuristic: insert RIGHT AFTER rawBody is defined (after the line assigning rawBody)
# We look for a line like:
#   const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
m = re.search(r'^\s*const\s+rawBody\s*=.*?;\s*$', s, flags=re.M)
if not m:
    print("❌ Could not find `const rawBody = ...;` to anchor insertion.")
    print("   Open the file and confirm rawBody exists; then re-run.")
    raise SystemExit(1)

insert_at = m.end()
s = s[:insert_at] + "\n" + debug_block + s[insert_at:]

p.write_text(s, encoding="utf-8")
print("✅ Inserted [abando][WEBHOOK_DEBUG] block after rawBody assignment.")
PY

# Sanity check: ensure file still parses as ESM
echo "🔎 Import-checking as ESM..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudging nodemon restart..."
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true
echo "✅ Done. Watch your `shopify app dev` terminal for: [nodemon] restarting due to changes..."

echo
echo "Next: trigger ONE checkout/update webhook (add to cart -> begin checkout -> close tab)."
echo "Then run: tail -n 6 web/.abando_webhook_inbox.jsonl"
