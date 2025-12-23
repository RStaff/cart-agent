#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# Replace ONLY the target resolution portion inside __abando__write_inbox
pat = re.compile(
    r"(function __abando__write_inbox\(stage, obj\)\s*\{.*?\n)"
    r"(\s*// ABANDO_INBOX_CANONICAL_V1.*?\n)"
    r"(.*?\n\s*let target = .*?\n)"
    r"(\s*// If running from /web.*?\n\s*if \(cwd\.endsWith.*?\n\s*\}\s*else\s*\{\n\s*target = .*?\n\s*\}\n)",
    re.S
)

m = pat.search(s)
if not m:
    raise SystemExit("❌ Could not locate __abando__write_inbox target-resolution block to patch.")

head = m.group(1) + m.group(2) + m.group(3)

replacement = r'''
  // Resolve relative inbox paths against *cwd* when running from /web (matches your actual runtime cwd),
  // otherwise resolve against repoRoot.
  const baseDir = cwd.endsWith(path.sep + "web") ? cwd : repoRoot;

  // If running from /web and env uses "web/...", normalize to avoid "web/web/..."
  if (cwd.endsWith(path.sep + "web") && (target.startsWith("web/") || target.startsWith("web\\"))) {
    target = target.slice(4);
  }

  // Absolute paths stay absolute; relative paths resolve against baseDir
  target = path.isAbsolute(target) ? target : path.resolve(baseDir, target);
'''.strip("\n") + "\n"

s2 = s[:m.start()] + head + replacement + s[m.end():]
p.write_text(s2, encoding="utf-8")
print(f"✅ Patched __abando__write_inbox target baseDir (cwd-aware). Backup: {bak.name}")
PY

echo "🔎 node --check..."
node --check "$FILE"
echo "✅ node --check passed."
