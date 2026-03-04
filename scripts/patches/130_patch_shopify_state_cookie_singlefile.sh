#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
if [[ ! -f "$FILE" ]]; then
  echo "ERROR: $FILE not found"
  exit 2
fi

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak_cookie_${TS}"

python3 - <<'PY'
import pathlib, re, sys

p = pathlib.Path("web/src/index.js")
txt = p.read_text(encoding="utf-8", errors="ignore")

# Look for a res.cookie call for shopify_state
pat = re.compile(r"""res\.cookie\(\s*(['"])shopify_state\1\s*,\s*([^,]+?)\s*,\s*\{(?P<opts>[^}]*?)\}\s*\)""", re.DOTALL)
m = pat.search(txt)
if not m:
    print("ERROR: Could not find res.cookie('shopify_state', ..., {...}) in web/src/index.js")
    sys.exit(3)

opts = m.group("opts")

def ensure_kv(opts: str, key: str, value_expr: str) -> str:
    # Replace existing key or insert at top
    if re.search(rf"\b{re.escape(key)}\s*:", opts):
        opts = re.sub(rf"\b{re.escape(key)}\s*:\s*[^,\n]+", f"{key}: {value_expr}", opts)
    else:
        opts = f" {key}: {value_expr},\n" + opts
    return opts

opts2 = opts
opts2 = ensure_kv(opts2, "secure", "true")
opts2 = ensure_kv(opts2, "sameSite", '"none"')

new_cookie = f"res.cookie('shopify_state', {m.group(2).strip()}, {{{opts2}}})"
txt2 = txt[:m.start()] + new_cookie + txt[m.end():]

p.write_text(txt2, encoding="utf-8")
print("Patched shopify_state cookie options in web/src/index.js")
PY

echo
echo "Verify cookie options:"
grep -n "res.cookie(.*shopify_state" -n "$FILE" | head -n 5 || true
grep -n "sameSite" -n "$FILE" | head -n 20 || true
grep -n "secure" -n "$FILE" | head -n 20 || true
