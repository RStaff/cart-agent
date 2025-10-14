#!/usr/bin/env bash
set -Eeuo pipefail

: "${CF_API_TOKEN:?Missing CF_API_TOKEN}"
: "${CF_ACCOUNT_ID:?Missing CF_ACCOUNT_ID}"
: "${AB_DOMAIN:?Missing AB_DOMAIN}"

NAME="$(echo "$AB_DOMAIN" | tr '.' '-')-align"
TMP_JS="$(mktemp -t cfworker.XXXXXX.js)"
TMP_MD="$(mktemp -t cfmeta.XXXXXX.json)"

cat > "$TMP_JS" <<'JS'
// Module Worker
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = url.origin;

    const cors204 = (req) => new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": req.headers.get("access-control-request-headers") || "*",
        "Vary": "Origin"
      }
    });

    const json = (obj, extra={}) => new Response(JSON.stringify(obj), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        "Vary": "Origin",
        ...extra
      }
    });

    const text = (body, type="text/plain") => new Response(body, {
      status: 200,
      headers: { "content-type": `${type}; charset=utf-8` }
    });

    // Routes
    if (url.pathname === "/__align") {
      return json({ ok: true, service: "abando", align: true, host: url.host });
    }

    if (url.pathname === "/api/status") {
      if (req.method === "OPTIONS") return cors204(req);
      if (req.method === "GET") return json({ service: "abando", connected_to: "staffordmedia.ai" });
    }

    if (url.pathname === "/robots.txt") {
      return text(
`User-agent: *
Allow: /

Sitemap: https://${url.host}/sitemap.xml
`, "text/plain");
    }

    if (url.pathname === "/sitemap.xml") {
      return text(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://https://${url.host}/</loc></url>
  <url><loc>https://https://${url.host}/pricing</loc></url>
  <url><loc>https://staffordmedia.ai/</loc></url>
</urlset>`, "application/xml");
    }

    // Pass-through for everything else
    return fetch(req);
  }
};
JS

cat > "$TMP_MD" <<'JSON'
{"main_module":"index.js"}
JSON

echo "→ Uploading Worker script: $NAME"
curl -fsS -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${NAME}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: multipart/form-data" \
  -F "metadata=@${TMP_MD};type=application/json" \
  -F "index.js=@${TMP_JS};type=application/javascript+module" \
  > /dev/null

rm -f "$TMP_JS" "$TMP_MD"
echo "✓ Worker deployed as: $NAME"
