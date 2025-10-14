// _status_seo.js — status + robots + sitemap + CORS preflight for /api/status
module.exports.installStatusSeo = function(app) {
  app.options("/api/status", (req,res)=>res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "*"
  }).status(204).end());

  app.get("/api/status", (_req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
    }).json({ service: "abando", connected_to: "staffordmedia.ai" });
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
`User-agent: *
Allow: /

Sitemap: https://abando.ai/sitemap.xml
`);
  });

  app.get("/sitemap.xml", (_req, res) => {
    res.type("application/xml").send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://abando.ai/</loc></url>
  <url><loc>https://abando.ai/pricing</loc></url>
  <url><loc>https://staffordmedia.ai/</loc></url>
</urlset>`);
  });
};
