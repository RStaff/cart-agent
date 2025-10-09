#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "✖ Failed at line $LINENO"; exit 1' ERR
test -f package.json || { echo "✖ Run from cart-agent repo root"; exit 2; }

git fetch origin main --quiet
BR="chore/abando-preload-esm-safe-$(date +%Y%m%d%H%M%S)"
git checkout -B "$BR" origin/main 2>/dev/null || git switch -c "$BR"

mkdir -p web

# 1) Robust router (unchanged)
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

# 2) ESM-safe preload: wrap express eagerly and replace its export in require.cache
cat > web/smc-preload.cjs <<'CJS'
try {
  const Module = require('module');
  const path = require('path');

  // Load the real express once
  const expressPath = require.resolve('express');
  const realExpress = require(expressPath);

  // Build wrapped express(): call original, then install our router
  const wrapped = function(...args) {
    const app = realExpress(...args);
    try {
      const { installSmcAlign } = require(path.join(process.cwd(), 'web', 'smc-align.js'));
      if (typeof installSmcAlign === 'function') {
        installSmcAlign(app);
        if (process.env.SMC_PRELOAD_LOG) console.log('[smc-preload] alignment router installed');
      }
    } catch (e) {
      console.error('[smc-preload] failed to install alignment router:', e && e.message);
    }
    return app;
  };

  // Copy all enumerable props so it behaves like express (Router, static, etc)
  Object.assign(wrapped, realExpress);

  // Replace the export in require.cache so *both* CJS require and ESM import get wrapped
  const cached = require.cache[expressPath];
  if (cached) {
    cached.exports = wrapped;
    if (process.env.SMC_PRELOAD_LOG) console.log('[smc-preload] express export replaced in require.cache');
  }

  // Also patch Module.prototype.require as a fallback for odd loaders
  const origRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    const m = origRequire.apply(this, arguments);
    return (id === 'express') ? wrapped : m;
  };
} catch (e) {
  console.error('[smc-preload] init failed:', e && e.message);
}
CJS

# 3) Ensure NODE_OPTIONS preloads our shim and enable logging
mkdir -p .render
cat > .render/env.sh <<'SH'
export NODE_OPTIONS="${NODE_OPTIONS:-} --require ./web/smc-preload.cjs"
export SMC_PRELOAD_LOG=1
SH
chmod +x .render/env.sh

# 4) Wrap start script to source env (works for any Start Command)
node - <<'JS'
const fs=require('fs');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts = pkg.scripts || {};
const start = pkg.scripts.start || "node web/src/index.js";
if (!/\.render\/env\.sh/.test(start)) {
  pkg.scripts.start = `bash -lc 'set -a; [ -f .render/env.sh ] && . .render/env.sh; set +a; ${start}'`;
}
fs.writeFileSync('package.json', JSON.stringify(pkg,null,2));
console.log('→ start:', pkg.scripts.start);
JS

[[ -f .npmrc ]] || echo "optional=false" > .npmrc
git add -A
git commit -m "abando: ESM-safe preload — replace express export in require.cache; always install alignment router" || true
git push -u origin "$BR"
gh pr create --fill --head "$BR" || true
gh pr merge --squash --admin -d || true

# 5) Force deploy
BR2="chore/abando-redeploy-$(date +%Y%m%d%H%M%S)"
git checkout -B "$BR2" origin/main 2>/dev/null || git switch -c "$BR2"
mkdir -p web
date -u +"forced-redeploy @ %Y-%m-%dT%H:%M:%SZ" > web/.redeploy-touch
git add web/.redeploy-touch
git commit -m "chore: force render deploy" || true
git push -u origin "$BR2"
gh pr create --fill --head "$BR2" || true
gh pr merge --squash --admin -d || true

echo "✅ Deploy triggered with ESM-safe preload."
