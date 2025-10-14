#!/usr/bin/env bash
set -Eeuo pipefail
: "${CF_API_TOKEN:?Set CF_API_TOKEN (export CF_API_TOKEN=...)}"

mask(){ printf '%s…' "$(printf %s "$1" | cut -c1-6)"; }
echo "CF_API_TOKEN: $(mask "$CF_API_TOKEN")"

echo; echo "→ token scopes"
curl -sS -H "Authorization: Bearer ${CF_API_TOKEN}" \
  https://api.cloudflare.com/client/v4/user/tokens/verify \
| python3 - <<'PY' || true
import sys, json
d=json.load(sys.stdin)
ok=d.get("success") and d.get("result",{}).get("status")=="active"
pol=d.get("result",{}).get("policies",[])
sc=[(p.get("permission_group",{}).get("id"), p.get("resources")) for p in pol]
print("  status:", "active ✅" if ok else "NOT ACTIVE ❌")
for i,(perm,res) in enumerate(sc,1):
    print(f"  [{i}] {perm}  resources={res}")
PY

echo; echo "→ zones visible to this token"
curl -sS -H "Authorization: Bearer ${CF_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?per_page=50" \
| python3 - <<'PY' || true
import sys, json
d=json.load(sys.stdin)
zones=d.get("result",[])
if not zones:
  print("  (none) — token likely lacks Zone:Read or is for another account")
else:
  for z in zones:
    acct=z.get("account",{})
    print(f"  - {z.get('name')}  zone_id={z.get('id')}  account={acct.get('name')}({acct.get('id')})")
PY
