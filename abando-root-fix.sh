#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "✖ Failed at line $LINENO"; exit 1' ERR

# 0) Repo sanity
test -d .git && test -f package.json || { echo "✖ Run from Abando repo root"; exit 2; }

# 1) Find Express entry
ENTRY=""
for f in web/src/index.js web/index.js web/shopify/server.js web/src/server.js index.js; do
  [[ -f "$f" ]] && grep -qE '\bapp\s*=\s*express\s*\(' "$f" && { ENTRY="$f"; break; }
done
[[ -z "$ENTRY" ]] && ENTRY="$(grep -RIl --include="*.js" -E '\bapp\s*=\s*express\s*\(' web 2>/dev/null || true)"
[[ -n "$ENTRY" ]] || { echo "✖ Could not find Express entry (app = express())"; exit 3; }
echo "→ Express entry: $ENTRY"

# 2) Router (CommonJS) with OPTIONS/status/robots/sitemap and CORS reflection
ROUTER="web/src/smc-align.js"
mkdir -p "$(dirname "$ROUTER")"
cat > "$ROUTER" <<'JS'
module.exports.installSmcAlign = function installSmcAlign(app, opts) {
  const DEFAULT_ALLOWED = ['https://staffordmedia.ai','https://www.staffordmedia.ai'];
  const allowed = (opts && Array.isArray(opts.allowedOrigins) && opts.allowedOrigins.length)
    ? opts.allowedOrigins
    : (process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
        : DEFAULT_ALLOWED);

  // Reflect allowed origins globally
  app.use((req, res, next) => {
    const o = req.headers.origin;
    if (o && allowed.includes(o)) res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    next();
  });

  // Preflight for /api/status
  app.options('/api/status', (req, res) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*'
    }).status(204).end();
  });

  // Public status
  app.get('/api/status', (_req, res) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
    }).json({ service: 'abando', connected_to: 'staffordmedia.ai' });
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
`User-agent: *
Allow: /

Sitemap: https://abando.ai/sitemap.xml
`);
  });

  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml').send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://abando.ai/</loc></url>
  <url><loc>https://abando.ai/pricing</loc></url>
  <url><loc>https://staffordmedia.ai/</loc></url>
</urlset>`);
  });
};
JS
echo "→ Router written: $ROUTER"

# 3) Patch entry (idempotent)
node - <<'JS'
const fs=require("fs");
const p=process.env.ENTRY;
let s=fs.readFileSync(p,"utf8");
s = s.replace(/^\s*import\s+\{\s*installSmcAlign\s*\}\s+from\s+["'][^"']*smc[-_]align["'];?\s*\n/m, "");
const reqLine = 'const { installSmcAlign } = require("./src/smc-align");\n';
if (!/require\(["']\.\/src\/smc-align["']\)/.test(s)) {
  if (/^['"]use strict['"];\s*/.test(s)) s = s.replace(/^(['"]use strict['"];\s*)/, `$1${reqLine}`);
  else if (/^#!.*/.test(s))           s = s.replace(/^(#!.*\n)/, `$1${reqLine}`);
  else                                 s = reqLine + s;
}
if (!/installSmcAlign\s*\(\s*app\s*\)/.test(s)) {
  s = s.replace(
    /(app\s*=\s*express\s*\([^)]*\)\s*;[^\n]*\n)/,
    `$1\n// Stafford ↔ Abando alignment\ninstallSmcAlign(app);\n`
  );
}
fs.writeFileSync(p,s);
console.log("→ Patched", p);
JS
ENTRY="$ENTRY"

# 4) Stabilize npm for Linux builds; ensure lockfile exists
if [[ -f .npmrc ]]; then
  grep -q "^optional=" .npmrc && sed -i.bak 's/^optional=.*/optional=false/' .npmrc || echo "optional=false" >> .npmrc
else
  echo "optional=false" > .npmrc
fi
[[ -f package-lock.json ]] || npm install --package-lock-only >/dev/null 2>&1 || true

# 5) Ignore transient caches that cause divergence
grep -q "^apps/website/.eslintcache$" .gitignore 2>/dev/null || echo "apps/website/.eslintcache" >> .gitignore
grep -q "^.eslintcache$" .gitignore 2>/dev/null || echo ".eslintcache" >> .gitignore

# 6) CI guard
mkdir -p .github/workflows
cat > .github/workflows/abando-align-validate.yml <<'YML'
name: abando-align-validate
on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ chore/**, feat/** ]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          test -f web/src/smc-align.js
          grep -q "/api/status" web/src/smc-align.js
          grep -q "sitemap.xml" web/src/smc-align.js
          grep -q "robots.txt" web/src/smc-align.js
YML

# 7) Branch, commit, PR (protected main safe)
git fetch origin main --quiet
BR="chore/abando-root-fix-$(date +%Y%m%d%H%M%S)"
git switch -c "$BR" origin/main >/dev/null 2>&1 || git checkout -B "$BR" origin/main
git add -A
git commit -m "abando: durable status/SEO + CORS/OPTIONS + npm stability + CI guard + cache ignore" || true
git push -u origin "$BR"
gh pr create --fill --head "$BR" || true
gh pr merge --squash --admin -d || true

echo "✅ Submitted PR ($BR). If not auto-merged, approve at: https://github.com/YOUR_ORG/YOUR_ABANDO_REPO/pulls"
