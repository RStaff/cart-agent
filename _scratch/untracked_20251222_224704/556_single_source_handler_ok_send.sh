#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "🩹 Enforcing single-source handler_ok_send + reliable fan-out inside __abando__write_inbox()..."

python3 - <<'PY'
from pathlib import Path
import re, time

p = Path("web/src/routes/webhooks.js")
s = p.read_text(encoding="utf-8")

# 1) Remove any prior hook blocks (so we don't stack broken ones)
s = re.sub(
  r"\n[ \t]*// ABANDO_OK_SEND_STAGE_HOOK_V1[\s\S]*?\n[ \t]*} catch \(_e\) \{\}\n",
  "\n",
  s,
  flags=re.M
)

# 2) Make the fan-out happen INSIDE __abando__write_inbox AFTER target/fs exist.
# Find the first appendFileSync(target, line + "\n"); and inject right BEFORE it.
hook = r'''
  // ABANDO_OK_SEND_STAGE_HOOK_V2 (safe placement)
  // If anyone writes handler_ok_send, automatically emit received+verified next to it.
  try {
    if (stage === "handler_ok_send" && obj && !(obj && obj.__abando_internal)) {
      const base = (typeof obj === "object" && obj) ? obj : { value: obj };
      const a = JSON.stringify({ ...base, __abando_internal: true, ts: new Date().toISOString(), stage: "received" });
      fs.appendFileSync(target, a + "\n");
      const b = JSON.stringify({ ...base, __abando_internal: true, ts: new Date().toISOString(), stage: "verified" });
      fs.appendFileSync(target, b + "\n");
    }
  } catch (_e) {}
'''.rstrip("\n")

needle = r"fs\.appendFileSync\(target,\s*line\s*\+\s*\"\\n\"\);\s*"
m = re.search(needle, s)
if not m:
  raise SystemExit("❌ Could not find fs.appendFileSync(target, line + \"\\n\"); inside __abando__write_inbox()")

# inject once, right before the first append
s = re.sub(needle, hook + "\n\n  " + 'fs.appendFileSync(target, line + "\\n");\n', s, count=1)

# 3) Ensure there is ONLY ONE call-site that writes handler_ok_send via __abando__write_inbox.
# If multiple exist, keep the FIRST and remove the rest.
calls = list(re.finditer(r'__abando__write_inbox\(\s*"handler_ok_send"\s*,', s))
if len(calls) > 1:
  # remove all but first by deleting the entire try-block that contains the call if possible
  # (fallback: comment out the call line)
  keep = calls[0].start()
  out = s
  removed = 0
  for c in reversed(calls[1:]):
    # try to remove an enclosing try { ... } catch ... around it (best effort)
    left = out.rfind("try {", 0, c.start())
    right = out.find("} catch", c.start())
    if left != -1 and right != -1 and right > left:
      # delete from try { to end of that catch block line
      end = out.find("}\n", right)
      if end != -1:
        out = out[:left] + "\n" + out[end+2:]
        removed += 1
        continue
    # fallback: comment only the call token
    out = out[:c.start()] + "// (deduped) " + out[c.start():]
    removed += 1
  s = out
  print(f"✅ Deduped handler_ok_send call-sites: kept 1, removed/disabled {removed}")
else:
  print(f"✅ handler_ok_send call-sites: {len(calls)}")

# 4) Kill any remaining direct JSON.stringify stage:"handler_ok_send" writers (these bypass the hook).
s = re.sub(r'stage:\s*"handler_ok_send"\s*,', 'stage: "handler_ok_send",', s)  # normalize
# Remove blocks that build a `line = JSON.stringify({ stage:"handler_ok_send"... })` and append it
s2 = re.sub(
  r"\n[ \t]*const\s+line\s*=\s*JSON\.stringify\(\{\s*[\s\S]*?stage:\s*\"handler_ok_send\"[\s\S]*?\}\);\s*\n"
  r"[ \t]*fs\.appendFileSync\(\s*out\s*,\s*line\s*\+\s*\"\\n\"\s*\);\s*\n",
  "\n",
  s,
  flags=re.M
)
s = s2

p.write_text(s, encoding="utf-8")
print("✅ Patched webhooks.js")
PY

echo "🔎 Import-check..."
node --input-type=module -e "import('file://' + process.cwd() + '/web/src/routes/webhooks.js').then(()=>console.log('✅ webhooks.js imports ok')).catch(e=>{console.error('❌ import failed'); console.error(e.stack||e); process.exit(1)})"

echo "🔁 Nudge nodemon restart..."
touch web/src/routes/webhooks.js 2>/dev/null || true

echo
echo "🔎 Sanity counts:"
rg -n '__abando__write_inbox\\("handler_ok_send"' web/src/routes/webhooks.js || true
rg -n 'stage:\\s*"handler_ok_send"' web/src/routes/webhooks.js || true
echo "✅ Done."
