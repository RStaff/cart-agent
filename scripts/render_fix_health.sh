#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
import re, pathlib
p = pathlib.Path("web/index.js")
s = p.read_text(encoding="utf-8")
if "app.get('/health'" not in s and 'app.get("/health"' not in s:
    s = s.rstrip() + "\n\napp.get('/health', (_req,res)=>res.status(200).send('ok'));\n"
s = re.sub(r'^[ \t]*app\.listen\([^;]*\);\s*$', '', s, flags=re.M)
if "app.listen(" not in s:
    s = s.rstrip() + "\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(`[boot] listening on ${PORT}`));\n"
p.write_text(s, encoding="utf-8")
print("ok")
PY

git add web/index.js
git commit -m "Render: add /health and PORT listener" || true
git push

BASE="https://cart-agent-backend.onrender.com"
for i in $(seq 1 60); do
  code=$(curl -fsS -o /dev/null -w '%{http_code}' "$BASE/health" || true)
  [ "$code" = "200" ] && break
  sleep 2
done
curl -fsS "$BASE/health" && echo
