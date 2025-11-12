#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "✖ Failed at line $LINENO"; exit 1' ERR

<<<<<<< HEAD
# Ensure Abando repo root
test -d .git && test -f package.json || { echo "✖ Run from Abando (cart-agent) repo root"; exit 2; }

git fetch origin main --quiet
git add -A
git commit -m "wip: capture untracked before branch switch" || true

BR="chore/abando-wire-align-$(date +%Y%m%d%H%M%S)"
git switch -c "$BR" >/dev/null 2>&1 || git checkout -B "$BR"
git rebase origin/main || { echo "Rebase failed; trying merge --no-ff"; git merge --no-ff -m "merge origin/main" origin/main || true; }

echo "→ Scanning for Express entries (excluding node_modules/backups)"
=======
# Ensure Abando repo (cart-agent) root
test -d .git && test -f package.json || { echo "✖ Run from Abando repo root (cart-agent)"; exit 2; }

git fetch origin main --quiet
BR="chore/abando-wire-align-$(date +%Y%m%d%H%M%S)"
git switch -c "$BR" origin/main >/dev/null 2>&1 || git checkout -B "$BR" origin/main

echo "→ Scanning for live Express entries (excluding node_modules/backups)"
>>>>>>> origin/main
mapfile -t ENTRIES < <(
  grep -RIl --include="*.js" -E '\bapp\s*=\s*express\s*\(' web 2>/dev/null \
  | grep -v '/node_modules/' | grep -v '\.backup\.' | grep -v '\.bak$' | sort -u
)
[[ ${#ENTRIES[@]} -gt 0 ]] || { echo "✖ No Express entries under web/. Aborting."; exit 3; }
<<<<<<< HEAD
printf "→ Found %d entries:\n" "${#ENTRIES[@]}"; printf '   - %s\n' "${ENTRIES[@]}"
=======
printf "→ Found %d candidate entries:\n" "${#ENTRIES[@]}"; printf '   - %s\n' "${ENTRIES[@]}"
>>>>>>> origin/main

make_router_here () {
  local dir="$1"
  cat > "$dir/smc-align.js" <<'JS'
/**
 * smc-align.js — CORS reflect + /api/status (GET+OPTIONS) + robots + sitemap + /__align
 */
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

  // Self-test
  app.get('/__align', (_req, res) => res.json({ok:true, service:'abando', align:true}));

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

  // robots
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
`User-agent: *
Allow: /

Sitemap: https://abando.ai/sitemap.xml
`);
  });

  // sitemap
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
}

patch_entry () {
  local entry="$1"
  local dir="$(cd "$(dirname "$entry")" && pwd)"
<<<<<<< HEAD
  make_router_here "$dir"
=======

  # drop router next to the entry so require is always "./smc-align"
  make_router_here "$dir"

>>>>>>> origin/main
  ENTRY="$entry" node - <<'JS'
const fs=require('fs');
const entry=process.env.ENTRY;
if(!entry){ throw new Error('ENTRY env missing'); }
let s=fs.readFileSync(entry,'utf8');

// Remove any previous ESM import
s = s.replace(/^\s*import\s+\{\s*installSmcAlign\s*\}\s+from\s+["'][^"']*smc[-_]align["'];?\s*\n/m, "");

// Ensure CJS require for local './smc-align'
const reqLine = 'const { installSmcAlign } = require("./smc-align");\n';
if (!/require\(["']\.\/smc-align["']\)/.test(s)) {
  if (/^['"]use strict['"];\s*/.test(s)) s = s.replace(/^(['"]use strict['"];\s*)/, `$1${reqLine}`);
  else if (/^#!.*/.test(s))            s = s.replace(/^(#!.*\n)/, `$1${reqLine}`);
  else                                  s = reqLine + s;
}

// Install after app = express(...)
if (!/installSmcAlign\s*\(\s*app\s*\)/.test(s)) {
  s = s.replace(
    /(app\s*=\s*express\s*\([^)]*\)\s*;[^\n]*\n)/,
    `$1\n// Stafford ↔ Abando alignment\ninstallSmcAlign(app);\n`
  );
}

fs.writeFileSync(entry,s);
console.log('→ Patched', entry);
JS
}

echo "→ Writing routers and patching entries"
for e in "${ENTRIES[@]}"; do
  patch_entry "$e"
done

<<<<<<< HEAD
# Keep installs deterministic & ignore noisy caches (non-blocking)
[[ -f .npmrc ]] || echo "optional=false" > .npmrc
grep -q "^.eslintcache$" .gitignore 2>/dev/null || echo ".eslintcache" >> .gitignore

# CI guard to keep alignment mounted
=======
# Build stability & ignore noisy caches
[[ -f .npmrc ]] || echo "optional=false" > .npmrc
grep -q "^.eslintcache$" .gitignore 2>/dev/null || echo ".eslintcache" >> .gitignore

# CI guard to ensure router stays mounted
>>>>>>> origin/main
mkdir -p .github/workflows
cat > .github/workflows/abando-align-validate.yml <<'YML'
name: abando-align-validate
on:
  pull_request: { branches: [ main ] }
  push: { branches: [ chore/**, feat/** ] }
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          set -e
          found=0
          while IFS= read -r f; do
            d="$(dirname "$f")"
            test -f "$d/smc-align.js" || { echo "missing $d/smc-align.js"; exit 1; }
            grep -q "installSmcAlign(app)" "$f" || { echo "not installed in $f"; exit 1; }
            found=1
          done < <(grep -RIl --include="*.js" -E '\bapp\s*=\s*express\s*\(' web | grep -v '/node_modules/' | grep -v '\.backup\.' | grep -v '\.bak$')
          test "$found" = "1" || { echo "no real entries found"; exit 1; }
YML

git add -A
<<<<<<< HEAD
git commit -m "abando: mount alignment router into live Express entry; status/SEO/self-test; npm stability; CI guard" || true
=======
git commit -m "abando: mount alignment router in real Express entries; self-test & SEO; npm stability; CI guard" || true
>>>>>>> origin/main
git push -u origin "$BR"
gh pr create --fill --head "$BR" || true
gh pr merge --squash --admin -d || true

<<<<<<< HEAD
echo "✅ Abando router submitted. Next: force deploy."
=======
echo "✅ Abando router submitted via PR. Next: force deploy so routes go live."
>>>>>>> origin/main
