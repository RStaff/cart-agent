#!/usr/bin/env python3
import re, time, pathlib, sys

FILE = pathlib.Path("web/src/routes/webhooks.js")
if not FILE.exists():
    print(f"❌ Missing {FILE}", file=sys.stderr)
    sys.exit(1)

ts = str(int(time.time()))
backup = FILE.with_suffix(FILE.suffix + f".bak_{ts}")
backup.write_text(FILE.read_text(encoding="utf-8"), encoding="utf-8")

s = FILE.read_text(encoding="utf-8")

# 0) Remove ESM-breaking require("node:path") line if present
s = re.sub(r"\n\s*const\s+path\s*=\s*require\(\"node:path\"\);\s*\n", "\n", s)

# 1) Remove default import path from "node:path" to avoid duplicates/conflicts
s = re.sub(r'^\s*import\s+path\s+from\s+"node:path";\s*\n', "", s, flags=re.M)

# 2) Ensure namespace imports exist once
def ensure_import(line: str):
    nonlocal_s = None

imports_block = re.match(r"^((?:\s*import[^\n]*\n)+)", s)
imports = imports_block.group(1) if imports_block else ""
need_path = 'import * as abandoPath from "node:path";\n' not in imports
need_crypto = 'import * as abandoCrypto from "node:crypto";\n' not in imports

to_add = ""
if need_path:
    to_add += 'import * as abandoPath from "node:path";\n'
if need_crypto:
    to_add += 'import * as abandoCrypto from "node:crypto";\n'

if to_add:
    if imports_block:
        s = to_add.join([imports, s[len(imports):]]) if False else (imports + to_add + s[len(imports):])
    else:
        s = to_add + s

# refresh imports after possible change
imports_block = re.match(r"^((?:\s*import[^\n]*\n)+)", s)
imports = imports_block.group(1) if imports_block else ""

# 3) Insert helper (once) right after imports
helper = r'''
// ABANDO_SECRET_FP_HELPER_BEGIN
function abandoSecretFp() {
  try {
    const secret = String(process.env.SHOPIFY_API_SECRET || "");
    return abandoCrypto.createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);
  } catch (e) {
    return "(fp_failed)";
  }
}
// ABANDO_SECRET_FP_HELPER_END

'''
if "ABANDO_SECRET_FP_HELPER_BEGIN" not in s:
    if imports_block:
        s = imports + helper + s[len(imports):]
    else:
        s = helper + s

# 4) Inject debug block AFTER the console.log call that contains the message
#    We match a *single console.log(...); statement that includes the substring.
debug_block = r'''// ABANDO_WEBHOOK_FP_DEBUG_BEGIN
try {
  const fp = abandoSecretFp();
  const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "");
  const resolved = raw ? abandoPath.resolve(process.cwd(), raw) : "(none)";
  console.log("[abando][SECRET_FP]", fp);
  console.log("[abando][INBOX_ENABLED]", String(process.env.ABANDO_EVENT_INBOX || ""));
  console.log("[abando][INBOX_PATH] cwd=", process.cwd(), "raw=", raw, "resolved=", resolved);
} catch (e) {
  console.log("[abando][FP_DEBUG] failed", e?.message || e);
}
// ABANDO_WEBHOOK_FP_DEBUG_END
'''

if "ABANDO_WEBHOOK_FP_DEBUG_BEGIN" not in s:
    # Find console.log statement that includes: [webhooks] received POST /api/webhooks
    # This grabs from 'console.log(' to the next ');' (non-greedy), across newlines.
    pattern = re.compile(
        r"(console\.log\([\s\S]*?\[webhooks\][\s\S]*?received\s+POST\s+\/api\/webhooks[\s\S]*?\)\s*;)",
        re.M
    )
    m = pattern.search(s)
    if not m:
        print("❌ Could not find console.log containing '[webhooks] received POST /api/webhooks' to patch.", file=sys.stderr)
        sys.exit(2)

    insert_at = m.end(1)
    s = s[:insert_at] + "\n" + debug_block + "\n" + s[insert_at:]

FILE.write_text(s, encoding="utf-8")
print(f"✅ Patched {FILE}")
print(f"🧾 Backup: {backup}")
print("ℹ️ Nodemon should auto-restart (Terminal A). If it doesn’t, type: rs in Terminal A.")
