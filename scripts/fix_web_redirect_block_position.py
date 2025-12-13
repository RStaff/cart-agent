#!/usr/bin/env python3
from __future__ import annotations
import re
import time
from pathlib import Path

target = Path("web/src/index.js")
if not target.exists():
    raise SystemExit(f"❌ Cannot find {target}. Run from repo root: ~/projects/cart-agent")

code = target.read_text(encoding="utf-8")

backup = target.with_suffix(target.suffix + f".bak_fixpos_{int(time.time())}")
backup.write_text(code, encoding="utf-8")

# 1) Remove any existing ABANDO redirect block (wherever it is)
code2 = re.sub(
    r"\n// ✅ ABANDO_PORT3000_REDIRECTS \(patched\)\n.*?\n\n",
    "\n",
    code,
    flags=re.S
)

# 2) Insert block immediately after app initialization
insert = (
    "\n// ✅ ABANDO_PORT3000_REDIRECTS (patched)\n"
    "// Port 3000 is the Shopify backend. UI lives on Next.js :3001.\n"
    "app.get(\"/\", (_req, res) => res.redirect(307, \"http://localhost:3001/demo/playground\"));\n"
    "app.get(\"/embedded\", (_req, res) => res.redirect(307, \"http://localhost:3001/embedded\"));\n\n"
)

patterns = [
    r"(const\s+app\s*=\s*express\(\)\s*;)",
    r"(const\s+app\s*=\s*express\(\)\s*)"
]

patched = False
for pat in patterns:
    m = re.search(pat, code2)
    if m:
        # ensure there's a semicolon after app init
        if m.group(0).strip().endswith("express()"):
            repl = m.group(0) + ";"
        else:
            repl = m.group(0)
        code2 = code2[:m.end()] + insert + code2[m.end():]
        # If we added a semicolon, replace the matched range with repl
        code2 = code2[:m.start()] + repl + code2[m.end():]
        patched = True
        break

if not patched:
    target.write_text("// ❌ Could not find app initialization for redirect insertion\n" + code2, encoding="utf-8")
    raise SystemExit("❌ Could not find `const app = express()` in web/src/index.js. I left a marker at the top.")

target.write_text(code2, encoding="utf-8")
print(f"✅ Patched {target}")
print(f"🧾 Backup: {backup}")
