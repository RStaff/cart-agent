#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Disabling OK_SEND_PROBE + switching handler_ok_send logging to __abando__write_inbox()..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# 1) Remove any OK_SEND_PROBE marker blocks (clean + deterministic)
s2 = re.sub(
    r"\n\s*// \[abando\]\[OK_SEND_PROBE_BEGIN\][\s\S]*?// \[abando\]\[OK_SEND_PROBE_END\]\s*\n",
    "\n",
    s,
    flags=re.M,
)

# 2) Remove any remaining direct "handler_ok_send" append blocks that write to out
# (pattern: JSON.stringify({ stage:"handler_ok_send"... }) then fs.appendFileSync(out, line + "\n")
s2 = re.sub(
    r"\n[ \t]*try\s*\{\s*\n"
    r"[ \t]*const\s+\[fsMod,\s*pathMod\]\s*=\s*await\s*Promise\.all\([\s\S]*?\);\s*\n"
    r"[\s\S]*?stage:\s*\"handler_ok_send\"[\s\S]*?fs\.appendFileSync\(out,\s*line\s*\+\s*\"\\n\"\);\s*\n"
    r"[ \t]*\}\s*catch\s*\(e\)\s*\{\s*[\s\S]*?\}\s*\n",
    "\n",
    s2,
    flags=re.M,
)

# 3) Inject a single canonical write via __abando__write_inbox right before sending "ok" (success path)
inject = r'''
  // ABANDO_OK_SEND_CANONICAL_V1 (write via __abando__write_inbox so hooks can fan out)
  try {
    __abando__write_inbox("handler_ok_send", {
      method: req.method,
      url: req.originalUrl || req.url || null,
      topic: req.get("x-shopify-topic") || null,
      shop: req.get("x-shopify-shop-domain") || null,
      has_hmac: !!req.get("x-shopify-hmac-sha256"),
    });
  } catch (_e) {}
'''.rstrip("\n")

needle = r"return\s+res\.status\(200\)\.send\(\"ok\"\);\s*"
m = re.search(needle, s2)
if not m:
    raise SystemExit('❌ Could not find `return res.status(200).send("ok");` to hook.')

# Only inject once (first occurrence)
s2 = re.sub(needle, inject + "\n\n  return res.status(200).send(\"ok\");\n", s2, count=1)

p.write_text(s2, encoding="utf-8")
print(f"✅ Patched. Backup: {bak.name}")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true
echo "✅ Done."
