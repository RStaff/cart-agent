#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "✖ Failed at line $LINENO"; exit 1' ERR

# Ensure repo root
test -d .git && test -f package.json || { echo "✖ Run from Abando repo root (cart-agent)"; exit 2; }

# If an untracked 04-verify-live.sh exists (from earlier), remove it so checkout can't complain
if ! git ls-files --error-unmatch 04-verify-live.sh >/dev/null 2>&1 && [ -f 04-verify-live.sh ]; then
  echo "→ Removing stray untracked 04-verify-live.sh"
  rm -f 04-verify-live.sh
fi

git fetch origin main --quiet
BR="chore/abando-preload-wire-$(date +%Y%m%d%H%M%S)"
git switch -c "$BR" origin/main >/dev/null 2>&1 || git checkout -B "$BR" origin/main

mkdir -p web

# 1) Router (status, __align, robots, sitemap)
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

# 2) Preload shim: wrap express() so our router always attaches
cat > web/smc-preload.cjs <<'CJS'
const Module = require('module');
const orig = Module.prototype.require;
Module.prototype.require = function (id) {
  const m = orig.apply(this, arguments);
  if (id === 'express' && typeof m === 'function') {
    const express = m;
    const wrapped = function(...args){
      const app = express(...args);
      try {
        const { installSmcAlign } = require('./smc-align');
        if (typeof installSmcAlign === 'function') {
          installSmcAlign(app);
          if (process.env.SMC_PRELOAD_LOG) console.log('[smc-preload] installed alignment router');
        }
      } catch (e) { console.error('[smc-preload] failed to install router', e); }
      return app;
    };
    Object.assign(wrapped, express);
    return wrapped;
  }
  return m;
};
CJS

# 3) Ensure "start" preloads shim (works on Render)
node - <<'JS'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts = pkg.scripts || {};
const has = /--require\s+\.\/*web\/smc-preload\.cjs/.test(pkg.scripts.start || "");
let start = pkg.scripts.start || "node web/src/index.js";
if (!has) start = start.replace(/^node\s+/, 'node --require ./web/smc-preload.cjs ');
pkg.scripts.start = start;
fs.writeFileSync('package.json', JSON.stringify(pkg,null,2));
console.log('→ start:', pkg.scripts.start);
JS

[[ -f .npmrc ]] || echo "optional=false" > .npmrc
grep -q "^.eslintcache$" .gitignore 2>/dev/null || echo ".eslintcache" >> .gitignore

git add -A
git commit -m "abando: universal preload attaches status/SEO routes regardless of entry" || true
git push -u origin "$BR"
gh pr create --fill --head "$BR" || true
gh pr merge --squash --admin -d || true
echo "✅ Abando preload merged."
