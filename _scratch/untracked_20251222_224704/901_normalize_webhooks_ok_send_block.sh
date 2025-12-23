#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8", errors="replace")
bak = p.with_name(p.name + f".bak_{int(time.time())}")
bak.write_text(s, encoding="utf-8")

# Replace the entire corrupted OK-send region with a clean canonical block.
# We anchor on the marker comment that exists in your file.
pat = re.compile(
    r"""
    ^[ \t]*//\s*ABANDO_OK_SEND_CANONICAL_V1.*?\n   # anchor line
    .*?
    ^[ \t]*return\s+res\.status\(\s*200\s*\)\.send\(\s*["']ok["']\s*\);\s*\n  # first ok send
    (?:^[ \t]*\}\s*\n)?                           # optional stray brace
    (?:^[ \t]*return\s+next\(\);\s*\n)?           # optional stray next()
    """,
    re.M | re.S | re.X
)

replacement = """  // ABANDO_OK_SEND_CANONICAL_V2 (single writer; received/verified fan-out happens inside __abando__write_inbox)
  try {
    __abando__write_inbox("handler_ok_send", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null,
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
    });
  } catch (_e) {}

  return res.status(200).send("ok");
"""

s2, n = pat.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit("❌ Could not locate the ABANDO_OK_SEND_CANONICAL_V1 -> send('ok') region to normalize.")

p.write_text(s2, encoding="utf-8")
print(f"✅ Normalized OK-send block. Backup: {bak.name}")
PY

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."
