#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Fixing stage override bug in __abando__write_inbox (stage must win)..."

python3 - <<'PY'
import time, re
from pathlib import Path

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")
bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# Find the canonical writer section and patch the JSON.stringify spreads so stage is last,
# and stage is deleted from base/common before writing.
# We'll do a targeted transform around the fan-out block.

# 1) Ensure we delete base.stage after base is defined
s2, n1 = re.subn(
  r'(const base\s*=\s*\(obj.*?\);\s*\n\s*const ts\s*=.*?;\s*\n)',
  r'\1\n  // ensure stage cannot be overridden by obj\n  try { if (base && typeof base === "object" && "stage" in base) delete base.stage; } catch (_e) {}\n',
  s,
  flags=re.S
)

# 2) Primary write: move stage to the end (stage wins)
s2, n2 = re.subn(
  r'JSON\.stringify\(\{\s*ts\s*,\s*stage\s*,\s*\.\.\.base\s*\}\)',
  r'JSON.stringify({ ts, ...base, stage })',
  s2
)

# 3) Fanout: ensure common also cannot carry stage, and stage is last
# Patch the common creation line to delete stage
s2, n3 = re.subn(
  r'(const common\s*=\s*\{\s*\.\.\.base\s*,\s*__abando_internal:\s*true\s*\};)',
  r'\1\n      try { if (common && typeof common === "object" && "stage" in common) delete common.stage; } catch (_e) {}',
  s2
)

# Patch JSON.stringify objects so stage is last
s2, n4 = re.subn(
  r'JSON\.stringify\(\{\s*ts:\s*new Date\(\)\.toISOString\(\)\s*,\s*stage:\s*"received"\s*,\s*\.\.\.common\s*\}\)',
  r'JSON.stringify({ ts: new Date().toISOString(), ...common, stage: "received" })',
  s2
)
s2, n5 = re.subn(
  r'JSON\.stringify\(\{\s*ts:\s*new Date\(\)\.toISOString\(\)\s*,\s*stage:\s*"verified"\s*,\s*\.\.\.common\s*\}\)',
  r'JSON.stringify({ ts: new Date().toISOString(), ...common, stage: "verified" })',
  s2
)

p.write_text(s2, encoding="utf-8")
print(f"✅ Patched stage override. Backed up: {bak.name}. Changes: base_del={n1}, primary={n2}, common_del={n3}, recv={n4}, ver={n5}")
PY

node --check "$FILE"
echo "✅ node --check passed."

touch "$FILE" 2>/dev/null || true
echo "✅ Done."
