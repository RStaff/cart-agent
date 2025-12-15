#!/usr/bin/env bash
set -euo pipefail

# App Router (Next 13+)
if [ -d app ]; then
  mkdir -p app/api/health
  cat << 'EOR' > app/api/health/route.ts
export const runtime = "nodejs";

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      app: "abando-frontend",
      ts: new Date().toISOString(),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
EOR
  echo "✅ Added: app/api/health/route.ts"
  exit 0
fi

# Pages Router fallback
if [ -d pages ]; then
  mkdir -p pages/api
  cat << 'EOR' > pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true, app: "abando-frontend", ts: new Date().toISOString() });
}
EOR
  echo "✅ Added: pages/api/health.ts"
  exit 0
fi

echo "❌ Neither app/ nor pages/ found. Can't add health route."
exit 1
