#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"

if [[ ! -f "$FILE" ]]; then
  echo "ERROR: $FILE not found"
  exit 2
fi

# Make a timestamped backup of the real file only
TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak_${TS}"

python3 - <<'PY'
import pathlib, re, sys

p = pathlib.Path("web/src/index.js")
txt = p.read_text(encoding="utf-8", errors="ignore")

needle = 'return res.status(500).send("Token exchange failed");'
if needle not in txt:
    print("ERROR: Did not find exact token failure line in web/src/index.js")
    print("Search results around 'Token exchange failed':")
    for m in re.finditer(r"Token exchange failed", txt):
        start = max(0, m.start()-120)
        end = min(len(txt), m.end()+120)
        print("----")
        print(txt[start:end])
    sys.exit(3)

# Replace the single line with richer logging.
replacement = """\
try {
        let __body = "";
        try {
          // tokenResp is likely in scope; if not, this still won't crash
          if (typeof tokenResp !== "undefined" && tokenResp && tokenResp.text) {
            __body = await tokenResp.text();
          }
        } catch (_) {}
        console.error("[OAUTH] Token exchange failed", {
          status: (typeof tokenResp !== "undefined" && tokenResp) ? tokenResp.status : undefined,
          body: __body,
        });
      } catch (_) {}
      return res.status(500).send("Token exchange failed");
"""

txt2 = txt.replace(needle, replacement, 1)
p.write_text(txt2, encoding="utf-8")
print("Patched web/src/index.js (1 occurrence)")
PY

echo
echo "Verify patch in web/src/index.js:"
grep -n "Token exchange failed" -n "$FILE" | head -n 20 || true
grep -n "\\[OAUTH\\] Token exchange failed" -n "$FILE" | head -n 20 || true

echo
echo "Done."
