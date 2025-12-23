#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Adding received+verified fan-out at the single handler_ok_send call-site..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

MARK = "ABANDO_CALLSITE_FANOUT_V1"
if MARK in s:
    print("ℹ️ Fan-out already present — no changes.")
    raise SystemExit(0)

# Find the one canonical call site
needle = r'__abando__write_inbox\("handler_ok_send",\s*\{'
m = re.search(needle, s)
if not m:
    raise SystemExit('❌ Could not find __abando__write_inbox("handler_ok_send", {')

inject = r'''
  // ABANDO_CALLSITE_FANOUT_V1
  try {
    __abando__write_inbox("received", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null,
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
    });
    __abando__write_inbox("verified", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null,
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
    });
  } catch (_e) {}
'''.lstrip("\n")

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

s2 = s[:m.start()] + inject + s[m.start():]
p.write_text(s2, encoding="utf-8")
print(f"✅ Inserted call-site fan-out. Backup: {bak.name}")
PY

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Restart (touch)..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."
