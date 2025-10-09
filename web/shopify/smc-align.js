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
