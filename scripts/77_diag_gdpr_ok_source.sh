#!/usr/bin/env bash
set -euo pipefail

echo "===== RIPGREP: gdpr route definitions anywhere under web/ ====="
rg -n 'webhooks/gdpr|/api/webhooks/gdpr' web || true

echo
echo "===== RIPGREP: any literal ok responses under web/ ====="
rg -n 'send\("ok"\)|send\(\x27ok\x27\)|status\(200\).*ok|"\bok\b"|'\''\bok\b'\''' web || true

echo
echo "===== SHOW web/src/index.js blocks around markers ====="
nl -ba web/src/index.js | sed -n '1,200p'
echo
echo "===== MARKER COUNT ====="
python3 - <<'PY'
from pathlib import Path
s = Path("web/src/index.js").read_text(encoding="utf-8")
print("ABANDO_GDPR_WEBHOOK_ROUTE =", s.count("ABANDO_GDPR_WEBHOOK_ROUTE"))
print("END_ABANDO_GDPR_WEBHOOK_ROUTE =", s.count("END_ABANDO_GDPR_WEBHOOK_ROUTE"))
PY
