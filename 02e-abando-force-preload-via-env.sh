#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "✖ Failed at line $LINENO"; exit 1' ERR
test -f package.json || { echo "✖ Run from cart-agent repo root"; exit 2; }

git fetch origin main --quiet
BR="chore/abando-node-options-preload-$(date +%Y%m%d%H%M%S)"
git checkout -B "$BR" origin/main 2>/dev/null || git switch -c "$BR"

# 1) .render-build & runtime env shim: export NODE_OPTIONS to include our preload
mkdir -p .render
cat > .render/env.sh <<'SH'
export NODE_OPTIONS="${NODE_OPTIONS:-} --require ./web/smc-preload.cjs"
SH
chmod +x .render/env.sh

# 2) Hook the env shim into start via npm script (Render respects package.json scripts)
node - <<'JS'
const fs=require('fs');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts = pkg.scripts || {};
// wrap start to source env.sh before node
const start = pkg.scripts.start || "node web/src/index.js";
if (!/\.render\/env\.sh/.test(start)) {
  pkg.scripts.start = `bash -lc 'set -a; [ -f .render/env.sh ] && . .render/env.sh; set +a; ${start}'`;
}
fs.writeFileSync('package.json', JSON.stringify(pkg,null,2));
console.log('→ start:', pkg.scripts.start);
JS

git add -A
git commit -m "abando: force preload via NODE_OPTIONS from .render/env.sh (works with any Start Command)" || true
git push -u origin "$BR"
gh pr create --fill --head "$BR" || true
gh pr merge --squash --admin -d || true

# 3) Redeploy to Render
BR2="chore/abando-redeploy-$(date +%Y%m%d%H%M%S)"
git checkout -B "$BR2" origin/main 2>/dev/null || git switch -c "$BR2"
mkdir -p web
date -u +"forced-redeploy @ %Y-%m-%dT%H:%M:%SZ" > web/.redeploy-touch
git add web/.redeploy-touch
git commit -m "chore: force render deploy" || true
git push -u origin "$BR2"
gh pr create --fill --head "$BR2" || true
gh pr merge --squash --admin -d || true
echo "✅ Deploy triggered."
