#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
[[ -f "$FILE" ]] || { echo "ERROR: $FILE not found"; exit 2; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak_tokfix_${TS}"

python3 - <<'PY'
import pathlib, re, sys
p = pathlib.Path("web/src/index.js")
txt = p.read_text(encoding="utf-8", errors="ignore")

# Find the token exchange failure block starting at: if (!tokenResp.ok) {
m = re.search(r'if\s*\(\s*!\s*tokenResp\.ok\s*\)\s*\{', txt)
if not m:
    print("ERROR: Could not find `if (!tokenResp.ok) {` in web/src/index.js")
    sys.exit(3)

start = m.start()

# Heuristically find the matching closing brace for that if-block.
# We'll scan forward counting braces from the first "{"
i = txt.find("{", m.end()-1)
depth = 0
end = None
for j in range(i, len(txt)):
    if txt[j] == "{":
        depth += 1
    elif txt[j] == "}":
        depth -= 1
        if depth == 0:
            end = j+1
            break
if end is None:
    print("ERROR: Could not find end of `if (!tokenResp.ok)` block")
    sys.exit(4)

old_block = txt[start:end]

new_block = """if (!tokenResp.ok) {
      const body = await tokenResp.text().catch(() => "");
      console.error("[OAUTH] Token exchange failed", {
        status: tokenResp.status,
        body,
      });
      return res.status(500).send("Token exchange failed");
    }"""

txt2 = txt[:start] + new_block + txt[end:]
p.write_text(txt2, encoding="utf-8")

print("Replaced tokenResp !ok block with single-read logger.")
PY

echo
echo "=== VERIFY ==="
grep -n "if (!tokenResp.ok)" -n "$FILE" | head -n 5 || true
grep -n "\\[OAUTH\\] Token exchange failed" -n "$FILE" | head -n 5 || true
