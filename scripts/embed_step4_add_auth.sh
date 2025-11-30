#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../abando-frontend/app" && pwd)"
EMBED_DIR="$APP_DIR/embedded"
API_DIR="$APP_DIR/api/shopify/verify-embedded"

echo "=============================="
echo " Abando – Add Shopify Auth    "
echo "=============================="
echo "App dir:  $APP_DIR"
echo "Embed dir: $EMBED_DIR"
echo "API dir:  $API_DIR"
mkdir -p "$EMBED_DIR" "$API_DIR"

# 1) Backup existing embedded page if present
if [ -f "$EMBED_DIR/page.tsx" ]; then
  TS="$(date +%Y%m%d_%H%M%S)"
  cp "$EMBED_DIR/page.tsx" "$EMBED_DIR/_backup_page_${TS}.tsx"
  echo "→ Backed up existing embedded/page.tsx to _backup_page_${TS}.tsx"
fi

# 2) New embedded/page.tsx that calls our verify endpoint
cat <<'PAGE' > "$EMBED_DIR/page.tsx"
'use client';

import { useEffect, useState } from 'react';

type Status = 'loading' | 'ok' | 'error';

interface VerifyResponse {
  ok: boolean;
  shop?: string;
  host?: string;
  error?: string;
}

export default function EmbeddedPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [shop, setShop] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const search = window.location.search;
    if (!search) {
      setStatus('error');
      setMessage('Missing Shopify query string.');
      return;
    }

    const url = `/api/shopify/verify-embedded${search}`;

    fetch(url)
      .then(async (res) => {
        const data: VerifyResponse = await res.json();
        if (!res.ok || !data.ok) {
          setStatus('error');
          setMessage(data.error || 'Shopify verification failed.');
          return;
        }
        setShop(data.shop);
        setStatus('ok');
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Network error.');
      });
  }, []);

  if (status === 'loading') {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Embedded App (Checking Session)</h1>
        <p>Verifying your Shopify session…</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Embedded App – Auth Error</h1>
        <p style={{ color: 'red' }}>
          {message || 'Unable to verify this request from Shopify.'}
        </p>
        <p style={{ marginTop: '1rem' }}>
          Try re-opening the app from your Shopify admin. If this continues,
          contact support.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Embedded App (Temp Dev Page)</h1>
      <p>This request has been verified as coming from Shopify.</p>
      {shop && (
        <p style={{ marginTop: '1rem' }}>
          <strong>Shop:</strong> {shop}
        </p>
      )}
      <p style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
        Next step: replace this shell with the real Abando command center UI.
      </p>
    </main>
  );
}
PAGE

# 3) Server-side HMAC verification route
cat <<'ROUTE' > "$API_DIR/route.ts"
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_SECRET =
  process.env.SHOPIFY_API_SECRET ||
  process.env.SHOPIFY_API_SECRET_KEY ||
  process.env.SHOPIFY_API_SECRET_VALUE;

if (!SHOPIFY_API_SECRET) {
  console.warn(
    '[Abando] SHOPIFY_API_SECRET is not set; embedded verification will always fail.'
  );
}

export async function GET(req: NextRequest) {
  try {
    if (!SHOPIFY_API_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Server misconfiguration: missing Shopify secret.' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const hmac = searchParams.get('hmac');
    const shop = searchParams.get('shop');
    const timestamp = searchParams.get('timestamp');

    if (!hmac || !shop || !timestamp) {
      return NextResponse.json(
        { ok: false, error: 'Missing required Shopify parameters.' },
        { status: 400 }
      );
    }

    // Build the message from all params except hmac/signature, sorted lexicographically
    const message = [...searchParams.entries()]
      .filter(([key]) => key !== 'hmac' && key !== 'signature')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const digest = crypto
      .createHmac('sha256', SHOPIFY_API_SECRET)
      .update(message)
      .digest('hex');

    if (digest !== hmac) {
      return NextResponse.json(
        { ok: false, error: 'Invalid HMAC. Request not trusted.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      shop,
      host: searchParams.get('host') ?? undefined,
    });
  } catch (err) {
    console.error('[Abando] Error in /api/shopify/verify-embedded:', err);
    return NextResponse.json(
      { ok: false, error: 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
ROUTE

echo
echo '✅ embed_step4_add_auth.sh complete:'
echo '  - embedded/page.tsx now performs runtime Shopify verification'
echo '  - /api/shopify/verify-embedded validates HMAC on the server'
