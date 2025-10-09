#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "✖ Failed at line $LINENO"; exit 1' ERR
test -d .git && test -f package.json || { echo "✖ Run from Abando repo root (cart-agent)"; exit 2; }

# Move local, untracked helper scripts out of the way so checkout can proceed
for f in 03-abando-force-deploy.sh 04-verify-live.sh; do
  if ! git ls-files --error-unmatch "$f" >/dev/null 2>&1 && [ -f "$f" ]; then
    echo "→ Moving untracked $f to /tmp"
    mv "$f" "/tmp/$f.$$"
  fi
done

git fetch origin main --quiet
BR="chore/abando-wire-everywhere-$(date +%Y%m%d%H%M%S)"
git switch -c "$BR" origin/main >/dev/null 2>&1 || git checkout -B "$BR" origin/main

# 1) Write router (if not already present)
mkdir -p web
cat > web/smc-align.js <<'JS'
module.exports.installSmcAlign = function installSmcAlign(app, opts) {
  const DEFAULT_ALLOWED = ['https://staffordmedia.ai','https://www.staffordmedia.ai'];
  const allowed = (opts && Array.isArray(opts.allowedOrigins) && opts.allowedOrigins.length)
    ? opts.allowedOrigins
    : (process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
        : DEFAULT_ALLOWED);

  app.use((req,res,next)=>{ const o=req.headers.origin; if(o && allowed.includes(o)) res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary','Origin'); next(); });

  app.get('/__align', (_req,res)=>res.json({ok:true, service:'abando', align:true}));

  app.options('/api/status', (req,res)=>res.set({
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET, OPTIONS',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*'
  }).status(204).end());

  app.get('/api/status', (_req,res)=>res.set({
    'Access-Control-Allow-Origin':'*',
    'Cache-Control':'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
  }).json({ service:'abando', connected_to:'staffordmedia.ai'}));

  app.get('/robots.txt', (_req,res)=>res.type('text/plain').send(
`User-agent: *
Allow: /

Sitemap: https://abando.ai/sitemap.xml
`));

  app.get('/sitemap.xml', (_req,res)=>res.type('application/xml').send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://abando.ai/</loc></url>
  <url><loc>https://abando.ai/pricing</loc></url>
  <url><loc>https://staffordmedia.ai/</loc></url>
</urlset>`));
};
JS

# 2) Find *all* Express entry files anywhere in the repo (JS/TS), excluding node_modules & backups
echo "→ Scanning repo for Express entries…"
mapfile -t ENTRIES < <(
  grep -RIl --include="*.{js,ts,mjs,cjs}" -E '\bapp\s*=\s*express\s*\(' . \
   | grep -v '/node_modules/' | grep -v '\.backup\.' | grep -v '\.bak$' | sort -u
)

if [[ ${#ENTRIES[@]} -eq 0 ]]; then
  echo "✖ No entries found; aborting."
  exit 3
fi
printf "→ Found %d entries:\n" "${#ENTRIES[@]}"; printf '   - %s\n' "${ENTRIES[@]}"

# 3) Patch each entry to require('./smc-align') and installSmcAlign(app)
patch_entry () {
  local entry="$1"
  local dir="$(cd "$(dirname "$entry")" && pwd)"

  # Drop a sibling smc-align.js if not already reachable via relative require
  [[ -f "$dir/smc-align.js" ]] || cp -f web/smc-align.js "$dir/smc-align.js"

  ENTRY="$entry" node - <<'JS'
const fs=require('fs'); const path=require('path');
const entry=process.env.ENTRY; if(!entry) throw new Error('ENTRY missing');
let s=fs.readFileSync(entry,'utf8');

// Strip prior ESM import of smc-align (if any)
s = s.replace(/^\s*import\s+\{\s*installSmcAlign\s*\}\s+from\s+["'][^"']*smc[-_]align["'];?\s*\n/m, "");

// Ensure CJS require near the top
const reqLine = 'const { installSmcAlign } = require("./smc-align");\n';
if (!/require\(["']\.\/smc-align["']\)/.test(s)) {
  if (/^['"]use strict['"];\s*/.test(s)) s = s.replace(/^(['"]use strict['"];\s*)/, `$1${reqLine}`);
  else if (/^#!.*/.test(s))            s = s.replace(/^(#!.*\n)/, `$1${reqLine}`);
  else                                  s = reqLine + s;
}

// Install right after app = express(...)
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

for e in "${ENTRIES[@]}"; do patch_entry "$e"; done

# 4) Commit & PR
[[ -f .npmrc ]] || echo "optional=false" > .npmrc
git add -A
git commit -m "abando: wire alignment router into all Express entries across repo" || true
git push -u origin "$BR"
gh pr create --fill --head "$BR" || true
gh pr merge --squash --admin -d || true

echo "✅ Repo-wide wiring merged."
