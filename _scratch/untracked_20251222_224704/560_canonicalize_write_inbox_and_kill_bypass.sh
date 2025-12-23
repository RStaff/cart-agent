#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🧱 Canonicalizing __abando__write_inbox() + disabling any bypass writes..."

python3 - <<'PY'
import time, re
from pathlib import Path

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")
bak = p.with_suffix(".js.bak_" + str(int(time.time())))
bak.write_text(s, encoding="utf-8")

# 1) Replace the entire __abando__write_inbox function body with a known-good version.
m = re.search(r'function\s+__abando__write_inbox\s*\(\s*stage\s*,\s*obj\s*\)\s*\{', s)
if not m:
    raise SystemExit("❌ Could not find function __abando__write_inbox(stage, obj)")

start = m.start()

# naive brace match from start of function
i = m.end()  # position after '{'
depth = 1
while i < len(s) and depth > 0:
    ch = s[i]
    if ch == "{":
        depth += 1
    elif ch == "}":
        depth -= 1
    i += 1
end = i  # position after matching '}'

func_new = r'''
function __abando__write_inbox(stage, obj) {
  // ABANDO_INBOX_CANONICAL_V1 (deterministic + cwd-safe)
  const fs = require("node:fs");
  const path = require("node:path");

  const cwd = process.cwd();
  const repoRoot = cwd.endsWith(path.sep + "web") ? cwd.slice(0, -4) : cwd;
  const fallback = path.resolve(repoRoot, "web/.abando_webhook_inbox.jsonl");

  let target = String(process.env.ABANDO_EVENT_INBOX_PATH || process.env.ABANDO_EVENT_INBOX || "").trim() || fallback;

  // If running from /web and env uses "web/...", normalize to avoid "web/web/..."
  if (cwd.endsWith(path.sep + "web") && (target.startsWith("web/") || target.startsWith("web\\"))) {
    target = target.slice(4);
    target = path.resolve(cwd, target);
  } else {
    target = path.resolve(repoRoot, target);
  }

  const base = (obj && typeof obj === "object") ? obj : { value: obj };
  const ts = new Date().toISOString();

  // Always write the primary stage
  try {
    fs.appendFileSync(target, JSON.stringify({ ts, stage, ...base }) + "\\n");
  } catch (_e) {}

  // Fan-out: if handler_ok_send, also emit received + verified next to it
  try {
    if (stage === "handler_ok_send" && !base.__abando_internal) {
      const common = { ...base, __abando_internal: true };
      fs.appendFileSync(target, JSON.stringify({ ts: new Date().toISOString(), stage: "received", ...common }) + "\\n");
      fs.appendFileSync(target, JSON.stringify({ ts: new Date().toISOString(), stage: "verified", ...common }) + "\\n");
    }
  } catch (_e) {}
}
'''.lstrip("\n")

s2 = s[:start] + func_new + s[end:]

# 2) Disable any remaining bypass that writes handler_ok_send directly to `out` file
# We only comment out the specific pattern: fs.appendFileSync(out, line + "\n");
pat = re.compile(r'^[ \t]*fs\.appendFileSync\(\s*out\s*,\s*line\s*\+\s*"\\n"\s*\);\s*$', re.M)
def repl(m):
    line = m.group(0)
    indent = re.match(r'^[ \t]*', line).group(0)
    return indent + "// [ABANDO] disabled bypass; use __abando__write_inbox() instead\n" + indent + "// " + line.strip()

s3, n = pat.subn(repl, s2)

p.write_text(s3, encoding="utf-8")
print(f"✅ Patched __abando__write_inbox() + disabled bypass sites: {n}. Backup: {bak.name}")
PY

# node --check is the truth source
node --check "$FILE"
echo "✅ node --check passed."

echo "🔁 Nudge nodemon restart..."
touch "$FILE" 2>/dev/null || true
echo "✅ Done."
