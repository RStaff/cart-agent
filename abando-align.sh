#!/usr/bin/env bash
set -euo pipefail

echo "Detecting framework…"
if grep -q '"next"' package.json 2>/dev/null; then
  echo "→ Next.js detected"
  SITE_DIR="apps/website"; [ -d "$SITE_DIR" ] || SITE_DIR="."
  STATUS_FILE="$SITE_DIR/app/api/status/route.ts"
  ROBOTS_FILE="$SITE_DIR/public/robots.txt"
  SITEMAP_FILE="$SITE_DIR/public/sitemap.xml"

  mkdir -p "$(dirname "$STATUS_FILE")" "$(dirname "$ROBOTS_FILE")"
  cat > "$STATUS_FILE" <<'TS'
import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 60;

export async function GET() {
  return NextResponse.json(
    { service: "abando", connected_to: "staffordmedia.ai" },
    { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } }
  );
}
TS

  cat > "$ROBOTS_FILE" <<'TXT'
User-agent: *
Allow: /

Sitemap: https://abando.ai/sitemap.xml
TXT

  cat > "$SITEMAP_FILE" <<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://abando.ai/</loc></url>
  <url><loc>https://abando.ai/pricing</loc></url>
  <url><loc>https://staffordmedia.ai/</loc></url>
</urlset>
XML

  npm ci || npm install
  npm run build || true
  echo "Next.js alignment complete."

elif grep -q '"express"' package.json 2>/dev/null; then
  echo "→ Express detected"
  SERVER=""
  for f in server.ts server.js app.ts app.js index.ts index.js; do [ -f "$f" ] && SERVER="$f" && break; done
  [ -n "$SERVER" ] || { echo "No server file found"; exit 3; }
  ext="${SERVER##*.}"

  if [ "$ext" = "ts" ]; then cat >> "$SERVER" <<'TS'
import type { Request, Response, NextFunction } from 'express';
const ALLOW_ORIGINS = ['https://staffordmedia.ai','https://www.staffordmedia.ai'];
function smcCors(req: Request, res: Response, next: NextFunction) { const o=req.headers.origin; if (o && ALLOW_ORIGINS.includes(o)) res.setHeader('Access-Control-Allow-Origin', o); next(); }
app.use(smcCors);

app.get('/api/status', (_req: Request, res: Response) => { res.json({ service: 'abando', connected_to: 'staffordmedia.ai' }); });

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: https://abando.ai/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://abando.ai/</loc></url>
  <url><loc>https://abando.ai/pricing</loc></url>
  <url><loc>https://staffordmedia.ai/</loc></url>
</urlset>`);
});
TS
  else cat >> "$SERVER" <<'JS'
const ALLOW_ORIGINS = ['https://staffordmedia.ai','https://www.staffordmedia.ai'];
function smcCors(req, res, next) { const o=req.headers.origin; if (o && ALLOW_ORIGINS.includes(o)) res.setHeader('Access-Control-Allow-Origin', o); next(); }
app.use(smcCors);

app.get('/api/status', (_req, res) => { res.json({ service: 'abando', connected_to: 'staffordmedia.ai' }); });

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: https://abando.ai/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://abando.ai/</loc></url>
  <url><loc>https://abando.ai/pricing</loc></url>
  <url><loc>https://staffordmedia.ai/</loc></url>
</urlset>`);
});
JS
  fi

  npm ci || npm install
  npm run build || true
  echo "Express alignment complete."

else
  echo "Neither Next.js nor Express detected here. Exiting."
  exit 5
fi

echo "Abando alignment patch applied."
