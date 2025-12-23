#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "🛠️  Patching webhook probe to fall through (no short-circuit by default)..."
cp "$FILE" "$FILE.bak_$(date +%s)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# 1) Ensure the probe middleware has `next` available.
# Heuristic: near the handler_ok_send logging, look for an arrow/function signature with (req, res) and add next.
def add_next_near_probe(text: str) -> str:
    # Find each handler_ok_send occurrence; for each, look back a bit and patch the nearest (req, res)
    out = text
    for m in list(re.finditer(r'stage\s*:\s*["\']handler_ok_send["\']', out)):
        start = max(0, m.start() - 1200)
        chunk = out[start:m.start()]
        # Patch the last occurrence of "(req, res)" in that chunk if it isn't already "(req, res, next)"
        # Covers: (req, res) => { ... }  OR function(req, res) { ... }
        candidates = list(re.finditer(r'\(\s*req\s*,\s*res\s*\)', chunk))
        if not candidates:
            continue
        last = candidates[-1]
        # Skip if next already present nearby
        if re.search(r'\(\s*req\s*,\s*res\s*,\s*next\s*\)', chunk[last.start():last.end()+40]):
            continue
        # Replace only this last one (by absolute indices)
        abs_a = start + last.start()
        abs_b = start + last.end()
        out = out[:abs_a] + "(req, res, next)" + out[abs_b:]
    return out

s = add_next_near_probe(s)

# 2) Replace the probe's `return res.status(200).send("ok");` that follows handler_ok_send
# with env-gated short-circuit; otherwise next().
pattern = re.compile(
    r'(?s)'
    r'(stage\s*:\s*["\']handler_ok_send["\'].*?)(return\s+res\.status\(\s*200\s*\)\.send\(\s*["\']ok["\']\s*\)\s*;)'
)

def repl(m):
    prefix = m.group(1)
    return (
        prefix
        + '\n// ABANDO_PROBE_V3: do NOT short-circuit by default.\n'
          '// Set ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT=1 if you want the old behavior.\n'
          'if (process.env.ABANDO_WEBHOOK_PROBE_SHORTCIRCUIT === "1") {\n'
          '  return res.status(200).send("ok");\n'
          '}\n'
          'return next();\n'
    )

s2, n = pattern.subn(repl, s)
if n == 0:
    raise SystemExit("❌ No handler_ok_send -> send('ok') blocks found to patch.")
p.write_text(s2, encoding="utf-8")
print(f"✅ Patched {n} handler_ok_send short-circuit(s) to fall through to next().")
PY

echo "🔎 ESM import-check $FILE..."
node --input-type=module -e "import('file://' + process.cwd() + '/$FILE').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."
